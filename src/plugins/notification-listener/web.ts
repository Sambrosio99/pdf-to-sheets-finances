import { WebPlugin } from '@capacitor/core';
import type { NotificationListenerPlugin } from './definitions';

export class NotificationListenerWeb extends WebPlugin implements NotificationListenerPlugin {
  async checkPermission(): Promise<{ granted: boolean }> {
    console.log('NotificationListener Web: checkPermission not supported on web');
    return { granted: false };
  }

  async requestPermission(): Promise<{ granted: boolean }> {
    console.log('NotificationListener Web: requestPermission not supported on web');
    return { granted: false };
  }

  async startListening(): Promise<void> {
    console.log('NotificationListener Web: startListening not supported on web');
  }

  async stopListening(): Promise<void> {
    console.log('NotificationListener Web: stopListening not supported on web');
  }

  async addListener(eventName: string, listenerFunc: any): Promise<any> {
    console.log('NotificationListener Web: addListener not supported on web');
    return Promise.resolve();
  }

  async removeAllListeners(): Promise<void> {
    console.log('NotificationListener Web: removeAllListeners not supported on web');
  }
}