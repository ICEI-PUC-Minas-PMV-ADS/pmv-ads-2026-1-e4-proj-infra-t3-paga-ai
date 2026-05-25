import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import NotificacaoItem, { Notificacao } from '@components/notificacoes/NotificacaoItem';
import BadgeContador from '@components/notificacoes/BadgeContador';
import { useAuth } from '@hooks/useAuth';
import {
    getNotificacoesPorCobrador,
    marcarComoLida,
    marcarTodasLidas,
    deletarNotificacao,
} from '@services/notificacoesService';
import {
    pedirPermissao,
    dispararNotificacaoLocal,
    configurarListeners,
} from '@services/pushNotificationService';

const POLLING_INTERVAL = 30000; // 30 segundos

function mapTipo(tipo: string): Notificacao['tipo'] {
    const t = tipo.toLowerCase();
    if (t.includes('atraso') || t.includes('vencimento')) return 'alerta';
    if (t.includes('pag')) return 'sucesso';
    if (t.includes('erro') || t.includes('falha')) return 'erro';
    return 'info';
}

function apiParaNotificacao(n: any): Notificacao {
    return {
        id: String(n.id),
        titulo: n.tipo,
        mensagem: n.mensagem ?? `Parcela ${n.numeroParcela}/${n.totalParcelas} — R$ ${n.valor.toFixed(2)}`,
        dataHora: n.dataCriacao,
        lida: n.lida,
        tipo: mapTipo(n.tipo),
        emprestimoId: n.emprestimoId,
    };
}

export default function NotificacoesScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [erro, setErro] = useState('');
    const idsConhecidos = useRef<Set<string>>(new Set());

    const naoLidas = notificacoes.filter((n) => !n.lida).length;

    const carregar = useCallback(async (silencioso = false) => {
        if (!user?.nome) return;
        try {
            setErro('');
            const dados = await getNotificacoesPorCobrador(user.nome);
            const novas = dados.map(apiParaNotificacao);

            // Detecta notificações novas e dispara notificação local
            if (idsConhecidos.current.size > 0) {
                for (const n of novas) {
                    if (!idsConhecidos.current.has(n.id) && !n.lida) {
                        await dispararNotificacaoLocal(n.titulo, n.mensagem);
                    }
                }
            }

            // Atualiza o conjunto de ids conhecidos
            idsConhecidos.current = new Set(novas.map((n) => n.id));
            setNotificacoes(novas);
        } catch {
            if (!silencioso) setErro('Não foi possível carregar as notificações.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.nome]);

    // Carregamento inicial e permissão
    useEffect(() => {
        pedirPermissao();
        carregar();
    }, [carregar]);

    // Polling a cada 30 segundos
    useEffect(() => {
        const intervalo = setInterval(() => carregar(true), POLLING_INTERVAL);
        return () => clearInterval(intervalo);
    }, [carregar]);

    // Listeners de notificação
    useEffect(() => {
        const remover = configurarListeners(
            (_n) => carregar(true),
            (_r) => router.push('/(tabs)/notificacoes')
        );
        return remover;
    }, [carregar]);

    const handleMarcarLida = async (id: string) => {
        setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
        try {
            await marcarComoLida(Number(id));
        } catch {
            setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: false } : n)));
        }
    };

    const handleDeletar = async (id: string) => {
        setNotificacoes((prev) => prev.filter((n) => n.id !== id));
        idsConhecidos.current.delete(id);
        try {
            await deletarNotificacao(Number(id));
        } catch {
            carregar();
        }
    };

    const handlePress = (notificacao: Notificacao) => {
        router.push('/(tabs)/emprestimos');
    };

    const handleMarcarTodasLidas = async () => {
        if (!user?.nome) return;
        setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
        try {
            await marcarTodasLidas(user.nome);
        } catch {
            carregar();
        }
    };

    const onRefresh = () => { setRefreshing(true); carregar(); };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitulo}>
                    <Text style={styles.titulo}>Notificações</Text>
                    <View style={styles.badgeWrapper}>
                        <BadgeContador contagem={naoLidas} />
                    </View>
                </View>
                {naoLidas > 0 && (
                    <TouchableOpacity onPress={handleMarcarTodasLidas}>
                        <Text style={styles.marcarTodas}>Marcar todas como lidas</Text>
                    </TouchableOpacity>
                )}
            </View>

            {erro ? (
                <View style={styles.erroContainer}>
                    <Text style={styles.erroTexto}>{erro}</Text>
                    <TouchableOpacity onPress={() => carregar()}>
                        <Text style={styles.tentarNovamente}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={notificacoes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NotificacaoItem
                            notificacao={item}
                            onMarcarLida={handleMarcarLida}
                            onDeletar={handleDeletar}
                            onPress={handlePress}
                        />
                    )}
                    contentContainerStyle={styles.lista}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                    }
                    ListEmptyComponent={
                        <Text style={styles.vazia}>Nenhuma notificação por aqui.</Text>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitulo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    titulo: { fontSize: 22, fontWeight: '700', color: '#111827' },
    badgeWrapper: { position: 'relative', width: 28, height: 24, marginLeft: 8 },
    marcarTodas: { fontSize: 13, color: '#3B82F6', fontWeight: '500', marginTop: 4 },
    lista: { paddingVertical: 10 },
    vazia: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 15 },
    erroContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    erroTexto: { color: '#EF4444', fontSize: 15, textAlign: 'center', marginBottom: 12 },
    tentarNovamente: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
});
