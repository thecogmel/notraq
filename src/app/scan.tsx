import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Camera,
  Check,
  ChevronLeft,
  Image,
  Keyboard,
  X,
} from 'lucide-react-native';

import { ManualEntryForm } from '@/components/ManualEntryForm';
import { ScannerView } from '@/components/ScannerView';
import { Toast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { pickAndScanQr } from '@/services/image-scanner';
import { createManualReceipt } from '@/services/nfce-parser';
import { isNfceUrl, parseNfceUrl, buildConsultaUrl } from '@/services/nfce-url';
import { ingestReceipt } from '@/services/receipt-ingestion';
import { useAppStore } from '@/store/app-store';

type ScanMode = 'choose' | 'camera' | 'manual';
type ScanState = 'idle' | 'loading' | 'success';

export default function ScanModal() {
  const [mode, setMode] = useState<ScanMode>('choose');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [toast, setToast] = useState<{ title: string; message?: string; variant: 'error' | 'success' | 'info' } | null>(null);
  const [successData, setSuccessData] = useState<{
    receiptId: number;
    itemCount: number;
    storeName: string;
    totalAmount: number;
  } | null>(null);
  const { isProcessing, setProcessing, setError, setPendingUrl } = useAppStore();

  const dismissToast = useCallback(() => setToast(null), []);

  const renderToast = () => (
    <Toast
      visible={!!toast}
      title={toast?.title ?? ''}
      message={toast?.message}
      variant={toast?.variant ?? 'error'}
      onDismiss={dismissToast}
    />
  );

  // Animated values (stable across renders)
  const scanLineAnim = useMemo(() => new Animated.Value(0), []);
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (mode === 'camera') {
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      scanLoop.start();
      pulseLoop.start();

      return () => {
        scanLoop.stop();
        pulseLoop.stop();
      };
    }
  }, [mode, scanLineAnim, pulseAnim]);

  const handleQrData = (url: string) => {
    if (isProcessing) return;

    if (!isNfceUrl(url)) {
      setToast({ title: 'QR inválido', message: 'Este QR code não parece ser de uma nota fiscal.', variant: 'error' });
      return;
    }

    const info = parseNfceUrl(url);
    if (!info) {
      setToast({ title: 'Erro', message: 'Não foi possível ler a chave de acesso do QR code.', variant: 'error' });
      return;
    }

    // Navegar para WebView de consulta
    setPendingUrl(url);
    const consultaUrl = buildConsultaUrl(info);
    router.push({
      pathname: '/nfce-webview',
      params: { url: consultaUrl, accessKey: info.accessKey },
    } as never);
  };

  const handlePickImage = async () => {
    try {
      setProcessing(true);
      setScanState('loading');
      const qrData = await pickAndScanQr();

      if (!qrData) {
        setScanState('idle');
        setToast({ title: 'QR não encontrado', message: 'Não foi possível detectar um QR code na imagem.', variant: 'error' });
        return;
      }

      setScanState('idle');
      handleQrData(qrData);
    } catch (e) {
      setScanState('idle');
      const msg = e instanceof Error ? e.message : 'Erro ao processar imagem';
      setToast({ title: 'Erro', message: msg, variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = async (data: {
    storeName: string;
    items: { name: string; price: number | null; quantity: string }[];
  }) => {
    setProcessing(true);
    setScanState('loading');
    try {
      const receipt = createManualReceipt({
        storeName: data.storeName,
        items: data.items.map((item) => ({
          name: item.name,
          unit: 'UN',
          quantity: parseFloat(item.quantity.replace(',', '.')) || 1,
          unitPrice: item.price ?? 0,
        })),
      });

      const receiptId = await ingestReceipt(receipt);
      setScanState('success');
      setSuccessData({
        receiptId,
        itemCount: receipt.items.length,
        storeName: data.storeName || 'Entrada Manual',
        totalAmount: receipt.totalAmount,
      });
    } catch (e) {
      setScanState('idle');
      const msg = e instanceof Error ? e.message : 'Erro ao salvar';
      setError(msg);
      setToast({ title: 'Erro', message: msg, variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  // Loading overlay
  if (scanState === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0b]">
        {renderToast()}
        <View className="items-center gap-4">
          <ActivityIndicator size="large" color="#34d399" />
          <Text className="text-base text-zinc-300">Processando nota fiscal...</Text>
          <Text className="text-sm text-zinc-500">Aguarde um momento</Text>
        </View>
      </View>
    );
  }

  // Success state
  if (scanState === 'success' && successData) {
    return (
      <View className="flex-1 items-center bg-[#0a0a0b] px-6 pt-24">
        {renderToast()}
        <View className="w-full items-center gap-5">
          {/* Green checkmark circle */}
          <View className="h-[74px] w-[74px] items-center justify-center rounded-full bg-[#34d399]/15">
            <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-[#34d399]">
              <Check size={28} color="#052e1f" strokeWidth={3} />
            </View>
          </View>

          <View className="items-center gap-1">
            <Text className="text-xl font-bold text-white">Nota registrada!</Text>
            <Text className="text-sm text-zinc-400">
              {successData.itemCount} {successData.itemCount === 1 ? 'item adicionado' : 'itens adicionados'} ao histórico
            </Text>
          </View>

          {/* Summary card - expanded */}
          <View className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            {/* Store header */}
            <View className="flex-row items-center gap-3 border-b border-zinc-800 pb-4">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#fb923c]/15">
                <Text className="text-base font-semibold text-[#fb923c]">
                  {successData.storeName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text className="text-base font-semibold text-white">
                  {successData.storeName}
                </Text>
                <Text className="text-xs text-zinc-500">
                  {new Date().toLocaleDateString('pt-BR')} · {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>

            {/* Stats row */}
            <View className="flex-row justify-between pt-4">
              <View>
                <Text className="text-xs text-zinc-500">Total da compra</Text>
                <Text className="mt-1 font-mono text-2xl font-semibold text-white">
                  R$ {successData.totalAmount.toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-zinc-500">Itens</Text>
                <Text className="mt-1 font-mono text-2xl font-semibold text-white">
                  {successData.itemCount}
                </Text>
              </View>
            </View>
          </View>

          {/* Ver detalhes button */}
          <Button
            variant="accent"
            className="w-full"
            onPress={() => router.replace(`/receipt/${successData.receiptId}?from=import` as never)}
          >
            <Text className="text-base font-semibold">
              Ver detalhes da nota
            </Text>
          </Button>

          {/* Scan again */}
          <Button variant="ghost" onPress={() => { setScanState('idle'); setMode('choose'); }}>
            <Text className="text-sm text-zinc-400">Escanear outra</Text>
          </Button>

          {/* Close */}
          <Button variant="ghost" onPress={() => router.back()}>
            <Text className="text-sm text-zinc-600">Fechar</Text>
          </Button>
        </View>
      </View>
    );
  }

  // Choose mode screen
  if (mode === 'choose') {
    return (
      <View className="flex-1 bg-[#0a0a0b]">
      {renderToast()}
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pb-4 pt-14">
          <Text className="text-xl font-bold text-white">Adicionar Nota</Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full bg-zinc-900"
          >
            <X size={18} color="#a1a1aa" />
          </Pressable>
        </View>

        {/* Options */}
        <View className="flex-1 justify-center gap-3 px-5">
          <Pressable onPress={() => setMode('camera')}>
            <Card className="p-4">
              <CardContent className="flex-row items-center gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#34d399]/10">
                  <Camera size={24} color="#34d399" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-white">Escanear QR Code</Text>
                  <Text className="text-sm text-zinc-400">
                    Aponte a câmera para o QR do cupom fiscal
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>

          <Pressable onPress={handlePickImage}>
            <Card className="p-4">
              <CardContent className="flex-row items-center gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#34d399]/10">
                  <Image size={24} color="#34d399" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-white">Importar Foto</Text>
                  <Text className="text-sm text-zinc-400">
                    Selecione uma foto do cupom na galeria
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>

          <Pressable onPress={() => setMode('manual')}>
            <Card className="p-4">
              <CardContent className="flex-row items-center gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#34d399]/10">
                  <Keyboard size={24} color="#34d399" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-white">Digitar Manualmente</Text>
                  <Text className="text-sm text-zinc-400">
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

  // Camera mode
  if (mode === 'camera') {
    return (
      <View className="flex-1 bg-[#0a0a0b]">
      {renderToast()}
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pb-3 pt-14">
          <Pressable
            onPress={() => setMode('choose')}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full bg-zinc-900"
          >
            <ChevronLeft size={18} color="#a1a1aa" />
          </Pressable>
          <Text className="text-lg font-bold text-white">Escanear QR</Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full bg-zinc-900"
          >
            <X size={18} color="#a1a1aa" />
          </Pressable>
        </View>

        {/* Camera with overlay */}
        <View className="flex-1">
          <ScannerView onScan={handleQrData} enabled={!isProcessing} />

          {/* QR Frame overlay */}
          <View className="absolute inset-0 items-center justify-center">
            <View className="h-[250px] w-[250px]">
              {/* Corner brackets */}
              {/* Top-left */}
              <View className="absolute left-0 top-0 h-[40px] w-[40px] border-l-[3px] border-t-[3px] border-[#34d399] rounded-tl-md" />
              {/* Top-right */}
              <View className="absolute right-0 top-0 h-[40px] w-[40px] border-r-[3px] border-t-[3px] border-[#34d399] rounded-tr-md" />
              {/* Bottom-left */}
              <View className="absolute bottom-0 left-0 h-[40px] w-[40px] border-b-[3px] border-l-[3px] border-[#34d399] rounded-bl-md" />
              {/* Bottom-right */}
              <View className="absolute bottom-0 right-0 h-[40px] w-[40px] border-b-[3px] border-r-[3px] border-[#34d399] rounded-br-md" />

              {/* Animated scan line */}
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 8,
                  right: 8,
                  height: 2,
                  backgroundColor: '#34d399',
                  borderRadius: 1,
                  opacity: 0.8,
                  transform: [
                    {
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 238],
                      }),
                    },
                  ],
                }}
              />
            </View>
          </View>

          {/* Bottom text */}
          <View className="absolute bottom-12 left-0 right-0 items-center gap-2">
            <View className="flex-row items-center gap-2">
              <Animated.View
                style={{ opacity: pulseAnim }}
                className="h-2 w-2 rounded-full bg-[#34d399]"
              />
              <Text className="text-base font-bold text-white">
                Aponte para o QR code
              </Text>
            </View>
            <Text className="text-sm text-zinc-400">
              Posicione o QR code dentro da moldura
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Manual mode
  return (
    <View className="flex-1 bg-[#0a0a0b]">
      {renderToast()}
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-14">
        <Pressable
          onPress={() => setMode('choose')}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-zinc-900"
        >
          <ChevronLeft size={18} color="#a1a1aa" />
        </Pressable>
        <Text className="text-lg font-bold text-white">Entrada Manual</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-zinc-900"
        >
          <X size={18} color="#a1a1aa" />
        </Pressable>
      </View>
      <ManualEntryForm onSubmit={handleManualSubmit} isLoading={isProcessing} />
    </View>
  );
}
