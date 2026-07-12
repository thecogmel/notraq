import { View } from 'react-native';

import { Text } from '@/components/ui/text';

interface Props {
  changePercent: number;
  direction: 'up' | 'down' | 'stable';
}

export function PriceChangeAlert({ changePercent, direction }: Props) {
  if (direction === 'stable') return null;

  const color = direction === 'up' ? 'text-red-500' : 'text-green-600';
  const icon = direction === 'up' ? '↑' : '↓';

  return (
    <View className="flex-row items-center gap-0.5">
      <Text className={`text-sm font-bold ${color}`}>
        {icon} {Math.abs(changePercent).toFixed(1)}%
      </Text>
    </View>
  );
}
