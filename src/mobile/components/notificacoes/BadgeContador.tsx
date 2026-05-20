import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
} from 'react-native';

type Props = {
    contagem: number;
    /** Cor de fundo do badge. Padrão: vermelho (#EF4444) */
    cor?: string;
    /** Cor do texto. Padrão: branco */
    corTexto?: string;
    /** Tamanho da fonte. Padrão: 10 */
    tamanhoFonte?: number;
    /** Exibe o badge mesmo com contagem 0. Padrão: false */
    mostrarZero?: boolean;
};

const MAX_EXIBIDO = 99;

export default function BadgeContador({
    contagem,
    cor = '#EF4444',
    corTexto = '#FFFFFF',
    tamanhoFonte = 10,
    mostrarZero = false,
}: Props) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const prevContagem = useRef<number>(contagem);

    const visivel = mostrarZero ? contagem >= 0 : contagem > 0;
    const label = contagem > MAX_EXIBIDO ? `${MAX_EXIBIDO}+` : String(contagem);

    // Animação de entrada e bump ao mudar contagem
    useEffect(() => {
        if (!visivel) {
            Animated.spring(scaleAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
            return;
        }

        if (prevContagem.current !== contagem) {
            // Bump de feedback ao mudar o número
            Animated.sequence([
                Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
            ]).start();
        } else {
            // Entrada inicial
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        }

        prevContagem.current = contagem;
    }, [contagem, visivel]);

    if (!visivel) return null;

    // Badge largo (99+ → pill) vs redondo (≤9 → círculo)
    const ehLargo = contagem > 9;

    return (
        <Animated.View
            style={[
                styles.badge,
                ehLargo ? styles.pill : styles.circulo,
                { backgroundColor: cor, transform: [{ scale: scaleAnim }] },
            ]}
            accessibilityLabel={`${contagem} notificações não lidas`}
        >
            <Text style={[styles.texto, { color: corTexto, fontSize: tamanhoFonte }]}>
                {label}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: -5,
        right: -6,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        // Sombra sutil para destacar sobre qualquer fundo de aba
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 4,
        zIndex: 10,
    },
    circulo: {
        borderRadius: 9,
        width: 18,
    },
    pill: {
        borderRadius: 9,
        paddingHorizontal: 5,
    },
    texto: {
        fontWeight: '700',
        lineHeight: 13,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});
