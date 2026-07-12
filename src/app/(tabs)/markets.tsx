import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { eq, sql } from 'drizzle-orm';
import { Store } from 'lucide-react-native';

import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { receipts, stores } from '@/db/schema';
import { formatBRL, getNameColor } from '@/lib/utils';

interface StoreSummary {
  id: number;
  name: string;
  cnpj: string | null;
  receiptCount: number;
  totalSpent: number;
}

export default function MarketsScreen() {
  const [storeList, setStoreList] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStores = useCallback(async () => {
    setLoading(true);
    const allStores = await db.select().from(stores);

    const summaries: StoreSummary[] = [];
    for (const s of allStores) {
      const [stats] = await db
        .select({
          count: sql<number>`count(*)`,
          total: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)`,
        })
        .from(receipts)
        .where(eq(receipts.storeId, s.id));

      summaries.push({
        id: s.id,
        name: s.name,
        cnpj: s.cnpj,
        receiptCount: stats.count,
        totalSpent: stats.total,
      });
    }

    setStoreList(summaries);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStores();
    }, [loadStores])
  );

  if (!loading && storeList.length === 0) {
    return (
      <EmptyState
        icon="🏪"
        title="Nenhum mercado"
        description="Os mercados dos cupons escaneados aparecerão aqui"
      />
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0b] px-4 pt-14">
      <Text className="mb-4 text-2xl font-bold text-white">Mercados</Text>

      <FlatList
        data={storeList}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => {
          const color = getNameColor(item.name);
          return (
            <Pressable onPress={() => router.push(`/market/${item.id}` as never)}>
              <View className="flex-row items-center rounded-[18px] border border-zinc-800 bg-zinc-900 p-4">
                {/* Store icon */}
                <View
                  className="h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Store size={22} color={color} />
                </View>

                {/* Name + address */}
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-white">{item.name}</Text>
                  <Text className="text-xs text-zinc-500">
                    {item.cnpj ? `CNPJ: ${item.cnpj}` : 'Endereço não disponível'}
                  </Text>
                </View>

                {/* Right: receipt count + total */}
                <View className="items-end">
                  <Text className="text-xs text-zinc-400">
                    {item.receiptCount} {item.receiptCount === 1 ? 'nota' : 'notas'}
                  </Text>
                  <Text className="mt-0.5 font-mono text-sm font-semibold text-white">
                    {formatBRL(item.totalSpent)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
