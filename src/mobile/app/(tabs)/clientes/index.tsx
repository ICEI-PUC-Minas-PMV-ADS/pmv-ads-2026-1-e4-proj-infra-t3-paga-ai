import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useClientes } from '@hooks/useClientes';
import { ClienteCard, ClienteForm } from '@components/clientes';
import type { Cliente, ClientePayload } from '../../../types/cliente';

export default function ClientesScreen() {
  const { clientes, loading, erro, carregar, criar, atualizar, deletar } = useClientes();
  const [busca, setBusca] = useState('');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);

  useEffect(() => { carregar(); }, [carregar]);

  const listagem = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.cpf.includes(q) ||
        c.telefone.includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [clientes, busca]);

  function abrirCriar() {
    setEditando(null);
    setModalVisivel(true);
  }

  function abrirEditar(cliente: Cliente) {
    setEditando(cliente);
    setModalVisivel(true);
  }

  function fecharModal() {
    setModalVisivel(false);
    setEditando(null);
  }

  async function handleSalvar(payload: ClientePayload) {
    if (editando) {
      await atualizar(editando.id, payload);
    } else {
      await criar(payload);
    }
  }

  function confirmarDeletar(id: number) {
    const nome = clientes.find((c) => c.id === id)?.nome ?? 'este cliente';
    Alert.alert('Remover cliente', `Deseja remover ${nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => deletar(id),
      },
    ]);
  }

  return (
    <View style={s.page}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.titulo}>Clientes</Text>
          <Text style={s.subtitulo}>
            {clientes.length} cadastrado{clientes.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={s.btnNovo} onPress={abrirCriar}>
          <Text style={s.btnNovoText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={s.buscaWrap}>
        <TextInput
          style={s.buscaInput}
          placeholder="Buscar por nome, CPF, telefone..."
          placeholderTextColor="#9CA3AF"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* Erro */}
      {erro && (
        <View style={s.erroWrap}>
          <Text style={s.erroText}>{erro}</Text>
          <TouchableOpacity onPress={carregar}>
            <Text style={s.erroLink}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista */}
      {loading && clientes.length === 0 ? (
        <ActivityIndicator color="#7C3AED" style={s.spinner} />
      ) : (
        <FlatList
          data={listagem}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={s.lista}
          renderItem={({ item }) => (
            <ClienteCard
              cliente={item}
              onEditar={abrirEditar}
              onDeletar={confirmarDeletar}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={s.vazio}>
                <Text style={s.vazioIcon}>👥</Text>
                <Text style={s.vazioText}>
                  {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
                </Text>
              </View>
            ) : null
          }
          refreshing={loading}
          onRefresh={carregar}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ClienteForm
        visivel={modalVisivel}
        clienteParaEditar={editando}
        onSalvar={handleSalvar}
        onFechar={fecharModal}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F3FF', paddingTop: 52 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  titulo:    { fontSize: 26, fontWeight: '700', color: '#1F2937' },
  subtitulo: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  btnNovo: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnNovoText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  buscaWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  buscaInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  erroWrap: {
    marginHorizontal: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  erroText: { color: '#DC2626', fontSize: 13, marginBottom: 6 },
  erroLink: { color: '#7C3AED', fontWeight: '600', fontSize: 13 },
  lista:   { paddingHorizontal: 20, paddingBottom: 32 },
  spinner: { marginTop: 40 },
  vazio:   { alignItems: 'center', paddingTop: 60 },
  vazioIcon: { fontSize: 48, marginBottom: 12 },
  vazioText: { fontSize: 14, color: '#9CA3AF' },
});
