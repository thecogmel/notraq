# Notraq - Plano de Implementação MVP

**Objetivo:** App mobile que escaneia QR codes de NFC-e (cupons fiscais brasileiros), extrai dados de produtos, armazena histórico de preços localmente e mostra evolução de preços com alertas de variação.

**Arquitetura:** App Expo com roteamento por arquivos (Expo Router). Banco SQLite local via expo-sqlite + Drizzle ORM. Scanner de QR code via câmera alimenta um parser que extrai dados dos produtos. Gráficos via react-native-gifted-charts. Estado global com Zustand. Componentes UI do React Native Reusables (modelo shadcn) estilizados com NativeWind/Tailwind CSS.

**Stack:**
- Expo 56, React Native 0.85, Expo Router
- React Native Reusables + NativeWind (UI — modelo shadcn/ui)
- expo-sqlite + Drizzle ORM (banco local)
- expo-camera (scan de QR code)
- react-native-gifted-charts (gráficos de evolução)
- Zustand (estado global)
- date-fns (formatação de datas)

**Nome do App:** `notraq`

---

## Estrutura de Arquivos

```
src/
├── app/
│   ├── _layout.tsx                # Layout raiz: providers (DB, NativeWind, SafeArea)
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Tab navigator (Produtos, Scan, Mercados)
│   │   ├── index.tsx              # Lista de produtos (home)
│   │   ├── scan.tsx               # Scan QR + entrada manual
│   │   └── stores.tsx             # Lista de mercados
│   ├── product/[id].tsx           # Detalhe do produto + gráfico de preços
│   └── receipt/[id].tsx           # Detalhe da nota (itens de um scan)
├── components/
│   ├── ui/                        # Componentes RNR (instalados via CLI)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── separator.tsx
│   │   └── text.tsx
│   ├── ProductCard.tsx            # Item de produto com indicador de variação
│   ├── PriceChart.tsx             # Wrapper do gráfico de linha
│   ├── ScannerView.tsx            # Componente de câmera QR
│   ├── ManualEntryForm.tsx        # Formulário de entrada manual
│   ├── PriceChangeAlert.tsx       # Badge de alerta % variação
│   └── EmptyState.tsx             # Placeholder de estado vazio
├── db/
│   ├── schema.ts                  # Schema Drizzle (products, stores, prices, receipts)
│   ├── client.ts                  # Inicialização do DB + migrations
│   └── migrations/                # SQL migrations geradas
├── services/
│   ├── nfce-parser.ts             # Parse de URL NFC-e, fetch + extração de itens
│   ├── price-analyzer.ts          # Cálculo de variações, percentuais, alertas
│   └── receipt-ingestion.ts       # Liga parser ao DB (upsert produtos, lojas, preços)
├── store/
│   └── app-store.ts               # Zustand store (estado do scan, UI)
├── lib/
│   ├── utils.ts                   # Helper cn() para merge de classes NativeWind
│   └── theme.ts                   # Tema de navegação (light/dark)
├── assets/
│   └── images/
└── types/
    └── index.ts                   # Types TypeScript compartilhados
```

---

## Task 1: Scaffolding do Projeto

- [x] **Step 1:** Criar projeto Expo com template RNR (Minimal Nativewind)
- [x] **Step 2:** Instalar NativeWind + dependências (reanimated, safe-area-context)
- [x] **Step 3:** Instalar dependências core (expo-sqlite, drizzle-orm, zustand, date-fns, gifted-charts, expo-camera)
- [x] **Step 4:** Inicializar React Native Reusables + instalar componentes (button, card, input, label, separator, text)
- [x] **Step 5:** Configurar Tailwind (tema de cores semânticas, darkMode, tailwindcss-animate)
- [x] **Step 6:** Criar global.css (variáveis CSS light/dark com tema blue-based)
- [x] **Step 7:** Configurar babel.config.js (jsxImportSource nativewind + inline-import .sql)
- [x] **Step 8:** Configurar metro.config.js (withNativeWind)
- [x] **Step 9:** Criar root layout com providers (ThemeProvider, PortalHost)
- [x] **Step 10:** Reorganizar para estrutura src/ com aliases (@/* -> ./src/*)
- [x] **Step 11:** Configurar ESLint (flat config + expo + prettier) e Prettier (import sorting + tailwind)
- [x] **Step 12:** Verificar app roda no Android
- [x] **Step 13:** Commit inicial

---

## Task 2: Schema do Banco & Client

**Arquivos:**
- Criar: `src/db/schema.ts`
- Criar: `src/db/client.ts`
- Criar: `drizzle.config.ts`

- [ ] **Step 1:** Criar schema Drizzle (stores, products, receipts, priceEntries)
- [ ] **Step 2:** Criar client do banco com provider + hook useDatabaseMigrations
- [ ] **Step 3:** Criar drizzle.config.ts
- [ ] **Step 4:** Gerar migration inicial (`pnpm db:generate`)
- [ ] **Step 5:** Commit

---

## Task 3: Types & Parser de NFC-e

**Arquivos:**
- Criar: `src/types/index.ts`
- Criar: `src/services/nfce-parser.ts`

- [ ] **Step 1:** Definir types compartilhados (NfceItem, NfceReceipt, PriceChange)
- [ ] **Step 2:** Criar parser de NFC-e (fetch HTML + extração de itens via regex)
- [ ] **Step 3:** Commit

---

## Task 4: Analisador de Preços & Ingestão de Notas

**Arquivos:**
- Criar: `src/services/price-analyzer.ts`
- Criar: `src/services/receipt-ingestion.ts`

- [ ] **Step 1:** Criar analisador de preços (histórico, cálculo de variação %)
- [ ] **Step 2:** Criar serviço de ingestão (upsert loja, produto, price entry)
- [ ] **Step 3:** Commit

---

## Task 5: Tela de Scanner QR

**Arquivos:**
- Criar: `src/components/ScannerView.tsx`
- Criar: `src/components/ManualEntryForm.tsx`
- Criar: `src/store/app-store.ts`
- Criar: `src/app/(tabs)/scan.tsx`

- [ ] **Step 1:** Criar Zustand store (isProcessing, lastError)
- [ ] **Step 2:** Criar ScannerView (câmera + permissão)
- [ ] **Step 3:** Criar ManualEntryForm (entrada manual de produto/preço)
- [ ] **Step 4:** Criar tela Scan com toggle QR/Manual
- [ ] **Step 5:** Commit

---

## Task 6: Tela de Lista de Produtos (Home)

**Arquivos:**
- Criar: `src/components/ProductCard.tsx`
- Criar: `src/components/PriceChangeAlert.tsx`
- Criar: `src/components/EmptyState.tsx`
- Criar: `src/app/(tabs)/index.tsx`

- [ ] **Step 1:** Criar PriceChangeAlert (badge ↑/↓ com %)
- [ ] **Step 2:** Criar ProductCard (nome, preço, variação)
- [ ] **Step 3:** Criar EmptyState
- [ ] **Step 4:** Criar tela de listagem com FlatList
- [ ] **Step 5:** Commit

---

## Task 7: Tela de Detalhe do Produto com Gráfico

**Arquivos:**
- Criar: `src/components/PriceChart.tsx`
- Criar: `src/app/product/[id].tsx`

- [ ] **Step 1:** Criar PriceChart (LineChart com área, curved, labels pt-BR)
- [ ] **Step 2:** Criar tela de detalhe (info + gráfico + histórico por loja)
- [ ] **Step 3:** Commit

---

## Task 8: Tab Navigator, Mercados & Detalhe de Nota

**Arquivos:**
- Criar: `src/app/(tabs)/_layout.tsx`
- Criar: `src/app/(tabs)/stores.tsx`
- Criar: `src/app/receipt/[id].tsx`

- [ ] **Step 1:** Criar Tab layout (Produtos, Escanear, Mercados) com ícones Lucide
- [ ] **Step 2:** Criar tela de Mercados (lista de lojas)
- [ ] **Step 3:** Criar tela de Detalhe da Nota (itens + total)
- [ ] **Step 4:** Commit

---

## Task 9: Configuração Final & Integração

**Arquivos:**
- Modificar: `app.json`
- Modificar: `src/app/_layout.tsx`

- [ ] **Step 1:** Atualizar app.json (plugin expo-camera com permissão em pt-BR, bundleIdentifier)
- [ ] **Step 2:** Atualizar root layout para rodar migrations na inicialização
- [ ] **Step 3:** Teste completo do fluxo
- [ ] **Step 4:** Commit final

---

## Resumo

| Task | Descrição | Tempo Estimado |
|------|-----------|---------------|
| 1 | Scaffolding (Expo + NativeWind + RNR) | ✅ Concluído |
| 2 | Schema do banco + Drizzle | 15 min |
| 3 | Types + parser NFC-e | 20 min |
| 4 | Analisador de preços + ingestão | 15 min |
| 5 | Tela de scanner QR | 25 min |
| 6 | Lista de produtos (home) | 20 min |
| 7 | Detalhe do produto + gráfico | 20 min |
| 8 | Tabs + mercados + detalhe nota | 20 min |
| 9 | Config final + integração | 10 min |
| **Total restante** | | **~2.5 horas** |

---

## Melhorias Futuras (Pós-MVP)

- Fuzzy matching de produtos (distância de Levenshtein)
- Notificações push quando preço sobe acima de X%
- Exportação de dados (CSV)
- Comparativo entre mercados por produto
- Busca/filtro de produtos
- Toggle de dark mode
- Backup/sync com cloud (Supabase)
