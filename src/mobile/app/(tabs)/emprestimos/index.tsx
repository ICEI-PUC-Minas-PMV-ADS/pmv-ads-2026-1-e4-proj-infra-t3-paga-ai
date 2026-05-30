import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, Modal, TouchableOpacity, Alert,
} from 'react-native';
import api from '@services/api';
import { EMPRESTIMOS } from '@constants/endpoints';
import { useAuth } from '@hooks/useAuth';
import { Emprestimo } from 'emprestimo';
import { EmprestimoListItem } from '@components/emprestimos/EmprestimoListItem';
import { EmprestimoCard } from '@components/emprestimos/EmprestimoCard';
import { useLocalSearchParams } from 'expo-router';
import { TextInput } from 'react-native';


function req(method: 'get' | 'patch' | 'delete', path: string) {
  return api({ method, url: path });
}

export default function EmprestimosScreen() {
  const { user } = useAuth();
  const cobrador = user?.nome ?? '';
  const [criando, setCriando] = useState(false);
  const [cliente, setCliente] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [valor, setValor] = useState('');
  const [juros, setJuros] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [vencimento, setVencimento] = useState('');

  const [lista, setLista]             = useState<Emprestimo[]>([]);
  const [carregando, setCarregando]   = useState(true);
  const [selecionado, setSelecionado] = useState<Emprestimo | null>(null);

  const carregar = useCallback(async () => {
    if (!cobrador) return;
    setCarregando(true);
    try {
      const url = `${EMPRESTIMOS}/carteira`;
      const res = await req('get', url);
      setLista(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error('[Emprestimos] erro:', e?.response?.status, e?.message);
    } finally {
      setCarregando(false);
    }
  }, [cobrador]);

    useEffect(() => { carregar(); }, [carregar]);

    const { abrirId } = useLocalSearchParams<{ abrirId?: string }>();

    useEffect(() => {
        if (abrirId && lista.length > 0) {
            const emprestimo = lista.find((e) => String(e.id) === abrirId);
            if (emprestimo) setSelecionado(emprestimo);
        }
    }, [abrirId, lista]);
    async function criarEmprestimo() {
      try {
        await api.post(EMPRESTIMOS, {
          cliente,
          valor: Number(valor),
          taxaJuros: Number(juros),
          numeroParcelas: Number(parcelas),
          dataVencimento: vencimento ? new Date(vencimento).toISOString() : undefined,
        });
        setCriando(false);
        carregar(); // recarrega lista
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível criar o empréstimo.');
  }
}

  async function marcarPago(id: number) {
    Alert.alert('Confirmar', 'Marcar como recebido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar', onPress: async () => {
          try {
            await req('patch', `${EMPRESTIMOS}/${id}/pagar`);
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
            await req('delete', `${EMPRESTIMOS}/${id}`);
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
     <TouchableOpacity style={s.addButton} onPress={() => setCriando(true)}>
       <Text style={s.addButtonText}>+ Novo Empréstimo</Text>
     </TouchableOpacity>


  {/* Modal de detalhes */}
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

{/* Modal de criação */}
<Modal visible={criando} animationType="slide" onRequestClose={() => setCriando(false)}>
  <View style={s.modalPage}>
    <TouchableOpacity style={s.fechar} onPress={() => setCriando(false)}>
      <Text style={s.fecharText}>← Voltar</Text>
    </TouchableOpacity>

    <Text style={s.titulo}>Novo Empréstimo</Text>

    <TextInput placeholder="Cliente" style={s.input} value={cliente} onChangeText={setCliente} />
    <TextInput placeholder="Valor" style={s.input} value={valor} onChangeText={setValor} keyboardType="numeric" />
    <TextInput placeholder="Taxa de juros (%)" style={s.input} value={juros} onChangeText={setJuros} keyboardType="numeric" />
    <TextInput placeholder="Número de parcelas" style={s.input} value={parcelas} onChangeText={setParcelas} keyboardType="numeric" />
    <TextInput placeholder="Data de vencimento (YYYY-MM-DD)" style={s.input} value={vencimento} onChangeText={setVencimento} />

    <TouchableOpacity style={s.btnSalvar} onPress={criarEmprestimo}>
      <Text style={s.btnSalvarText}>Salvar</Text>
    </TouchableOpacity>
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
  input: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 6,
  padding: 10,
  marginVertical: 8,
  backgroundColor: '#fff',
},
btnSalvar: {
  backgroundColor: '#7C3AED',
  padding: 14,
  borderRadius: 8,
  alignItems: 'center',
  marginTop: 16,
},
btnSalvarText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 16,
},
addButton: {
  position: 'absolute',
  bottom: 20,
  right: 20,
  backgroundColor: '#7C3AED',
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 50,
  elevation: 5,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
},
addButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 16,
},
});
