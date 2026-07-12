import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { desc, eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { PriceChangeAlert } from '@/components/PriceChangeAlert';
import { PriceChart } from '@/components/PriceChart';
import { Separator } from '@/components/ui/separator';
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

  useEffect(() => {
    loadData();
  }, [productId]);

  async function loadData() {
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
  }

  if (!product) return null;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-4 p-4">
        <View>
          <Text className="text-2xl font-bold text-foreground">{product.name}</Text>
          {product.unit && <Text className="text-muted-foreground">Unidade: {product.unit}</Text>}
        </View>

        {change && change.direction !== 'stable' && (
          <View className="flex-row items-center gap-2 rounded-lg bg-secondary p-3">
            <PriceChangeAlert changePercent={change.changePercent} direction={change.direction} />
            <Text className="text-sm text-muted-foreground">
              {change.direction === 'up' ? 'Aumento' : 'Redução'} desde a última compra
            </Text>
          </View>
        )}

        {history.length >= 2 && <PriceChart data={history} />}

        <Separator />

        <View className="gap-2">
          <Text className="text-lg font-bold text-foreground">Histórico</Text>
          {history.map((entry, idx) => (
            <View
              key={idx}
              className={`flex-row items-center justify-between rounded p-2 ${idx % 2 === 0 ? 'bg-secondary' : ''}`}
            >
              <View>
                <Text className="text-sm">
                  {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                </Text>
                <Text className="text-xs text-muted-foreground">{entry.storeName}</Text>
              </View>
              <Text className="text-base font-bold">
                R$ {entry.value.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
