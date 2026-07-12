import { View } from 'react-native';

import { Text } from '@/components/ui/text';

interface Props {
  icon?: string;
  title: string;
  description: string;
}

export function EmptyState({ icon = '🛒', title, description }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-6">
      <Text className="text-4xl">{icon}</Text>
      <Text className="text-center text-lg font-bold text-foreground">{title}</Text>
      <Text className="text-center text-sm text-muted-foreground">{description}</Text>
    </View>
  );
}
