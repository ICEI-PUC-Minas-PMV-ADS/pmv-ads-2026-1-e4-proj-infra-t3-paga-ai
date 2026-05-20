import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import { Card } from '@components/common/Card';

export type Notificacao = {
    id: string;
    titulo: string;
    mensagem: string;
    dataHora: string; // ISO string
    lida: boolean;
    tipo?: 'info' | 'alerta' | 'sucesso' | 'erro';
};

type Props = {
    notificacao: Notificacao;
    onMarcarLida: (id: string) => void;
};

const TIPO_CONFIG = {
    info: { cor: '#3B82F6', icone: 'ℹ' },
    alerta: { cor: '#F59E0B', icone: '⚠' },
    sucesso: { cor: '#10B981', icone: '✓' },
    erro: { cor: '#EF4444', icone: '✕' },
} as const;

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

export default function NotificacaoItem({ notificacao, onMarcarLida }: Props) {
    const { id, titulo, mensagem, dataHora, lida, tipo = 'info' } = notificacao;
    const { cor, icone } = TIPO_CONFIG[tipo];
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();

    const handlePressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    const handlePress = () => {
        if (!lida) onMarcarLida(id);
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                accessibilityRole="button"
                accessibilityLabel={`Notificação: ${titulo}. ${lida ? 'Lida' : 'Não lida'}`}
            >
                <Card style={[styles.card, !lida && styles.cardNaoLida]}>
                    {/* Barra lateral colorida */}
                    <View style={[styles.barraLateral, { backgroundColor: cor }]} />

                    {/* Ícone do tipo */}
                    <View style={[styles.iconeBg, { backgroundColor: cor + '20' }]}>
                        <Text style={[styles.icone, { color: cor }]}>{icone}</Text>
                    </View>

                    {/* Conteúdo principal */}
                    <View style={styles.conteudo}>
                        <View style={styles.cabecalho}>
                            <Text
                                style={[styles.titulo, !lida && styles.tituloNaoLido]}
                                numberOfLines={1}
                            >
                                {titulo}
                            </Text>
                            <Text style={styles.tempo}>{formatarDataHora(dataHora)}</Text>
                        </View>
                        <Text style={styles.mensagem} numberOfLines={2}>
                            {mensagem}
                        </Text>
                    </View>

                    {/* Bolinha de não lida */}
                    {!lida && <View style={[styles.bolinha, { backgroundColor: cor }]} />}
                </Card>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginVertical: 5,
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
    icone: {
        fontSize: 16,
        fontWeight: '700',
    },
    conteudo: {
        flex: 1,
    },
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
    tituloNaoLido: {
        fontWeight: '700',
        color: '#111827',
    },
    mensagem: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    tempo: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    bolinha: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginLeft: 8,
    },
});
