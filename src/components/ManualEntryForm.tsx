import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { like } from 'drizzle-orm';
import CurrencyInput from 'react-native-currency-input';

import { AutocompleteInput } from '@/components/AutocompleteInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { products, stores } from '@/db/schema';

interface ManualItem {
  name: string;
  price: number | null;
  quantity: string;
  unit: string;
}

interface Props {
  onSubmit: (data: { storeName: string; items: ManualItem[] }) => void;
  isLoading?: boolean;
}

export function ManualEntryForm({ onSubmit, isLoading }: Props) {
  const [storeName, setStoreName] = useState('');
  const [items, setItems] = useState<ManualItem[]>([{ name: '', price: null, quantity: '1', unit: 'UN' }]);
  const [unitModalIndex, setUnitModalIndex] = useState<number | null>(null);

  const UNITS = [
    { key: 'UN', label: 'UN - Unidade' },
    { key: 'KG', label: 'KG - Quilograma' },
    { key: 'G', label: 'G - Grama' },
    { key: 'LT', label: 'LT - Litro' },
    { key: 'ML', label: 'ML - Mililitro' },
    { key: 'PC', label: 'PC - Pacote' },
    { key: 'CX', label: 'CX - Caixa' },
    { key: 'DZ', label: 'DZ - Dúzia' },
    { key: 'MT', label: 'MT - Metro' },
    { key: 'FD', label: 'FD - Fardo' },
  ];

  const searchStores = useCallback(async (query: string) => {
    const results = await db
      .select({ name: stores.name })
      .from(stores)
      .where(like(stores.name, `%${query}%`))
      .limit(5);
    return results.map((r) => r.name);
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    const results = await db
      .select({ name: products.name })
      .from(products)
      .where(like(products.name, `%${query}%`))
      .limit(4);
    return results.map((r) => r.name);
  }, []);

  const handleAddItem = () => {
    setItems([...items, { name: '', price: null, quantity: '1', unit: 'UN' }]);
  };

  const handleUpdateItem = (index: number, field: keyof ManualItem, value: string | number | null) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validItems = items.filter((item) => item.name.trim() && item.price && item.price > 0);
    if (validItems.length === 0) return;
    onSubmit({ storeName: storeName.trim(), items: validItems });
  };

  const hasValidItems = items.some((item) => item.name.trim() && item.price && item.price > 0);

  return (
    <>
      {/* Unit picker modal */}
      <Modal visible={unitModalIndex !== null} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-[#09090b] px-5 pb-10 pt-5">
            <View className="flex-row items-center justify-between pb-4">
              <Text className="text-lg font-semibold text-white">Unidade de medida</Text>
              <Pressable onPress={() => setUnitModalIndex(null)} className="h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                <Text className="text-xs text-zinc-400">✕</Text>
              </Pressable>
            </View>
            <ScrollView className="max-h-64">
              <View className="gap-1">
                {UNITS.map((u) => (
                  <Pressable
                    key={u.key}
                    onPress={() => {
                      if (unitModalIndex !== null) {
                        handleUpdateItem(unitModalIndex, 'unit', u.key);
                      }
                      setUnitModalIndex(null);
                    }}
                    className={`rounded-xl px-4 py-3 ${unitModalIndex !== null && items[unitModalIndex]?.unit === u.key ? 'bg-[#34d399]' : 'bg-zinc-900'}`}
                  >
                    <Text className={`text-sm font-medium ${unitModalIndex !== null && items[unitModalIndex]?.unit === u.key ? 'text-[#052e1f]' : 'text-white'}`}>
                      {u.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView className="flex-1 bg-[#09090b]" keyboardShouldPersistTaps="handled">
      <View className="gap-5 p-4">
        {/* Store name with autocomplete */}
        <View className="z-20 gap-1.5">
          <Text className="text-xs font-medium text-zinc-400">Mercado</Text>
          <AutocompleteInput
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Ex: Supermercado X"
            search={searchStores}
            emptyMessage="Novo mercado será criado"
          />
        </View>

        {/* Items */}
        {items.map((item, index) => (
          <Card key={index} className="p-3.5">
            <CardContent className="gap-3 p-0">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-medium text-zinc-500">Item {index + 1}</Text>
                {items.length > 1 && (
                  <Button variant="ghost" size="sm" onPress={() => handleRemoveItem(index)}>
                    <Text className="text-xs text-red-400">Remover</Text>
                  </Button>
                )}
              </View>

              <View className="gap-1.5">
                <Text className="text-xs text-zinc-400">Produto</Text>
                <AutocompleteInput
                  value={item.name}
                  onChangeText={(v) => handleUpdateItem(index, 'name', v)}
                  placeholder="Ex: Arroz 5kg"
                  search={searchProducts}
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-1.5">
                  <Text className="text-xs text-zinc-400">Preço (R$)</Text>
                  <CurrencyInput
                    value={item.price}
                    onChangeValue={(v) => handleUpdateItem(index, 'price', v as number | null)}
                    prefix="R$ "
                    delimiter="."
                    separator=","
                    precision={2}
                    minValue={0}
                    placeholder="R$ 0,00"
                    placeholderTextColor="#52525b"
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#27272a',
                      backgroundColor: '#18181b',
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: '#ffffff',
                      fontFamily: 'Capriola_400Regular',
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <View className="w-16 gap-1.5">
                  <Text className="text-xs text-zinc-400">Qtde</Text>
                  <Input
                    value={item.quantity}
                    onChangeText={(v) => handleUpdateItem(index, 'quantity', v)}
                    placeholder="1"
                    keyboardType="numeric"
                  />
                </View>
                <View className="w-16 gap-1.5">
                  <Text className="text-xs text-zinc-400">Un.</Text>
                  <Pressable
                    onPress={() => setUnitModalIndex(index)}
                    className="items-center rounded-[14px] border border-zinc-800 bg-[#18181b] px-2 py-3"
                  >
                    <Text className="text-sm font-medium text-white">{item.unit}</Text>
                  </Pressable>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}

        {/* Add item */}
        <Button variant="outline" onPress={handleAddItem} className="border-dashed">
          <Text>+ Adicionar item</Text>
        </Button>

        {/* Submit */}
        <Button
          variant="accent"
          onPress={handleSubmit}
          disabled={!hasValidItems || isLoading}
        >
          <Text className="text-base font-semibold">
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Text>
        </Button>
      </View>
    </ScrollView>
    </>
  );
}
