import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { desc } from 'drizzle-orm';

import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { stores } from '@/db/schema';

export default function StoresScreen() {
  const [storeList, setStoreList] = useState<
    { id: number; name: string; cnpj: string | null; address: string | null }[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      loadStores();
    }, [])
  );

  async function loadStores() {
    setStoreList(await db.select().from(stores).orderBy(desc(stores.createdAt)));
  }

  if (storeList.length === 0) {
    return (
      <EmptyState
        icon="🏪"
        title="Nenhum mercado"
        description="Mercados aparecem automaticamente ao escanear ou adicionar notas"
      />
    );
  }

  return (
    <View className="flex-1 bg-background p-3">
      <Text className="mb-3 text-2xl font-bold text-foreground">Mercados</Text>
      <FlatList
        data={storeList}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card className="mb-2">
            <CardContent className="p-3">
              <Text className="text-base font-medium">{item.name}</Text>
              {item.cnpj && (
                <Text className="text-xs text-muted-foreground">CNPJ: {item.cnpj}</Text>
              )}
              {item.address && (
                <Text className="mt-0.5 text-xs text-muted-foreground">{item.address}</Text>
              )}
            </CardContent>
          </Card>
        )}
      />
    </View>
  );
}
