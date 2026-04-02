#!/usr/bin/env python3
"""
Đồng bộ chỉ số VNINDEX / VN30 / VN30F1M vào DB — nguồn vnstock (VCI), cùng hướng với market_index_seed.py ở repo gốc.

Chạy từ thư mục gốc backend (yt2future-be-v2):
  .venv/bin/python scripts/sync_market_index_vnstock.py

Cài dependency (trong venv):
  pip install -r scripts/requirements-sync.txt

Biến: DATABASE_URL trong .env của backend (cùng file với Prisma).

Cron ví dụ:
  CRON_TZ=Asia/Ho_Chi_Minh
  1,5,10 15 * * 1-5 cd /home/deploy/yt2future/yt2future-be-v2 && /home/deploy/yt2future/yt2future-be-v2/.venv/bin/python scripts/sync_market_index_vnstock.py >> /home/deploy/logs/yt2future-market-sync.log 2>&1
"""
from __future__ import annotations

import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_values
from vnstock import Quote

INDICES = [
    ("VNINDEX", "VCI"),
    ("VN30", "VCI"),
    ("VN30F1M", "VCI"),
]

# Thư mục gốc backend = cha của thư mục scripts/
BE_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(BE_ROOT / ".env")

BOOTSTRAP_YEARS = int(os.getenv("SYNC_BOOTSTRAP_YEARS", "5"))
HOLIDAYS = {x.strip() for x in os.getenv("VN_MARKET_HOLIDAYS", "").split(",") if x.strip()}


def vn_today() -> date:
    from zoneinfo import ZoneInfo

    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).date()


def is_trading_day(d: date) -> bool:
    if d.weekday() >= 5:
        return False
    if d.isoformat() in HOLIDAYS:
        return False
    return True


def normalize_history(df: pd.DataFrame, symbol: str) -> pd.DataFrame:
    if df.empty:
        return df
    if "date" in df.columns and "time" not in df.columns:
        df = df.rename(columns={"date": "time"})
    df["symbol"] = symbol
    df["time"] = pd.to_datetime(df["time"]).dt.date
    df = df.sort_values("time")
    if "change" not in df.columns:
        df["change"] = df["close"].diff()
    if "changePct" not in df.columns:
        prev_close = df["close"].shift(1)
        df["changePct"] = ((df["close"] - prev_close) / prev_close) * 100
    if "ref" not in df.columns:
        df["ref"] = df["close"].shift(1)
    cols = ["time", "open", "high", "low", "close", "volume", "change", "changePct", "ref", "symbol"]
    available = [c for c in cols if c in df.columns]
    return df[available]


def date_to_utc_midnight(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=timezone.utc)


def main() -> None:
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("[sync-vnstock] Missing DATABASE_URL", file=sys.stderr)
        sys.exit(1)

    today = vn_today()
    print(f"[sync-vnstock] start VN date={today.isoformat()}")

    if not is_trading_day(today):
        print("[sync-vnstock] skip: weekend/holiday.")
        return

    conn = psycopg2.connect(url)
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT symbol, MAX(date)::date
            FROM "MarketIndexDaily"
            WHERE symbol IN ('VNINDEX','VN30','VN30F1M')
            GROUP BY symbol
            """
        )
        latest_by_symbol = {row[0]: row[1] for row in cur.fetchall()}

        for symbol, source in INDICES:
            latest = latest_by_symbol.get(symbol)
            if latest:
                start_d = latest + timedelta(days=1)
            else:
                start_d = today - timedelta(days=365 * BOOTSTRAP_YEARS)

            if start_d > today:
                print(f"[{symbol}] up-to-date (latest={latest})")
                continue

            start_s = start_d.isoformat()
            end_s = today.isoformat()
            print(f"[{symbol}] fetching vnstock {start_s} -> {end_s}")

            quote = Quote(symbol=symbol, source=source)
            df = quote.history(start=start_s, end=end_s, interval="1D")
            df = normalize_history(df, symbol)
            if df.empty:
                print(f"[{symbol}] no rows from source.")
                continue

            rows = []
            for _, r in df.iterrows():
                t = r["time"]
                if isinstance(t, pd.Timestamp):
                    t = t.date()
                rows.append(
                    (
                        symbol,
                        date_to_utc_midnight(t if isinstance(t, date) else t),
                        float(r["open"]) if pd.notna(r.get("open")) else None,
                        float(r["high"]) if pd.notna(r.get("high")) else None,
                        float(r["low"]) if pd.notna(r.get("low")) else None,
                        float(r["close"]) if pd.notna(r.get("close")) else None,
                        int(r["volume"]) if pd.notna(r.get("volume")) else None,
                        float(r["change"]) if pd.notna(r.get("change")) else None,
                        float(r["changePct"]) if pd.notna(r.get("changePct")) else None,
                        float(r["ref"]) if pd.notna(r.get("ref")) else None,
                    )
                )

            sql = """
            INSERT INTO "MarketIndexDaily" (
              "symbol", "date", "open", "high", "low", "close", "volume",
              "change", "changePct", "ref", "updatedAt"
            ) VALUES %s
            ON CONFLICT ("symbol", "date") DO UPDATE SET
              "open" = EXCLUDED."open",
              "high" = EXCLUDED."high",
              "low" = EXCLUDED."low",
              "close" = EXCLUDED."close",
              "volume" = EXCLUDED."volume",
              "change" = EXCLUDED."change",
              "changePct" = EXCLUDED."changePct",
              "ref" = EXCLUDED."ref",
              "updatedAt" = EXCLUDED."updatedAt"
            """
            now = datetime.now(timezone.utc)
            template = "(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            batch = [(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], now) for r in rows]
            execute_values(cur, sql, batch, template=template, page_size=100)
            conn.commit()
            print(f"[{symbol}] upserted {len(rows)} row(s).")

    finally:
        conn.close()

    print("[sync-vnstock] completed.")


if __name__ == "__main__":
    main()
