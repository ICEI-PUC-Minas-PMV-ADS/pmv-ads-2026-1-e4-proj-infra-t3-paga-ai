// Tela exibida quando nenhuma rota corresponde ao caminho acessado.

import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Página não encontrada</Text>
      <Text style={styles.subtitle}>O endereço acessado não existe.</Text>
      <Link href="/(tabs)" style={styles.link}>
        Voltar ao início
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  link: {
    fontSize: 15,
    color: '#1a73e8',
    fontWeight: '600',
  },
});
