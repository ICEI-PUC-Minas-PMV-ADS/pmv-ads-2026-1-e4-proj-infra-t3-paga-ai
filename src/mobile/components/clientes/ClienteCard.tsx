import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@components/common';
import { fmtCpf, fmtTelefone } from '@types/cliente';
import type { Cliente } from '@types/cliente';

interface ClienteCardProps {
  cliente: Cliente;
  onEditar: (cliente: Cliente) => void;
  onDeletar: (id: number) => void;
}

export function ClienteCard({ cliente, onEditar, onDeletar }: ClienteCardProps) {
  const inicial = cliente.nome.charAt(0).toUpperCase();

  return (
    <Card style={s.card}>
      <View style={s.row}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{inicial}</Text>
        </View>

        <View style={s.info}>
          <Text style={s.nome} numberOfLines={1}>{cliente.nome}</Text>
          <Text style={s.detalhe}>CPF: {fmtCpf(cliente.cpf)}</Text>
          <Text style={s.detalhe}>{fmtTelefone(cliente.telefone)}</Text>
          <Text style={s.detalhe} numberOfLines={1}>{cliente.email}</Text>
          {cliente.endereco ? (
            <Text style={s.detalhe} numberOfLines={1}>{cliente.endereco}</Text>
          ) : null}
          {cliente.observacoes ? (
            <Text style={s.obs} numberOfLines={2}>{cliente.observacoes}</Text>
          ) : null}
        </View>

        <View style={s.acoes}>
          <TouchableOpacity style={s.btnEditar} onPress={() => onEditar(cliente)}>
            <Text style={s.btnEditarText}>✏</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnDeletar} onPress={() => onDeletar(cliente.id)}>
            <Text style={s.btnDeletarText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#7C3AED' },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  detalhe: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  obs: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginTop: 4 },
  acoes: { flexDirection: 'column', gap: 6, alignItems: 'center', flexShrink: 0 },
  btnEditar: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#7C3AED',
    backgroundColor: '#fff',
  },
  btnEditarText: { fontSize: 13, color: '#7C3AED' },
  btnDeletar: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  btnDeletarText: { fontSize: 13, color: '#9CA3AF' },
});
