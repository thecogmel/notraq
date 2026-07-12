import '../../global.css';

import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

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
        <ActivityIndicator size="large" color="#34d399" />
        <Text className="mt-2 text-muted-foreground">Inicializando...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#09090b' },
        headerTintColor: '#fafafa',
        contentStyle: { backgroundColor: '#09090b' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="scan"
        options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="receipt/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <AppContent />
    </>
  );
}
