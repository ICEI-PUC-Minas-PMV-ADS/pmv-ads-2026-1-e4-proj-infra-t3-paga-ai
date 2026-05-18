// Dashboard placeholder — exibe o nome do usuário logado.
// O conteúdo definitivo (resumos, gráficos) será desenvolvido pelo responsável.

import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@hooks/useAuth';

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Olá, {user?.nome ?? 'usuário'}!</Text>
      <Text style={styles.hint}>
        O conteúdo do dashboard será desenvolvido pelo responsável pelo módulo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  hint: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
