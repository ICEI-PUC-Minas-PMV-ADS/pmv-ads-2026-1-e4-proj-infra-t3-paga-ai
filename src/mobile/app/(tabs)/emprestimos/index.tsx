import { View, Text, StyleSheet } from 'react-native';

export default function EmprestimosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Empréstimos</Text>
      <Text style={styles.sub}>Em desenvolvimento</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 22, fontWeight: '500', color: '#222' },
  sub: { fontSize: 14, color: '#888', marginTop: 8 },
});