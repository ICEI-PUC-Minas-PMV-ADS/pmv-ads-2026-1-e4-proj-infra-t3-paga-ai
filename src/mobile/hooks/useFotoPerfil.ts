import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FOTO_KEY = '@pagaai:foto_perfil';

export function useFotoPerfil() {
  const [foto, setFoto] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const fotoSalva = await AsyncStorage.getItem(FOTO_KEY);
    setFoto(fotoSalva);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { foto, recarregar: carregar };
}