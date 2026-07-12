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
  // Clean store name (remove "RAZÃO SOCIAL:" prefix etc)
  const cleanName = name
    .replace(/^(?:RAZ[ÃA]O\s*SOCIAL|EMPRESA|EMITENTE)[:\s]*/i, '')
    .trim() || name.trim();

  // Match by CNPJ first (most reliable)
  if (cnpj) {
    const [existing] = await db.select().from(stores).where(eq(stores.cnpj, cnpj)).limit(1);
    if (existing) {
      // Update name if it still has the prefix
      if (existing.name !== cleanName && existing.name.match(/RAZ[ÃA]O\s*SOCIAL/i)) {
        await db.update(stores).set({ name: cleanName, address: address || existing.address }).where(eq(stores.id, existing.id));
      }
      return existing.id;
    }
  }

  // Match by exact name (case-insensitive via UPPER)
  const normalized = cleanName.toUpperCase();
  const allStores = await db.select().from(stores);
  const match = allStores.find((s) => s.name.toUpperCase().trim() === normalized);
  if (match) {
    // Update name if it still has the prefix
    if (match.name.match(/RAZ[ÃA]O\s*SOCIAL/i)) {
      await db.update(stores).set({ name: cleanName }).where(eq(stores.id, match.id));
    }
    return match.id;
  }

  const [store] = await db.insert(stores).values({ name: cleanName, cnpj, address }).returning();
  return store.id;
}

async function upsertProduct(name: string, unit: string): Promise<number> {
  const normalized = name.trim();
  const upper = normalized.toUpperCase();

  // Case-insensitive match
  const allProducts = await db.select().from(products);
  const match = allProducts.find((p) => p.name.toUpperCase() === upper);
  if (match) {
    // Update name to Title Case if currently all upper
    const titleCase = toTitleCase(normalized);
    if (match.name !== titleCase && match.name === match.name.toUpperCase()) {
      await db.update(products).set({ name: titleCase }).where(eq(products.id, match.id));
    }
    return match.id;
  }

  // Save as Title Case
  const titleCase = toTitleCase(normalized);
  const [product] = await db.insert(products).values({ name: titleCase, unit }).returning();
  return product.id;
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
