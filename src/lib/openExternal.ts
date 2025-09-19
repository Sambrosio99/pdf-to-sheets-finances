import { Browser } from '@capacitor/browser';

export async function openExternal(url: string) {
  // Ensure the URL has a protocol
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  await Browser.open({ url });
}
