import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconFocused: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'index',        title: 'Dashboard',    icon: 'home-outline',          iconFocused: 'home' },
  { name: 'clientes',     title: 'Clientes',     icon: 'people-outline',        iconFocused: 'people' },
  { name: 'emprestimos',  title: 'Empréstimos',  icon: 'cash-outline',          iconFocused: 'cash' },
  { name: 'notificacoes', title: 'Notificações', icon: 'notifications-outline', iconFocused: 'notifications' },
  { name: 'relatorios',   title: 'Relatórios',   icon: 'bar-chart-outline',     iconFocused: 'bar-chart' },
  { name: 'perfil',       title: 'Perfil',       icon: 'person-outline',        iconFocused: 'person' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const baseName = route.name.split('/')[0];
        const tab = TABS.find((t) => t.name === baseName);
        return {
          headerShown: false,
          title: tab?.title,
          tabBarActiveTintColor: '#7C3AED',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? tab?.iconFocused : tab?.icon;
            return <Ionicons name={iconName ?? 'ellipse-outline'} size={size} color={color} />;
          },
        };
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="clientes/index" />
      <Tabs.Screen name="emprestimos/index" />
      <Tabs.Screen name="notificacoes/index" />
      <Tabs.Screen name="relatorios/index" />
      <Tabs.Screen name="perfil/index" />
      </Tabs>
  );
}