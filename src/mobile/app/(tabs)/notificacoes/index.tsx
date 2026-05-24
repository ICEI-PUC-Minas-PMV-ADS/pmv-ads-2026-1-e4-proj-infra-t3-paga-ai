import React, { useState, useEffect, useCallback } from 'react';
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
import NotificacaoItem, { Notificacao } from '@components/notificacoes/NotificacaoItem';
import BadgeContador from '@components/notificacoes/BadgeContador';
import { useAuth } from '@hooks/useAuth';
import {
    getNotificacoesPorCobrador,
    marcarComoLida,
    marcarTodasLidas,
    NotificacaoAPI,
} from '@services/notificacoesService';

function mapTipo(tipo: string): Notificacao['tipo'] {
    const t = tipo.toLowerCase();
    if (t.includes('atraso') || t.includes('vencimento')) return 'alerta';
    if (t.includes('pag')) return 'sucesso';
    if (t.includes('erro') || t.includes('falha')) return 'erro';
    return 'info';
}

function apiParaNotificacao(n: NotificacaoAPI): Notificacao {
    return {
        id: String(n.id),
        titulo: n.tipo,
        mensagem: n.mensagem ?? `Parcela ${n.numeroParcela}/${n.totalParcelas} — R$ ${n.valor.toFixed(2)}`,
        dataHora: n.dataCriacao,
        lida: n.lida,
        tipo: mapTipo(n.tipo),
    };
}

export default function NotificacoesScreen() {
    const { user } = useAuth();
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [erro, setErro] = useState('');

    const naoLidas = notificacoes.filter((n) => !n.lida).length;

    const carregar = useCallback(async () => {
        if (!user?.nome) return;
        try {
            setErro('');
            const dados = await getNotificacoesPorCobrador(user.nome);
            setNotificacoes(dados.map(apiParaNotificacao));
        } catch (e) {
            setErro('Não foi possível carregar as notificações.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.nome]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const handleMarcarLida = async (id: string) => {
        setNotificacoes((prev) =>
            prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
        try {
            await marcarComoLida(Number(id));
        } catch {
            setNotificacoes((prev) =>
                prev.map((n) => (n.id === id ? { ...n, lida: false } : n))
            );
        }
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

    const onRefresh = () => {
        setRefreshing(true);
        carregar();
    };

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
                    <TouchableOpacity onPress={carregar}>
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

