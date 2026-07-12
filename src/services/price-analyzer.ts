import { desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { priceEntries, products } from '@/db/schema';
import type { PriceChange } from '@/types';

export async function getPriceHistory(productId: number) {
  return db
    .select()
    .from(priceEntries)
    .where(eq(priceEntries.productId, productId))
    .orderBy(desc(priceEntries.recordedAt));
}

export async function calculatePriceChange(productId: number): Promise<PriceChange | null> {
  const results = await db
    .select()
    .from(priceEntries)
    .where(eq(priceEntries.productId, productId))
    .orderBy(desc(priceEntries.recordedAt))
    .limit(2);

  if (results.length < 2) return null;

  const [latest, previous] = results;
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return null;

  const pct = ((latest.unitPrice - previous.unitPrice) / previous.unitPrice) * 100;
  const direction = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'stable';

  return {
    productId,
    productName: product.name,
    currentPrice: latest.unitPrice,
    previousPrice: previous.unitPrice,
    changePercent: Math.round(pct * 10) / 10,
    direction,
  };
}
