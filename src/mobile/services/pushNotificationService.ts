import * as Notifications from 'expo-notifications';

// Configura como as notificações aparecem
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Pede permissão para notificações locais
export async function pedirPermissao(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

// Dispara uma notificação local imediatamente
export async function dispararNotificacaoLocal(
    titulo: string,
    corpo: string
): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: titulo,
            body: corpo,
            sound: true,
        },
        trigger: null, // dispara imediatamente
    });
}

// Configura listeners para quando o usuário clica na notificação
export function configurarListeners(
    onNotificacaoRecebida: (n: Notifications.Notification) => void,
    onNotificacaoClicada: (r: Notifications.NotificationResponse) => void
) {
    const sub1 = Notifications.addNotificationReceivedListener(onNotificacaoRecebida);
    const sub2 = Notifications.addNotificationResponseReceivedListener(onNotificacaoClicada);
    return () => {
        sub1.remove();
        sub2.remove();
    };
}

// Registrar token (não disponível no Expo Go SDK 55)
export async function registrarPushToken(): Promise<string | null> {
    console.log('[Push] Push remoto não disponível no Expo Go. Use um Development Build.');
    return null;
}
