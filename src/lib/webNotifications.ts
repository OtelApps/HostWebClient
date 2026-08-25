const DISMISS_KEY = 'otelapps_web_notifications_banner_dismissed';

let audioCtx: AudioContext | null = null;

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

export function wasNotificationBannerDismissed(): boolean {
  return localStorage.getItem(DISMISS_KEY) === '1';
}

export function dismissNotificationBanner(): void {
  localStorage.setItem(DISMISS_KEY, '1');
}

export function unlockNotificationAudio(): void {
  getAudioContext();
}

function getAudioContext(): AudioContext | null {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const beep = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.2, now + start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    };
    beep(880, 0, 0.11);
    beep(1175, 0.13, 0.18);
  } catch {
    // Autoplay / insecure context
  }
}

export async function registerNotificationWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  getAudioContext();
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

export type GuestNotification = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function showGuestNotification(input: GuestNotification): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;

  playNotificationSound();

  const options = {
    body: input.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: input.tag ?? 'otelapps',
    silent: false,
    renotify: true,
    data: { url: input.url || '/' },
  } as NotificationOptions;

  try {
    const registration = await navigator.serviceWorker?.ready.catch(() => null);
    if (registration?.showNotification) {
      await registration.showNotification(input.title, options);
      return;
    }
  } catch {
    // fall through
  }

  try {
    const n = new Notification(input.title, options);
    n.onclick = () => {
      window.focus();
      if (input.url) window.location.assign(input.url);
      n.close();
    };
  } catch {
    // Safari / insecure context
  }
}
