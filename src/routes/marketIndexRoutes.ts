import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/market-index?symbol=VNINDEX&from=2026-01-01&to=2026-04-01
router.get('/', async (req, res) => {
  try {
    const { symbol, from, to } = req.query;
    const where: any = {};
    if (symbol) where.symbol = symbol;
    if (from || to) where.date = {};
    if (from) where.date.gte = new Date(from as string);
    if (to) where.date.lte = new Date(to as string);
    const data = await prisma.marketIndexDaily.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    // Convert BigInt fields to Number for JSON serialization
    const safeData = data.map((item) => ({
      ...item,
      volume: item.volume !== null && item.volume !== undefined ? Number(item.volume) : null,
    }));
    res.json(safeData);
  } catch (err) {
    console.error('MarketIndex API error:', err);
    res.status(500).json({ error: 'Server error', detail: String(err) });
  }
});

export default router;
