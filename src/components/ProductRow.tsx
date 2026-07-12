import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { Sparkline } from '@/components/Sparkline';
import { Text } from '@/components/ui/text';
import { formatBRL } from '@/lib/utils';
import type { PriceChange } from '@/types';

interface ProductWithPrice {
  id: number;
  name: string;
  unit: string | null;
  lastPrice: number;
  priceChange: PriceChange | null;
  recentPrices: number[];
}

interface Props {
  item: ProductWithPrice;
}

export function ProductRow({ item }: Props) {
  const direction = item.priceChange?.direction;
  const changePercent = item.priceChange?.changePercent ?? 0;

  const variationColor =
    direction === 'up'
      ? 'text-price-up'
      : direction === 'down'
        ? 'text-price-down'
        : 'text-zinc-500';

  const variationPrefix = direction === 'up' ? '+' : '';

  return (
    <Pressable onPress={() => router.push(`/product/${item.id}` as never)}>
      <View className="flex-row items-center gap-3 rounded-2xl border border-zinc-800 bg-[#18181b] px-3.5 py-3">
        {/* Left: Name + Unit */}
        <View className="flex-1 shrink">
          <Text className="text-sm font-semibold text-white" numberOfLines={1}>
            {item.name}
          </Text>
          {item.unit ? (
            <Text className="mt-0.5 text-[11.5px] text-zinc-500">{item.unit}</Text>
          ) : null}
        </View>

        {/* Middle: Sparkline */}
        <Sparkline prices={item.recentPrices} direction={direction} />

        {/* Right: Price + Variation (fixed width) */}
        <View className="w-[74px] items-end">
          <Text className="font-mono text-sm font-semibold text-white">
            {formatBRL(item.lastPrice)}
          </Text>
          {item.priceChange && direction !== 'stable' ? (
            <Text className={`mt-0.5 text-[11.5px] font-semibold ${variationColor}`}>
              {variationPrefix}
              {changePercent.toFixed(1).replace('.', ',')}%
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
