import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

export async function pedirPermissao(): Promise<boolean> {
  if (isExpoGo) return false;
  const Notifications = await import('expo-notifications');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function dispararNotificacaoLocal(titulo: string, corpo: string): Promise<void> {
  if (isExpoGo) {
    console.log(`[Notificação] ${titulo}: ${corpo}`);
    return;
  }
  const Notifications = await import('expo-notifications');
  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: corpo, sound: true },
    trigger: null,
  });
}

export function configurarListeners(
  onNotificacaoRecebida: (n: any) => void,
  onNotificacaoClicada: (r: any) => void
) {
  if (isExpoGo) return () => {};
  let sub1: any, sub2: any;
  import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    sub1 = Notifications.addNotificationReceivedListener(onNotificacaoRecebida);
    sub2 = Notifications.addNotificationResponseReceivedListener(onNotificacaoClicada);
  });
  return () => { sub1?.remove(); sub2?.remove(); };
}

export async function registrarPushToken(): Promise<string | null> {
  return null;
}