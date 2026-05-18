// components/clientes/ClienteCard.tsx
// Responsabilidade: exibir os dados de um cliente em formato de card.
// Reutilizável em qualquer tela do app que precise exibir um cliente.
// Exemplos de uso: listagem de clientes, seleção de cliente em novo empréstimo.

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { Cliente }                         from "@modelos/cliente";      // types/cliente.ts
import { colors, spacing, fontSize }       from "@constants/theme";    // constants/theme.ts
import { Card }                            from "@components/common/Card"; // components/common/

// ─── Props ────────────────────────────────────────────────────────────────────
interface ClienteCardProps {
  cliente:    Cliente;
  onPress?:   (cliente: Cliente) => void; // navegar para detalhe
  onEdit?:    (cliente: Cliente) => void; // abrir tela de edição
  onDelete?:  (cliente: Cliente) => void; // confirmar remoção
  compact?:   boolean;                    // modo compacto para listas de seleção
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function ClienteCard({
  cliente,
  onPress,
  onEdit,
  onDelete,
  compact = false,
}: ClienteCardProps) {

  // ── Iniciais do nome para o avatar ─────────────────────────────────────────
  const iniciais = cliente.nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  return (
    <Card>
      <TouchableOpacity
        onPress={() => onPress?.(cliente)}
        activeOpacity={onPress ? 0.7 : 1}
        style={styles.container}
      >
        {/* Avatar com iniciais */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciais}</Text>
        </View>

        {/* Dados do cliente */}
        <View style={styles.info}>
          <Text style={styles.nome}>{cliente.nome}</Text>

          {!compact && (
            <>
              <Text style={styles.detalhe}>{cliente.email}</Text>
              <Text style={styles.detalhe}>{cliente.telefone}</Text>
              <Text style={styles.detalhe}>CPF: {cliente.cpf}</Text>
            </>
          )}

          {compact && (
            <Text style={styles.detalhe}>{cliente.email}</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Ações — só aparecem se os handlers foram passados */}
      {(onEdit || onDelete) && !compact && (
        <View style={styles.acoes}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(cliente)}
              style={[styles.btnAcao, styles.btnEditar]}
            >
              <Text style={styles.btnEditarText}>Editar</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(cliente)}
              style={[styles.btnAcao, styles.btnRemover]}
            >
              <Text style={styles.btnRemoverText}>Remover</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nome: {
    fontSize: fontSize.md,
    fontWeight: "500",
    color: colors.text,
  },
  detalhe: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  acoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.surface,
  },
  btnAcao: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  btnEditar: {
    borderColor: colors.primary,
  },
  btnEditarText: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  btnRemover: {
    borderColor: colors.danger,
  },
  btnRemoverText: {
    fontSize: fontSize.sm,
    color: colors.danger,
  },
});
