import { Modal, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60 px-8">
        <View className="w-full rounded-2xl border border-zinc-800 bg-[#18181b] p-5">
          <Text className="text-lg font-semibold text-white">{title}</Text>
          <Text className="mt-2 text-sm text-zinc-400">{message}</Text>
          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 rounded-xl border border-zinc-700 py-3"
            >
              <Text className="text-center text-sm font-medium text-zinc-300">{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 rounded-xl py-3 ${destructive ? 'bg-red-500/90' : 'bg-[#34d399]'}`}
            >
              <Text className="text-center text-sm font-semibold text-white">{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
