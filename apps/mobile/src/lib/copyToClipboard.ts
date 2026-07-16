import { Platform, Share } from 'react-native';

/** Cross-platform copy without relying on Metro resolving expo-clipboard in all environments. */
export async function copyToClipboard(text: string): Promise<void> {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    if (!ok) throw new Error('Clipboard unavailable');
    return;
  }

  // Native fallback when Clipboard API is unavailable (keeps invite flow working).
  await Share.share({ message: text });
}
