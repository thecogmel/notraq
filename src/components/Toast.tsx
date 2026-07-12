import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { X } from 'lucide-react-native';

import { Text } from '@/components/ui/text';

interface ToastProps {
  visible: boolean;
  title: string;
  message?: string;
  variant?: 'error' | 'success' | 'info';
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ visible, title, message, variant = 'info', onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  const borderColor =
    variant === 'error' ? 'border-red-500/50' :
    variant === 'success' ? 'border-[#34d399]/50' :
    'border-zinc-700';

  const iconBg =
    variant === 'error' ? 'bg-red-500/10' :
    variant === 'success' ? 'bg-[#34d399]/10' :
    'bg-zinc-800';

  return (
    <View className="absolute left-4 right-4 top-16 z-50">
      <View className={`flex-row items-start gap-3 rounded-2xl border bg-[#18181b] p-4 ${borderColor}`}>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-white">{title}</Text>
          {message && (
            <Text className="mt-0.5 text-xs text-zinc-400">{message}</Text>
          )}
        </View>
        <Pressable onPress={onDismiss} hitSlop={12}>
          <X size={16} color="#71717a" />
        </Pressable>
      </View>
    </View>
  );
}
