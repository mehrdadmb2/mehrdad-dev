/**
 * MEHRDAD.DEV — public Live Hub snapshot collector
 * Node.js 20+ · built-in APIs only · no secrets or local-network access.
 * Each source is independent. A failed source never overwrites its last good file.
 */
import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const LATITUDE = 29.5918;
const LONGITUDE = 52.5837;
const TIMEZONE = 'Asia/Tehran';
const ROOT = process.cwd();
const TIMEOUT_MS = 15_000;
const RETRIES = 1;

const WEATHER_URL = new URL('https://api.open-meteo.com/v1/forecast');
WEATHER_URL.search = new URLSearchParams({
  latitude: String(LATITUDE),
  longitude: String(LONGITUDE),
  current: [
    'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
    'precipitation', 'rain', 'showers', 'snowfall', 'weather_code', 'cloud_cover',
    'pressure_msl', 'wind_speed_10m', 'wind_direction_10m'
  ].join(','),
  hourly: 'temperature_2m,weather_code,precipitation_probability',
  daily: [
    'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunrise',
    'sunset', 'uv_index_max', 'precipitation_probability_max'
  ].join(','),
  timezone: TIMEZONE,
  forecast_days: '3',
  wind_speed_unit: 'kmh'
}).toString();

const SOURCES = [
  {
    key: 'weather-shiraz',
    file: 'data/weather-shiraz.json',
    url: WEATHER_URL.toString(),
    validate: value => Boolean(
      value && value.current && value.hourly && value.daily &&
      Number.isFinite(Number(value.current.temperature_2m))
    ),
    timestamp: value => value?.current?.time || value?.current?.time_iso || null
  },
  {
    key: 'arzpulse',
    file: 'data/arzpulse.json',
    url: 'https://raw.githubusercontent.com/mehrdadmb2/ArzPulse/main/docs/data/latest.json',
    validate: value => Boolean(
      value && value.prices && (
        value.dollarPrice != null || value.usdtPrice != null || value.prices.USDT?.lastPrice != null
      )
    ),
    timestamp: value => value?.timestamp || value?.prices?.USDT?.fetchedAt || null
  },
  {
    key: 'smarthome',
    file: 'data/smarthome.json',
    url: 'https://raw.githubusercontent.com/mehrdadmb2/PySmartHome-PC/main/data/status.json',
    validate: value => Boolean(value && value.nodes && typeof value.nodes === 'object'),
    timestamp: value => value?.generated_at || value?.server?.last_publish || null
  }
];

async function fetchJson(url) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'user-agent': 'mehrdad-dev-live-hub/1.0 (+https://github.com/mehrdadmb2/mehrdad-dev)'
        },
        signal: controller.signal,
        redirect: 'follow'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Source returned a non-object JSON payload');
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await new Promise(resolve => setTimeout(resolve, 650 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error('Unknown source error');
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

function stableJson(value) {
  // All source payloads are JSON objects and the upstream key order is stable.
  return JSON.stringify(value);
}

async function writeSnapshot(source, raw) {
  const old = await readJson(source.file);
  const sourceTimestamp = source.timestamp(raw);
  const envelope = {
    schema_version: 1,
    name: source.key,
    fetchedAt: sourceTimestamp || new Date().toISOString(),
    source: source.url,
    raw
  };

  if (old && old.source === envelope.source && stableJson(old.raw) === stableJson(raw)) {
    console.log(`UNCHANGED ${source.key}: source payload is identical`);
    return false;
  }

  await mkdir(dirname(source.file), { recursive: true });
  const temporaryFile = `${source.file}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
  await rename(temporaryFile, source.file);
  console.log(`UPDATED ${source.key}: ${source.file} (${sourceTimestamp || 'timestamp unavailable'})`);
  return true;
}

async function main() {
  await mkdir('data', { recursive: true });
  let changed = 0;
  let failed = 0;
  const details = [];

  const results = await Promise.all(SOURCES.map(async source => {
    try {
      const raw = await fetchJson(source.url);
      if (!source.validate(raw)) throw new Error('Source JSON schema did not match the expected public fields');
      const updated = await writeSnapshot(source, raw);
      return { key: source.key, ok: true, changed: updated };
    } catch (error) {
      failed += 1;
      console.warn(`UNAVAILABLE ${source.key}: ${error?.message || error}; previous snapshot preserved`);
      return { key: source.key, ok: false, changed: false, error: String(error?.message || error) };
    }
  }));

  for (const result of results) {
    if (result.changed) changed += 1;
    details.push(`${result.ok ? 'OK' : 'WARN'} ${result.key}${result.changed ? ' (updated)' : ''}`);
  }

  const summary = [
    `Live Hub snapshots: ${changed} file(s) updated; ${failed} source(s) unavailable.`,
    ...details
  ].join('\n');
  console.log(summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Live Hub data refresh\n\n${summary}\n`, 'utf8');
  }
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed > 0}\nfailed=${failed}\n`, 'utf8');
  }

  // Upstream downtime is not a build failure: keep the last good JSON files.
}

main().catch(error => {
  console.error('Live Hub snapshot collector failed unexpectedly:', error);
  process.exitCode = 1;
});
