import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  cnpj: text('cnpj'),
  address: text('address'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  unit: text('unit'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const receipts = sqliteTable('receipts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id),
  qrcodeUrl: text('qrcode_url'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }).notNull(),
  totalAmount: real('total_amount'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const priceEntries = sqliteTable('price_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  receiptId: integer('receipt_id')
    .notNull()
    .references(() => receipts.id),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id),
  price: real('price').notNull(),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull(),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
});
