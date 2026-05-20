// Tela de Notificações — exibe lista mockada para validar os componentes visuais.
// Quando a API estiver pronta, substitua `mockNotificacoes` por uma chamada real.
import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import NotificacaoItem, { Notificacao } from '@components/notificacoes/NotificacaoItem';
import BadgeContador from '@components/notificacoes/BadgeContador';

const mockNotificacoes: Notificacao[] = [
    {
        id: '1',
        titulo: 'Pagamento recebido',
        mensagem: 'O cliente João Silva realizou o pagamento da parcela #3 no valor de R$ 450,00.',
        dataHora: new Date(Date.now() - 2 * 60000).toISOString(), // 2 min atrás
        lida: false,
        tipo: 'sucesso',
    },
    {
        id: '2',
        titulo: 'Parcela em atraso',
        mensagem: 'O empréstimo #1042 do cliente Maria Souza está com 3 dias de atraso.',
        dataHora: new Date(Date.now() - 60 * 60000).toISOString(), // 1h atrás
        lida: false,
        tipo: 'alerta',
    },
    {
        id: '3',
        titulo: 'Novo empréstimo aprovado',
        mensagem: 'O empréstimo de R$ 2.000,00 para Carlos Oliveira foi aprovado com sucesso.',
        dataHora: new Date(Date.now() - 3 * 60 * 60000).toISOString(), // 3h atrás
        lida: false,
        tipo: 'info',
    },
    {
        id: '4',
        titulo: 'Falha no processamento',
        mensagem: 'Não foi possível processar o pagamento automático do contrato #998.',
        dataHora: new Date(Date.now() - 24 * 60 * 60000).toISOString(), // 1 dia atrás
        lida: true,
        tipo: 'erro',
    },
    {
        id: '5',
        titulo: 'Lembrete de vencimento',
        mensagem: 'A parcela do cliente Ana Lima vence amanhã. Valor: R$ 320,00.',
        dataHora: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(), // 2 dias atrás
        lida: true,
        tipo: 'alerta',
    },
];

export default function NotificacoesScreen() {
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>(mockNotificacoes);

    const naoLidas = notificacoes.filter((n) => !n.lida).length;

    function handleMarcarLida(id: string) {
        setNotificacoes((prev) =>
            prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
    }

    function handleMarcarTodasLidas() {
        setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Cabeçalho */}
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

            {/* Lista */}
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
                ListEmptyComponent={
                    <Text style={styles.vazia}>Nenhuma notificação por aqui.</Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitulo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    titulo: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    badgeWrapper: {
        position: 'relative',
        width: 28,
        height: 24,
        marginLeft: 8,
    },
    marcarTodas: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '500',
        marginTop: 4,
    },
    lista: {
        paddingVertical: 10,
    },
    vazia: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 60,
        fontSize: 15,
    },
});
