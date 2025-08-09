// ===================== Tipos =====================
export type TxType = 'income' | 'expense';

export interface Transacao {
  date: string;               // YYYY-MM-DD
  description: string;
  category: string;
  paymentMethod: string;
  amount: number;             // sempre em R$
  type: TxType;
  status: 'paid';
  origin: 'extrato' | 'fatura';
  includeInTotals: boolean;   // extrato=true, fatura=false
}

// ===================== Utils =====================

// Split seguro que respeita aspas e suporta ',' e ';'
function splitCSVSafe(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } // escape ""
      else inQuotes = !inQuotes;
    } else if (!inQuotes && (ch === ',' || ch === ';')) {
      out.push(cur.trim().replace(/^"|"$/g, ''));
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim().replace(/^"|"$/g, ''));
  return out;
}

// Datas → YYYY-MM-DD
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const s = dateStr.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;                  // 2025-07-15
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {                        // 15/07/2025
    const [d, m, y] = s.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}\/\d{2}\/\d{4}$/.test(s)) {                        // 2025/07/15
    const [y, m, d] = s.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(s)) {              // 2025-7-5
    const [y, m, d] = s.split(/[-\/]/);
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

// Valores (centavos vs. reais)
function parseNubankValue(valueStr: string): number {
  const cleaned = (valueStr ?? '').replace('R$', '').trim();
  const isCentavos   = /^-?\d+$/.test(cleaned);              // "320556"
  const isReaisBr    = /^-?[\d\.]*\,\d{2}$/.test(cleaned);   // "3.205,56"
  const isDotDec     = /^-?\d+\.\d{2}$/.test(cleaned);       // "3205.56"

  if (isCentavos) return parseFloat(cleaned) / 100;
  if (isReaisBr)  return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  if (isDotDec)   return parseFloat(cleaned);
  // fallback (troca vírgula por ponto)
  return parseFloat(cleaned.replace(',', '.'));
}

// Categorias (ajuste às suas regras)
function categorizeTransaction(description: string): string {
  const desc = (description || '').toLowerCase();
  if (desc.includes('google') || desc.includes('chatgpt') || desc.includes('lovable')) return 'Assinaturas';
  if (desc.includes('uber') || desc.includes('trip')) return 'Transporte';
  if (desc.includes('academia') || desc.includes('wellhub') || desc.includes('gym')) return 'Academia';
  if (desc.includes('puc') || desc.includes('faculdade') || desc.includes('universidade')) return 'Faculdade';
  if (desc.includes('aliexpress') || desc.includes('amazon') || desc.includes('compra')) return 'Compras';
  if (desc.includes('pix recebido') || desc.includes('transferência recebida')) return 'Transferência Recebida';
  if (desc.includes('pix enviado') || desc.includes('transferência enviada')) return 'Transferência Enviada';
  if (desc.includes('boleto') || desc.includes('pagamento') || desc.includes('fatura')) return 'Pagamentos';
  if (desc.includes('café') || desc.includes('lanche') || desc.includes('pastel')) return 'Alimentação';
  return 'Outros';
}

function getPaymentMethod(description: string): string {
  const desc = (description || '').toLowerCase();
  if (desc.includes('pix')) return 'PIX';
  if (desc.includes('débito')) return 'Cartão de Débito';
  if (desc.includes('crédito')) return 'Cartão de Crédito';
  if (desc.includes('boleto')) return 'Boleto';
  if (desc.includes('transferência')) return 'Transferência';
  return 'Outros';
}

// ===================== Parsers por arquivo =====================

// Extrato NU_*.csv → sempre centavos
function parseExtratoLine(rawLine: string): Transacao | null {
  const parts0 = splitCSVSafe(rawLine.replace(/\r$/, ''));
  // Alguns NU_* vêm com ';' embrulhando tudo no primeiro campo
  const parts = (parts0.length === 1 && parts0[0].includes(',')) ? splitCSVSafe(parts0[0]) : parts0;

  if (parts.length < 4) return null;
  const [dataStr, valorStr, , descricao] = parts;
  if (!dataStr || !valorStr || !descricao) return null;
  if (/^\s*(data|date)\s*$/i.test(dataStr)) return null;

  const date = formatDate(dataStr);
  if (!date) return null;

  const raw = Number(String(valorStr).replace(/\s+/g, ''));
  if (!Number.isFinite(raw)) return null;

  const valor = raw / 100;                     // centavos → reais
  const amount = Math.abs(valor);
  if (amount === 0) return null;

  const type: TxType = valor > 0 ? 'income' : 'expense';

  return {
    date,
    description: (descricao || '').trim(),
    category: categorizeTransaction(descricao || ''),
    paymentMethod: getPaymentMethod(descricao || ''),
    amount,
    type,
    status: 'paid',
    origin: 'extrato',
    includeInTotals: true,
  };
}

// Fatura Nubank_*.csv → já em reais (detalhamento)
function parseFaturaLine(rawLine: string): Transacao | null {
  const parts = splitCSVSafe(rawLine.replace(/\r$/, ''));
  if (parts.length < 3) return null;

  const [dataStr, descricao, valorStr] = parts;
  if (!dataStr || !descricao || !valorStr) return null;
  if (/^\s*(data|date)\s*$/i.test(dataStr)) return null;

  const date = formatDate(dataStr);
  if (!date) return null;

  const v = parseNubankValue(valorStr);
  if (!Number.isFinite(v)) return null;

  const amount = Math.abs(v);
  if (amount === 0) return null;

  const isEstorno = (descricao || '').toLowerCase().includes('estorno');
  const type: TxType = (v < 0 || isEstorno) ? 'income' : 'expense';

  return {
    date,
    description: (descricao || '').trim(),
    category: categorizeTransaction(descricao || ''),
    paymentMethod: 'Cartão de Crédito',
    amount,
    type,
    status: 'paid',
    origin: 'fatura',
    includeInTotals: false, // <- fatura é detalhamento, não entra no somatório
  };
}

// ===================== Coordenador =====================
export function parseCSVFile(fileContent: string, fileName: string): Transacao[] {
  // Normaliza EOL e remove linhas vazias
  const lines = fileContent.replace(/\r/g, '').split('\n').filter(Boolean);

  // Detecta cabeçalho pela primeira célula
  const firstCells = splitCSVSafe(lines[0] || '');
  const firstCell = (Array.isArray(firstCells) ? firstCells[0] : '')?.trim().toLowerCase() || '';
  const hasHeader = firstCell === 'data' || firstCell === 'date' || firstCell === 'titulo' || firstCell === 'title';
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const isExtrato = fileName.includes('NU_');
  const out: Transacao[] = [];

  for (const line of dataLines) {
    const parsed = isExtrato ? parseExtratoLine(line) : parseFaturaLine(line);
    if (!parsed) continue;

    // validações finais
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) continue;
    if (!Number.isFinite(parsed.amount) || parsed.amount === 0) continue;

    // dedupe por (date, description, amount, origin)
    const isDup = out.some(t =>
      t.date === parsed.date &&
      t.description === parsed.description &&
      Math.abs(t.amount - parsed.amount) < 0.01 &&
      t.origin === parsed.origin
    );
    if (!isDup) out.push(parsed);
  }
  return out;
}
