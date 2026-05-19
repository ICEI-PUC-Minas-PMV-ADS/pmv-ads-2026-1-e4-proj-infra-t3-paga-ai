import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '@hooks/useAuth';

export default function TabsLayout() {
  const { logout } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes/index"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="emprestimos/index"
        options={{
          title: 'Empréstimos',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'cash' : 'cash-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notificacoes/index"
        options={{
          title: 'Notificações',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="relatorios/index"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={size} color={color} />
          ),
        }}
      />

      {/* Esconde rotas dinâmicas da Tab Bar */}
      <Tabs.Screen
        name="clientes/[id]"
        options={{ href: null }}
      />

      {/* Aba de logout */}
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Sair',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          ),
          tabBarButton: () => (
            <TouchableOpacity
              onPress={logout}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name="log-out-outline" size={24} color="#e53935" />
              <Text style={{ fontSize: 10, color: '#e53935', marginTop: 2 }}>Sair</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}