import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@components/common';
import { StatusBadge } from './StatusBadge';
import {
  Emprestimo,
  calcularStatusDisplay,
  fmt,
  fmtDate,
} from 'emprestimo';

interface EmprestimoCardProps {
  emprestimo: Emprestimo;
  onPagar:   (id: number) => void;
  onDeletar: (id: number) => void;
}

export function EmprestimoCard({ emprestimo: e, onPagar, onDeletar }: EmprestimoCardProps) {
  const status      = calcularStatusDisplay(e);
  const pago        = status === 'Pago';
  const idFormatado = String(e.id).padStart(3, '0');

  const parcelasPagas = e.parcelas.filter((p) => p.pago).length;
  const progressoPct  = e.numeroParcelas > 0
    ? Math.round((parcelasPagas / e.numeroParcelas) * 100)
    : 0;

  return (
    <Card>
      {/* ── Cabeçalho ── */}
      <View style={styles.topRow}>
        <View style={styles.nomeWrap}>
          <Text style={styles.nome} numberOfLines={1}>{e.cliente}</Text>
          <Text style={styles.idText}>#{idFormatado}</Text>
        </View>

        <View style={styles.acoes}>
          {!pago && (
            <TouchableOpacity style={styles.btnPagar} onPress={() => onPagar(e.id)}>
              <Text style={styles.btnPagarText}>✔ Recebido</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.btnDeletar} onPress={() => onDeletar(e.id)}>
            <Text style={styles.btnDeletarText}>✕</Text>
          </TouchableOpacity>
          <StatusBadge status={status} size="sm" />
        </View>
      </View>

      {/* ── Infos principais ── */}
      <View style={styles.infosGrid}>
        <InfoItem label="VALOR"    valor={fmt(e.valor)} />
        <InfoItem label="JUROS"    valor={`${(e.taxaJuros * 100).toFixed(1)}%`} />
        {e.numeroParcelas > 1 && (
          <InfoItem label="PARCELAS" valor={`${e.numeroParcelas}x de ${fmt(e.valorParcela)}`} />
        )}
        <InfoItem
          label="A RECEBER"
          valor={pago ? '—' : fmt(e.valorFinal)}
          destaque={!pago}
        />
        <InfoItem
          label={pago ? 'PAGO EM' : 'VENCIMENTO'}
          valor={pago ? fmtDate(e.dataPagamento) : fmtDate(e.dataVencimento)}
        />
        <InfoItem label="EMPRÉSTIMO EM" valor={fmtDate(e.dataEmprestimo)} />
      </View>

      {/* ── Barra de progresso ── */}
      {e.numeroParcelas > 1 && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Parcelas pagas: {parcelasPagas}/{e.numeroParcelas}
            </Text>
            <Text style={styles.progressPct}>{progressoPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressoPct}%` as any }]} />
          </View>
        </View>
      )}

      {/* ── Chips de parcelas ── */}
      {e.parcelas.length > 1 && (
        <View style={styles.parcelasSection}>
          <Text style={styles.parcelasHeader}>PARCELAS</Text>
          <View style={styles.parcelasWrap}>
            {e.parcelas.map((p) => (
              <View
                key={p.numero}
                style={[styles.chip, { backgroundColor: p.pago ? '#D1FAE5' : '#EDE9FE' }]}
              >
                <Text style={[styles.chipText, { color: p.pago ? '#059669' : '#7C3AED' }]}>
                  {p.numero}ª {fmt(p.valor)} — {fmtDate(p.dataVencimento)}{p.pago ? ' ✔' : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

function InfoItem({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValor, destaque && styles.infoDestaque]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 8,
  },
  nomeWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  nome: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  idText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  btnPagar: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#7C3AED',
    backgroundColor: '#fff',
  },
  btnPagarText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  btnDeletar: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  btnDeletarText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  infosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 14,
  },
  infoItem: {
    minWidth: 80,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoValor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  infoDestaque: {
    color: '#DC2626',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#EDE9FE',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 99,
  },
  parcelasSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  parcelasHeader: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  parcelasWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});