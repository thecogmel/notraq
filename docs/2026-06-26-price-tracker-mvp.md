# Price Tracker MVP - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile app that scans NFC-e QR codes from Brazilian receipts, extracts product data, stores price history locally, and shows price evolution over time with alerts for price changes.

**Architecture:** Expo app with file-based routing (Expo Router). Local SQLite database via expo-sqlite + Drizzle ORM for type-safe queries. Camera-based QR scanning feeds URLs to a scraping service that extracts product data. Charts via react-native-gifted-charts. State management with Zustand. UI components from React Native Reusables (shadcn model) styled with NativeWind/Tailwind CSS.

**Tech Stack:**
- Expo 56, React Native 0.85, Expo Router
- React Native Reusables + NativeWind (UI — shadcn/ui model)
- expo-sqlite + Drizzle ORM (local DB)
- expo-camera (QR code scanning)
- react-native-gifted-charts (price evolution charts)
- Zustand (global state)
- date-fns (date formatting)

**App Name:** `notraq`

---

## File Structure

```
app/
├── _layout.tsx                    # Root layout: providers (DB, NativeWind, SafeArea)
├── (tabs)/
│   ├── _layout.tsx                # Tab navigator (Produtos, Scan, Mercados)
│   ├── index.tsx                  # Products list (home)
│   ├── scan.tsx                   # QR scan + manual entry
│   └── stores.tsx                 # Stores list
├── product/[id].tsx               # Product detail + price history chart
└── receipt/[id].tsx               # Receipt detail (items from a single scan)

components/
├── ui/                            # RNR components (installed via CLI)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── separator.tsx
│   └── text.tsx
├── ProductCard.tsx                 # Product list item with price change indicator
├── PriceChart.tsx                  # Line chart wrapper for price history
├── ScannerView.tsx                 # Camera QR scanner component
├── ManualEntryForm.tsx             # Manual product + price entry form
├── PriceChangeAlert.tsx            # Alert badge showing % change
└── EmptyState.tsx                  # Empty state placeholder

db/
├── schema.ts                      # Drizzle schema (products, stores, prices, receipts)
├── client.ts                      # DB initialization + migrations
└── migrations/                    # Generated SQL migrations

services/
├── nfce-parser.ts                 # Parse NFC-e QR code URL, fetch + extract items
├── price-analyzer.ts              # Calculate price changes, percentages, alerts
└── receipt-ingestion.ts           # Ties parser to DB (upsert products, stores, prices)

store/
└── app-store.ts                   # Zustand store (scan state, UI state)

lib/
└── utils.ts                       # cn() helper for NativeWind class merging

types/
└── index.ts                       # Shared TypeScript types
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: new Expo project `precotrack/`
- Create: `tailwind.config.js`
- Create: `global.css`
- Create: `lib/utils.ts`
- Create: `app/_layout.tsx`

- [ ] **Step 1: Create new Expo project**

```bash
bunx create-expo-app notraq --template blank-typescript
cd notraq
```

- [ ] **Step 2: Install NativeWind**

```bash
bun add nativewind tailwindcss
bun add -d tailwindcss
bunx expo install react-native-reanimated react-native-safe-area-context
```

- [ ] **Step 3: Install core dependencies**

```bash
bun add expo-sqlite drizzle-orm zustand date-fns react-native-gifted-charts react-native-svg
bun add -d drizzle-kit babel-plugin-inline-import
bunx expo install expo-camera
```

- [ ] **Step 4: Install React Native Reusables CLI and components**

```bash
bunx @react-native-reusables/cli@latest init
bunx @react-native-reusables/cli@latest add button card input label separator text
```

This installs the RNR components into `components/ui/` and sets up the `cn()` utility in `lib/utils.ts`.

- [ ] **Step 5: Configure Tailwind**

Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 6: Create global.css**

Create `global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --primary: 217 91% 60%;
    --primary-foreground: 240 10% 3.9%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
  }
}
```

- [ ] **Step 7: Update babel.config.js**

```javascript
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  }
}
```

- [ ] **Step 8: Update metro.config.js**

```javascript
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './global.css' })
```

- [ ] **Step 9: Create root layout**

Create `app/_layout.tsx`:

```typescript
import '../global.css'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { DatabaseProvider } from '../db/client'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ title: 'Produto' }} />
          <Stack.Screen name="receipt/[id]" options={{ title: 'Nota Fiscal' }} />
        </Stack>
      </DatabaseProvider>
    </SafeAreaProvider>
  )
}
```

- [ ] **Step 10: Verify app runs**

```bash
bun start
```

Expected: App launches, no errors.

- [ ] **Step 11: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold notraq with Expo, NativeWind, RNR"
```

---

## Task 2: Database Schema & Client

**Files:**
- Create: `db/schema.ts`
- Create: `db/client.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Create Drizzle schema**

Create `db/schema.ts`:

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  cnpj: text('cnpj'),
  address: text('address'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  unit: text('unit'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const receipts = sqliteTable('receipts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  qrcodeUrl: text('qrcode_url'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }).notNull(),
  totalAmount: real('total_amount'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const priceEntries = sqliteTable('price_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  receiptId: integer('receipt_id').notNull().references(() => receipts.id),
  storeId: integer('store_id').notNull().references(() => stores.id),
  price: real('price').notNull(),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull(),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
})
```

- [ ] **Step 2: Create database client with provider**

Create `db/client.ts`:

```typescript
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { createContext, useContext } from 'react'
import * as schema from './schema'
import migrations from './migrations/migrations'

const DATABASE_NAME = 'notraq.db'

const expoDb = openDatabaseSync(DATABASE_NAME)
export const db = drizzle(expoDb, { schema })

export type Database = typeof db

const DatabaseContext = createContext<Database>(db)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  return useContext(DatabaseContext)
}

export function useDatabaseMigrations() {
  return useMigrations(db, migrations)
}
```

- [ ] **Step 3: Create Drizzle config**

Create `drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config
```

- [ ] **Step 4: Generate initial migration**

```bash
bunx drizzle-kit generate
```

Expected: Migration SQL files created in `db/migrations/`.

- [ ] **Step 5: Commit**

```bash
git add db/ drizzle.config.ts
git commit -m "feat: add database schema with Drizzle ORM + expo-sqlite"
```

---

## Task 3: Types & NFC-e Parser Service

**Files:**
- Create: `types/index.ts`
- Create: `services/nfce-parser.ts`

- [ ] **Step 1: Define shared types**

Create `types/index.ts`:

```typescript
export interface NfceItem {
  name: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface NfceReceipt {
  storeName: string
  storeCnpj: string
  storeAddress: string
  items: NfceItem[]
  totalAmount: number
  purchaseDate: Date
  qrcodeUrl: string
}

export interface PriceChange {
  productId: number
  productName: string
  currentPrice: number
  previousPrice: number
  changePercent: number
  direction: 'up' | 'down' | 'stable'
}
```

- [ ] **Step 2: Create NFC-e parser**

Create `services/nfce-parser.ts`:

```typescript
import { NfceItem, NfceReceipt } from '../types'

export async function fetchNfceData(qrcodeUrl: string): Promise<NfceReceipt> {
  const response = await fetch(qrcodeUrl)
  if (!response.ok) throw new Error(`Falha ao consultar NFC-e: ${response.status}`)
  const html = await response.text()
  return parseNfceHtml(html, qrcodeUrl)
}

export function parseNfceHtml(html: string, qrcodeUrl: string): NfceReceipt {
  const storeName = extractText(html, 'txtTopo') ?? 'Loja desconhecida'
  const storeCnpj = extractCnpj(html) ?? ''
  const storeAddress = extractText(html, 'txtEndereco') ?? ''
  const items = extractItems(html)

  const totalMatch = html.match(/Valor total R\$\s*([\d.,]+)/i) ?? html.match(/txtMax[^>]*>([\d.,]+)/i)
  const totalAmount = totalMatch ? parsePrice(totalMatch[1]) : items.reduce((s, i) => s + i.totalPrice, 0)

  const dateMatch = html.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/)
  const purchaseDate = dateMatch ? parseBrDate(dateMatch[1]) : new Date()

  return { storeName: clean(storeName), storeCnpj, storeAddress: clean(storeAddress), items, totalAmount, purchaseDate, qrcodeUrl }
}

function extractItems(html: string): NfceItem[] {
  const items: NfceItem[] = []
  const blocks = html.split(/(?=txtTit2|RCod)/).slice(1)

  for (const block of blocks) {
    const nameMatch = block.match(/txtTit[^>]*>([^<]+)/)
    if (!nameMatch) continue

    const qty = parsePrice((block.match(/Qtde\.\s*:\s*([\d.,]+)/i) ?? block.match(/Rqtd[^>]*>([\d.,]+)/))?.[1] ?? '1')
    const unit = (block.match(/UN:\s*(\w+)/i) ?? block.match(/RUN[^>]*>(\w+)/))?.[1]?.trim() ?? 'UN'
    const unitPrice = parsePrice((block.match(/Vl\.\s*Unit\.\s*:\s*([\d.,]+)/i) ?? block.match(/RvlUnit[^>]*>([\d.,]+)/))?.[1] ?? '0')
    const totalPrice = parsePrice((block.match(/Vl\.\s*Total\s*:?\s*R?\$?\s*([\d.,]+)/i) ?? block.match(/valor[^>]*>([\d.,]+)/))?.[1] ?? '0') || unitPrice * qty

    items.push({ name: clean(nameMatch[1]), unit, quantity: qty, unitPrice: unitPrice || totalPrice / qty, totalPrice })
  }
  return items
}

function extractText(html: string, className: string): string | null {
  const idx = html.indexOf(className)
  if (idx === -1) return null
  const start = html.indexOf('>', idx) + 1
  const end = html.indexOf('<', start)
  return end > start ? html.slice(start, end) : null
}

function extractCnpj(html: string): string | null {
  return (html.match(/CNPJ:\s*([\d./-]+)/) ?? html.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/))?.[1] ?? null
}

function parsePrice(v: string): number {
  return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0
}

function parseBrDate(s: string): Date {
  const [date, time] = s.split(/\s+/)
  const [d, m, y] = date.split('/')
  return new Date(`${y}-${m}-${d}T${time}`)
}

function clean(t: string): string {
  return t.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim()
}
```

- [ ] **Step 3: Commit**

```bash
git add types/ services/nfce-parser.ts
git commit -m "feat: add NFC-e QR code parser service"
```

---

## Task 4: Price Analyzer & Receipt Ingestion

**Files:**
- Create: `services/price-analyzer.ts`
- Create: `services/receipt-ingestion.ts`

- [ ] **Step 1: Create price analyzer**

Create `services/price-analyzer.ts`:

```typescript
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { priceEntries, products } from '../db/schema'
import { PriceChange } from '../types'

export async function getPriceHistory(productId: number) {
  return db.select().from(priceEntries).where(eq(priceEntries.productId, productId)).orderBy(desc(priceEntries.recordedAt))
}

export async function calculatePriceChange(productId: number): Promise<PriceChange | null> {
  const results = await db.select().from(priceEntries).where(eq(priceEntries.productId, productId)).orderBy(desc(priceEntries.recordedAt)).limit(2)
  if (results.length < 2) return null

  const [latest, previous] = results
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
  if (!product) return null

  const pct = ((latest.unitPrice - previous.unitPrice) / previous.unitPrice) * 100
  const direction = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'stable'

  return {
    productId,
    productName: product.name,
    currentPrice: latest.unitPrice,
    previousPrice: previous.unitPrice,
    changePercent: Math.round(pct * 10) / 10,
    direction,
  }
}
```

- [ ] **Step 2: Create receipt ingestion service**

Create `services/receipt-ingestion.ts`:

```typescript
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { stores, products, receipts, priceEntries } from '../db/schema'
import { NfceReceipt } from '../types'

export async function ingestReceipt(data: NfceReceipt) {
  const storeId = await upsertStore(data.storeName, data.storeCnpj, data.storeAddress)

  const [receipt] = await db.insert(receipts).values({
    storeId,
    qrcodeUrl: data.qrcodeUrl,
    purchaseDate: data.purchaseDate,
    totalAmount: data.totalAmount,
  }).returning()

  for (const item of data.items) {
    const productId = await upsertProduct(item.name, item.unit)
    await db.insert(priceEntries).values({
      productId,
      receiptId: receipt.id,
      storeId,
      price: item.totalPrice,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      recordedAt: data.purchaseDate,
    })
  }

  return receipt.id
}

async function upsertStore(name: string, cnpj: string, address: string): Promise<number> {
  if (cnpj) {
    const [existing] = await db.select().from(stores).where(eq(stores.cnpj, cnpj)).limit(1)
    if (existing) return existing.id
  }
  const [store] = await db.insert(stores).values({ name, cnpj, address }).returning()
  return store.id
}

async function upsertProduct(name: string, unit: string): Promise<number> {
  const normalized = name.toUpperCase().trim()
  const [existing] = await db.select().from(products).where(eq(products.name, normalized)).limit(1)
  if (existing) return existing.id
  const [product] = await db.insert(products).values({ name: normalized, unit }).returning()
  return product.id
}
```

- [ ] **Step 3: Commit**

```bash
git add services/
git commit -m "feat: add price analyzer and receipt ingestion services"
```

---

## Task 5: QR Scanner Screen

**Files:**
- Create: `components/ScannerView.tsx`
- Create: `components/ManualEntryForm.tsx`
- Create: `store/app-store.ts`
- Create: `app/(tabs)/scan.tsx`

- [ ] **Step 1: Create Zustand store**

Create `store/app-store.ts`:

```typescript
import { create } from 'zustand'

interface AppState {
  isProcessing: boolean
  lastError: string | null
  setProcessing: (v: boolean) => void
  setError: (e: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  isProcessing: false,
  lastError: null,
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (lastError) => set({ lastError }),
}))
```

- [ ] **Step 2: Create ScannerView component**

Create `components/ScannerView.tsx`:

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera'
import { View, Text, Pressable } from 'react-native'

interface Props {
  onScan: (url: string) => void
  enabled: boolean
}

export function ScannerView({ onScan, enabled }: Props) {
  const [permission, requestPermission] = useCameraPermissions()

  if (!permission) return null

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-4">
        <Text className="text-center text-foreground">Precisamos de acesso à câmera para escanear QR codes</Text>
        <Pressable className="rounded-lg bg-primary px-6 py-3" onPress={requestPermission}>
          <Text className="text-primary-foreground font-medium">Permitir Câmera</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <CameraView
      style={{ flex: 1 }}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={enabled ? ({ data }) => onScan(data) : undefined}
    />
  )
}
```

- [ ] **Step 3: Create ManualEntryForm**

Create `components/ManualEntryForm.tsx`:

```typescript
import { useState } from 'react'
import { View } from 'react-native'
import { Text } from '~/components/ui/text'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'

interface Props {
  onSubmit: (item: { name: string; price: string; store: string }) => void
}

export function ManualEntryForm({ onSubmit }: Props) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [store, setStore] = useState('')

  const handleSubmit = () => {
    if (!name.trim() || !price.trim()) return
    onSubmit({ name: name.trim(), price, store: store.trim() })
    setName('')
    setPrice('')
  }

  return (
    <View className="gap-4 p-4">
      <Text className="text-xl font-bold">Adicionar manualmente</Text>

      <View className="gap-1.5">
        <Label nativeID="product-name">Produto</Label>
        <Input value={name} onChangeText={setName} placeholder="Ex: Arroz 5kg" aria-labelledby="product-name" />
      </View>

      <View className="gap-1.5">
        <Label nativeID="product-price">Preço (R$)</Label>
        <Input value={price} onChangeText={setPrice} placeholder="0,00" keyboardType="decimal-pad" aria-labelledby="product-price" />
      </View>

      <View className="gap-1.5">
        <Label nativeID="store-name">Mercado (opcional)</Label>
        <Input value={store} onChangeText={setStore} placeholder="Ex: Supermercado X" aria-labelledby="store-name" />
      </View>

      <Button onPress={handleSubmit} disabled={!name.trim() || !price.trim()}>
        <Text>Salvar</Text>
      </Button>
    </View>
  )
}
```

- [ ] **Step 4: Create Scan tab screen**

Create `app/(tabs)/scan.tsx`:

```typescript
import { useState } from 'react'
import { View, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { ScannerView } from '~/components/ScannerView'
import { ManualEntryForm } from '~/components/ManualEntryForm'
import { fetchNfceData } from '~/services/nfce-parser'
import { ingestReceipt } from '~/services/receipt-ingestion'
import { useAppStore } from '~/store/app-store'

export default function ScanScreen() {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan')
  const { isProcessing, setProcessing, setError } = useAppStore()

  const handleScan = async (url: string) => {
    if (isProcessing) return
    setProcessing(true)
    try {
      const data = await fetchNfceData(url)
      const receiptId = await ingestReceipt(data)
      Alert.alert('Sucesso!', `${data.items.length} itens importados.`)
      router.push(`/receipt/${receiptId}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao processar nota'
      setError(msg)
      Alert.alert('Erro', msg)
    } finally {
      setProcessing(false)
    }
  }

  const handleManualSubmit = async ({ name, price, store }: { name: string; price: string; store: string }) => {
    setProcessing(true)
    try {
      const priceNum = parseFloat(price.replace(',', '.'))
      await ingestReceipt({
        storeName: store || 'Manual',
        storeCnpj: '',
        storeAddress: '',
        items: [{ name, unit: 'UN', quantity: 1, unitPrice: priceNum, totalPrice: priceNum }],
        totalAmount: priceNum,
        purchaseDate: new Date(),
        qrcodeUrl: '',
      })
      Alert.alert('Salvo!', `${name} adicionado.`)
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.')
    } finally {
      setProcessing(false)
    }
  }

  if (isProcessing) {
    return (
      <View className="flex-1 items-center justify-center gap-4">
        <ActivityIndicator size="large" />
        <Text>Processando nota fiscal...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1">
      <View className="flex-row justify-center gap-2 p-3">
        <Button variant={mode === 'scan' ? 'default' : 'outline'} onPress={() => setMode('scan')}>
          <Text>QR Code</Text>
        </Button>
        <Button variant={mode === 'manual' ? 'default' : 'outline'} onPress={() => setMode('manual')}>
          <Text>Manual</Text>
        </Button>
      </View>

      {mode === 'scan' ? <ScannerView onScan={handleScan} enabled={!isProcessing} /> : <ManualEntryForm onSubmit={handleManualSubmit} />}
    </View>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/ScannerView.tsx components/ManualEntryForm.tsx store/ app/\(tabs\)/scan.tsx
git commit -m "feat: add QR scanner screen with manual entry fallback"
```

---

## Task 6: Products List Screen (Home)

**Files:**
- Create: `components/ProductCard.tsx`
- Create: `components/PriceChangeAlert.tsx`
- Create: `components/EmptyState.tsx`
- Create: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create PriceChangeAlert**

Create `components/PriceChangeAlert.tsx`:

```typescript
import { View } from 'react-native'
import { Text } from '~/components/ui/text'

interface Props {
  changePercent: number
  direction: 'up' | 'down' | 'stable'
}

export function PriceChangeAlert({ changePercent, direction }: Props) {
  const color = direction === 'up' ? 'text-red-500' : 'text-green-500'
  const icon = direction === 'up' ? '↑' : '↓'

  return (
    <View className="flex-row items-center gap-0.5">
      <Text className={`text-sm font-bold ${color}`}>
        {icon} {Math.abs(changePercent).toFixed(1)}%
      </Text>
    </View>
  )
}
```

- [ ] **Step 2: Create ProductCard**

Create `components/ProductCard.tsx`:

```typescript
import { Pressable, View } from 'react-native'
import { Link } from 'expo-router'
import { Text } from '~/components/ui/text'
import { Card } from '~/components/ui/card'
import { PriceChangeAlert } from './PriceChangeAlert'
import { PriceChange } from '~/types'

interface Props {
  productId: number
  name: string
  lastPrice: number
  priceChange: PriceChange | null
}

export function ProductCard({ productId, name, lastPrice, priceChange }: Props) {
  return (
    <Link href={`/product/${productId}`} asChild>
      <Pressable>
        <Card className="p-3">
          <View className="flex-row items-center justify-between">
            <View className="mr-2 flex-1">
              <Text className="text-base font-medium" numberOfLines={1}>{name}</Text>
              <Text className="mt-1 text-lg font-bold">
                R$ {lastPrice.toFixed(2).replace('.', ',')}
              </Text>
            </View>
            {priceChange && priceChange.direction !== 'stable' && (
              <PriceChangeAlert changePercent={priceChange.changePercent} direction={priceChange.direction} />
            )}
          </View>
        </Card>
      </Pressable>
    </Link>
  )
}
```

- [ ] **Step 3: Create EmptyState**

Create `components/EmptyState.tsx`:

```typescript
import { View } from 'react-native'
import { Text } from '~/components/ui/text'

interface Props {
  title: string
  description: string
}

export function EmptyState({ title, description }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-6">
      <Text className="text-4xl">🛒</Text>
      <Text className="text-center text-lg font-bold">{title}</Text>
      <Text className="text-center text-sm text-muted-foreground">{description}</Text>
    </View>
  )
}
```

- [ ] **Step 4: Create Products list screen**

Create `app/(tabs)/index.tsx`:

```typescript
import { useEffect, useState, useCallback } from 'react'
import { FlatList, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { eq, desc } from 'drizzle-orm'
import { Text } from '~/components/ui/text'
import { db } from '~/db/client'
import { products, priceEntries } from '~/db/schema'
import { calculatePriceChange } from '~/services/price-analyzer'
import { ProductCard } from '~/components/ProductCard'
import { EmptyState } from '~/components/EmptyState'
import { PriceChange } from '~/types'

interface ProductWithPrice {
  id: number
  name: string
  lastPrice: number
  priceChange: PriceChange | null
}

export default function ProductsScreen() {
  const [items, setItems] = useState<ProductWithPrice[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      loadProducts()
    }, [])
  )

  async function loadProducts() {
    setLoading(true)
    const allProducts = await db.select().from(products).orderBy(desc(products.createdAt))
    const withPrices: ProductWithPrice[] = []

    for (const p of allProducts) {
      const [latest] = await db.select().from(priceEntries).where(eq(priceEntries.productId, p.id)).orderBy(desc(priceEntries.recordedAt)).limit(1)
      if (latest) {
        const change = await calculatePriceChange(p.id)
        withPrices.push({ id: p.id, name: p.name, lastPrice: latest.unitPrice, priceChange: change })
      }
    }

    setItems(withPrices)
    setLoading(false)
  }

  if (!loading && items.length === 0) {
    return <EmptyState title="Nenhum produto" description="Escaneie uma nota fiscal para começar a acompanhar preços" />
  }

  return (
    <View className="flex-1 p-3">
      <Text className="mb-3 text-2xl font-bold">Meus Produtos</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View className="mb-2">
            <ProductCard productId={item.id} name={item.name} lastPrice={item.lastPrice} priceChange={item.priceChange} />
          </View>
        )}
      />
    </View>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/ProductCard.tsx components/PriceChangeAlert.tsx components/EmptyState.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add products list screen with price change alerts"
```

---

## Task 7: Product Detail Screen with Price Chart

**Files:**
- Create: `components/PriceChart.tsx`
- Create: `app/product/[id].tsx`

- [ ] **Step 1: Create PriceChart component**

Create `components/PriceChart.tsx`:

```typescript
import { View } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { Text } from '~/components/ui/text'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DataPoint {
  value: number
  date: Date
}

interface Props {
  data: DataPoint[]
}

export function PriceChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <View className="items-center p-4">
        <Text className="text-muted-foreground">Dados insuficientes para gráfico (mín. 2 registros)</Text>
      </View>
    )
  }

  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime())
  const chartData = sorted.map((point, idx) => ({
    value: point.value,
    label: idx % Math.ceil(sorted.length / 4) === 0 ? format(point.date, 'dd/MM', { locale: ptBR }) : '',
  }))

  return (
    <View className="p-3">
      <Text className="mb-2 text-base font-bold">Evolução de Preço</Text>
      <LineChart
        data={chartData}
        width={280}
        height={180}
        spacing={50}
        color="#3b82f6"
        dataPointsColor="#3b82f6"
        thickness={2}
        startFillColor="rgba(59,130,246,0.2)"
        endFillColor="rgba(59,130,246,0.01)"
        areaChart
        curved
        xAxisLabelTextStyle={{ fontSize: 10, color: '#666' }}
        yAxisTextStyle={{ fontSize: 10, color: '#666' }}
      />
    </View>
  )
}
```

- [ ] **Step 2: Create Product Detail screen**

Create `app/product/[id].tsx`:

```typescript
import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { eq, desc } from 'drizzle-orm'
import { Text } from '~/components/ui/text'
import { Separator } from '~/components/ui/separator'
import { db } from '~/db/client'
import { products, priceEntries, stores } from '~/db/schema'
import { PriceChart } from '~/components/PriceChart'
import { PriceChangeAlert } from '~/components/PriceChangeAlert'
import { calculatePriceChange } from '~/services/price-analyzer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PriceChange } from '~/types'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const productId = Number(id)

  const [product, setProduct] = useState<{ name: string; unit: string | null } | null>(null)
  const [history, setHistory] = useState<{ value: number; date: Date; storeName: string }[]>([])
  const [change, setChange] = useState<PriceChange | null>(null)

  useEffect(() => {
    loadData()
  }, [productId])

  async function loadData() {
    const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
    if (!p) return
    setProduct(p)

    const entries = await db
      .select({ unitPrice: priceEntries.unitPrice, recordedAt: priceEntries.recordedAt, storeName: stores.name })
      .from(priceEntries)
      .innerJoin(stores, eq(priceEntries.storeId, stores.id))
      .where(eq(priceEntries.productId, productId))
      .orderBy(desc(priceEntries.recordedAt))

    setHistory(entries.map((e) => ({ value: e.unitPrice, date: new Date(e.recordedAt), storeName: e.storeName })))
    setChange(await calculatePriceChange(productId))
  }

  if (!product) return null

  return (
    <ScrollView className="flex-1">
      <View className="gap-4 p-4">
        <View>
          <Text className="text-2xl font-bold">{product.name}</Text>
          {product.unit && <Text className="text-muted-foreground">Unidade: {product.unit}</Text>}
        </View>

        {change && change.direction !== 'stable' && (
          <View className="flex-row items-center gap-2 rounded-lg bg-secondary p-3">
            <PriceChangeAlert changePercent={change.changePercent} direction={change.direction} />
            <Text className="text-sm text-muted-foreground">
              {change.direction === 'up' ? 'Aumento' : 'Redução'} desde a última compra
            </Text>
          </View>
        )}

        <PriceChart data={history} />

        <Separator />

        <View className="gap-2">
          <Text className="text-lg font-bold">Histórico</Text>
          {history.map((entry, idx) => (
            <View key={idx} className={`flex-row items-center justify-between rounded p-2 ${idx % 2 === 0 ? 'bg-secondary' : ''}`}>
              <View>
                <Text className="text-sm">{format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}</Text>
                <Text className="text-xs text-muted-foreground">{entry.storeName}</Text>
              </View>
              <Text className="text-base font-bold">R$ {entry.value.toFixed(2).replace('.', ',')}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/PriceChart.tsx app/product/\[id\].tsx
git commit -m "feat: add product detail screen with price history chart"
```

---

## Task 8: Tab Navigator, Stores & Receipt Detail

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/stores.tsx`
- Create: `app/receipt/[id].tsx`

- [ ] **Step 1: Install icons**

```bash
bun add lucide-react-native
```

- [ ] **Step 2: Create Tab layout**

Create `app/(tabs)/_layout.tsx`:

```typescript
import { Tabs } from 'expo-router'
import { ShoppingCart, ScanLine, Store } from 'lucide-react-native'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6' }}>
      <Tabs.Screen name="index" options={{ title: 'Produtos', tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} /> }} />
      <Tabs.Screen name="scan" options={{ title: 'Escanear', tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} /> }} />
      <Tabs.Screen name="stores" options={{ title: 'Mercados', tabBarIcon: ({ color, size }) => <Store color={color} size={size} /> }} />
    </Tabs>
  )
}
```

- [ ] **Step 3: Create Stores screen**

Create `app/(tabs)/stores.tsx`:

```typescript
import { useEffect, useState, useCallback } from 'react'
import { FlatList, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { desc } from 'drizzle-orm'
import { Text } from '~/components/ui/text'
import { Card } from '~/components/ui/card'
import { db } from '~/db/client'
import { stores } from '~/db/schema'
import { EmptyState } from '~/components/EmptyState'

export default function StoresScreen() {
  const [storeList, setStoreList] = useState<{ id: number; name: string; cnpj: string | null }[]>([])

  useFocusEffect(useCallback(() => { loadStores() }, []))

  async function loadStores() {
    setStoreList(await db.select().from(stores).orderBy(desc(stores.createdAt)))
  }

  if (storeList.length === 0) {
    return <EmptyState title="Nenhum mercado" description="Mercados aparecem automaticamente ao escanear notas" />
  }

  return (
    <View className="flex-1 p-3">
      <Text className="mb-3 text-2xl font-bold">Mercados</Text>
      <FlatList
        data={storeList}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card className="mb-2 p-3">
            <Text className="text-base font-medium">{item.name}</Text>
            {item.cnpj && <Text className="text-xs text-muted-foreground">CNPJ: {item.cnpj}</Text>}
          </Card>
        )}
      />
    </View>
  )
}
```

- [ ] **Step 4: Create Receipt Detail screen**

Create `app/receipt/[id].tsx`:

```typescript
import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { eq } from 'drizzle-orm'
import { Text } from '~/components/ui/text'
import { Separator } from '~/components/ui/separator'
import { db } from '~/db/client'
import { receipts, priceEntries, products, stores } from '~/db/schema'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const receiptId = Number(id)

  const [storeName, setStoreName] = useState('')
  const [date, setDate] = useState<Date | null>(null)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState<{ name: string; quantity: number; unitPrice: number; total: number }[]>([])

  useEffect(() => { loadReceipt() }, [receiptId])

  async function loadReceipt() {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, receiptId)).limit(1)
    if (!receipt) return

    const [store] = await db.select().from(stores).where(eq(stores.id, receipt.storeId)).limit(1)
    setStoreName(store?.name ?? 'Desconhecido')
    setDate(new Date(receipt.purchaseDate))
    setTotal(receipt.totalAmount ?? 0)

    const entries = await db
      .select({ name: products.name, quantity: priceEntries.quantity, unitPrice: priceEntries.unitPrice, total: priceEntries.price })
      .from(priceEntries)
      .innerJoin(products, eq(priceEntries.productId, products.id))
      .where(eq(priceEntries.receiptId, receiptId))

    setItems(entries)
  }

  return (
    <ScrollView className="flex-1">
      <View className="gap-4 p-4">
        <View>
          <Text className="text-2xl font-bold">{storeName}</Text>
          {date && <Text className="text-muted-foreground">{format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</Text>}
        </View>

        <Separator />

        {items.map((item, idx) => (
          <View key={idx} className="flex-row items-center justify-between py-2">
            <View className="mr-2 flex-1">
              <Text className="text-sm" numberOfLines={1}>{item.name}</Text>
              <Text className="text-xs text-muted-foreground">{item.quantity}x R$ {item.unitPrice.toFixed(2).replace('.', ',')}</Text>
            </View>
            <Text className="font-bold">R$ {item.total.toFixed(2).replace('.', ',')}</Text>
          </View>
        ))}

        <Separator />

        <View className="flex-row justify-between">
          <Text className="text-lg font-bold">Total</Text>
          <Text className="text-lg font-bold">R$ {total.toFixed(2).replace('.', ',')}</Text>
        </View>
      </View>
    </ScrollView>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat: add tab navigator, stores screen, and receipt detail"
```

---

## Task 9: App Configuration & Final Integration

**Files:**
- Modify: `app.json`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update app.json**

```json
{
  "expo": {
    "name": "Notraq",
    "slug": "notraq",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "notraq",
    "plugins": [
      "expo-router",
      ["expo-camera", { "cameraPermission": "Permitir acesso à câmera para escanear QR codes de notas fiscais" }]
    ],
    "experiments": { "typedRoutes": true },
    "ios": { "bundleIdentifier": "com.notraq.app", "supportsTablet": false },
    "android": { "package": "com.notraq.app" }
  }
}
```

- [ ] **Step 2: Update root layout to run migrations**

Update `app/_layout.tsx`:

```typescript
import '../global.css'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Text } from '~/components/ui/text'
import { DatabaseProvider, useDatabaseMigrations } from '~/db/client'

function AppContent() {
  const { success, error } = useDatabaseMigrations()

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-destructive">Erro ao inicializar banco: {error.message}</Text>
      </View>
    )
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Produto' }} />
      <Stack.Screen name="receipt/[id]" options={{ title: 'Nota Fiscal' }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </SafeAreaProvider>
  )
}
```

- [ ] **Step 3: Verify full app runs**

```bash
bun start
```

Test flow:
1. App opens → Products tab (empty state)
2. Scan tab → camera permission → manual entry works
3. Products tab → product appears with price
4. Tap product → detail with chart (needs 2+ entries)
5. Stores tab → store appears

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Notraq MVP — ready for testing"
```

---

## Summary

| Task | Description | Estimated Time |
|------|-------------|---------------|
| 1 | Project scaffolding (Expo + NativeWind + RNR) | 20 min |
| 2 | Database schema + Drizzle | 15 min |
| 3 | Types + NFC-e parser | 20 min |
| 4 | Price analyzer + receipt ingestion | 15 min |
| 5 | QR Scanner screen | 25 min |
| 6 | Products list (home) | 20 min |
| 7 | Product detail + chart | 20 min |
| 8 | Tabs + stores + receipt detail | 20 min |
| 9 | App config + final integration | 10 min |
| **Total** | | **~3 hours** |

## Future Enhancements (Post-MVP)

- Fuzzy matching de produtos (levenshtein distance)
- Notificações push quando preço sobe acima de X%
- Export de dados (CSV)
- Comparativo entre mercados por produto
- Busca/filtro de produtos
- Dark mode toggle
- Backup/sync com cloud (Supabase)
