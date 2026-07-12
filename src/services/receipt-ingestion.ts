import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { priceEntries, products, receipts, stores } from '@/db/schema';
import type { NfceReceipt } from '@/types';

export async function ingestReceipt(data: NfceReceipt): Promise<number> {
  const storeId = await upsertStore(data.storeName, data.storeCnpj, data.storeAddress);

  const [receipt] = await db
    .insert(receipts)
    .values({
      storeId,
      qrcodeUrl: data.qrcodeUrl,
      purchaseDate: data.purchaseDate,
      totalAmount: data.totalAmount,
    })
    .returning();

  for (const item of data.items) {
    const productId = await upsertProduct(item.name, item.unit);
    await db.insert(priceEntries).values({
      productId,
      receiptId: receipt.id,
      storeId,
      price: item.totalPrice,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      recordedAt: data.purchaseDate,
    });
  }

  return receipt.id;
}

async function upsertStore(name: string, cnpj: string, address: string): Promise<number> {
  if (cnpj) {
    const [existing] = await db.select().from(stores).where(eq(stores.cnpj, cnpj)).limit(1);
    if (existing) return existing.id;
  }

  const [store] = await db.insert(stores).values({ name, cnpj, address }).returning();
  return store.id;
}

async function upsertProduct(name: string, unit: string): Promise<number> {
  const normalized = name.toUpperCase().trim();
  const [existing] = await db
    .select()
    .from(products)
    .where(eq(products.name, normalized))
    .limit(1);

  if (existing) return existing.id;

  const [product] = await db.insert(products).values({ name: normalized, unit }).returning();
  return product.id;
}
