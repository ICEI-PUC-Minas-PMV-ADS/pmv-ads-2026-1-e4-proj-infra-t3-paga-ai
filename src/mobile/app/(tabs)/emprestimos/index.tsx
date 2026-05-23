import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, Modal, TouchableOpacity, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL, EMPRESTIMOS } from '@constants/endpoints';
import { useAuth } from '@hooks/useAuth';
import { Emprestimo } from 'emprestimo';
import { EmprestimoListItem } from '@components/emprestimos/EmprestimoListItem';
import { EmprestimoCard } from '@components/emprestimos/EmprestimoCard';

const TOKEN_KEY = '@pagaai:token';

async function req(method: 'get' | 'patch' | 'delete', path: string) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return axios({ method, url: `${BASE_URL}${path}`, headers: { Authorization: `Bearer ${token}` } });
}

export default function EmprestimosScreen() {
  const { user } = useAuth();
  const cobrador = user?.nome ?? '';

  const [lista, setLista]             = useState<Emprestimo[]>([]);
  const [carregando, setCarregando]   = useState(true);
  const [selecionado, setSelecionado] = useState<Emprestimo | null>(null);

  const carregar = useCallback(async () => {
    if (!cobrador) return;
    setCarregando(true);
    try {
      const res = await req('get', `${EMPRESTIMOS}/carteira/${encodeURIComponent(cobrador)}`);
      setLista(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('[Emprestimos] erro:', e);
    } finally {
      setCarregando(false);
    }
  }, [cobrador]);

  useEffect(() => { carregar(); }, [carregar]);

  async function marcarPago(id: number) {
    Alert.alert('Confirmar', 'Marcar como recebido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar', onPress: async () => {
          try {
            await req('patch', `${EMPRESTIMOS}/${id}/pagar/${encodeURIComponent(cobrador)}`);
            setSelecionado(null);
            carregar();
          } catch { Alert.alert('Erro', 'Não foi possível marcar como pago.'); }
        },
      },
    ]);
  }

  async function deletar(id: number) {
    Alert.alert('Excluir', 'Deseja excluir este empréstimo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await req('delete', `${EMPRESTIMOS}/${id}/${encodeURIComponent(cobrador)}`);
            setSelecionado(null);
            carregar();
          } catch { Alert.alert('Erro', 'Não foi possível excluir.'); }
        },
      },
    ]);
  }

  if (carregando) {
    return <View style={s.center}><ActivityIndicator size="large" color="#7C3AED" /></View>;
  }

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={s.titulo}>Empréstimos</Text>
        <Text style={s.sub}>{lista.length} registro{lista.length !== 1 ? 's' : ''}</Text>
      </View>

      {lista.length === 0 ? (
        <View style={s.center}>
          <Text style={s.vazio}>Nenhum empréstimo encontrado.</Text>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(e) => String(e.id)}
          renderItem={({ item }) => (
            <EmprestimoListItem
              emprestimo={item}
              onPress={(id) => setSelecionado(lista.find((e) => e.id === id) ?? null)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}

      <Modal visible={!!selecionado} animationType="slide" onRequestClose={() => setSelecionado(null)}>
        <View style={s.modalPage}>
          <TouchableOpacity style={s.fechar} onPress={() => setSelecionado(null)}>
            <Text style={s.fecharText}>← Voltar</Text>
          </TouchableOpacity>
          {selecionado && (
            <EmprestimoCard
              emprestimo={selecionado}
              onPagar={marcarPago}
              onDeletar={deletar}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  page:       { flex: 1, backgroundColor: '#F5F3FF' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:     { padding: 20, paddingBottom: 12 },
  titulo:     { fontSize: 28, fontWeight: '700', color: '#1F2937' },
  sub:        { fontSize: 13, color: '#6B7280', marginTop: 2 },
  vazio:      { fontSize: 15, color: '#9CA3AF' },
  modalPage:  { flex: 1, backgroundColor: '#F5F3FF', padding: 16 },
  fechar:     { paddingVertical: 12, marginBottom: 8 },
  fecharText: { fontSize: 15, color: '#7C3AED', fontWeight: '600' },
});
