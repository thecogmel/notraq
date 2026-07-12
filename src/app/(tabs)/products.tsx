import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { desc, eq } from 'drizzle-orm';
import { Search } from 'lucide-react-native';

import { EmptyState } from '@/components/EmptyState';
import { ProductRow } from '@/components/ProductRow';
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
      result = result.filter((item) => item.name.toUpperCase().includes(q));
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
      <View className="mb-4 flex-row items-center gap-2.5 rounded-[14px] border border-zinc-800 bg-[#18181b] px-[13px] py-[11px]">
        <Search size={18} color="#71717a" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar produto…"
          placeholderTextColor="#52525b"
          className="flex-1 p-0 text-sm text-white"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Filter Chips */}
      <View className="mb-2.5 -mx-4 h-10">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-4 items-center"
          className="flex-1"
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={`rounded-full border px-3.5 py-1.5 ${
                  active
                    ? 'border-transparent bg-price-down'
                    : 'border-zinc-800 bg-[#18181b]'
                }`}
              >
                <Text
                  className={`text-[13px] font-medium leading-5 ${
                    active ? 'text-zinc-950' : 'text-zinc-400'
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

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
