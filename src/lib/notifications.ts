export function notificationsSupported(): boolean {
  return typeof Notification !== 'undefined'
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** Mostra notificação pelo service worker (necessário no Android) com fallback para a API direta. */
export async function showNotification(
  title: string,
  options: NotificationOptions = {},
): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  const opts: NotificationOptions = { icon: '/pwa-192.png', badge: '/pwa-192.png', ...options }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, opts)
      return
    }
  } catch {
    // cai para a API direta
  }
  try {
    new Notification(title, opts)
  } catch {
    // Alguns navegadores móveis só permitem via service worker.
  }
}
