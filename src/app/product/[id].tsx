import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { desc, eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, TrendingDown, TrendingUp } from 'lucide-react-native';

import { PriceChart } from '@/components/PriceChart';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products, stores } from '@/db/schema';
import { formatBRL, getNameColor } from '@/lib/utils';
import { calculatePriceChange } from '@/services/price-analyzer';
import type { PriceChange } from '@/types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);

  const [product, setProduct] = useState<{ name: string; unit: string | null } | null>(null);
  const [history, setHistory] = useState<
    { value: number; date: Date; storeName: string; storeId: number }[]
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
        storeId: stores.id,
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
        storeId: e.storeId,
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

  const direction = change?.direction ?? 'stable';
  const trendLabel = direction === 'up' ? 'Subindo' : direction === 'down' ? 'Descendo' : 'Estável';
  const trendColor = direction === 'up' ? '#f87171' : direction === 'down' ? '#34d399' : '#a1a1aa';
  const trendBg = direction === 'up' ? 'rgba(248,113,113,0.13)' : direction === 'down' ? 'rgba(52,211,153,0.13)' : 'rgba(161,161,170,0.12)';
  const varStr = change ? `${change.changePercent > 0 ? '+' : ''}${change.changePercent.toFixed(1).replace('.', ',')}%` : '';

  // Deduplicate stores for "Onde encontrar" — show latest per store
  const storeMap = new Map<number, (typeof history)[0]>();
  for (const entry of history) {
    if (!storeMap.has(entry.storeId)) {
      storeMap.set(entry.storeId, entry);
    }
  }
  const storeEntries = Array.from(storeMap.values());
  const lowestPrice = storeEntries.length > 0 ? Math.min(...storeEntries.map((e) => e.value)) : 0;

  return (
    <ScrollView className="flex-1 bg-[#09090b]">
      <View className="px-5 pb-8 pt-14">
        {/* Header: back + title */}
        <View className="flex-row items-center gap-2.5 pb-3.5">
          <Pressable
            onPress={() => router.back()}
            className="h-[38px] w-[38px] items-center justify-center rounded-xl border border-zinc-800 bg-[#18181b]"
          >
            <ChevronLeft size={20} color="#e4e4e7" />
          </Pressable>
          <Text className="text-[17px] font-semibold text-white">Produto</Text>
        </View>

        {/* Product name + trend badge (same row) */}
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xl font-semibold leading-tight tracking-tight text-white">
              {product.name}
            </Text>
            <Text className="mt-1 text-[13px] text-zinc-500">
              {product.unit ?? 'UN'} · Mercearia
            </Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ backgroundColor: trendBg }}
          >
            {direction === 'up' && <TrendingUp size={13} color={trendColor} />}
            {direction === 'down' && <TrendingDown size={13} color={trendColor} />}
            <Text className="text-[11.5px] font-semibold" style={{ color: trendColor }}>
              {trendLabel}
            </Text>
          </View>
        </View>

        {/* Current price + variation */}
        <View className="mt-4 flex-row items-baseline gap-2.5">
          <Text className="font-mono text-[34px] font-semibold tracking-tighter text-white">
            {formatBRL(currentPrice)}
          </Text>
          {change && direction !== 'stable' && (
            <Text className="text-[15px] font-semibold" style={{ color: trendColor }}>
              {varStr}
            </Text>
          )}
        </View>

        {/* Chart */}
        {history.length >= 2 && (
          <View className="mt-4 rounded-[18px] border border-zinc-800 bg-[#18181b] p-4">
            <PriceChart data={history} />
          </View>
        )}

        {/* 4 stat cards - 2×2 grid */}
        <View className="mt-3.5 flex-row gap-2.5">
          <View className="flex-1 rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3">
            <Text className="text-[11px] text-zinc-500">Preço atual</Text>
            <Text className="mt-1 font-mono text-lg font-semibold tracking-tight text-white">
              {formatBRL(currentPrice)}
            </Text>
          </View>
          <View className="flex-1 rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3">
            <Text className="text-[11px] text-zinc-500">Menor preço</Text>
            <Text className="mt-1 font-mono text-lg font-semibold tracking-tight text-[#34d399]">
              {formatBRL(minPrice)}
            </Text>
          </View>
        </View>
        <View className="mt-2.5 flex-row gap-2.5">
          <View className="flex-1 rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3">
            <Text className="text-[11px] text-zinc-500">Maior preço</Text>
            <Text className="mt-1 font-mono text-lg font-semibold tracking-tight text-[#f87171]">
              {formatBRL(maxPrice)}
            </Text>
          </View>
          <View className="flex-1 rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3">
            <Text className="text-[11px] text-zinc-500">Preço médio</Text>
            <Text className="mt-1 font-mono text-lg font-semibold tracking-tight text-[#e4e4e7]">
              {formatBRL(avgPrice)}
            </Text>
          </View>
        </View>

        {/* ONDE ENCONTRAR */}
        {storeEntries.length > 0 && (
          <View className="mt-6">
            <Text className="mb-3 text-sm font-semibold tracking-wide text-zinc-400">
              ONDE ENCONTRAR
            </Text>
            <View className="gap-2">
              {storeEntries.map((entry, idx) => {
                const color = getNameColor(entry.storeName);
                const isLowest = entry.value === lowestPrice;
                return (
                  <View
                    key={idx}
                    className="flex-row items-center gap-3 rounded-[14px] border px-3.5 py-3"
                    style={{ borderColor: isLowest ? '#34d399' : '#27272a', backgroundColor: '#18181b' }}
                  >
                    {/* Store initial */}
                    <View
                      className="h-9 w-9 items-center justify-center rounded-[11px]"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Text className="text-sm font-semibold" style={{ color }}>
                        {entry.storeName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* Store name + date */}
                    <View className="flex-1">
                      <Text className="text-[13.5px] font-medium text-white">
                        {entry.storeName}
                      </Text>
                      <Text className="mt-0.5 text-[11px] text-zinc-500">
                        Registrado em {format(entry.date, 'dd MMM', { locale: ptBR })}
                      </Text>
                    </View>

                    {/* Price + lowest badge */}
                    <View className="items-end">
                      {isLowest && (
                        <Text className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[#34d399]">
                          Menor
                        </Text>
                      )}
                      <Text className="font-mono text-sm font-semibold tracking-tight text-white">
                        {formatBRL(entry.value)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
