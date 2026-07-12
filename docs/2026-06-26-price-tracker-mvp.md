# Notraq - Plano de Implementação MVP

**Objetivo:** App mobile que escaneia QR codes de NFC-e (cupons fiscais brasileiros), extrai dados de produtos, armazena histórico de preços localmente e mostra evolução de preços com alertas de variação.

**Arquitetura:** App Expo com roteamento por arquivos (Expo Router). Banco SQLite local via expo-sqlite + Drizzle ORM. Scanner de QR code via câmera alimenta um WebView (consulta SEFAZ com captcha manual) que extrai dados via injeção de JS. Gráficos SVG customizados. Estado global com Zustand. Componentes UI do React Native Reusables (modelo shadcn) estilizados com NativeWind/Tailwind CSS.

**Stack:**
- Expo 56, React Native 0.85, Expo Router
- React Native Reusables + NativeWind (UI — modelo shadcn/ui)
- expo-sqlite + Drizzle ORM (banco local)
- expo-camera (scan de QR code)
- react-native-webview (consulta SEFAZ com captcha)
- react-native-svg (gráficos customizados)
- react-native-currency-input (máscara de preço R$)
- Zustand (estado global)
- date-fns (formatação de datas)

**Nome do App:** `notraq`

---

## Estrutura de Arquivos

```
src/
├── app/
│   ├── _layout.tsx                # Layout raiz: migrations, StatusBar
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Tab navigator (Início, Produtos, Mercados)
│   │   ├── index.tsx              # Home/Dashboard
│   │   ├── products.tsx           # Lista de produtos (busca, filtros, sparklines)
│   │   └── markets.tsx            # Lista de mercados
│   ├── scan.tsx                   # Modal: QR scan + importar foto + manual
│   ├── nfce-webview.tsx           # WebView para consulta SEFAZ (captcha)
│   ├── product/[id].tsx           # Detalhe do produto + gráfico + onde encontrar
│   ├── receipt/[id].tsx           # Detalhe da nota (itens, total, delete)
│   └── market/[id].tsx            # Detalhe do mercado (edit, delete, compras)
├── components/
│   ├── ui/                        # RNR (button, card, input, label, separator, text, icon)
│   ├── EmptyState.tsx
│   ├── ManualEntryForm.tsx        # Formulário com autocomplete (loja + produto)
│   ├── PriceChangeAlert.tsx
│   ├── PriceChart.tsx             # SVG customizado (área + linha + pontos)
│   ├── ProductCard.tsx
│   ├── ScannerView.tsx
│   └── Toast.tsx                  # Notificações inline (substitui Alert nativo)
├── db/
│   ├── schema.ts                  # Drizzle: stores, products, receipts, price_entries
│   ├── client.ts                  # Singleton db + useDatabaseMigrations
│   └── migrations/
├── services/
│   ├── image-scanner.ts           # Picker galeria + Camera.scanFromURLAsync
│   ├── nfce-parser.ts            # Script JS para WebView + parseWebViewResult
│   ├── nfce-url.ts              # Parse URL QR, chave acesso, UF, buildConsultaUrl
│   ├── price-analyzer.ts         # Histórico, cálculo variação %
│   └── receipt-ingestion.ts      # Upsert store/product/prices (Title Case, dedup)
├── store/
│   └── app-store.ts              # Zustand (isProcessing, pendingUrl, etc)
├── lib/
│   ├── utils.ts                  # cn()
│   └── theme.ts                  # NAV_THEME
├── assets/
└── types/
    └── index.ts                  # NfceItem, NfceReceipt, PriceChange, etc
```

---

## Progresso

### ✅ Task 1: Scaffolding do Projeto
Expo 56 + NativeWind + RNR + estrutura src/ + ESLint/Prettier

### ✅ Task 2: Schema do Banco & Client
Drizzle ORM com 4 tabelas + migrations + provider

### ✅ Task 3: Types & Parser NFC-e
Types compartilhados + extração via WebView JS injection + manual fallback

### ✅ Task 4: Analisador de Preços & Ingestão
Price analyzer (variação %) + receipt ingestion (upsert com Title Case + dedup)

### ✅ Task 5: Scanner QR + Entrada Manual
Câmera, importar foto (galeria), formulário manual com autocomplete + máscara R$

### ✅ Task 6: Telas de Listagem
Dashboard (stats, alertas, últimas compras) + Produtos (busca, filtros, sparklines)

### ✅ Task 7: Detalhe do Produto
Gráfico SVG + stats 2x2 + "Onde encontrar" + trend badge

### ✅ Task 8: Tabs + Mercados + Notas
3 tabs (Início, Produtos, Mercados) + detalhe mercado (edit, delete) + detalhe nota (delete)

### ✅ Task 9: WebView NFC-e
Consulta SEFAZ via WebView + captcha manual + extração de dados do DOM

### ✅ Task 10: Design System
Pixel-perfect dark mode baseado no Claude Design handoff + componentes RNR atualizados

---

## Funcionalidades Implementadas

- ✅ Scan QR code via câmera
- ✅ Importar foto da galeria (detecta QR)
- ✅ Consulta NFC-e via WebView (captcha manual + extração JS)
- ✅ Entrada manual com autocomplete (mercado + produto)
- ✅ Máscara de preço R$ (react-native-currency-input)
- ✅ Dashboard com stats, alertas e últimas compras
- ✅ Lista de produtos com busca, filtros e sparklines SVG
- ✅ Detalhe do produto com gráfico SVG + stats + "Onde encontrar"
- ✅ Detalhe da nota fiscal com variação de preço por item
- ✅ Detalhe do mercado com edição + produtos mais comprados
- ✅ Deletar notas e mercados (com confirmação)
- ✅ Dark mode pixel-perfect (design handoff)
- ✅ Toast customizado (sem Alert nativo)
- ✅ Normalização de nomes (Title Case, dedup case-insensitive)
- ✅ Limpeza automática de "RAZÃO SOCIAL:" dos nomes

---

## Melhorias Futuras (Pós-MVP)

- Fuzzy matching de produtos (distância de Levenshtein)
- Merge de mercados duplicados
- Notificações push quando preço sobe acima de X%
- Exportação de dados (CSV)
- Comparativo entre mercados por produto
- Busca/filtro de produtos por categoria
- OCR de cupom fiscal (foto do papel)
- Toggle de dark/light mode
- Backup/sync com cloud (Supabase)
- Edição de produtos (renomear, mudar unidade)
- Histórico de gastos por período
