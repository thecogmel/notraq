import { Tabs } from 'expo-router';
import { Home, Package, Store } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#34d399',
        tabBarInactiveTintColor: '#71717a',
        sceneStyle: { backgroundColor: '#09090b' },
        tabBarStyle: {
          backgroundColor: 'rgba(9, 9, 11, 0.85)',
          borderTopColor: '#27272a',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          ...(Platform.OS === 'ios' && {
            position: 'absolute',
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: 'Mercados',
          tabBarIcon: ({ color, size }) => <Store color={color} size={size} />,
        }}
      />
      {/* Hide removed routes from tabs */}
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}
