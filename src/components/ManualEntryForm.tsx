import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

interface ManualItem {
  name: string;
  price: string;
  quantity: string;
}

interface Props {
  onSubmit: (data: { storeName: string; items: ManualItem[] }) => void;
  isLoading?: boolean;
}

export function ManualEntryForm({ onSubmit, isLoading }: Props) {
  const [storeName, setStoreName] = useState('');
  const [items, setItems] = useState<ManualItem[]>([{ name: '', price: '', quantity: '1' }]);

  const handleAddItem = () => {
    setItems([...items, { name: '', price: '', quantity: '1' }]);
  };

  const handleUpdateItem = (index: number, field: keyof ManualItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validItems = items.filter((item) => item.name.trim() && item.price.trim());
    if (validItems.length === 0) return;
    onSubmit({ storeName: storeName.trim(), items: validItems });
  };

  const hasValidItems = items.some((item) => item.name.trim() && item.price.trim());

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      <View className="gap-5 p-4">
        <View className="gap-1.5">
          <Label nativeID="store-name">Mercado (opcional)</Label>
          <Input
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Ex: Supermercado X"
            aria-labelledby="store-name"
          />
        </View>

        {items.map((item, index) => (
          <View key={index} className="gap-3 rounded-lg border border-border p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-muted-foreground">Item {index + 1}</Text>
              {items.length > 1 && (
                <Button variant="ghost" size="sm" onPress={() => handleRemoveItem(index)}>
                  <Text className="text-destructive">Remover</Text>
                </Button>
              )}
            </View>

            <View className="gap-1.5">
              <Label nativeID={`item-name-${index}`}>Produto</Label>
              <Input
                value={item.name}
                onChangeText={(v) => handleUpdateItem(index, 'name', v)}
                placeholder="Ex: Arroz 5kg"
                aria-labelledby={`item-name-${index}`}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 gap-1.5">
                <Label nativeID={`item-price-${index}`}>Preço (R$)</Label>
                <Input
                  value={item.price}
                  onChangeText={(v) => handleUpdateItem(index, 'price', v)}
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  aria-labelledby={`item-price-${index}`}
                />
              </View>
              <View className="w-20 gap-1.5">
                <Label nativeID={`item-qty-${index}`}>Qtde</Label>
                <Input
                  value={item.quantity}
                  onChangeText={(v) => handleUpdateItem(index, 'quantity', v)}
                  placeholder="1"
                  keyboardType="numeric"
                  aria-labelledby={`item-qty-${index}`}
                />
              </View>
            </View>
          </View>
        ))}

        <Button variant="outline" onPress={handleAddItem}>
          <Text>+ Adicionar item</Text>
        </Button>

        <Button onPress={handleSubmit} disabled={!hasValidItems || isLoading}>
          <Text>{isLoading ? 'Salvando...' : 'Salvar'}</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
