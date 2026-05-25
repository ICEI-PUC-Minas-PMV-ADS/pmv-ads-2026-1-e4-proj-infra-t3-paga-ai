import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    PanResponder,
    Alert,
} from 'react-native';
import { Card } from '@components/common/Card';

export type Notificacao = {
    id: string;
    titulo: string;
    mensagem: string;
    dataHora: string;
    lida: boolean;
    tipo?: 'info' | 'alerta' | 'sucesso' | 'erro';
    emprestimoId?: number | null;
};

type Props = {
    notificacao: Notificacao;
    onMarcarLida: (id: string) => void;
    onDeletar: (id: string) => void;
    onPress?: (notificacao: Notificacao) => void;
};

const TIPO_CONFIG = {
    info: { cor: '#3B82F6', icone: 'ℹ' },
    alerta: { cor: '#F59E0B', icone: '⚠' },
    sucesso: { cor: '#10B981', icone: '✓' },
    erro: { cor: '#EF4444', icone: '✕' },
} as const;

const SWIPE_THRESHOLD = -80;

function formatarDataHora(iso: string): string {
    const data = new Date(iso);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Há ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Há ${diffD}d`;
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function NotificacaoItem({ notificacao, onMarcarLida, onDeletar, onPress }: Props) {
    const { id, titulo, mensagem, dataHora, lida, tipo = 'info', emprestimoId } = notificacao;
    const { cor, icone } = TIPO_CONFIG[tipo];

    const translateX = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,
            onPanResponderMove: (_, g) => {
                if (g.dx < 0) translateX.setValue(g.dx);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dx < SWIPE_THRESHOLD) {
                    // Confirma deletar
                    Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => {
                        Alert.alert(
                            'Deletar notificação',
                            'Tem certeza que deseja deletar esta notificação?',
                            [
                                {
                                    text: 'Cancelar',
                                    onPress: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start(),
                                },
                                {
                                    text: 'Deletar',
                                    style: 'destructive',
                                    onPress: () => onDeletar(id),
                                },
                            ]
                        );
                    });
                } else {
                    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                }
            },
        })
    ).current;

    const handlePressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();

    const handlePressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    const handlePress = () => {
        if (!lida) onMarcarLida(id);
        if (onPress) onPress(notificacao);
    };

    return (
        <View style={styles.wrapper}>
            {/* Fundo vermelho de deletar */}
            <View style={styles.deleteBackground}>
                <Text style={styles.deleteIcon}>🗑</Text>
            </View>

            <Animated.View style={{ transform: [{ translateX }, { scale: scaleAnim }] }} {...panResponder.panHandlers}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                    accessibilityRole="button"
                    accessibilityLabel={`Notificação: ${titulo}. ${lida ? 'Lida' : 'Não lida'}`}
                >
                    <Card style={[styles.card, !lida && styles.cardNaoLida]}>
                        <View style={[styles.barraLateral, { backgroundColor: cor }]} />

                        <View style={[styles.iconeBg, { backgroundColor: cor + '20' }]}>
                            <Text style={[styles.icone, { color: cor }]}>{icone}</Text>
                        </View>

                        <View style={styles.conteudo}>
                            <View style={styles.cabecalho}>
                                <Text style={[styles.titulo, !lida && styles.tituloNaoLido]} numberOfLines={1}>
                                    {titulo}
                                </Text>
                                <Text style={styles.tempo}>{formatarDataHora(dataHora)}</Text>
                            </View>
                            <Text style={styles.mensagem} numberOfLines={2}>{mensagem}</Text>
                            {emprestimoId && (
                                <Text style={[styles.linkEmprestimo, { color: cor }]}>
                                    Ver empréstimo →
                                </Text>
                            )}
                        </View>

                        {!lida && <View style={[styles.bolinha, { backgroundColor: cor }]} />}
                    </Card>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: 16,
        marginVertical: 5,
        borderRadius: 12,
        overflow: 'hidden',
    },
    deleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    deleteIcon: {
        fontSize: 22,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    cardNaoLida: {
        backgroundColor: '#F8FAFF',
        elevation: 3,
        shadowOpacity: 0.1,
    },
    barraLateral: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    iconeBg: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        marginRight: 10,
    },
    icone: { fontSize: 16, fontWeight: '700' },
    conteudo: { flex: 1 },
    cabecalho: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    titulo: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
        flex: 1,
        marginRight: 8,
    },
    tituloNaoLido: { fontWeight: '700', color: '#111827' },
    mensagem: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
    linkEmprestimo: { fontSize: 12, fontWeight: '600', marginTop: 4 },
    tempo: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
    bolinha: { width: 9, height: 9, borderRadius: 5, marginLeft: 8 },
});
