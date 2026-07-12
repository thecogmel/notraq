# 🟢🟣 Notraq — Sprint Planning Hub

Rastreador de preços de supermercado via NFC-e.

**Sprint:** Sprint 1 — "Fundação MVP"
**Período:** 26/06/2026 – 10/07/2026
**Tema:** Scaffolding, banco de dados, parser NFC-e e telas principais E2E.

---

## 🎯 OKRs

**Objetivo 1: App funcional com scan de QR code**
- KR 1: Escanear QR e extrair itens automaticamente
- KR 2: Persistir produtos/preços no SQLite local
- KR 3: Gráfico de evolução de preço

**Objetivo 2: UX completa no fluxo principal**
- KR 1: Navegação por tabs (Produtos, Scan, Mercados)
- KR 2: Entrada manual como fallback
- KR 3: Detalhe com variação percentual

---

## 📋 Sprint Kanban

| Task Name | Status | Priority | Epic |
|-----------|--------|----------|------|
| Criar projeto Expo + NativeWind + RNR | Done | 🔴 High | Infraestrutura |
| Instalar deps (sqlite, drizzle, camera, charts, zustand) | Done | 🔴 High | Infraestrutura |
| Configurar Tailwind + global.css (light/dark) | Done | 🔴 High | Infraestrutura |
| Configurar babel + metro + tsconfig | Done | 🔴 High | Infraestrutura |
| Reorganizar para estrutura src/ com aliases | Done | 🟡 Medium | Infraestrutura |
| Instalar componentes UI (button, card, input, label, separator, text) | Done | 🔴 High | Infraestrutura |
| Configurar ESLint + Prettier | Done | 🟡 Medium | Infraestrutura |
| Criar home screen inicial | Done | 🟢 Low | Infraestrutura |
| Criar schema Drizzle (stores, products, receipts, priceEntries) | To Do | 🔴 High | Banco de Dados |
| Criar client DB + provider + migrations | To Do | 🔴 High | Banco de Dados |
| Gerar migration inicial | To Do | 🔴 High | Banco de Dados |
| Definir types compartilhados (NfceItem, NfceReceipt, PriceChange) | To Do | 🟡 Medium | Parser NFC-e |
| Criar parser NFC-e (fetch + regex extraction) | To Do | 🔴 High | Parser NFC-e |
| Criar serviço de ingestão de notas | To Do | 🔴 High | Parser NFC-e |
| Criar analisador de preços (variação %, direção) | To Do | 🟡 Medium | Análise |
| Criar Zustand store (isProcessing, lastError) | To Do | 🟢 Low | Telas |
| Criar ScannerView (câmera + permissão) | To Do | 🔴 High | Telas |
| Criar ManualEntryForm | To Do | 🟡 Medium | Telas |
| Criar tela Scan com toggle QR/Manual | To Do | 🔴 High | Telas |
| Criar PriceChangeAlert (badge ↑/↓) | To Do | 🟢 Low | Telas |
| Criar ProductCard | To Do | 🟡 Medium | Telas |
| Criar EmptyState | To Do | 🟢 Low | Telas |
| Criar tela lista de produtos (home real) | To Do | 🔴 High | Telas |
| Criar PriceChart (LineChart gifted-charts) | To Do | 🟡 Medium | Telas |
| Criar tela detalhe do produto | To Do | 🔴 High | Telas |
| Criar Tab layout (Produtos, Escanear, Mercados) | To Do | 🔴 High | Telas |
| Criar tela de Mercados | To Do | 🟡 Medium | Telas |
| Criar tela Detalhe da Nota | To Do | 🟡 Medium | Telas |
| Atualizar app.json (plugin camera, permissão pt-BR) | To Do | 🟡 Medium | Config Final |
| Atualizar root layout (migrations na inicialização) | To Do | 🔴 High | Config Final |
| Teste completo do fluxo E2E | To Do | 🔴 High | Config Final |

---

## ✅ Definição de Pronto

- App builda sem erros no Android
- TypeScript sem erros (`tsc --noEmit`)
- ESLint passa sem warnings
- Testado manualmente no device/emulador
- Commit atômico com mensagem descritiva

---

## 📝 Decisões Técnicas

- **Expo Router** com file-based routing em `src/app/`
- **Banco local** SQLite + Drizzle — sem backend no MVP
- **Parser regex** para HTML da NFC-e
- Estrutura `src/` com alias `@/*`
- ESLint flat config + Prettier com import sorting
- Commits em inglês, docs em português
