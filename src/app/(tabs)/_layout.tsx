import { Tabs } from 'expo-router';
import { ScanLine, ShoppingCart, Store } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'hsl(221, 83%, 53%)' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Escanear',
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: 'Mercados',
          tabBarIcon: ({ color, size }) => <Store color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
