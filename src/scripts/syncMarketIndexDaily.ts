import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const INDICES = [
  { symbol: 'VNINDEX', vndirectCode: 'VNINDEX' },
  { symbol: 'VN30', vndirectCode: 'VN30' },
  { symbol: 'VN30F1M', vndirectCode: 'VN30F1M' },
] as const;

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';
const BOOTSTRAP_YEARS = Number(process.env.SYNC_BOOTSTRAP_YEARS || '5');
const HOLIDAYS = (process.env.VN_MARKET_HOLIDAYS || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

type VndirectIndexPoint = {
  date: string;
  open?: number;
  close?: number;
  high?: number;
  low?: number;
  change?: number;
  changePercent?: number;
  ref?: number;
  volume?: number;
};

function getVNDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Cannot resolve VN date.');
  }
  return `${year}-${month}-${day}`;
}

function getVNWeekday(date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: VN_TIMEZONE,
    weekday: 'short',
  }).format(date);
}

function getWeekdayFromDateString(dateStr: string): string {
  return getVNWeekday(new Date(`${dateStr}T00:00:00+07:00`));
}

function isTradingDay(vnDate: string): boolean {
  const weekday = getWeekdayFromDateString(vnDate);
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  if (HOLIDAYS.includes(vnDate)) return false;
  return true;
}

function addDays(dateStr: string, amount: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

function subtractYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBigInt(value: unknown): bigint | null {
  const n = toNumber(value);
  if (n == null) return null;
  return BigInt(Math.round(n));
}

async function fetchIndexHistory(symbol: string, from: string, to: string): Promise<VndirectIndexPoint[]> {
  const url = `https://finfo-api.vndirect.com.vn/v4/index_series?sort=date&series_code=${symbol}&from=${from}&to=${to}&fields=date,open,close,high,low,average,change,changePercent,ref,volume`;
  const response = await axios.get(url, { timeout: 20000 });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

async function syncSymbol(symbol: string, vndirectCode: string, todayVN: string): Promise<void> {
  const latest = await prisma.marketIndexDaily.findFirst({
    where: { symbol },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  const from = latest
    ? addDays(latest.date.toISOString().slice(0, 10), 1)
    : subtractYears(todayVN, BOOTSTRAP_YEARS);
  const to = todayVN;

  if (from > to) {
    console.log(`[${symbol}] up-to-date (latest=${latest?.date.toISOString().slice(0, 10) ?? 'none'})`);
    return;
  }

  console.log(`[${symbol}] fetching ${from} -> ${to}`);
  const rows = await fetchIndexHistory(vndirectCode, from, to);
  const freshRows = rows.filter((row) => row?.date && row.date >= from && row.date <= to);
  if (freshRows.length === 0) {
    console.log(`[${symbol}] no new rows from source.`);
    return;
  }

  let upserted = 0;
  for (const row of freshRows) {
    if (!row?.date) continue;
    const date = new Date(row.date);

    await prisma.marketIndexDaily.upsert({
      where: { symbol_date: { symbol, date } },
      update: {
        open: toNumber(row.open),
        high: toNumber(row.high),
        low: toNumber(row.low),
        close: toNumber(row.close),
        volume: toBigInt(row.volume),
        change: toNumber(row.change),
        changePct: toNumber(row.changePercent),
        ref: toNumber(row.ref),
      },
      create: {
        symbol,
        date,
        open: toNumber(row.open),
        high: toNumber(row.high),
        low: toNumber(row.low),
        close: toNumber(row.close),
        volume: toBigInt(row.volume),
        change: toNumber(row.change),
        changePct: toNumber(row.changePercent),
        ref: toNumber(row.ref),
      },
    });
    upserted += 1;
  }

  console.log(`[${symbol}] upserted ${upserted} row(s).`);
}

async function main(): Promise<void> {
  const todayVN = getVNDateString();
  console.log(`[sync] start for VN date ${todayVN}`);

  if (!isTradingDay(todayVN)) {
    console.log('[sync] skip: weekend/holiday.');
    return;
  }

  for (const idx of INDICES) {
    await syncSymbol(idx.symbol, idx.vndirectCode, todayVN);
  }

  console.log('[sync] completed.');
}

main()
  .catch((error) => {
    console.error('[sync] failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
