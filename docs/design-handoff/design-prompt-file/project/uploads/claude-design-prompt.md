# Prompt — Claude Design (Notraq)

Crie um design system e mockups mobile para o app "Notraq" — um rastreador de preços de supermercado via NFC-e (cupom fiscal eletrônico). O usuário escaneia QR codes de notas fiscais e acompanha a evolução dos preços.

## Contexto técnico

- App mobile (iOS e Android) em React Native com Expo
- Estilização com Tailwind/NativeWind (dark mode por padrão)
- Componentes estilo shadcn/ui (cards, buttons, inputs, separators, labels)
- Gráficos de linha para histórico de preços
- Navegação por tabs na parte inferior

## Paleta sugerida

- Background escuro (zinc-950 / slate-950)
- Cards com superfície elevada sutil (zinc-900)
- Accent em verde ou azul-esverdeado (para indicar economia/bons preços)
- Vermelho/laranja para alertas de alta de preço
- Texto primário branco, secundário em zinc-400

## Telas para desenhar

### 1. Home (Dashboard)

- Saudação com nome do usuário
- 3 stat cards em row: total de produtos rastreados, mercados, notas escaneadas
- Seção "Alertas recentes" — cards com produtos que subiram ou desceram de preço (badge colorido com % de variação)
- Seção "Últimas compras" — lista compacta com nome do mercado, data e total
- FAB (floating action button) para escanear nova nota

### 2. Scanner

- Tela de câmera fullscreen com overlay de enquadramento do QR code
- Instrução na parte inferior: "Aponte para o QR code da nota fiscal"
- Estado de loading após leitura com progress indicator
- Estado de sucesso com resumo rápido (mercado, total, qtd itens) e botão "Ver detalhes"

### 3. Detalhe da Nota Fiscal

- Header com nome do mercado, endereço, data
- Total da compra em destaque
- Lista de itens com: nome do produto, quantidade, preço unitário, subtotal
- Cada item com indicador visual se o preço subiu/desceu vs última compra

### 4. Produto (Histórico de preço)

- Nome do produto e unidade de medida
- Gráfico de linha com histórico de preço ao longo do tempo (eixo X = datas, Y = preço)
- Cards abaixo do gráfico: preço atual, menor preço, maior preço, preço médio
- Lista "Onde encontrar" com mercados e último preço registrado em cada um
- Badge de tendência (subindo, estável, descendo)

### 5. Lista de Produtos

- Search bar no topo
- Lista com nome do produto, último preço, variação %, mini sparkline
- Filtros: todos, subindo, descendo, estáveis
- Ordenação: nome, preço, variação

### 6. Mercados

- Lista de mercados com nome, endereço abreviado, qtd de notas
- Ao tocar: tela do mercado com últimas compras e produtos mais comprados lá

## Modelo de dados (referência)

- **Stores**: nome, CNPJ, endereço
- **Products**: nome, unidade
- **Receipts**: mercado, data, total
- **PriceEntries**: produto, mercado, nota, preço, quantidade, preço unitário, data

## Diretrizes de design

- Mobile-first (iPhone 15 Pro como canvas — 393×852)
- Dark mode
- Hierarquia visual clara com tipografia (bold para títulos, regular para corpo)
- Espaçamento generoso (padding 16-20px)
- Cards com border radius 12-16px e border sutil (1px zinc-800)
- Ícones estilo Lucide (outline, stroke 1.5-2px)
- Gráficos limpos e minimalistas sem excesso de gridlines
- Bottom tab bar com 4 tabs: Home, Produtos, Mercados, Scanner (central, destacado)
- Micro-interações sutis (não precisa animar, mas indique estados hover/press)
- Acessibilidade: contraste mínimo 4.5:1 para texto

Gere os mockups como artefatos visuais de alta fidelidade, um por tela.
