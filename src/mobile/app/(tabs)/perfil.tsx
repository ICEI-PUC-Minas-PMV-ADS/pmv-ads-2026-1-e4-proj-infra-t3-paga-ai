import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Alert, ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@hooks/useAuth';
import { obterPerfil, atualizarPerfil } from '@services/authService';

const FOTO_KEY = '@pagaai:foto_perfil';

function maskTelefone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10)
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function formatarCpf(cpf?: string) {
  if (!cpf) return '—';
  const d = cpf.replace(/\D/g, '');
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarTelefone(tel?: string) {
  if (!tel) return '—';
  const d = tel.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return tel;
}

export default function PerfilScreen() {
  const { user, logout, updateUser } = useAuth();
  const [foto, setFoto] = useState<string | null>(null);

  const [perfil, setPerfil] = useState<{
    nome: string; email: string;
    dataNascimento?: string; cpf?: string; telefone?: string;
  } | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [editando, setEditando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    async function carregar() {
      const fotoSalva = await AsyncStorage.getItem(FOTO_KEY);
      if (fotoSalva) setFoto(fotoSalva);
    }
    carregar();
  }, []);

  useEffect(() => {
    if (!user?.email) { setCarregando(false); return; }
    obterPerfil(user.email)
      .then(setPerfil)
      .catch(() => {
        if (user) {
          setPerfil({
            nome: user.nome,
            email: user.email,
            dataNascimento: user.dataNascimento,
            cpf: user.cpf,
            telefone: user.telefone,
          });
        }
      })
      .finally(() => setCarregando(false));
  }, [user?.email]);

  function abrirEdicao() {
    setNovoNome(perfil?.nome ?? user?.nome ?? '');
    setNovoTelefone(perfil?.telefone ? formatarTelefone(perfil.telefone) : '');
    setErro('');
    setSucesso('');
    setEditando(true);
  }

  async function salvar() {
    setErro('');
    if (!novoNome.trim()) { setErro('Nome é obrigatório.'); return; }
    if (novoTelefone && novoTelefone.replace(/\D/g, '').length < 10) {
      setErro('Telefone inválido. Informe DDD + número.');
      return;
    }
    try {
      setSalvando(true);
      await atualizarPerfil(user!.email, novoNome.trim(), novoTelefone || undefined);
      const novoTelDigitos = novoTelefone ? novoTelefone.replace(/\D/g, '') : perfil?.telefone;
      setPerfil(p => p ? { ...p, nome: novoNome.trim(), telefone: novoTelDigitos } : p);
      await updateUser({ ...user!, nome: novoNome.trim() });
      setSucesso('Perfil atualizado com sucesso!');
      setEditando(false);
    } catch (e: any) {
      setErro(e.message || 'Erro ao atualizar perfil.');
    } finally {
      setSalvando(false);
    }
  }

  async function escolherFoto() {
    Alert.alert('Foto de Perfil', 'Escolha uma opção', [
      { text: 'Câmera', onPress: abrirCamera },
      { text: 'Galeria', onPress: abrirGaleria },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function abrirCamera() {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) { Alert.alert('Permissão negada', 'Permita o acesso à câmera.'); return; }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!r.canceled) { setFoto(r.assets[0].uri); await AsyncStorage.setItem(FOTO_KEY, r.assets[0].uri); }
  }

  async function abrirGaleria() {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) { Alert.alert('Permissão negada', 'Permita o acesso à galeria.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!r.canceled) { setFoto(r.assets[0].uri); await AsyncStorage.setItem(FOTO_KEY, r.assets[0].uri); }
  }

  async function removerFoto() {
    Alert.alert('Remover foto', 'Deseja remover sua foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { setFoto(null); await AsyncStorage.removeItem(FOTO_KEY); } },
    ]);
  }

  const nomeExibido = perfil?.nome ?? user?.nome ?? '—';
  const inicial = nomeExibido.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.titulo}>Meu Perfil</Text>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          {foto
            ? <Image source={{ uri: foto }} style={s.avatar} />
            : <View style={s.avatarPlaceholder}><Text style={s.avatarInicial}>{inicial}</Text></View>}
          <TouchableOpacity style={s.btnFoto} onPress={escolherFoto}>
            <Text style={s.btnFotoText}>📷 Alterar foto</Text>
          </TouchableOpacity>
          {foto && <TouchableOpacity onPress={removerFoto}><Text style={s.btnRemover}>Remover foto</Text></TouchableOpacity>}
        </View>

        {/* Dados */}
        <View style={s.card}>
          {!editando ? (
            <>
              {carregando ? (
                <ActivityIndicator color="#7C3AED" style={{ marginVertical: 16 }} />
              ) : (
                <>
                  <Campo label="Nome"               valor={nomeExibido} />
                  <Campo label="E-mail"             valor={perfil?.email ?? user?.email ?? '—'} />
                  <Campo label="Data de Nascimento" valor={perfil?.dataNascimento ?? '—'} />
                  <Campo label="CPF"                valor={formatarCpf(perfil?.cpf)} />
                  <Campo label="Telefone"           valor={formatarTelefone(perfil?.telefone)} />
                </>
              )}

              {sucesso ? <Text style={s.msgSucesso}>{sucesso}</Text> : null}

              <TouchableOpacity style={s.btnEditar} onPress={abrirEdicao}>
                <Text style={s.btnEditarText}>✏️  Editar dados</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.editLabel}>Nome</Text>
              <TextInput
                style={s.editInput}
                value={novoNome}
                onChangeText={setNovoNome}
                placeholder="Seu nome completo"
                placeholderTextColor="#9CA3AF"
                editable={!salvando}
              />

              <Text style={[s.editLabel, { marginTop: 16 }]}>Número de Telefone</Text>
              <TextInput
                style={s.editInput}
                value={novoTelefone}
                onChangeText={v => setNovoTelefone(maskTelefone(v))}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={15}
                editable={!salvando}
              />

              {erro ? <Text style={s.msgErro}>{erro}</Text> : null}

              <View style={s.botoesRow}>
                <TouchableOpacity style={s.btnCancelar} onPress={() => setEditando(false)} disabled={salvando}>
                  <Text style={s.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnSalvar, salvando && s.btnDisabled]} onPress={salvar} disabled={salvando}>
                  {salvando
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.btnSalvarText}>Salvar</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity style={s.btnSair} onPress={logout}>
          <Text style={s.btnSairText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={s.campo}>
      <Text style={s.campoLabel}>{label}</Text>
      <Text style={s.campoValor}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#F5F3FF' },
  content:           { padding: 24, paddingBottom: 60 },
  titulo:            { fontSize: 26, fontWeight: '700', color: '#1F2937', marginBottom: 24 },
  avatarWrap:        { alignItems: 'center', marginBottom: 24 },
  avatar:            { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarInicial:     { fontSize: 40, fontWeight: '700', color: '#7C3AED' },
  btnFoto:           { backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 8 },
  btnFotoText:       { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnRemover:        { color: '#DC2626', fontSize: 13, marginTop: 4 },
  card:              { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  campo:             { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  campoLabel:        { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  campoValor:        { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  btnEditar:         { marginTop: 16, borderWidth: 1, borderColor: '#7C3AED', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnEditarText:     { color: '#7C3AED', fontWeight: '600', fontSize: 14 },
  editLabel:         { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  editInput:         { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: '#1F2937', backgroundColor: '#F8FAFC' },
  msgErro:           { marginTop: 12, color: '#991B1B', backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10, fontSize: 13 },
  msgSucesso:        { marginTop: 12, color: '#166534', backgroundColor: '#DCFCE7', borderRadius: 8, padding: 10, fontSize: 13 },
  botoesRow:         { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnCancelar:       { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnCancelarText:   { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  btnSalvar:         { flex: 1, backgroundColor: '#7C3AED', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnDisabled:       { opacity: 0.6 },
  btnSalvarText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSair:           { backgroundColor: '#FEE2E2', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnSairText:       { color: '#DC2626', fontWeight: '700', fontSize: 15 },
});
