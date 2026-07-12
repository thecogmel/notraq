import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';

import { ManualEntryForm } from '@/components/ManualEntryForm';
import { ScannerView } from '@/components/ScannerView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { createManualReceipt } from '@/services/nfce-parser';
import { isNfceUrl, parseNfceUrl } from '@/services/nfce-url';
import { ingestReceipt } from '@/services/receipt-ingestion';
import { useAppStore } from '@/store/app-store';

export default function ScanScreen() {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const { isProcessing, setProcessing, setError, setPendingUrl } = useAppStore();

  const handleScan = (url: string) => {
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

    // TODO: Abrir WebView para consulta com captcha
    // Por enquanto, salva URL pendente e alerta o usuário
    setPendingUrl(url);
    Alert.alert(
      'NFC-e detectada',
      `Chave: ...${info.accessKey.slice(-8)}\nEstado: ${info.uf}\n\nA consulta via WebView será implementada em breve. Use a entrada manual por enquanto.`,
      [{ text: 'OK', onPress: () => setMode('manual') }]
    );
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
      router.push(`/receipt/${receiptId}` as never);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar';
      setError(msg);
      Alert.alert('Erro', msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row justify-center gap-2 border-b border-border p-3">
        <Button
          variant={mode === 'scan' ? 'default' : 'outline'}
          size="sm"
          onPress={() => setMode('scan')}
        >
          <Text>QR Code</Text>
        </Button>
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          size="sm"
          onPress={() => setMode('manual')}
        >
          <Text>Manual</Text>
        </Button>
      </View>

      {mode === 'scan' ? (
        <ScannerView onScan={handleScan} enabled={!isProcessing} />
      ) : (
        <ManualEntryForm onSubmit={handleManualSubmit} isLoading={isProcessing} />
      )}
    </View>
  );
}
