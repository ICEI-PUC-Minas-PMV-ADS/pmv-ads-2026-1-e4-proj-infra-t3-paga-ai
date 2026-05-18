import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBadge } from './StatusBadge';
import {
  Emprestimo,
  calcularStatusDisplay,
  fmt,
  fmtDateCurta,
} from 'emprestimo';

interface EmprestimoListItemProps {
  emprestimo: Emprestimo;
  onPress: (id: number) => void;
}

export function EmprestimoListItem({ emprestimo: e, onPress }: EmprestimoListItemProps) {
  const status  = calcularStatusDisplay(e);
  const pago    = status === 'Pago';
  const inicial = e.cliente.trim().charAt(0).toUpperCase();

  const jurosTxt    = `${(e.taxaJuros * 100).toFixed(1)}% a.m.`;
  const parcelasTxt = e.numeroParcelas > 1 ? `${e.numeroParcelas}x · ` : '';
  const dataTxt     = pago
    ? `pago ${fmtDateCurta(e.dataPagamento)}`
    : `vence ${fmtDateCurta(e.dataVencimento)}`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(e.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{inicial}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.nome} numberOfLines={1}>{e.cliente}</Text>
          <Text style={styles.valor}>{fmt(e.valor)}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {parcelasTxt}{jurosTxt} · {dataTxt}
          </Text>
          <StatusBadge status={status} size="sm" />
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  nome: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  valor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  chevron: {
    fontSize: 22,
    color: '#D1D5DB',
    marginLeft: 4,
    lineHeight: 24,
  },
});