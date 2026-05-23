// Layout de abas principal. Define as 5 seções da aplicação com nome e ícone.
// Cada aba aponta para o index.tsx da sua pasta — implemente as telas lá.

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
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = TABS.find((t) => t.name === route.name);
        return {
          headerShown: false,
          title: tab?.title,
          tabBarActiveTintColor: '#7C3AED',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            height: 60,
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
    />
  );
}
