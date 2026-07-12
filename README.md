# Notraq

Rastreador de preços de supermercado via NFC-e (cupom fiscal eletrônico).

Escaneie o QR code do cupom fiscal, acompanhe a evolução de preços dos produtos e receba alertas de variação.

## Stack

- [Expo](https://expo.dev/) 56 + [React Native](https://reactnative.dev/) 0.85
- [Expo Router](https://expo.dev/router) (file-based routing)
- [NativeWind](https://www.nativewind.dev/) + [Tailwind CSS](https://tailwindcss.com/) (estilização)
- [React Native Reusables](https://reactnativereusables.com) (componentes UI — modelo shadcn)
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) + [Drizzle ORM](https://orm.drizzle.team/) (banco local)
- [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) (scan de QR code)
- [react-native-webview](https://github.com/nicolestandifer/react-native-webview) (consulta SEFAZ)
- [react-native-svg](https://github.com/software-mansion/react-native-svg) (gráficos)
- [react-native-currency-input](https://github.com/CaioQuirinoMedeiros/react-native-currency-input) (máscara R$)
- [Zustand](https://zustand-demo.pmnd.rs/) (estado global)
- Fonte: [Capriola](https://fonts.google.com/specimen/Capriola)

## Funcionalidades

- 📷 Scan de QR code via câmera ou importação de foto
- 🌐 Consulta automática na SEFAZ via WebView (captcha manual)
- ✍️ Entrada manual de produtos com autocomplete e máscara R$
- 📊 Gráfico de evolução de preços (SVG customizado)
- 🔔 Alertas de variação de preço (subindo/descendo)
- 🏪 Gerenciamento de mercados (editar, excluir)
- 🧾 Histórico de notas fiscais com detalhamento
- 🔍 Busca e filtros de produtos (por tendência, preço, nome)
- 🗑️ Exclusão de notas e mercados com confirmação

## Começando

```bash
# Instalar dependências
pnpm install

# Gerar nativos (necessário para camera e webview)
pnpm prebuild

# Rodar no Android
pnpm android

# Rodar no iOS (Mac only)
pnpm ios

# Dev server
pnpm start
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm start` | Inicia o dev server |
| `pnpm android` | Build + run Android |
| `pnpm ios` | Build + run iOS |
| `pnpm web` | Dev server web |
| `pnpm lint` | Type check + ESLint |
| `pnpm format` | Formata com Prettier |
| `pnpm test` | Testes unitários (Jest) |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm e2e:build` | Build para E2E (Detox) |
| `pnpm e2e:test` | Rodar testes E2E |
| `pnpm prebuild` | Regenera pastas nativas |
| `pnpm db:generate` | Gera migrations Drizzle |

## Estrutura

```
src/
├── app/           # Rotas (Expo Router)
├── components/    # Componentes React
│   └── ui/        # Primitivos RNR (button, card, input...)
├── db/            # Schema + client Drizzle
├── services/      # Lógica de negócio (parser, analyzer, ingestion)
├── store/         # Estado global (Zustand)
├── lib/           # Utilitários (cn, formatBRL, getNameColor, toTitleCase)
├── types/         # TypeScript types
├── __tests__/     # Testes unitários e de componentes
└── assets/        # Imagens e recursos

e2e/               # Testes E2E (Detox)
```

## Testes

- **Unitários (Jest):** Services (nfce-url, nfce-parser) + Utils (formatBRL, toTitleCase, getNameColor)
- **Componentes (RNTL):** EmptyState, PriceChangeAlert, Toast, ConfirmDialog, Sparkline
- **E2E (Detox):** Navegação entre tabs, fluxo completo de entrada manual

## Design

Dark mode por padrão. Design pixel-perfect baseado em mockup do Claude Design.

- Background: `#09090b` (zinc-950)
- Cards: `#18181b` com border `#27272a`
- Accent: verde `#34d399`
- Alerta de alta: vermelho `#f87171`
- Fonte: Capriola (Google Fonts)
- Font mono para números e preços

## Licença

Projeto privado.
