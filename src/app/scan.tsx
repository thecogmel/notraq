import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Camera, Image, Keyboard, X } from 'lucide-react-native';

import { ManualEntryForm } from '@/components/ManualEntryForm';
import { ScannerView } from '@/components/ScannerView';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { pickAndScanQr } from '@/services/image-scanner';
import { createManualReceipt } from '@/services/nfce-parser';
import { isNfceUrl, parseNfceUrl } from '@/services/nfce-url';
import { ingestReceipt } from '@/services/receipt-ingestion';
import { useAppStore } from '@/store/app-store';

type ScanMode = 'choose' | 'camera' | 'manual';

export default function ScanModal() {
  const [mode, setMode] = useState<ScanMode>('choose');
  const { isProcessing, setProcessing, setError, setPendingUrl } = useAppStore();

  const handleQrData = (url: string) => {
    if (isProcessing) return;

    if (!isNfceUrl(url)) {
      Alert.alert('QR inválido', 'Este QR code não parece ser de uma nota fiscal.');
      return;
    }

    const info = parseNfceUrl(url);
    if (!info) {
      Alert.alert('Erro', 'Não foi possível ler a chave de acesso do QR code.');
      return;
    }

    setPendingUrl(url);
    Alert.alert(
      'NFC-e detectada!',
      `Chave: ...${info.accessKey.slice(-8)}\nEstado: ${info.uf}\n\nConsulta via WebView em breve. Use entrada manual por enquanto.`,
      [{ text: 'Adicionar Manual', onPress: () => setMode('manual') }]
    );
  };

  const handlePickImage = async () => {
    try {
      setProcessing(true);
      const qrData = await pickAndScanQr();

      if (!qrData) {
        Alert.alert('QR não encontrado', 'Não foi possível detectar um QR code na imagem.');
        return;
      }

      handleQrData(qrData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao processar imagem';
      Alert.alert('Erro', msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = async (data: {
    storeName: string;
    items: { name: string; price: string; quantity: string }[];
  }) => {
    setProcessing(true);
    try {
      const receipt = createManualReceipt({
        storeName: data.storeName,
        items: data.items.map((item) => ({
          name: item.name,
          unit: 'UN',
          quantity: parseFloat(item.quantity.replace(',', '.')) || 1,
          unitPrice: parseFloat(item.price.replace(',', '.')) || 0,
        })),
      });

      const receiptId = await ingestReceipt(receipt);
      Alert.alert('Salvo!', `${receipt.items.length} item(ns) adicionado(s).`);
      router.replace(`/receipt/${receiptId}` as never);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar';
      setError(msg);
      Alert.alert('Erro', msg);
    } finally {
      setProcessing(false);
    }
  };

  // Tela de escolha
  if (mode === 'choose') {
    return (
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border p-4 pt-14">
          <Text className="text-xl font-bold text-foreground">Adicionar Nota</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <X size={24} className="text-foreground" />
          </Pressable>
        </View>

        {/* Opções */}
        <View className="flex-1 justify-center gap-4 p-6">
          <Pressable onPress={() => setMode('camera')}>
            <Card>
              <CardContent className="flex-row items-center gap-4 p-4">
                <View className="rounded-full bg-primary/10 p-3">
                  <Camera size={28} color="hsl(221, 83%, 53%)" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold">Escanear QR Code</Text>
                  <Text className="text-sm text-muted-foreground">
                    Aponte a câmera para o QR do cupom fiscal
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>

          <Pressable onPress={handlePickImage}>
            <Card>
              <CardContent className="flex-row items-center gap-4 p-4">
                <View className="rounded-full bg-primary/10 p-3">
                  <Image size={28} color="hsl(221, 83%, 53%)" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold">Importar Foto</Text>
                  <Text className="text-sm text-muted-foreground">
                    Selecione uma foto do cupom na galeria
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>

          <Pressable onPress={() => setMode('manual')}>
            <Card>
              <CardContent className="flex-row items-center gap-4 p-4">
                <View className="rounded-full bg-primary/10 p-3">
                  <Keyboard size={28} color="hsl(221, 83%, 53%)" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold">Digitar Manualmente</Text>
                  <Text className="text-sm text-muted-foreground">
                    Adicione produtos e preços na mão
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>
        </View>
      </View>
    );
  }

  // Câmera
  if (mode === 'camera') {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border p-4 pt-14">
          <Pressable onPress={() => setMode('choose')}>
            <Text className="text-primary">← Voltar</Text>
          </Pressable>
          <Text className="text-lg font-bold">Escanear QR</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <X size={24} className="text-foreground" />
          </Pressable>
        </View>
        <ScannerView onScan={handleQrData} enabled={!isProcessing} />
      </View>
    );
  }

  // Manual
  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border p-4 pt-14">
        <Pressable onPress={() => setMode('choose')}>
          <Text className="text-primary">← Voltar</Text>
        </Pressable>
        <Text className="text-lg font-bold">Entrada Manual</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <X size={24} className="text-foreground" />
        </Pressable>
      </View>
      <ManualEntryForm onSubmit={handleManualSubmit} isLoading={isProcessing} />
    </View>
  );
}
