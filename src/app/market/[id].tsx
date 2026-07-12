import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { desc, eq, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Receipt, Store } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products, receipts, stores } from '@/db/schema';

function getStoreColor(name: string): string {
  const colors = ['#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#facc15'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

interface MarketData {
  name: string;
  address: string;
  cnpj: string;
  receiptCount: number;
  totalSpent: number;
  topProducts: { name: string; count: number }[];
  recentReceipts: { id: number; date: Date; itemCount: number; total: number }[];
}

export default function MarketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeId = Number(id);

  const [data, setData] = useState<MarketData | null>(null);

  const loadData = useCallback(async () => {
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (!store) return;

    // Stats
    const [stats] = await db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)`,
      })
      .from(receipts)
      .where(eq(receipts.storeId, storeId));

    // Recent receipts
    const recentR = await db
      .select()
      .from(receipts)
      .where(eq(receipts.storeId, storeId))
      .orderBy(desc(receipts.purchaseDate))
      .limit(5);

    const recentReceipts = [];
    for (const r of recentR) {
      const [itemCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(priceEntries)
        .where(eq(priceEntries.receiptId, r.id));
      recentReceipts.push({
        id: r.id,
        date: new Date(r.purchaseDate),
        itemCount: itemCount.count,
        total: r.totalAmount ?? 0,
      });
    }

    // Top products (most bought at this store)
    const productCounts = await db
      .select({
        name: products.name,
        count: sql<number>`count(*)`,
      })
      .from(priceEntries)
      .innerJoin(products, eq(priceEntries.productId, products.id))
      .where(eq(priceEntries.storeId, storeId))
      .groupBy(products.name)
      .orderBy(desc(sql`count(*)`))
      .limit(6);

    setData({
      name: store.name,
      address: store.address ?? '',
      cnpj: store.cnpj ?? '',
      receiptCount: stats.count,
      totalSpent: stats.total,
      topProducts: productCounts.map((p) => ({ name: p.name, count: p.count })),
      recentReceipts,
    });
  }, [storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!data) return null;

  const color = getStoreColor(data.name);

  return (
    <ScrollView className="flex-1 bg-[#09090b]">
      <View className="px-5 pb-8 pt-14">
        {/* Header */}
        <View className="flex-row items-center gap-2.5 pb-3.5">
          <Pressable
            onPress={() => router.back()}
            className="h-[38px] w-[38px] items-center justify-center rounded-xl border border-zinc-800 bg-[#18181b]"
          >
            <ChevronLeft size={20} color="#e4e4e7" />
          </Pressable>
          <Text className="text-[17px] font-semibold text-white">Mercado</Text>
        </View>

        {/* Store icon + name + address + CNPJ */}
        <View className="flex-row items-center gap-3.5">
          <View
            className="h-[54px] w-[54px] items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${color}20` }}
          >
            <Store size={26} color={color} />
          </View>
          <View className="flex-1">
            <Text className="text-[19px] font-semibold tracking-tight text-white">
              {data.name}
            </Text>
            {data.address ? (
              <Text className="mt-0.5 text-[12.5px] text-zinc-500">{data.address}</Text>
            ) : null}
            {data.cnpj ? (
              <Text className="mt-0.5 font-mono text-[11px] text-zinc-600">
                CNPJ {data.cnpj}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Stats: notas + total gasto */}
        <View className="mt-4 flex-row gap-2.5">
          <View className="flex-1 rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3">
            <Text className="text-[11px] text-zinc-500">Notas escaneadas</Text>
            <Text className="mt-1 font-mono text-xl font-semibold text-white">
              {data.receiptCount}
            </Text>
          </View>
          <View className="flex-1 rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3">
            <Text className="text-[11px] text-zinc-500">Total gasto</Text>
            <Text className="mt-1 font-mono text-xl font-semibold tracking-tight text-white">
              R$ {data.totalSpent.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>

        {/* MAIS COMPRADOS AQUI */}
        {data.topProducts.length > 0 && (
          <View className="mt-6">
            <Text className="mb-3 text-sm font-semibold tracking-wide text-zinc-400">
              MAIS COMPRADOS AQUI
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {data.topProducts.map((p, idx) => (
                <View
                  key={idx}
                  className="rounded-full border border-zinc-800 bg-[#18181b] px-3.5 py-2"
                >
                  <Text className="text-[12.5px] font-medium text-zinc-300">
                    {p.name}{' '}
                    <Text className="font-mono text-zinc-600">×{p.count}</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ÚLTIMAS COMPRAS */}
        {data.recentReceipts.length > 0 && (
          <View className="mt-6">
            <Text className="mb-3 text-sm font-semibold tracking-wide text-zinc-400">
              ÚLTIMAS COMPRAS
            </Text>
            <View className="rounded-2xl border border-zinc-800 bg-[#18181b] px-3.5">
              {data.recentReceipts.map((r, idx) => (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/receipt/${r.id}` as never)}
                  className={`flex-row items-center gap-3 py-3.5 ${
                    idx < data.recentReceipts.length - 1 ? 'border-b border-zinc-800/60' : ''
                  }`}
                >
                  {/* Receipt icon */}
                  <View className="h-9 w-9 items-center justify-center rounded-[11px] border border-zinc-800 bg-[#0f0f11]">
                    <Receipt size={17} color="#71717a" />
                  </View>

                  {/* Date + item count */}
                  <View className="flex-1">
                    <Text className="text-[13.5px] font-medium text-white">
                      {format(r.date, "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </Text>
                    <Text className="mt-0.5 text-[11.5px] text-zinc-500">
                      {r.itemCount} itens
                    </Text>
                  </View>

                  {/* Total + chevron */}
                  <View className="flex-row items-center gap-1.5">
                    <Text className="font-mono text-sm font-semibold tracking-tight text-zinc-200">
                      R$ {r.total.toFixed(2).replace('.', ',')}
                    </Text>
                    <ChevronRight size={16} color="#52525b" />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
