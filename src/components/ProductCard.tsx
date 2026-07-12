import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';

import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { PriceChange } from '@/types';

import { PriceChangeAlert } from './PriceChangeAlert';

interface Props {
  productId: number;
  name: string;
  lastPrice: number;
  priceChange: PriceChange | null;
}

export function ProductCard({ productId, name, lastPrice, priceChange }: Props) {
  return (
    <Link href={`/product/${productId}` as never} asChild>
      <Pressable>
        <Card>
          <CardContent className="flex-row items-center justify-between p-3">
            <View className="mr-2 flex-1">
              <Text className="text-base font-medium" numberOfLines={1}>
                {name}
              </Text>
              <Text className="mt-0.5 text-lg font-bold text-foreground">
                R$ {lastPrice.toFixed(2).replace('.', ',')}
              </Text>
            </View>
            {priceChange && priceChange.direction !== 'stable' && (
              <PriceChangeAlert
                changePercent={priceChange.changePercent}
                direction={priceChange.direction}
              />
            )}
          </CardContent>
        </Card>
      </Pressable>
    </Link>
  );
}
