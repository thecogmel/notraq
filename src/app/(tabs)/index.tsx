import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { desc, eq, sql } from 'drizzle-orm';
import { ScanLine, TrendingDown, TrendingUp } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products, receipts, stores } from '@/db/schema';
import { calculatePriceChange } from '@/services/price-analyzer';
import type { PriceChange } from '@/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia,';
  if (hour < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

interface RecentReceipt {
  id: number;
  storeName: string;
  storeInitial: string;
  date: Date;
  total: number;
  itemCount: number;
}

interface DashboardData {
  totalProducts: number;
  totalStores: number;
  totalReceipts: number;
  alerts: PriceChange[];
  recentReceipts: RecentReceipt[];
}

export default function HomeScreen() {
  const [data, setData] = useState<DashboardData>({
    totalProducts: 0,
    totalStores: 0,
    totalReceipts: 0,
    alerts: [],
    recentReceipts: [],
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

    // Últimas notas
    const lastReceipts = await db
      .select()
      .from(receipts)
      .orderBy(desc(receipts.createdAt))
      .limit(3);

    const recentReceipts: RecentReceipt[] = [];
    for (const r of lastReceipts) {
      const [store] = await db.select().from(stores).where(eq(stores.id, r.storeId)).limit(1);
      const [itemCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(priceEntries)
        .where(eq(priceEntries.receiptId, r.id));

      const storeName = store?.name ?? 'Desconhecido';
      recentReceipts.push({
        id: r.id,
        storeName,
        storeInitial: storeName.charAt(0).toUpperCase(),
        date: new Date(r.purchaseDate),
        total: r.totalAmount ?? 0,
        itemCount: itemCount.count,
      });
    }

    setData({
      totalProducts: prodCount.count,
      totalStores: storeCount.count,
      totalReceipts: receiptCount.count,
      alerts: alerts.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)),
      recentReceipts,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="gap-5 px-4 pt-16">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-zinc-500">{getGreeting()}</Text>
            <Text className="text-2xl font-bold text-white">Erick</Text>
          </View>
          <Pressable onPress={() => router.push('/scan')}>
            <LinearGradient
              colors={['#34d399', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
            >
              <ScanLine color="#000" size={22} strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Stats */}
        <View className="flex-row gap-2">
          <View className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <Text className="font-mono text-2xl font-semibold text-white">
              {data.totalProducts}
            </Text>
            <Text className="text-xs text-zinc-500">Produtos</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <Text className="font-mono text-2xl font-semibold text-white">
              {data.totalStores}
            </Text>
            <Text className="text-xs text-zinc-500">Mercados</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <Text className="font-mono text-2xl font-semibold text-white">
              {data.totalReceipts}
            </Text>
            <Text className="text-xs text-zinc-500">Notas</Text>
          </View>
        </View>

        {/* Alertas recentes */}
        {data.alerts.length > 0 && (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-white">Alertas recentes</Text>
              <Pressable onPress={() => router.push('/products' as never)}>
                <Text className="text-sm text-price-down">Ver todos</Text>
              </Pressable>
            </View>

            {data.alerts.slice(0, 4).map((alert) => (
              <Pressable
                key={alert.productId}
                onPress={() => router.push(`/product/${alert.productId}` as never)}
                className="flex-row items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3"
              >
                {/* Icon */}
                <View
                  className="items-center justify-center rounded-xl"
                  style={{
                    width: 42,
                    height: 42,
                    backgroundColor: alert.direction === 'up' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
                  }}
                >
                  {alert.direction === 'up' ? (
                    <TrendingUp color="#f87171" size={20} />
                  ) : (
                    <TrendingDown color="#34d399" size={20} />
                  )}
                </View>

                {/* Product info */}
                <View className="flex-1">
                  <Text className="text-sm font-medium text-white" numberOfLines={1}>
                    {alert.productName}
                  </Text>
                  <Text className="text-xs text-zinc-500">
                    {alert.direction === 'up' ? 'Aumento de preço' : 'Redução de preço'}
                  </Text>
                </View>

                {/* Price info */}
                <View className="items-end">
                  <Text
                    className={`text-sm font-semibold ${
                      alert.direction === 'up' ? 'text-price-up' : 'text-price-down'
                    }`}
                  >
                    {alert.direction === 'up' ? '+' : ''}
                    {alert.changePercent.toFixed(1)}%
                  </Text>
                  <Text className="text-xs text-zinc-500">
                    R$ {alert.currentPrice.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Últimas compras */}
        {data.recentReceipts.length > 0 && (
          <View className="gap-3">
            <Text className="text-base font-semibold text-white">Últimas compras</Text>

            <View className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              {data.recentReceipts.map((receipt, index) => (
                <Pressable
                  key={receipt.id}
                  onPress={() => router.push(`/receipt/${receipt.id}` as never)}
                  className={`flex-row items-center gap-3 p-3 ${
                    index < data.recentReceipts.length - 1 ? 'border-b border-zinc-800' : ''
                  }`}
                >
                  {/* Avatar initial */}
                  <View
                    className="items-center justify-center rounded-xl bg-zinc-800"
                    style={{ width: 40, height: 40 }}
                  >
                    <Text className="text-sm font-semibold text-zinc-300">
                      {receipt.storeInitial}
                    </Text>
                  </View>

                  {/* Store info */}
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-white" numberOfLines={1}>
                      {receipt.storeName}
                    </Text>
                    <Text className="text-xs text-zinc-500">
                      {receipt.date.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}{' '}
                      · {receipt.itemCount} itens
                    </Text>
                  </View>

                  {/* Total */}
                  <Text className="font-mono text-sm font-semibold text-white">
                    R$ {receipt.total.toFixed(2).replace('.', ',')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {data.totalProducts === 0 && data.totalReceipts === 0 && (
          <View className="items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            <Text className="text-4xl">📱</Text>
            <Text className="text-center text-base font-medium text-white">
              Comece escaneando uma nota fiscal
            </Text>
            <Text className="text-center text-sm text-zinc-500">
              Toque no botão verde acima para escanear o QR code do cupom fiscal.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
