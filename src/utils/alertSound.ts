/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer - Không phụ thuộc file mp3 ngoài
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API không được hỗ trợ:', e);
    return null;
  }
}

/**
 * Phát âm thanh thông báo chuẩn không gian thể thao / cờ vua
 * @param type 'imminent' (chuẩn bị) | 'urgent' (khẩn cấp < 5p) | 'start' (đến giờ)
 */
export function playNotificationChime(type: 'imminent' | 'urgent' | 'start' = 'imminent'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'start') {
      // 4 nốt vươn lên phấn chấn (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.45);
      });
    } else if (type === 'urgent') {
      // 3 nốt chuông cảnh báo rõ ràng (A5 -> D6 -> A5)
      const notes = [880.0, 1174.66, 880.0];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);

        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.25, now + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.4);
      });
    } else {
      // 2 nốt ding-dong êm ái nhắc nhở nhẹ nhàng (E5 -> G5)
      const notes = [659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.2);

        gain.gain.setValueAtTime(0, now + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.2 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.2 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.55);
      });
    }
  } catch (err) {
    console.warn('Lỗi khi phát âm thanh thông báo:', err);
  }
}

/**
 * Yêu cầu quyền gửi thông báo trình duyệt HTML5 (Desktop Notification)
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Lỗi khi xin quyền Notification:', err);
    return 'denied';
  }
}

/**
 * Gửi thông báo Desktop Notification khi ván đấu sắp diễn ra
 */
export function sendBrowserNotification(title: string, body: string, iconUrl?: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body,
      icon: iconUrl || '/favicon.ico',
      badge: iconUrl || '/favicon.ico',
      tag: 'tournament-match-alert',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Tự động đóng sau 8 giây
    setTimeout(() => {
      notification.close();
    }, 8000);
  } catch (err) {
    console.warn('Lỗi khi gửi Notification:', err);
  }
}
