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
- [react-native-gifted-charts](https://github.com/nicolestandifer/react-native-gifted-charts) (gráficos)
- [Zustand](https://zustand-demo.pmnd.rs/) (estado global)

## Começando

```bash
# Instalar dependências
pnpm install

# Gerar nativos
pnpm prebuild

# Rodar no Android
pnpm android

# Rodar no iOS (Mac only)
pnpm ios

# Dev server (Expo Go)
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
| `pnpm prebuild` | Regenera pastas nativas |
| `pnpm db:generate` | Gera migrations Drizzle |

## Estrutura

```
src/
├── app/          # Rotas (Expo Router)
├── components/   # Componentes React
│   └── ui/       # Primitivos RNR (button, card, input...)
├── db/           # Schema + client Drizzle
├── services/     # Lógica de negócio (parser, analyzer)
├── store/        # Estado global (Zustand)
├── lib/          # Utilitários (cn, theme)
├── types/        # TypeScript types
└── assets/       # Imagens e recursos
```

## Licença

Projeto privado.
