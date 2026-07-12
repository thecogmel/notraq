import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products, receipts, stores } from '@/db/schema';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const receiptId = Number(id);

  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<
    { name: string; quantity: number; unitPrice: number; total: number }[]
  >([]);

  const loadReceipt = useCallback(async () => {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, receiptId)).limit(1);
    if (!receipt) return;

    const [store] = await db.select().from(stores).where(eq(stores.id, receipt.storeId)).limit(1);
    setStoreName(store?.name ?? 'Desconhecido');
    setDate(new Date(receipt.purchaseDate));
    setTotal(receipt.totalAmount ?? 0);

    const entries = await db
      .select({
        name: products.name,
        quantity: priceEntries.quantity,
        unitPrice: priceEntries.unitPrice,
        total: priceEntries.price,
      })
      .from(priceEntries)
      .innerJoin(products, eq(priceEntries.productId, products.id))
      .where(eq(priceEntries.receiptId, receiptId));

    setItems(entries);
  }, [receiptId]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-4 p-4">
        <View>
          <Text className="text-2xl font-bold text-foreground">{storeName}</Text>
          {date && (
            <Text className="text-muted-foreground">
              {format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </Text>
          )}
        </View>

        <Separator />

        {items.map((item, idx) => (
          <View key={idx} className="flex-row items-center justify-between py-2">
            <View className="mr-2 flex-1">
              <Text className="text-sm" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {item.quantity}x R$ {item.unitPrice.toFixed(2).replace('.', ',')}
              </Text>
            </View>
            <Text className="font-bold">R$ {item.total.toFixed(2).replace('.', ',')}</Text>
          </View>
        ))}

        <Separator />

        <View className="flex-row justify-between">
          <Text className="text-lg font-bold">Total</Text>
          <Text className="text-lg font-bold">R$ {total.toFixed(2).replace('.', ',')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
