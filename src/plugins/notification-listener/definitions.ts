export interface NotificationListenerPlugin {
  /**
   * Check if the notification access permission is granted
   */
  checkPermission(): Promise<{ granted: boolean }>;
  
  /**
   * Request notification access permission
   */
  requestPermission(): Promise<{ granted: boolean }>;
  
  /**
   * Start listening to notifications
   */
  startListening(): Promise<void>;
  
  /**
   * Stop listening to notifications
   */
  stopListening(): Promise<void>;
  
  /**
   * Add a listener for notification events
   */
  addListener(
    eventName: 'notificationReceived',
    listenerFunc: (notification: {
      title: string;
      body: string;
      packageName: string;
      timestamp: number;
    }) => void,
  ): Promise<any>;
  
  /**
   * Remove all listeners
   */
  removeAllListeners(): Promise<void>;
}