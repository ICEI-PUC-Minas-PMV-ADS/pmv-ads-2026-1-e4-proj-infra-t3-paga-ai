import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@hooks/useAuth';

const FOTO_KEY = '@pagaai:foto_perfil';

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    async function carregarFoto() {
      const fotoSalva = await AsyncStorage.getItem(FOTO_KEY);
      if (fotoSalva) setFoto(fotoSalva);
    }
    carregarFoto();
  }, []);

  async function escolherFoto() {
    Alert.alert('Foto de Perfil', 'Escolha uma opção', [
      { text: 'Câmera', onPress: abrirCamera },
      { text: 'Galeria', onPress: abrirGaleria },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function abrirCamera() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!resultado.canceled) {
      const uri = resultado.assets[0].uri;
      setFoto(uri);
      await AsyncStorage.setItem(FOTO_KEY, uri);
    }
  }

  async function abrirGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!resultado.canceled) {
      const uri = resultado.assets[0].uri;
      setFoto(uri);
      await AsyncStorage.setItem(FOTO_KEY, uri);
    }
  }

  async function removerFoto() {
    Alert.alert('Remover foto', 'Deseja remover sua foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          setFoto(null);
          await AsyncStorage.removeItem(FOTO_KEY);
        }
      },
    ]);
  }

  const inicial = user?.nome?.charAt(0).toUpperCase() ?? '?';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.titulo}>Meu Perfil</Text>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          {foto ? (
            <Image source={{ uri: foto }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarInicial}>{inicial}</Text>
            </View>
          )}
          <TouchableOpacity style={s.btnFoto} onPress={escolherFoto}>
            <Text style={s.btnFotoText}>📷 Alterar foto</Text>
          </TouchableOpacity>
          {foto && (
            <TouchableOpacity onPress={removerFoto}>
              <Text style={s.btnRemover}>Remover foto</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dados */}
        <View style={s.card}>
          <Campo label="Nome" valor={user?.nome ?? '—'} />
          <Campo label="E-mail" valor={user?.email ?? '—'} />
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
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EDE9FE',
                       alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarInicial:     { fontSize: 40, fontWeight: '700', color: '#7C3AED' },
  btnFoto:           { backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 8,
                       borderRadius: 8, marginBottom: 8 },
  btnFotoText:       { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnRemover:        { color: '#DC2626', fontSize: 13, marginTop: 4 },
  card:              { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24,
                       shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  campo:             { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  campoLabel:        { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  campoValor:        { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  btnSair:           { backgroundColor: '#FEE2E2', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnSairText:       { color: '#DC2626', fontWeight: '700', fontSize: 15 },
});