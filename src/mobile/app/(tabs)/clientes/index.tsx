// app/(tabs)/clientes/index.tsx
// Responsabilidade: tela principal do módulo Clientes.
// Exibe a lista de todos os clientes e permite navegar para detalhe,
// editar e remover. O botão "Novo" abre a tela de criação.
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

// ─── Scaffold ─────────────────────────────────────────────────────────────────
import { Button }        from "@components/common/Button";
import { LoadingSpinner} from "@components/common/LoadingSpinner";
import { colors, spacing, fontSize } from "@constants/theme";
import { Cliente }       from "@modelos/cliente";

// ─── Módulo Clientes ──────────────────────────────────────────────────────────
import { useClientes }   from "@hooks/useClientes";
import ClienteCard       from "@components/clientes/ClienteCard";

export default function ClientesScreen() {
  const router = useRouter();
  const {
    clientes,
    loading,
    error,
    fetchAll,
    remove,
    clearError,
  } = useClientes();

  const [busca, setBusca] = useState("");

  // ── Carrega a lista ao abrir a tela ────────────────────────────────────────
  useEffect(() => {
    fetchAll();
  }, []);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  // ── Filtro local por nome ou email ─────────────────────────────────────────
  const clientesFiltrados = clientes.filter((c) => {
    const termo = busca.toLowerCase();
    return (
      c.nome.toLowerCase().includes(termo) ||
      c.email.toLowerCase().includes(termo)
    );
  });

  // ── Confirmação de remoção ─────────────────────────────────────────────────
  const handleDelete = (cliente: Cliente) => {
    Alert.alert(
      "Remover cliente",
      `Deseja remover ${cliente.nome}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => remove(cliente.id),
        },
      ]
    );
  };

  // ── Loading inicial ────────────────────────────────────────────────────────
  if (loading && !refreshing && clientes.length === 0) {
    return <LoadingSpinner />;
  }

  // ── Tela de erro ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Tentar novamente"
          onPress={() => { clearError(); fetchAll(); }}
        />
      </View>
    );
  }

  // ── Tela principal ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <Button
          title="+ Novo"
          variant="primary"
          onPress={() => router.push("/(tabs)/clientes/novo")}
        />
      </View>

      {/* Campo de busca */}
      <TextInput
        style={styles.busca}
        placeholder="Buscar por nome ou email..."
        placeholderTextColor={colors.textMuted}
        value={busca}
        onChangeText={setBusca}
      />

      {/* Lista */}
      <FlatList
        data={clientesFiltrados}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ClienteCard
            cliente={item}
            onPress={(c) => router.push(`/(tabs)/clientes/${c.id}`)}
            onEdit={(c)  => router.push(`/(tabs)/clientes/${c.id}?modo=editar`)}
            onDelete={handleDelete}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            {busca
              ? "Nenhum cliente encontrado para essa busca."
              : "Nenhum cliente cadastrado."}
          </Text>
        }
      />

    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "500",
    color: colors.text,
  },
  busca: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.surface,
  },
  lista: {
    paddingBottom: spacing.xl,
  },
  separador: {
    height: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.danger,
    textAlign: "center",
  },
  vazio: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xl,
  },
});
