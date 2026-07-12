import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { desc, eq } from 'drizzle-orm';

import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { priceEntries, products } from '@/db/schema';
import { calculatePriceChange } from '@/services/price-analyzer';
import type { PriceChange } from '@/types';

interface ProductWithPrice {
  id: number;
  name: string;
  lastPrice: number;
  priceChange: PriceChange | null;
}

export default function ProductsScreen() {
  const [items, setItems] = useState<ProductWithPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  async function loadProducts() {
    setLoading(true);
    const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
    const withPrices: ProductWithPrice[] = [];

    for (const p of allProducts) {
      const [latest] = await db
        .select()
        .from(priceEntries)
        .where(eq(priceEntries.productId, p.id))
        .orderBy(desc(priceEntries.recordedAt))
        .limit(1);

      if (latest) {
        const change = await calculatePriceChange(p.id);
        withPrices.push({ id: p.id, name: p.name, lastPrice: latest.unitPrice, priceChange: change });
      }
    }

    setItems(withPrices);
    setLoading(false);
  }

  if (!loading && items.length === 0) {
    return (
      <EmptyState
        title="Nenhum produto"
        description="Escaneie uma nota fiscal para começar a acompanhar preços"
      />
    );
  }

  return (
    <View className="flex-1 bg-background p-3">
      <Text className="mb-3 text-2xl font-bold text-foreground">Meus Produtos</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View className="mb-2">
            <ProductCard
              productId={item.id}
              name={item.name}
              lastPrice={item.lastPrice}
              priceChange={item.priceChange}
            />
          </View>
        )}
      />
    </View>
  );
}
