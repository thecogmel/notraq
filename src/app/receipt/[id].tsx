import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { desc, eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, Clock, Package, TrendingDown, TrendingUp } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products, receipts, stores } from '@/db/schema';

function getStoreColor(name: string): string {
  const colors = ['#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#facc15'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  delta: string | null;
  direction: 'up' | 'down' | 'stable';
}

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const receiptId = Number(id);

  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<ReceiptItem[]>([]);

  const loadReceipt = useCallback(async () => {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, receiptId)).limit(1);
    if (!receipt) return;

    const [store] = await db.select().from(stores).where(eq(stores.id, receipt.storeId)).limit(1);
    setStoreName(store?.name ?? 'Desconhecido');
    setStoreAddress(store?.address ?? '');
    setDate(new Date(receipt.purchaseDate));
    setTotal(receipt.totalAmount ?? 0);

    const entries = await db
      .select({
        name: products.name,
        productId: priceEntries.productId,
        quantity: priceEntries.quantity,
        unitPrice: priceEntries.unitPrice,
        total: priceEntries.price,
      })
      .from(priceEntries)
      .innerJoin(products, eq(priceEntries.productId, products.id))
      .where(eq(priceEntries.receiptId, receiptId));

    // Calculate price delta for each item
    const itemsWithDelta: ReceiptItem[] = [];
    for (const entry of entries) {
      const history = await db
        .select()
        .from(priceEntries)
        .where(eq(priceEntries.productId, entry.productId))
        .orderBy(desc(priceEntries.recordedAt))
        .limit(2);

      let delta: string | null = null;
      let direction: 'up' | 'down' | 'stable' = 'stable';

      if (history.length >= 2) {
        const pct = ((history[0].unitPrice - history[1].unitPrice) / history[1].unitPrice) * 100;
        if (Math.abs(pct) > 0.5) {
          delta = `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`;
          direction = pct > 0 ? 'up' : 'down';
        }
      }

      itemsWithDelta.push({
        name: entry.name,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice,
        total: entry.total,
        delta,
        direction,
      });
    }

    setItems(itemsWithDelta);
  }, [receiptId]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  const storeColor = getStoreColor(storeName || 'D');

  return (
    <ScrollView className="flex-1 bg-[#09090b]">
      <View className="px-4 pb-8 pt-14">
        {/* Header: back + title */}
        <View className="flex-row items-center gap-2.5 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="h-[38px] w-[38px] items-center justify-center rounded-xl border border-zinc-800 bg-[#18181b]"
          >
            <ChevronLeft size={20} color="#e4e4e7" />
          </Pressable>
          <Text className="text-[17px] font-semibold text-white">Nota fiscal</Text>
        </View>

        {/* Store avatar + name + address */}
        <View className="flex-row items-center gap-3.5 px-1">
          <View
            className="h-12 w-12 items-center justify-center rounded-[14px]"
            style={{ backgroundColor: `${storeColor}20` }}
          >
            <Text style={{ color: storeColor }} className="text-lg font-semibold">
              {storeName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-[17px] font-semibold text-white">{storeName}</Text>
            {storeAddress ? (
              <Text className="mt-0.5 text-xs text-zinc-500">{storeAddress}</Text>
            ) : null}
          </View>
        </View>

        {/* Date · time · items row */}
        {date && (
          <View className="mt-3.5 flex-row items-center gap-3.5 px-1">
            <View className="flex-row items-center gap-1.5">
              <Calendar size={13} color="#a1a1aa" />
              <Text className="text-xs text-zinc-400">
                {format(date, 'dd/MM/yyyy', { locale: ptBR })}
              </Text>
            </View>
            <Text className="text-xs text-zinc-700">·</Text>
            <Text className="text-xs text-zinc-400">
              {format(date, 'HH:mm', { locale: ptBR })}
            </Text>
            <Text className="text-xs text-zinc-700">·</Text>
            <Text className="text-xs text-zinc-400">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </Text>
          </View>
        )}

        {/* Total card with gradient-like bg */}
        <View className="mt-4 flex-row items-end justify-between rounded-[18px] border border-zinc-800 bg-[#18181b] p-[18px]">
          <View>
            <Text className="text-xs text-zinc-500">Total da compra</Text>
            <Text className="mt-1 font-mono text-[30px] font-semibold tracking-tighter text-white">
              R$ {total.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>

        {/* ITENS DA NOTA header */}
        <Text className="mb-3 mt-6 px-0.5 text-sm font-semibold tracking-wide text-zinc-400">
          ITENS DA NOTA
        </Text>

        {/* Items list */}
        <View className="gap-2">
          {items.map((item, idx) => (
            <View
              key={idx}
              className="flex-row items-center gap-3 rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3"
            >
              {/* Left: name + qty × unit */}
              <View className="flex-1">
                <Text className="text-[13.5px] font-medium text-white" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="mt-0.5 font-mono text-[11.5px] text-zinc-500">
                  {item.quantity} × R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                </Text>
              </View>

              {/* Right: delta + subtotal */}
              <View className="flex-row items-center gap-2.5">
                {item.delta && (
                  <View className="flex-row items-center gap-1">
                    {item.direction === 'up' && <TrendingUp size={12} color="#f87171" />}
                    {item.direction === 'down' && <TrendingDown size={12} color="#34d399" />}
                    <Text
                      className="font-mono text-[11px] font-semibold"
                      style={{ color: item.direction === 'up' ? '#f87171' : '#34d399' }}
                    >
                      {item.delta}
                    </Text>
                  </View>
                )}
                <Text className="min-w-[74px] text-right font-mono text-sm font-semibold tracking-tight text-white">
                  R$ {item.total.toFixed(2).replace('.', ',')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
