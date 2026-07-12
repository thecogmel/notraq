import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, Clock, Package } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products, receipts, stores } from '@/db/schema';

// Generate a consistent color for store initials
function getStoreColor(name: string): string {
  const colors = ['#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#facc15'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

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

  const storeColor = getStoreColor(storeName || 'D');

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

        {/* Store name + avatar */}
        <View className="flex-row items-center gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: `${storeColor}20` }}
          >
            <Text style={{ color: storeColor }} className="text-lg font-bold">
              {storeName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-xl font-bold text-white">{storeName}</Text>
          </View>
        </View>

        {/* Date/time/item count row */}
        {date && (
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <Calendar size={14} color="#71717a" />
              <Text className="text-sm text-zinc-400">
                {format(date, 'dd/MM/yyyy', { locale: ptBR })}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Clock size={14} color="#71717a" />
              <Text className="text-sm text-zinc-400">
                {format(date, 'HH:mm', { locale: ptBR })}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Package size={14} color="#71717a" />
              <Text className="text-sm text-zinc-400">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </Text>
            </View>
          </View>
        )}

        {/* Total card */}
        <View className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <Text className="text-sm text-zinc-400">Total da nota</Text>
          <Text className="mt-1 font-mono text-3xl font-bold text-white">
            R$ {total.toFixed(2).replace('.', ',')}
          </Text>
        </View>

        {/* ITENS DA NOTA section */}
        <View className="gap-3">
          <Text className="text-xs uppercase tracking-wider text-zinc-400">
            ITENS DA NOTA
          </Text>

          {items.map((item, idx) => (
            <View
              key={idx}
              className="rounded-[14px] border border-zinc-800 bg-zinc-900 p-3"
            >
              <View className="flex-row items-center justify-between">
                {/* Left: name + qty×unit */}
                <View className="mr-3 flex-1">
                  <Text className="text-sm font-medium text-white" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-zinc-500">
                    {item.quantity}× R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                  </Text>
                </View>

                {/* Right: subtotal */}
                <View className="items-end">
                  <Text className="font-mono text-sm font-semibold text-white">
                    R$ {item.total.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
