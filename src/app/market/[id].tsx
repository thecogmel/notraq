import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { desc, eq, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Pencil, Receipt, Store, Trash2, X } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products, receipts, stores } from '@/db/schema';
import { formatBRL, getNameColor } from '@/lib/utils';

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
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMarket = async () => {
    // Delete all price entries for this store
    await db.delete(priceEntries).where(eq(priceEntries.storeId, storeId));
    // Delete all receipts for this store
    await db.delete(receipts).where(eq(receipts.storeId, storeId));
    // Delete the store
    await db.delete(stores).where(eq(stores.id, storeId));
    router.replace('/(tabs)' as never);
  };

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

  const openEdit = () => {
    setEditName(data.name);
    setEditAddress(data.address);
    setEditCnpj(data.cnpj);
    setEditing(true);
  };

  const saveEdit = async () => {
    await db
      .update(stores)
      .set({
        name: editName.trim() || data.name,
        address: editAddress.trim() || null,
        cnpj: editCnpj.trim() || null,
      })
      .where(eq(stores.id, storeId));
    setEditing(false);
    loadData();
  };

  const color = getNameColor(data.name);

  return (
    <>
      {/* Edit Modal */}
      <Modal visible={editing} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-[#09090b] px-5 pb-10 pt-5">
            {/* Modal header */}
            <View className="flex-row items-center justify-between pb-5">
              <Text className="text-lg font-semibold text-white">Editar mercado</Text>
              <Pressable
                onPress={() => setEditing(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-zinc-800"
              >
                <X size={16} color="#a1a1aa" />
              </Pressable>
            </View>

            {/* Fields */}
            <View className="gap-4">
              <View className="gap-1.5">
                <Text className="text-xs font-medium text-zinc-400">Nome</Text>
                <Input
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nome do mercado"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-xs font-medium text-zinc-400">Endereço</Text>
                <Input
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Ex: Av. Brasil, 1200 · Centro"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-xs font-medium text-zinc-400">CNPJ</Text>
                <Input
                  value={editCnpj}
                  onChangeText={setEditCnpj}
                  placeholder="00.000.000/0000-00"
                  keyboardType="numeric"
                  className="font-mono"
                />
              </View>

              <Button variant="accent" onPress={saveEdit} className="mt-2">
                <Text className="text-base font-semibold">
                  Salvar
                </Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView className="flex-1 bg-[#09090b]">
        <View className="px-5 pb-8 pt-14">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3.5">
            <View className="flex-row items-center gap-2.5">
              <Pressable
                onPress={() => router.back()}
                className="h-[38px] w-[38px] items-center justify-center rounded-xl border border-zinc-800 bg-[#18181b]"
              >
                <ChevronLeft size={20} color="#e4e4e7" />
              </Pressable>
              <Text className="text-[17px] font-semibold text-white">Mercado</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={openEdit}
                className="h-[38px] w-[38px] items-center justify-center rounded-xl border border-zinc-800 bg-[#18181b]"
              >
                <Pencil size={16} color="#a1a1aa" />
              </Pressable>
              <Pressable
                onPress={() => setConfirmDelete(true)}
                className="h-[38px] w-[38px] items-center justify-center rounded-xl border border-zinc-800 bg-[#18181b]"
              >
                <Trash2 size={16} color="#f87171" />
              </Pressable>
            </View>
          </View>

          {/* Delete confirmation modal */}
          <ConfirmDialog
            visible={confirmDelete}
            title="Excluir mercado?"
            message="Todas as notas e registros de preço deste mercado serão removidos permanentemente."
            destructive
            confirmLabel="Excluir"
            onConfirm={deleteMarket}
            onCancel={() => setConfirmDelete(false)}
          />

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
            <Text className="text-[11px] text-zinc-500">Notas</Text>
            <Text className="mt-1 font-mono text-xl font-semibold text-white">
              {data.receiptCount}
            </Text>
          </View>
          <View className="flex-1 rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3">
            <Text className="text-[11px] text-zinc-500">Total gasto</Text>
            <Text className="mt-1 font-mono text-xl font-semibold tracking-tight text-white">
              {formatBRL(data.totalSpent)}
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
                      {formatBRL(r.total)}
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
    </>
  );
}
