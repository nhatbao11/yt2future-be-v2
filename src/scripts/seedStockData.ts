import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Danh sách chỉ số cần lấy (theo yêu cầu dashboard)
const INDICES = [
  { symbol: 'VNINDEX', vndirectCode: 'VNINDEX' },
  { symbol: 'VN30', vndirectCode: 'VN30' },
  { symbol: 'VN30F1M', vndirectCode: 'VN30F1M' },
];

// Hàm lấy dữ liệu lịch sử chỉ số từ VNDIRECT (API public, không cần token)
async function fetchIndexHistory(symbol: string, from: string, to: string) {
  const url = `https://finfo-api.vndirect.com.vn/v4/index_series?sort=date&series_code=${symbol}&from=${from}&to=${to}&fields=date,open,close,high,low,average,change,changePercent,ref,volume`;
  const res = await axios.get(url);
  return res.data.data;
}

async function main() {
  // Có thể truyền YEARS để seed sâu hơn, mặc định 5 năm
  const yearsBack = Number(process.env.YEARS || '5');
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const fromDate = new Date(today);
  fromDate.setFullYear(fromDate.getFullYear() - yearsBack);
  const from = fromDate.toISOString().slice(0, 10);

  // Xoá dữ liệu cũ của các symbol cần seed trong khoảng thời gian để đè dữ liệu sạch
  await prisma.marketIndexDaily.deleteMany({
    where: {
      symbol: { in: INDICES.map((x) => x.symbol) },
      date: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
  });

  for (const idx of INDICES) {
    console.log(`Fetching ${idx.symbol} from ${from} to ${to}`);
    const data = await fetchIndexHistory(idx.vndirectCode, from, to);
    for (const d of data) {
      await prisma.marketIndexDaily.upsert({
        where: { symbol_date: { symbol: idx.symbol, date: new Date(d.date) } },
        update: {
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
          change: d.change,
          changePct: d.changePercent,
          ref: d.ref,
        },
        create: {
          symbol: idx.symbol,
          date: new Date(d.date),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
          change: d.change,
          changePct: d.changePercent,
          ref: d.ref,
        },
      });
    }
    console.log(`Done ${idx.symbol}`);
  }
  console.log('Seed completed!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
