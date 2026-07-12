import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { like } from 'drizzle-orm';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { products, stores } from '@/db/schema';

interface ManualItem {
  name: string;
  price: string;
  quantity: string;
}

interface Props {
  onSubmit: (data: { storeName: string; items: ManualItem[] }) => void;
  isLoading?: boolean;
}

interface StoreSuggestion {
  id: number;
  name: string;
}

// --- Product autocomplete input ---

function ProductInput({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const search = async () => {
      const results = await db
        .select({ name: products.name })
        .from(products)
        .where(like(products.name, `%${value.trim()}%`))
        .limit(4);
      const names = results.map((r) => r.name);
      setSuggestions(names);
      setShowSuggestions(names.length > 0);
    };

    const timeout = setTimeout(search, 200);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <View className="relative">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder="Ex: Arroz 5kg"
        placeholderTextColor="#52525b"
        className="rounded-[14px] border border-zinc-800 bg-[#0f0f11] px-3.5 py-2.5 text-sm text-white"
      />
      {showSuggestions && (
        <View className="absolute left-0 right-0 top-[42px] z-50 rounded-xl border border-zinc-800 bg-[#1c1c1f] shadow-lg">
          {suggestions.map((name) => (
            <Pressable
              key={name}
              onPress={() => {
                onChangeText(name);
                setShowSuggestions(false);
              }}
              className="border-b border-zinc-800/50 px-3.5 py-2.5"
            >
              <Text className="text-sm text-white">{name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export function ManualEntryForm({ onSubmit, isLoading }: Props) {
  const [storeName, setStoreName] = useState('');
  const [suggestions, setSuggestions] = useState<StoreSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [items, setItems] = useState<ManualItem[]>([{ name: '', price: '', quantity: '1' }]);

  // Search stores as user types
  useEffect(() => {
    if (storeName.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const search = async () => {
      const results = await db
        .select({ id: stores.id, name: stores.name })
        .from(stores)
        .where(like(stores.name, `%${storeName.trim()}%`))
        .limit(5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    };

    const timeout = setTimeout(search, 200);
    return () => clearTimeout(timeout);
  }, [storeName]);

  const selectStore = (name: string) => {
    setStoreName(name);
    setShowSuggestions(false);
  };

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
    <ScrollView className="flex-1 bg-[#09090b]" keyboardShouldPersistTaps="handled">
      <View className="gap-5 p-4">
        {/* Store name with autocomplete */}
        <View className="gap-1.5">
          <Label nativeID="store-name" className="text-xs font-medium text-zinc-400">
            Mercado
          </Label>
          <View className="relative">
            <TextInput
              value={storeName}
              onChangeText={setStoreName}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Ex: Supermercado X"
              placeholderTextColor="#52525b"
              className="rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3 text-sm text-white"
              aria-labelledby="store-name"
            />
            {showSuggestions && (
              <View className="absolute left-0 right-0 top-[48px] z-50 rounded-xl border border-zinc-800 bg-[#1c1c1f] shadow-lg">
                {suggestions.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => selectStore(s.name)}
                    className="border-b border-zinc-800/50 px-3.5 py-3 last:border-b-0"
                  >
                    <Text className="text-sm text-white">{s.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {storeName.trim().length >= 2 && suggestions.length === 0 && (
            <Text className="mt-1 text-xs text-zinc-500">
              Novo mercado será criado
            </Text>
          )}
        </View>

        {/* Items */}
        {items.map((item, index) => (
          <View key={index} className="gap-3 rounded-2xl border border-zinc-800 bg-[#18181b] p-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium text-zinc-500">Item {index + 1}</Text>
              {items.length > 1 && (
                <Pressable onPress={() => handleRemoveItem(index)}>
                  <Text className="text-xs text-red-400">Remover</Text>
                </Pressable>
              )}
            </View>

            <View className="gap-1.5">
              <Text className="text-xs text-zinc-400">Produto</Text>
              <ProductInput
                value={item.name}
                onChangeText={(v) => handleUpdateItem(index, 'name', v)}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 gap-1.5">
                <Text className="text-xs text-zinc-400">Preço (R$)</Text>
                <TextInput
                  value={item.price}
                  onChangeText={(v) => handleUpdateItem(index, 'price', v)}
                  placeholder="0,00"
                  placeholderTextColor="#52525b"
                  keyboardType="decimal-pad"
                  className="rounded-[14px] border border-zinc-800 bg-[#0f0f11] px-3.5 py-2.5 text-sm text-white"
                />
              </View>
              <View className="w-20 gap-1.5">
                <Text className="text-xs text-zinc-400">Qtde</Text>
                <TextInput
                  value={item.quantity}
                  onChangeText={(v) => handleUpdateItem(index, 'quantity', v)}
                  placeholder="1"
                  placeholderTextColor="#52525b"
                  keyboardType="numeric"
                  className="rounded-[14px] border border-zinc-800 bg-[#0f0f11] px-3.5 py-2.5 text-sm text-white"
                />
              </View>
            </View>
          </View>
        ))}

        {/* Add item */}
        <Pressable
          onPress={handleAddItem}
          className="rounded-2xl border border-dashed border-zinc-700 py-3"
        >
          <Text className="text-center text-sm text-zinc-400">+ Adicionar item</Text>
        </Pressable>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={!hasValidItems || isLoading}
          className={`rounded-2xl py-4 ${hasValidItems && !isLoading ? 'bg-[#34d399]' : 'bg-zinc-800'}`}
        >
          <Text
            className={`text-center text-base font-semibold ${hasValidItems && !isLoading ? 'text-[#052e1f]' : 'text-zinc-500'}`}
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
