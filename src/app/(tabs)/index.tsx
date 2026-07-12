import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { desc, eq, sql } from 'drizzle-orm';

import { PriceChangeAlert } from '@/components/PriceChangeAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products, receipts, stores } from '@/db/schema';
import { calculatePriceChange } from '@/services/price-analyzer';
import type { PriceChange } from '@/types';

interface DashboardData {
  totalProducts: number;
  totalStores: number;
  totalReceipts: number;
  alerts: PriceChange[];
  lastReceipt: {
    id: number;
    storeName: string;
    date: Date;
    total: number;
    itemCount: number;
  } | null;
}

export default function HomeScreen() {
  const [data, setData] = useState<DashboardData>({
    totalProducts: 0,
    totalStores: 0,
    totalReceipts: 0,
    alerts: [],
    lastReceipt: null,
  });

  const loadDashboard = useCallback(async () => {
    const [prodCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [storeCount] = await db.select({ count: sql<number>`count(*)` }).from(stores);
    const [receiptCount] = await db.select({ count: sql<number>`count(*)` }).from(receipts);

    // Alertas: produtos com variação significativa
    const allProducts = await db.select().from(products).limit(20);
    const alerts: PriceChange[] = [];
    for (const p of allProducts) {
      const change = await calculatePriceChange(p.id);
      if (change && change.direction !== 'stable') {
        alerts.push(change);
      }
    }

    // Última nota
    const [lastR] = await db.select().from(receipts).orderBy(desc(receipts.createdAt)).limit(1);
    let lastReceipt: DashboardData['lastReceipt'] = null;
    if (lastR) {
      const [store] = await db.select().from(stores).where(eq(stores.id, lastR.storeId)).limit(1);
      const [itemCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(priceEntries)
        .where(eq(priceEntries.receiptId, lastR.id));

      lastReceipt = {
        id: lastR.id,
        storeName: store?.name ?? 'Desconhecido',
        date: new Date(lastR.purchaseDate),
        total: lastR.totalAmount ?? 0,
        itemCount: itemCount.count,
      };
    }

    setData({
      totalProducts: prodCount.count,
      totalStores: storeCount.count,
      totalReceipts: receiptCount.count,
      alerts: alerts.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)),
      lastReceipt,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const hasData = data.totalProducts > 0;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-4 p-4 pt-14">
        {/* Header */}
        <View>
          <Text className="text-3xl font-bold text-foreground">notraq</Text>
          <Text className="text-muted-foreground">
            {hasData
              ? `${data.totalProducts} produtos rastreados`
              : 'Rastreie preços das suas compras'}
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3">
          <Card className="flex-1">
            <CardContent className="items-center p-3">
              <Text className="text-2xl font-bold text-foreground">{data.totalProducts}</Text>
              <Text className="text-xs text-muted-foreground">Produtos</Text>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="items-center p-3">
              <Text className="text-2xl font-bold text-foreground">{data.totalStores}</Text>
              <Text className="text-xs text-muted-foreground">Mercados</Text>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="items-center p-3">
              <Text className="text-2xl font-bold text-foreground">{data.totalReceipts}</Text>
              <Text className="text-xs text-muted-foreground">Notas</Text>
            </CardContent>
          </Card>
        </View>

        {/* Alertas */}
        {data.alerts.length > 0 && (
          <View className="gap-2">
            <Text className="text-lg font-bold text-foreground">⚠️ Alertas de Preço</Text>
            {data.alerts.slice(0, 5).map((alert) => (
              <Pressable
                key={alert.productId}
                onPress={() => router.push(`/product/${alert.productId}` as never)}
              >
                <Card>
                  <CardContent className="flex-row items-center justify-between p-3">
                    <View className="flex-1">
                      <Text className="text-sm font-medium" numberOfLines={1}>
                        {alert.productName}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        R$ {alert.previousPrice.toFixed(2).replace('.', ',')} →{' '}
                        R$ {alert.currentPrice.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                    <PriceChangeAlert
                      changePercent={alert.changePercent}
                      direction={alert.direction}
                    />
                  </CardContent>
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {/* Última nota */}
        {data.lastReceipt && (
          <Pressable onPress={() => router.push(`/receipt/${data.lastReceipt!.id}` as never)}>
            <Card>
              <CardHeader>
                <CardTitle>Última Nota</CardTitle>
              </CardHeader>
              <CardContent className="gap-1">
                <Text className="text-base font-medium">{data.lastReceipt.storeName}</Text>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">
                    {data.lastReceipt.itemCount} itens
                  </Text>
                  <Text className="text-base font-bold">
                    R$ {data.lastReceipt.total.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>
        )}

        {/* Empty state */}
        {!hasData && (
          <Card className="mt-4">
            <CardContent className="items-center gap-2 p-6">
              <Text className="text-4xl">📱</Text>
              <Text className="text-center text-base font-medium text-foreground">
                Comece escaneando uma nota fiscal
              </Text>
              <Text className="text-center text-sm text-muted-foreground">
                Toque no botão + abaixo para escanear um QR code, importar uma foto ou adicionar
                manualmente.
              </Text>
            </CardContent>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
