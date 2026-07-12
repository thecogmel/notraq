import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { desc, eq, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, receipts, stores } from '@/db/schema';

interface ReceiptSummary {
  id: number;
  storeName: string;
  date: Date;
  total: number;
  itemCount: number;
}

export default function HistoryScreen() {
  const [receiptList, setReceiptList] = useState<ReceiptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const allReceipts = await db.select().from(receipts).orderBy(desc(receipts.purchaseDate));

    const summaries: ReceiptSummary[] = [];
    for (const r of allReceipts) {
      const [store] = await db.select().from(stores).where(eq(stores.id, r.storeId)).limit(1);
      const [itemCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(priceEntries)
        .where(eq(priceEntries.receiptId, r.id));

      summaries.push({
        id: r.id,
        storeName: store?.name ?? 'Desconhecido',
        date: new Date(r.purchaseDate),
        total: r.totalAmount ?? 0,
        itemCount: itemCount.count,
      });
    }

    setReceiptList(summaries);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  if (!loading && receiptList.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="Nenhuma nota"
        description="Suas notas fiscais escaneadas aparecerão aqui"
      />
    );
  }

  return (
    <View className="flex-1 bg-background p-3 pt-14">
      <Text className="mb-3 text-2xl font-bold text-foreground">Histórico</Text>

      <FlatList
        data={receiptList}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/receipt/${item.id}` as never)}>
            <Card className="mb-2">
              <CardContent className="flex-row items-center justify-between p-3">
                <View className="flex-1">
                  <Text className="text-base font-medium">{item.storeName}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {format(item.date, "dd 'de' MMM, yyyy", { locale: ptBR })} •{' '}
                    {item.itemCount} itens
                  </Text>
                </View>
                <Text className="text-base font-bold">
                  R$ {item.total.toFixed(2).replace('.', ',')}
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
