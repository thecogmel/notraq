import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Download } from 'lucide-react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { Text } from '@/components/ui/text';
import { EXTRACTION_SCRIPT, parseWebViewResult } from '@/services/nfce-parser';
import { ingestReceipt } from '@/services/receipt-ingestion';

export default function NfceWebViewScreen() {
  const { url, accessKey } = useLocalSearchParams<{ url: string; accessKey: string }>();
  const webViewRef = useRef<WebView>(null);
  const [canExtract, setCanExtract] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleLoadEnd = useCallback(() => {
    // After page loads (user resolved captcha), show extract button
    setCanExtract(true);
  }, []);

  const handleExtract = () => {
    if (!webViewRef.current) return;
    setExtracting(true);
    webViewRef.current.injectJavaScript(EXTRACTION_SCRIPT);
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);

      if (!parsed.success) {
        setExtracting(false);
        Alert.alert('Extração falhou', parsed.error || 'Não foi possível ler os dados da nota.');
        return;
      }

      const receipt = parseWebViewResult(parsed.data, url ?? '', accessKey ?? '');

      if (receipt.items.length === 0) {
        setExtracting(false);
        Alert.alert(
          'Nenhum item encontrado',
          'Verifique se a página da nota carregou completamente e tente novamente.'
        );
        return;
      }

      const receiptId = await ingestReceipt(receipt);
      Alert.alert('Sucesso!', `${receipt.items.length} itens importados de ${receipt.storeName}.`);
      router.replace(`/receipt/${receiptId}` as never);
    } catch (e) {
      setExtracting(false);
      Alert.alert('Erro', 'Falha ao processar dados da nota.');
    }
  };

  return (
    <View className="flex-1 bg-[#09090b]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-14">
        <View className="flex-row items-center gap-2.5">
          <Pressable
            onPress={() => router.back()}
            className="h-[38px] w-[38px] items-center justify-center rounded-xl border border-zinc-800 bg-[#18181b]"
          >
            <ChevronLeft size={20} color="#e4e4e7" />
          </Pressable>
          <Text className="text-[17px] font-semibold text-white">Consulta NFC-e</Text>
        </View>

        {canExtract && (
          <Pressable
            onPress={handleExtract}
            disabled={extracting}
            className="flex-row items-center gap-2 rounded-xl bg-[#34d399] px-4 py-2.5"
          >
            <Download size={16} color="#052e1f" />
            <Text className="text-sm font-semibold text-[#052e1f]">
              {extracting ? 'Extraindo...' : 'Extrair dados'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Instruction */}
      <View className="border-b border-zinc-800 bg-[#18181b] px-4 py-2.5">
        <Text className="text-xs text-zinc-400">
          1. Resolva o captcha abaixo • 2. Aguarde a página carregar • 3. Toque em "Extrair dados"
        </Text>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: url ?? '' }}
        onLoadEnd={handleLoadEnd}
        onMessage={handleMessage}
        className="flex-1"
        style={{ flex: 1, backgroundColor: '#09090b' }}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}
