
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

const csvFilePath = path.resolve(process.cwd(), '../market_index_3months.csv');


type MarketIndexCSVRow = {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  change?: string;
  changePct?: string;
  ref?: string;
  symbol: string;
};

const TARGET_SYMBOLS = ['VNINDEX', 'VN30', 'VN30F1M'];

function toFloat(value?: string): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBigInt(value?: string): bigint | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return BigInt(Math.round(n));
}

async function importCSV() {
  const records: MarketIndexCSVRow[] = [];
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row: MarketIndexCSVRow) => {
        records.push(row);
      })
      .on('end', async () => {
        try {
          await prisma.marketIndexDaily.deleteMany({
            where: {
              symbol: { in: TARGET_SYMBOLS },
            },
          });

          for (const row of records) {
            if (!TARGET_SYMBOLS.includes(row.symbol)) continue;

            await prisma.marketIndexDaily.upsert({
              where: { symbol_date: { symbol: row.symbol, date: new Date(row.time) } },
              update: {
                open: toFloat(row.open),
                high: toFloat(row.high),
                low: toFloat(row.low),
                close: toFloat(row.close),
                volume: toBigInt(row.volume),
                change: toFloat(row.change),
                changePct: toFloat(row.changePct),
                ref: toFloat(row.ref),
              },
              create: {
                symbol: row.symbol,
                date: new Date(row.time),
                open: toFloat(row.open),
                high: toFloat(row.high),
                low: toFloat(row.low),
                close: toFloat(row.close),
                volume: toBigInt(row.volume),
                change: toFloat(row.change),
                changePct: toFloat(row.changePct),
                ref: toFloat(row.ref),
              },
            });
          }
          console.log('Import completed!');
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          await prisma.$disconnect();
        }
      })
      .on('error', (err: any) => {
        reject(err);
      });
  });
}

importCSV().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
