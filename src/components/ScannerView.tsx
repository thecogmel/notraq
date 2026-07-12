import { CameraView, useCameraPermissions } from 'expo-camera';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface Props {
  onScan: (url: string) => void;
  enabled: boolean;
}

export function ScannerView({ onScan, enabled }: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-6">
        <Text className="text-center text-lg text-foreground">
          Precisamos de acesso à câmera para escanear QR codes de notas fiscais
        </Text>
        <Button onPress={requestPermission}>
          <Text>Permitir Câmera</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={enabled ? ({ data }) => onScan(data) : undefined}
      />
      <View className="absolute bottom-8 left-0 right-0 items-center">
        <View className="rounded-lg bg-black/60 px-4 py-2">
          <Text className="text-sm text-white">Aponte para o QR code da nota fiscal</Text>
        </View>
      </View>
    </View>
  );
}
