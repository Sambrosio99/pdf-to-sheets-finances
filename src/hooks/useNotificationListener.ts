import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NotificationListener } from '@/plugins/notification-listener';
import { parseNotification, NotificationData } from '@/lib/notificationParser';
import { useTransactions } from './useTransactions';
import { toast } from 'sonner';

export function useNotificationListener() {
  const { addTransaction } = useTransactions();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Notification listener: Not on native platform');
      return;
    }

    const setupNotificationListener = async () => {
      try {
        console.log('Setting up notification listener...');
        
        // Verificar permissão
        const { granted } = await NotificationListener.checkPermission();
        
        if (!granted) {
          console.log('Requesting notification permission...');
          const result = await NotificationListener.requestPermission();
          
          if (!result.granted) {
            console.log('Notification permission denied');
            toast.error('Permissão de acesso às notificações necessária para captura automática');
            return;
          }
        }
        
        console.log('Notification permission granted');
        
        // Configurar listener para notificações
        await NotificationListener.addListener('notificationReceived', (notification) => {
          console.log('Received notification:', notification);
          
          const notificationData: NotificationData = {
            title: notification.title,
            body: notification.body,
            packageName: notification.packageName,
            timestamp: notification.timestamp
          };
          
          processNotification(notificationData);
        });
        
        // Iniciar escuta
        await NotificationListener.startListening();
        console.log('Notification listener started successfully');
        toast.success('Captura automática de transações ativada');
        
      } catch (error) {
        console.error('Error setting up notification listener:', error);
        toast.error('Erro ao configurar captura automática');
      }
    };

    setupNotificationListener();
  }, []);

  // Process notification (used by both real and test notifications)
  const processNotification = (notificationData: NotificationData) => {
    const parsed = parseNotification(notificationData);
    
    if (parsed) {
      const transaction = {
        date: parsed.date,
        description: parsed.description,
        category: parsed.category,
        paymentMethod: parsed.paymentMethod,
        amount: parsed.amount,
        type: parsed.type,
        status: 'paid' as const
      };
      
      addTransaction(transaction);
      toast.success(`💰 Transação capturada: ${parsed.description} - R$ ${parsed.amount.toFixed(2)}`);
    } else {
      console.log('Could not parse notification:', notificationData);
    }
  };

  // Manual function to test notification parsing
  const testNotificationParsing = (mockNotification: NotificationData) => {
    processNotification(mockNotification);
  };

  return {
    testNotificationParsing
  };
}