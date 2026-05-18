// app/(tabs)/clientes/[id].tsx
// Responsabilidade: exibir o detalhe de um cliente e permitir edição.
// O parâmetro [id] vem da navegação — ex: /(tabs)/clientes/123
// O parâmetro opcional ?modo=editar abre a tela diretamente em modo edição.

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

// ─── Scaffold ─────────────────────────────────────────────────────────────────
import { Button }        from "@components/common/Button";
import { Input }         from "@components/common/Input";
import { LoadingSpinner} from "@components/common/LoadingSpinner";
import { Card }          from "@components/common/Card";
import { colors, spacing, fontSize } from "@constants/theme";

// ─── Módulo Clientes ──────────────────────────────────────────────────────────
import { useClientes }   from "@hooks/useClientes";

export default function ClienteDetalheScreen() {
  const router = useRouter();
  const { id, modo } = useLocalSearchParams<{ id: string; modo?: string }>();

  const {
    cliente,
    loading,
    error,
    fetchById,
    update,
    remove,
    clearError,
  } = useClientes();

  // ── Modo edição ────────────────────────────────────────────────────────────
  const [editando, setEditando] = useState(modo === "editar");

  // ── Campos do formulário de edição ─────────────────────────────────────────
  const [nome,     setNome]     = useState("");
  const [email,    setEmail]    = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf,      setCpf]      = useState("");
  const [erros,    setErros]    = useState<Record<string, string>>({});

  // ── Carrega o cliente ao abrir a tela ──────────────────────────────────────
  useEffect(() => {
    if (id) fetchById(Number(id));
  }, [id]);

  // ── Preenche os campos quando o cliente é carregado ────────────────────────
  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome);
      setEmail(cliente.email);
      setTelefone(cliente.telefone);
      setCpf(cliente.cpf);
    }
  }, [cliente]);

  // ── Validação básica do formulário ─────────────────────────────────────────
  const validar = (): boolean => {
    const novosErros: Record<string, string> = {};
    if (!nome.trim())     novosErros.nome     = "Nome é obrigatório.";
    if (!email.trim())    novosErros.email    = "Email é obrigatório.";
    if (!telefone.trim()) novosErros.telefone = "Telefone é obrigatório.";
    if (!cpf.trim())      novosErros.cpf      = "CPF é obrigatório.";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // ── Salvar edição ──────────────────────────────────────────────────────────
  const handleSalvar = async () => {
    if (!validar()) return;
    await update(Number(id), { nome, email, telefone, cpf });
    setEditando(false);
  };

  // ── Cancelar edição — restaura os valores originais ───────────────────────
  const handleCancelar = () => {
    if (cliente) {
      setNome(cliente.nome);
      setEmail(cliente.email);
      setTelefone(cliente.telefone);
      setCpf(cliente.cpf);
    }
    setErros({});
    setEditando(false);
  };

  // ── Confirmação de remoção ─────────────────────────────────────────────────
  const handleRemover = () => {
    Alert.alert(
      "Remover cliente",
      `Deseja remover ${cliente?.nome}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            await remove(Number(id));
            router.back();
          },
        },
      ]
    );
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && !cliente) {
    return <LoadingSpinner />;
  }

  // ── Erro ───────────────────────────────────────────────────────────────────
  if (error || !cliente) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error ?? "Cliente não encontrado."}
        </Text>
        <Button
          title="Voltar"
          onPress={() => { clearError(); router.back(); }}
        />
      </View>
    );
  }

  // ── Tela principal ─────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {editando ? "Editar cliente" : "Detalhe do cliente"}
        </Text>
      </View>

      {/* Formulário / Visualização */}
      <Card>
        {editando ? (
          // ── Modo edição ──────────────────────────────────────────────────
          <View style={styles.form}>
            <Input
              label="Nome"
              value={nome}
              onChangeText={setNome}
              error={erros.nome}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={erros.email}
            />
            <Input
              label="Telefone"
              value={telefone}
              onChangeText={setTelefone}
              error={erros.telefone}
            />
            <Input
              label="CPF"
              value={cpf}
              onChangeText={setCpf}
              error={erros.cpf}
            />
          </View>
        ) : (
          // ── Modo visualização ────────────────────────────────────────────
          <View style={styles.visualizacao}>
            <Campo label="Nome"     valor={cliente.nome}     />
            <Campo label="Email"    valor={cliente.email}    />
            <Campo label="Telefone" valor={cliente.telefone} />
            <Campo label="CPF"      valor={cliente.cpf}      />
          </View>
        )}
      </Card>

      {/* Ações */}
      <View style={styles.acoes}>
        {editando ? (
          <>
            <Button
              title="Salvar"
              variant="primary"
              loading={loading}
              onPress={handleSalvar}
            />
            <Button
              title="Cancelar"
              onPress={handleCancelar}
            />
          </>
        ) : (
          <>
            <Button
              title="Editar"
              variant="primary"
              onPress={() => setEditando(true)}
            />
            <Button
              title="Remover"
              onPress={handleRemover}
            />
          </>
        )}
      </View>

    </ScrollView>
  );
}

// ─── Componente auxiliar para exibir campo no modo visualização ───────────────
function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={styles.campoValor}>{valor}</Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "500",
    color: colors.text,
  },
  form: {
    gap: spacing.md,
  },
  visualizacao: {
    gap: spacing.sm,
  },
  campo: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.surface,
  },
  campoLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  campoValor: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  acoes: {
    gap: spacing.sm,
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
});
