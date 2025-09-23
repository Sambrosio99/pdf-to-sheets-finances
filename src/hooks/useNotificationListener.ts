import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
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
        console.log('Notification listener setup - Ready for implementation');
        
        // Note: Para captura real de notificações, seria necessário:
        // 1. Plugin nativo customizado para interceptar notificações
        // 2. Permissões especiais no Android (Notification Listener Service)
        // 3. Implementação de um serviço que roda em background
        
        // Por enquanto, implementamos o parser e testador
        
      } catch (error) {
        console.error('Error setting up notification listener:', error);
      }
    };

    setupNotificationListener();
  }, []);

  // Manual function to test notification parsing
  const testNotificationParsing = (mockNotification: NotificationData) => {
    const parsed = parseNotification(mockNotification);
    
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
      toast.success(`Transação automática adicionada: ${parsed.description} - R$ ${parsed.amount.toFixed(2)}`);
    } else {
      toast.error('Não foi possível extrair dados da notificação');
    }
  };

  return {
    testNotificationParsing
  };
}