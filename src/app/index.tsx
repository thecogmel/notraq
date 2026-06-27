import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background p-4 pt-12">
      <Text className="text-3xl font-bold text-foreground">Notraq</Text>
      <Text className="mb-6 mt-1 text-muted-foreground">Rastreie preços das suas compras</Text>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Nenhum produto ainda</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-muted-foreground">
            Escaneie um QR code de nota fiscal para começar a rastrear preços.
          </Text>
        </CardContent>
      </Card>

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <CardContent className="items-center pt-4">
            <Text className="text-2xl font-bold text-foreground">0</Text>
            <Text className="text-xs text-muted-foreground">Produtos</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="items-center pt-4">
            <Text className="text-2xl font-bold text-foreground">0</Text>
            <Text className="text-xs text-muted-foreground">Mercados</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="items-center pt-4">
            <Text className="text-2xl font-bold text-foreground">0</Text>
            <Text className="text-xs text-muted-foreground">Notas</Text>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}
