import '../../global.css';

import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

import { Text } from '@/components/ui/text';
import { useDatabaseMigrations } from '@/db/client';

function AppContent() {
  const { success, error } = useDatabaseMigrations();

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="text-center text-destructive">
          Erro ao inicializar banco: {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-muted-foreground">Inicializando...</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Produto' }} />
      <Stack.Screen name="receipt/[id]" options={{ title: 'Nota Fiscal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AppContent />
    </>
  );
}
