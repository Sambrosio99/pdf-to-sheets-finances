import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationListener } from '@/hooks/useNotificationListener';
import { NotificationData } from '@/lib/notificationParser';

const MOCK_NOTIFICATIONS = {
  nubank: [
    {
      title: 'Nubank',
      body: 'Compra aprovada no débito R$ 15,90 em PADARIA DA ESQUINA',
      packageName: 'com.nu.production',
      timestamp: Date.now()
    },
    {
      title: 'Nubank',
      body: 'Você fez um Pix de R$ 50,00 para João Silva',
      packageName: 'com.nu.production',
      timestamp: Date.now()
    },
    {
      title: 'Nubank',
      body: 'Você recebeu um Pix de R$ 100,00 de Maria Santos',
      packageName: 'com.nu.production',
      timestamp: Date.now()
    },
    {
      title: 'Nubank',
      body: 'Compra no crédito R$ 89,90 em SUPERMERCADO ABC',
      packageName: 'com.nu.production',
      timestamp: Date.now()
    }
  ],
  bradesco: [
    {
      title: 'Bradesco',
      body: 'Compra Cartão Débito R$ 25,50 - FARMACIA POPULAR',
      packageName: 'com.bradesco.next',
      timestamp: Date.now()
    },
    {
      title: 'Bradesco',
      body: 'PIX Enviado R$ 75,00 - Ana Carolina',
      packageName: 'com.bradesco.next',
      timestamp: Date.now()
    },
    {
      title: 'Bradesco',
      body: 'PIX Recebido R$ 150,00 - Pedro Henrique',
      packageName: 'com.bradesco.next',
      timestamp: Date.now()
    },
    {
      title: 'Bradesco',
      body: 'Saque Cartão R$ 200,00',
      packageName: 'com.bradesco.next',
      timestamp: Date.now()
    }
  ]
};

export function NotificationTester() {
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [selectedNotification, setSelectedNotification] = useState<string>('');
  const { testNotificationParsing } = useNotificationListener();

  const handleTest = () => {
    if (!selectedBank || selectedNotification === '') return;
    
    const notifications = MOCK_NOTIFICATIONS[selectedBank as keyof typeof MOCK_NOTIFICATIONS];
    const notification = notifications[parseInt(selectedNotification)];
    
    if (notification) {
      testNotificationParsing(notification);
    }
  };

  const getNotificationOptions = () => {
    if (!selectedBank) return [];
    return MOCK_NOTIFICATIONS[selectedBank as keyof typeof MOCK_NOTIFICATIONS];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔔 Teste de Captura de Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Banco:</label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nubank">Nubank</SelectItem>
              <SelectItem value="bradesco">Bradesco</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedBank && (
          <div>
            <label className="text-sm font-medium">Notificação:</label>
            <Select value={selectedNotification} onValueChange={setSelectedNotification}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma notificação" />
              </SelectTrigger>
              <SelectContent>
                {getNotificationOptions().map((notification, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {notification.body.substring(0, 50)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button 
          onClick={handleTest} 
          disabled={!selectedBank || selectedNotification === ''}
          className="w-full"
        >
          Simular Notificação
        </Button>

        <div className="text-xs text-muted-foreground">
          <p><strong>⚠️ Funcionalidade em Desenvolvimento</strong></p>
          <p>• Para captura real, é necessário um plugin nativo customizado</p>
          <p>• Este teste simula como as notificações seriam processadas</p>
          <p>• Permissões especiais são necessárias no Android</p>
        </div>
      </CardContent>
    </Card>
  );
}