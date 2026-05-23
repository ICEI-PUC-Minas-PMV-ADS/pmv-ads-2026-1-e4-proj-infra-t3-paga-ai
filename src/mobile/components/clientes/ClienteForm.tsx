import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Input } from '@components/common';
import type { Cliente, ClientePayload } from '@types/cliente';

interface ClienteFormProps {
  visivel: boolean;
  clienteParaEditar?: Cliente | null;
  onSalvar: (payload: ClientePayload) => Promise<void>;
  onFechar: () => void;
}

const VAZIO: ClientePayload = {
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  endereco: '',
  observacoes: '',
};

export function ClienteForm({ visivel, clienteParaEditar, onSalvar, onFechar }: ClienteFormProps) {
  const [form, setForm] = useState<ClientePayload>(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Partial<Record<keyof ClientePayload, string>>>({});

  useEffect(() => {
    if (clienteParaEditar) {
      setForm({
        nome: clienteParaEditar.nome,
        email: clienteParaEditar.email,
        telefone: clienteParaEditar.telefone,
        cpf: clienteParaEditar.cpf,
        endereco: clienteParaEditar.endereco ?? '',
        observacoes: clienteParaEditar.observacoes ?? '',
      });
    } else {
      setForm(VAZIO);
    }
    setErros({});
  }, [clienteParaEditar, visivel]);

  function set(field: keyof ClientePayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErros((prev) => ({ ...prev, [field]: undefined }));
  }

  function validar(): Partial<Record<keyof ClientePayload, string>> {
    const e: Partial<Record<keyof ClientePayload, string>> = {};
    if (!form.nome.trim())     e.nome     = 'Nome é obrigatório';
    if (!form.cpf.trim())      e.cpf      = 'CPF é obrigatório';
    if (!form.telefone.trim()) e.telefone = 'Telefone é obrigatório';
    if (!form.email.trim())    e.email    = 'E-mail é obrigatório';
    return e;
  }

  async function handleSalvar() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErros(e); return; }
    setSalvando(true);
    try {
      await onSalvar(form);
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={s.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.kvWrap}
        >
          <View style={s.sheet}>
            <View style={s.header}>
              <Text style={s.titulo}>{clienteParaEditar ? 'Editar Cliente' : 'Novo Cliente'}</Text>
              <TouchableOpacity onPress={onFechar} style={s.btnFechar}>
                <Text style={s.btnFecharText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Input
                label="Nome *"
                value={form.nome}
                onChangeText={(v) => set('nome', v)}
                error={erros.nome}
                placeholder="Nome completo"
              />
              <Input
                label="CPF *"
                value={form.cpf}
                onChangeText={(v) => set('cpf', v)}
                error={erros.cpf}
                placeholder="000.000.000-00"
              />
              <Input
                label="Telefone *"
                value={form.telefone}
                onChangeText={(v) => set('telefone', v)}
                error={erros.telefone}
                placeholder="(00) 00000-0000"
              />
              <Input
                label="E-mail *"
                value={form.email}
                onChangeText={(v) => set('email', v)}
                error={erros.email}
                placeholder="email@exemplo.com"
              />
              <Input
                label="Endereço"
                value={form.endereco ?? ''}
                onChangeText={(v) => set('endereco', v)}
                placeholder="Rua, número, bairro"
              />
              <Input
                label="Observações"
                value={form.observacoes ?? ''}
                onChangeText={(v) => set('observacoes', v)}
                placeholder="Informações adicionais"
              />
            </ScrollView>

            <View style={s.footer}>
              <TouchableOpacity style={s.btnCancelar} onPress={onFechar}>
                <Text style={s.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnSalvar} onPress={handleSalvar} disabled={salvando}>
                {salvando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnSalvarText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  kvWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  btnFechar: { padding: 4 },
  btnFecharText: { fontSize: 18, color: '#9CA3AF' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  btnCancelar: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelarText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  btnSalvar: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSalvarText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
