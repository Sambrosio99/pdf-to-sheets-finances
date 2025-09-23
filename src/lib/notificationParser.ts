import { Transaction } from '@/types/finance';

export interface NotificationData {
  title: string;
  body: string;
  packageName: string;
  timestamp: number;
}

export interface ParsedTransaction {
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  date: string;
}

// Patterns for Nubank notifications
const NUBANK_PATTERNS = {
  // Compra no débito/crédito: "Compra aprovada no débito R$ 15,90 em PADARIA DA ESQUINA"
  purchase: /(?:Compra aprovada|Compra no crédito|Compra no débito).*?R\$\s*([0-9.,]+).*?em\s+(.+?)(?:\s|$)/i,
  
  // PIX: "Você fez um Pix de R$ 50,00 para João Silva"
  pixSent: /Você fez um Pix de R\$\s*([0-9.,]+).*?para\s+(.+?)(?:\s|$)/i,
  
  // PIX recebido: "Você recebeu um Pix de R$ 100,00 de Maria Santos"
  pixReceived: /Você recebeu um Pix de R\$\s*([0-9.,]+).*?de\s+(.+?)(?:\s|$)/i,
  
  // TED/DOC: "TED realizada de R$ 200,00 para Conta Corrente"
  transfer: /(?:TED|DOC) realizada de R\$\s*([0-9.,]+)/i,
  
  // Saque: "Saque realizado de R$ 100,00"
  withdrawal: /Saque realizado de R\$\s*([0-9.,]+)/i,
  
  // Depósito: "Depósito de R$ 500,00 realizado"
  deposit: /Depósito de R\$\s*([0-9.,]+)/i
};

// Patterns for Bradesco notifications
const BRADESCO_PATTERNS = {
  // Compra: "Compra Cartão Débito R$ 25,50 - SUPERMERCADO ABC"
  purchase: /Compra Cartão (?:Débito|Crédito) R\$\s*([0-9.,]+)\s*-\s*(.+?)(?:\s|$)/i,
  
  // PIX: "PIX Enviado R$ 75,00 - João Silva"
  pixSent: /PIX Enviado R\$\s*([0-9.,]+)\s*-\s*(.+?)(?:\s|$)/i,
  
  // PIX recebido: "PIX Recebido R$ 150,00 - Maria Santos"
  pixReceived: /PIX Recebido R\$\s*([0-9.,]+)\s*-\s*(.+?)(?:\s|$)/i,
  
  // Transferência: "Transferência Enviada R$ 300,00"
  transfer: /Transferência Enviada R\$\s*([0-9.,]+)/i,
  
  // Saque: "Saque Cartão R$ 200,00"
  withdrawal: /Saque Cartão R\$\s*([0-9.,]+)/i
};

function parseAmount(amountStr: string): number {
  // Convert Brazilian format (1.234,56) to number
  return parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
}

function categorizeTransaction(description: string, type: 'income' | 'expense'): string {
  const desc = description.toLowerCase();
  
  if (type === 'income') {
    if (desc.includes('pix') || desc.includes('transferência')) return 'Transferência Recebida';
    if (desc.includes('salário') || desc.includes('salario')) return 'Salário';
    if (desc.includes('depósito') || desc.includes('deposito')) return 'Depósito';
    return 'Outros Recebimentos';
  }
  
  // Expense categories
  if (desc.includes('supermercado') || desc.includes('mercado') || desc.includes('padaria')) return 'Alimentação';
  if (desc.includes('posto') || desc.includes('gasolina') || desc.includes('combustível')) return 'Transporte';
  if (desc.includes('farmácia') || desc.includes('farmacia') || desc.includes('drogaria')) return 'Saúde';
  if (desc.includes('restaurante') || desc.includes('lanchonete') || desc.includes('pizza')) return 'Alimentação';
  if (desc.includes('shopping') || desc.includes('loja') || desc.includes('magazine')) return 'Compras';
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('cinema')) return 'Entretenimento';
  if (desc.includes('saque')) return 'Saque';
  if (desc.includes('pix') || desc.includes('transferência')) return 'Transferência';
  
  return 'Outros';
}

function getPaymentMethod(description: string, bankApp: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('pix')) return 'PIX';
  if (desc.includes('débito')) return 'Cartão Débito';
  if (desc.includes('crédito')) return 'Cartão Crédito';
  if (desc.includes('ted') || desc.includes('doc')) return 'TED/DOC';
  if (desc.includes('saque')) return 'Saque';
  if (desc.includes('depósito') || desc.includes('deposito')) return 'Depósito';
  
  return bankApp === 'nubank' ? 'Nubank' : 'Bradesco';
}

export function parseNubankNotification(notification: NotificationData): ParsedTransaction | null {
  const { title, body } = notification;
  const text = `${title} ${body}`.trim();
  
  // Try each pattern
  for (const [type, pattern] of Object.entries(NUBANK_PATTERNS)) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      let description = '';
      let transactionType: 'income' | 'expense' = 'expense';
      
      switch (type) {
        case 'purchase':
          description = match[2]?.trim() || 'Compra';
          transactionType = 'expense';
          break;
        case 'pixSent':
          description = `PIX para ${match[2]?.trim() || 'Destinatário'}`;
          transactionType = 'expense';
          break;
        case 'pixReceived':
          description = `PIX de ${match[2]?.trim() || 'Remetente'}`;
          transactionType = 'income';
          break;
        case 'transfer':
          description = 'Transferência';
          transactionType = 'expense';
          break;
        case 'withdrawal':
          description = 'Saque';
          transactionType = 'expense';
          break;
        case 'deposit':
          description = 'Depósito';
          transactionType = 'income';
          break;
      }
      
      return {
        amount,
        description,
        type: transactionType,
        category: categorizeTransaction(description, transactionType),
        paymentMethod: getPaymentMethod(text, 'nubank'),
        date: new Date().toISOString().split('T')[0]
      };
    }
  }
  
  return null;
}

export function parseBradescoNotification(notification: NotificationData): ParsedTransaction | null {
  const { title, body } = notification;
  const text = `${title} ${body}`.trim();
  
  // Try each pattern
  for (const [type, pattern] of Object.entries(BRADESCO_PATTERNS)) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      let description = '';
      let transactionType: 'income' | 'expense' = 'expense';
      
      switch (type) {
        case 'purchase':
          description = match[2]?.trim() || 'Compra';
          transactionType = 'expense';
          break;
        case 'pixSent':
          description = `PIX para ${match[2]?.trim() || 'Destinatário'}`;
          transactionType = 'expense';
          break;
        case 'pixReceived':
          description = `PIX de ${match[2]?.trim() || 'Remetente'}`;
          transactionType = 'income';
          break;
        case 'transfer':
          description = 'Transferência';
          transactionType = 'expense';
          break;
        case 'withdrawal':
          description = 'Saque';
          transactionType = 'expense';
          break;
      }
      
      return {
        amount,
        description,
        type: transactionType,
        category: categorizeTransaction(description, transactionType),
        paymentMethod: getPaymentMethod(text, 'bradesco'),
        date: new Date().toISOString().split('T')[0]
      };
    }
  }
  
  return null;
}

export function parseNotification(notification: NotificationData): ParsedTransaction | null {
  const { packageName } = notification;
  
  // Identify bank app and parse accordingly
  if (packageName.includes('nubank') || packageName.includes('nu.production')) {
    return parseNubankNotification(notification);
  } else if (packageName.includes('bradesco') || packageName.includes('com.bradesco')) {
    return parseBradescoNotification(notification);
  }
  
  return null;
}