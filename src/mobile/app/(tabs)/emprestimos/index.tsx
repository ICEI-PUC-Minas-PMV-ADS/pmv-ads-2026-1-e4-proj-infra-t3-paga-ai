import { View, Text, StyleSheet } from 'react-native';

export default function EmprestimosScreen() {
  return (
    <View style={s.container}>
      <Text style={s.icon}>💳</Text>
      <Text style={s.titulo}>Empréstimos</Text>
      <Text style={s.sub}>Tela em desenvolvimento</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' },
  icon:      { fontSize: 48, marginBottom: 12 },
  titulo:    { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  sub:       { fontSize: 14, color: '#6B7280', marginTop: 6 },
});
