import { Pressable, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import { History, Home, Plus, ShoppingBag } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'hsl(221, 83%, 53%)',
        tabBarStyle: { height: 60, paddingBottom: 8 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scan-placeholder"
        options={{
          title: '',
          tabBarIcon: () => (
            <View className="absolute -top-4 rounded-full bg-primary p-3 shadow-lg" style={{ elevation: 6 }}>
              <Plus color="white" size={24} strokeWidth={2.5} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/scan');
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
