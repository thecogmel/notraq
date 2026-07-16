import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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
                <View className="w-14 gap-1.5">
                  <Text className="text-xs text-zinc-400">Un.</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-1">
                      {['UN', 'KG', 'LT', 'ML', 'PC'].map((u) => (
                        <Pressable
                          key={u}
                          onPress={() => handleUpdateItem(index, 'unit', u)}
                          className={`rounded-lg px-2 py-2 ${item.unit === u ? 'bg-[#34d399]' : 'bg-zinc-800'}`}
                        >
                          <Text className={`text-[10px] font-medium ${item.unit === u ? 'text-[#052e1f]' : 'text-zinc-400'}`}>
                            {u}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
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
  );
}
