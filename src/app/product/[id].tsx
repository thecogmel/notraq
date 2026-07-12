import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { desc, eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, TrendingDown, TrendingUp, Minus } from 'lucide-react-native';

import { PriceChart } from '@/components/PriceChart';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products, stores } from '@/db/schema';
import { calculatePriceChange } from '@/services/price-analyzer';
import type { PriceChange } from '@/types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);

  const [product, setProduct] = useState<{ name: string; unit: string | null } | null>(null);
  const [history, setHistory] = useState<
    { value: number; date: Date; storeName: string }[]
  >([]);
  const [change, setChange] = useState<PriceChange | null>(null);

  const loadData = useCallback(async () => {
    const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!p) return;
    setProduct(p);

    const entries = await db
      .select({
        unitPrice: priceEntries.unitPrice,
        recordedAt: priceEntries.recordedAt,
        storeName: stores.name,
      })
      .from(priceEntries)
      .innerJoin(stores, eq(priceEntries.storeId, stores.id))
      .where(eq(priceEntries.productId, productId))
      .orderBy(desc(priceEntries.recordedAt));

    setHistory(
      entries.map((e) => ({
        value: e.unitPrice,
        date: new Date(e.recordedAt),
        storeName: e.storeName,
      }))
    );
    setChange(await calculatePriceChange(productId));
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!product) return null;

  const currentPrice = history.length > 0 ? history[0].value : 0;
  const prices = history.map((h) => h.value);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  // Find lowest-priced store entry
  const lowestEntry = history.length > 0
    ? history.reduce((min, e) => (e.value < min.value ? e : min), history[0])
    : null;

  const getTrendIcon = () => {
    if (!change || change.direction === 'stable') return <Minus size={14} color="#a1a1aa" />;
    if (change.direction === 'up') return <TrendingUp size={14} color="#f87171" />;
    return <TrendingDown size={14} color="#34d399" />;
  };

  const getTrendColor = () => {
    if (!change || change.direction === 'stable') return 'bg-zinc-800';
    if (change.direction === 'up') return 'bg-red-500/10';
    return 'bg-emerald-500/10';
  };

  const getTrendTextColor = () => {
    if (!change || change.direction === 'stable') return 'text-zinc-400';
    if (change.direction === 'up') return 'text-price-up';
    return 'text-price-down';
  };

  return (
    <ScrollView className="flex-1 bg-[#0a0a0b]">
      <View className="gap-5 px-5 pb-8 pt-14">
        {/* Back button */}
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-[38px] w-[38px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900"
          >
            <ChevronLeft size={20} color="#a1a1aa" />
          </Pressable>
        </View>

        {/* Product name + unit */}
        <View className="gap-1">
          <Text className="text-2xl font-bold text-white">{product.name}</Text>
          <Text className="text-sm text-zinc-400">
            {product.unit ?? 'UN'} • Produto
          </Text>
        </View>

        {/* Trend badge + current price */}
        <View className="flex-row items-center gap-3">
          <Text className="font-mono text-3xl text-white">
            R$ {currentPrice.toFixed(2).replace('.', ',')}
          </Text>

          {change && change.direction !== 'stable' && (
            <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <Text className={`text-xs font-medium ${getTrendTextColor()}`}>
                {Math.abs(change.changePercent).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        {/* Chart area */}
        {history.length >= 2 && (
          <View className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <PriceChart data={history} />
          </View>
        )}

        {/* 4 stat cards in 2x2 grid */}
        <View className="flex-row flex-wrap gap-3">
          <View className="min-w-[46%] flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <Text className="text-xs text-zinc-400">Preço atual</Text>
            <Text className="mt-1 font-mono text-lg text-white">
              R$ {currentPrice.toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <View className="min-w-[46%] flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <Text className="text-xs text-zinc-400">Menor preço</Text>
            <Text className="mt-1 font-mono text-lg text-price-down">
              R$ {minPrice.toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <View className="min-w-[46%] flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <Text className="text-xs text-zinc-400">Maior preço</Text>
            <Text className="mt-1 font-mono text-lg text-price-up">
              R$ {maxPrice.toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <View className="min-w-[46%] flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <Text className="text-xs text-zinc-400">Preço médio</Text>
            <Text className="mt-1 font-mono text-lg text-white">
              R$ {avgPrice.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>

        {/* Store list - ONDE ENCONTRAR */}
        {history.length > 0 && (
          <View className="gap-3">
            <Text className="text-xs uppercase tracking-wider text-zinc-400">
              ONDE ENCONTRAR
            </Text>

            {history.map((entry, idx) => {
              const isLowest = lowestEntry && entry.value === lowestEntry.value;
              return (
                <View
                  key={idx}
                  className="flex-row items-center rounded-2xl border border-zinc-800 bg-zinc-900 p-3"
                >
                  {/* Store initial avatar */}
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                    <Text className="text-sm font-bold text-zinc-300">
                      {entry.storeName.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-white">{entry.storeName}</Text>
                    <Text className="text-xs text-zinc-500">
                      {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="font-mono text-sm font-semibold text-white">
                      R$ {entry.value.toFixed(2).replace('.', ',')}
                    </Text>
                    {isLowest && (
                      <View className="mt-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5">
                        <Text className="text-[10px] font-medium text-price-down">
                          Menor
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
