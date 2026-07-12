import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { desc, eq } from 'drizzle-orm';
import { Search } from 'lucide-react-native';
import Svg, { Polyline } from 'react-native-svg';

import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products } from '@/db/schema';
import { calculatePriceChange } from '@/services/price-analyzer';
import type { PriceChange } from '@/types';

// --- Types ---

type FilterOption = 'todos' | 'subindo' | 'descendo' | 'estaveis';
type SortOption = 'variacao' | 'preco' | 'nome';

interface ProductWithPrice {
  id: number;
  name: string;
  unit: string | null;
  lastPrice: number;
  priceChange: PriceChange | null;
  recentPrices: number[];
}

// --- Filter / Sort Labels ---

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'subindo', label: 'Subindo' },
  { key: 'descendo', label: 'Descendo' },
  { key: 'estaveis', label: 'Estáveis' },
];

const SORTS: { key: SortOption; label: string }[] = [
  { key: 'variacao', label: 'variação' },
  { key: 'preco', label: 'preço' },
  { key: 'nome', label: 'nome' },
];

// --- Sparkline Component ---

function Sparkline({ prices, direction }: { prices: number[]; direction?: 'up' | 'down' | 'stable' }) {
  if (prices.length < 2) return <View className="h-[22px] w-[56px]" />;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const w = 56;
  const h = 22;
  const padding = 2;
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;

  const points = prices
    .map((price, i) => {
      const x = padding + (i / (prices.length - 1)) * innerW;
      const y = padding + innerH - ((price - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor =
    direction === 'up' ? '#f87171' : direction === 'down' ? '#34d399' : '#71717a';

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// --- Main Screen ---

export default function ProductsScreen() {
  const [items, setItems] = useState<ProductWithPrice[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('todos');
  const [sort, setSort] = useState<SortOption>('variacao');
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
    const withPrices: ProductWithPrice[] = [];

    for (const p of allProducts) {
      const entries = await db
        .select()
        .from(priceEntries)
        .where(eq(priceEntries.productId, p.id))
        .orderBy(desc(priceEntries.recordedAt))
        .limit(8);

      if (entries.length > 0) {
        const change = await calculatePriceChange(p.id);
        withPrices.push({
          id: p.id,
          name: p.name,
          unit: p.unit,
          lastPrice: entries[0].unitPrice,
          priceChange: change,
          recentPrices: entries.map((e) => e.unitPrice).reverse(),
        });
      }
    }

    setItems(withPrices);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  // --- Derived list (search + filter + sort) ---

  const displayItems = useMemo(() => {
    let result = items;

    // Search
    if (search.trim()) {
      const q = search.toUpperCase();
      result = result.filter((item) => item.name.includes(q));
    }

    // Filter
    if (filter === 'subindo') {
      result = result.filter((item) => item.priceChange?.direction === 'up');
    } else if (filter === 'descendo') {
      result = result.filter((item) => item.priceChange?.direction === 'down');
    } else if (filter === 'estaveis') {
      result = result.filter(
        (item) => !item.priceChange || item.priceChange.direction === 'stable'
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sort === 'variacao') {
        const aV = Math.abs(a.priceChange?.changePercent ?? 0);
        const bV = Math.abs(b.priceChange?.changePercent ?? 0);
        return bV - aV;
      }
      if (sort === 'preco') {
        return b.lastPrice - a.lastPrice;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [items, search, filter, sort]);

  // --- Empty state ---

  if (!loading && items.length === 0) {
    return (
      <EmptyState
        title="Nenhum produto"
        description="Escaneie uma nota fiscal para começar a acompanhar preços"
      />
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-14">
      {/* Title */}
      <Text className="mb-4 text-[27px] font-semibold tracking-tight text-white">Produtos</Text>

      {/* Search Bar */}
      <View className="mb-4 flex-row items-center gap-2.5 rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3">
        <Search size={18} color="#71717a" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar produto…"
          placeholderTextColor="#52525b"
          className="flex-1 text-sm text-white"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-2.5 -mx-4 grow-0"
        contentContainerClassName="gap-2 px-4"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`self-start rounded-full border px-3.5 py-[7px] ${
                active
                  ? 'border-transparent bg-price-down'
                  : 'border-zinc-800 bg-[#18181b]'
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  active ? 'text-zinc-950' : 'text-zinc-400'
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sort Row */}
      <View className="mb-3 flex-row items-center gap-2">
        <Text className="text-xs text-zinc-500">Ordenar:</Text>
        {SORTS.map((s) => {
          const active = sort === s.key;
          return (
            <Pressable key={s.key} onPress={() => setSort(s.key)}>
              <Text
                className={`text-xs font-medium ${
                  active ? 'text-price-down' : 'text-zinc-400'
                }`}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Product List */}
      <FlatList
        data={displayItems}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-24 gap-2"
        renderItem={({ item }) => <ProductRow item={item} />}
        ListEmptyComponent={
          search || filter !== 'todos' ? (
            <View className="items-center p-6">
              <Text className="text-zinc-500">Nenhum produto encontrado</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

// --- Product Row Component ---

function ProductRow({ item }: { item: ProductWithPrice }) {
  const direction = item.priceChange?.direction;
  const changePercent = item.priceChange?.changePercent ?? 0;

  const variationColor =
    direction === 'up'
      ? 'text-price-up'
      : direction === 'down'
        ? 'text-price-down'
        : 'text-zinc-500';

  const variationPrefix = direction === 'up' ? '+' : direction === 'down' ? '' : '';

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-zinc-800 bg-[#18181b] px-3.5 py-3">
      {/* Left: Name + Unit */}
      <View className="flex-1 shrink">
        <Text className="text-sm font-semibold text-white" numberOfLines={1}>
          {item.name}
        </Text>
        {item.unit ? (
          <Text className="mt-0.5 text-[11.5px] text-zinc-500">{item.unit}</Text>
        ) : null}
      </View>

      {/* Middle: Sparkline */}
      <Sparkline prices={item.recentPrices} direction={direction} />

      {/* Right: Price + Variation (fixed width) */}
      <View className="w-[74px] items-end">
        <Text className="font-mono text-sm font-semibold text-white">
          R$ {item.lastPrice.toFixed(2).replace('.', ',')}
        </Text>
        {item.priceChange && direction !== 'stable' ? (
          <Text className={`mt-0.5 text-[11.5px] font-semibold ${variationColor}`}>
            {variationPrefix}
            {changePercent.toFixed(1).replace('.', ',')}%
          </Text>
        ) : null}
      </View>
    </View>
  );
}
