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

// ===================== Audit Config =====================
export const AUDIT_MODE = true;
export const AUDIT_SAMPLING = true;
export const AUDIT_MAX_LOG_LINES = 50;
export const AUDIT_STRICT = true;

// Audit session state and helpers
type AuditFileMeta = { fileName?: string; sizeBytes?: number; mimeType?: string };
type MonthlyAgg = { income: number; expense: number };
const auditSession = {
  files: [] as any[],
  monthly: {} as Record<string, { extrato: MonthlyAgg; fatura: MonthlyAgg }>,
  unitTests: { valueParsing: { passed: true, failedCases: [] as string[] }, dateParsing: { passed: true, failedCases: [] as string[] } },
};
let pendingFileMeta: AuditFileMeta = {};
export function setNubankAuditFileMeta(meta: AuditFileMeta) { pendingFileMeta = meta || {}; }

function detectLineEndings(src: string): 'CRLF' | 'LF' {
  return src.includes('\r\n') ? 'CRLF' : 'LF';
}
function detectEncoding(src: string): string {
  return src.includes('\uFFFD') ? 'UTF-8 (replacement chars found)' : 'UTF-8';
}
function countNonPrintable(s: string): number {
  let c = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    if ((ch < 9) || (ch > 13 && ch < 32)) c++;
  }
  return c;
}
function countDelimsOutsideQuotes(s: string) {
  let inQ = false, comma = 0, semi = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') {
      if (inQ && s[i + 1] === '"') { i++; continue; }
      inQ = !inQ;
    } else if (!inQ) {
      if (ch === ',') comma++;
      else if (ch === ';') semi++;
    }
  }
  return { comma, semi };
}
function monthKey(date: string): string { return date.slice(0, 7); }
function addMonthly(map: Record<string, { extrato: MonthlyAgg; fatura: MonthlyAgg }>, origin: 'extrato'|'fatura', date: string, type: TxType, amount: number) {
  const key = monthKey(date);
  if (!map[key]) map[key] = { extrato: { income: 0, expense: 0 }, fatura: { income: 0, expense: 0 } };
  map[key][origin][type] += amount;
}
function computeSessionReconciliation() {
  const months = Object.keys(auditSession.monthly);
  const alerts: string[] = [];
  let sumPct = 0, count = 0;
  for (const m of months) {
    const ex = auditSession.monthly[m]?.extrato?.expense || 0;
    const fa = auditSession.monthly[m]?.fatura?.expense || 0;
    if (ex > 0 && fa > 0) {
      const pct = (1 - Math.abs(ex - fa) / ex) * 100;
      sumPct += pct; count++;
      if (Math.abs(ex - fa) / ex > 0.10) alerts.push(`detalhe não concilia no mês ${m} (>10%)`);
    }
  }
  return { monthlyMatchPct: count ? +(sumPct / count).toFixed(1) : null, alerts };
}
function computeSessionTotals() {
  const byMonth: any[] = [];
  const months = Object.keys(auditSession.monthly).sort();
  let extratoIncome = 0, extratoExpense = 0;
  for (const m of months) {
    const e = auditSession.monthly[m]?.extrato || { income: 0, expense: 0 };
    byMonth.push({ month: m, income: +(e.income.toFixed(2)), expense: +(e.expense.toFixed(2)), saldo: +((e.income - e.expense).toFixed(2)) });
    extratoIncome += e.income; extratoExpense += e.expense;
  }
  return {
    byMonth,
    byOrigin: {
      extrato: { income: +extratoIncome.toFixed(2), expense: +extratoExpense.toFixed(2) },
      fatura: { income: 0, expense: 0, included: false },
    },
  };
}
function collectRootCauses(files: any[]) {
  const causes: string[] = [];
  for (const f of files) {
    if (f.parser?.quoteAware === false) causes.push("CSV com vírgulas em aspas não respeitadas");
    if (f.source?.delimiterGuess === 'mixed') causes.push("Mistura de ; e ,");
    if (f.unitTests?.valueParsing?.passed === false) causes.push("Valores de fatura tratados como centavos");
    const s = f.stats?.rowsSkipped;
    if (s && (s.invalidDate + s.invalidValue + s.zeroAmount) > (f.stats?.rowsTotal || 1) * 0.3) causes.push("Datas/valores inválidos descartados em massa");
    if (f.reconciliation?.alerts?.length) causes.push(...f.reconciliation.alerts);
  }
  return Array.from(new Set(causes));
}
function suggestActions(files: any[]) {
  const actions = new Set<string>();
  if (files.some(f => f.unitTests?.valueParsing?.passed === false)) actions.add("Revisar parseNubankValue e formatos de moeda/centavos");
  if (files.some(f => f.source?.delimiterGuess === 'mixed')) actions.add("Forçar delimitador por arquivo e normalizar antes do parse");
  if (files.some(f => (f.stats?.rowsSkipped?.duplicates || 0) / (f.stats?.rowsTotal || 1) > 0.05)) actions.add("Ajustar dedupe para reduzir falsos positivos");
  if (files.some(f => f.faturaIncomeRatioAlert)) actions.add("Verificar sinal de estornos em faturas (muitos incomes)");
  return Array.from(actions);
}
export function printNubankAuditSummary() {
  if (!AUDIT_MODE) return;
  const summary = {
    auditVersion: "1.0.0",
    sourceFiles: auditSession.files,
    unitTests: auditSession.unitTests,
    reconciliation: computeSessionReconciliation(),
    totals: computeSessionTotals(),
    rootCauses: collectRootCauses(auditSession.files),
    actions: suggestActions(auditSession.files),
  };
  try { console.log("[AUDIT][REPORT]", JSON.stringify(summary, null, 2)); } catch { console.log("[AUDIT][REPORT]", summary); }
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

  // Para extratos, tentar detectar se já vem em reais ou centavos
  let valor: number;
  
  // Se contém vírgula ou ponto decimal, provavelmente já está em reais
  if (valorStr.includes(',') || valorStr.includes('.')) {
    valor = parseNubankValue(valorStr);
  } else {
    // Número puro, assumir centavos
    const raw = Number(String(valorStr).replace(/\s+/g, ''));
    if (!Number.isFinite(raw)) return null;
    valor = raw / 100;
  }
  
  if (!Number.isFinite(valor)) return null;
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
  // [AUDIT] Coleta de metadados da origem
  const sourceRaw = fileContent;
  const fileMeta = { fileName, sizeBytes: pendingFileMeta.sizeBytes, mimeType: pendingFileMeta.mimeType };
  const lineEndings = detectLineEndings(sourceRaw);
  const linesRaw = sourceRaw.split('\n'); // mantém \r
  const first3RawLines = linesRaw.slice(0, 3);
  const last3RawLines = linesRaw.slice(Math.max(0, linesRaw.length - 3));
  const npCounts = linesRaw.slice(0, Math.min(linesRaw.length, AUDIT_MAX_LOG_LINES)).map(countNonPrintable);
  const delimCounts = linesRaw.slice(0, 10).map(countDelimsOutsideQuotes);
  const sumComma = delimCounts.reduce((a,b)=>a+b.comma,0);
  const sumSemi = delimCounts.reduce((a,b)=>a+b.semi,0);
  const delimiterGuess = sumComma > sumSemi ? ',' : (sumSemi > sumComma ? ';' : 'mixed');
  const quoteUsage = { quotes: sourceRaw.includes('"'), escaped: sourceRaw.includes('""') };
  if (AUDIT_MODE) {
    console.groupCollapsed('[AUDIT][SOURCE]');
    console.log({ fileName, sizeBytes: fileMeta.sizeBytes ?? null, mimeType: fileMeta.mimeType ?? null, encodingDetect: detectEncoding(sourceRaw), lineEndings, first3RawLines, last3RawLines, nonPrintableCharsCount: npCounts, delimiterGuess, quoteUsage });
    console.groupEnd();
  }

  // Normaliza EOL e remove linhas vazias
  const lines = fileContent.replace(/\r/g, '').split('\n').filter(Boolean);

  // Detecta cabeçalho pela primeira célula
  const firstCells = splitCSVSafe(lines[0] || '');
  const firstCell = (Array.isArray(firstCells) ? firstCells[0] : '')?.trim().toLowerCase() || '';
  const hasHeader = firstCell === 'data' || firstCell === 'date' || firstCell === 'titulo' || firstCell === 'title';
  const dataLines = hasHeader ? lines.slice(1) : lines;

  // Estrutura
  const colCount1 = splitCSVSafe(lines[0] || '').length;
  const colCount2 = splitCSVSafe(lines[1] || '').length;
  const sampleSplitMatrix = (hasHeader ? [lines[1], lines[2], lines[3], lines[4], lines[5]] : lines).slice(0,5).map(l => splitCSVSafe(l || ''));
  const sampleCounts = (hasHeader ? dataLines : lines).slice(0, Math.min(20, dataLines.length)).map(l => splitCSVSafe(l).length);
  const consistentColumnCount = sampleCounts.every(c => c === sampleCounts[0]);
  const headerDuplicate = dataLines.findIndex(l => splitCSVSafe(l)[0]?.trim().toLowerCase() === firstCell) !== -1;
  if (AUDIT_MODE) {
    console.groupCollapsed('[AUDIT][STRUCT]');
    console.log({ headerPresent: hasHeader, columnsDetected: [splitCSVSafe(lines[0] || ''), splitCSVSafe(lines[1] || '')], consistentColumnCount, headerDuplicate, sampleSplitMatrix });
    console.groupEnd();
  }

  // Testes de valores e datas
  const valueTests: Array<[string, number]> = [["320556", 3205.56],["3.205,56", 3205.56],["3205.56", 3205.56],["R$ 3.205,56", 3205.56],["-294740", -2947.40],["R$ -32,50", -32.50]];
  const valueFailed: string[] = [];
  for (const [raw, exp] of valueTests) { const got = parseNubankValue(raw); if (Math.abs(got - exp) > 0.001) valueFailed.push(`${raw} -> ${got} (exp ${exp})`); }
  const dateTests: Array<[string, string]> = [["2025-07-15","2025-07-15"],["15/07/2025","2025-07-15"],["2025/7/5","2025-07-05"],["2025-7-05","2025-07-05"]];
  const dateFailed: string[] = [];
  for (const [raw, exp] of dateTests) { const got = formatDate(raw); if (got !== exp) dateFailed.push(`${raw} -> ${got} (exp ${exp})`); }
  if (AUDIT_MODE) { console.groupCollapsed('[AUDIT][UNIT]'); console.log({ valueParsing: { passed: valueFailed.length === 0, failedCases: valueFailed }, dateParsing: { passed: dateFailed.length === 0, failedCases: dateFailed } }); console.groupEnd(); }
  auditSession.unitTests.valueParsing.passed = auditSession.unitTests.valueParsing.passed && valueFailed.length === 0;
  auditSession.unitTests.valueParsing.failedCases.push(...valueFailed);
  auditSession.unitTests.dateParsing.passed = auditSession.unitTests.dateParsing.passed && dateFailed.length === 0;
  auditSession.unitTests.dateParsing.failedCases.push(...dateFailed);
  if (AUDIT_STRICT && (valueFailed.length || dateFailed.length)) {
    const report = {
      auditVersion: "1.0.0",
      source: { fileName, sizeBytes: fileMeta.sizeBytes ?? null, mimeType: fileMeta.mimeType ?? null, encodingDetect: detectEncoding(sourceRaw), lineEndings, delimiterGuess, quoteAware: true, unwrappedEmbeddedCSV: false, headerPresent: hasHeader, columnsDetected: [splitCSVSafe(lines[0] || '')], consistentColumnCount },
      unitTests: { valueParsing: { passed: valueFailed.length === 0, failedCases: valueFailed }, dateParsing: { passed: dateFailed.length === 0, failedCases: dateFailed } },
      rootCauses: ["valueParsing"],
      actions: ["Corrigir parseNubankValue conforme formatos exigidos"],
    };
    auditSession.files.push(report);
    if (AUDIT_MODE) console.warn("[AUDIT][ABORT] Unit tests failed. Parsing aborted.");
    return [];
  }

  const isExtrato = fileName.includes('NU_');
  const isFatura = fileName.includes('Nubank_');
  const out: Transacao[] = [];
  let rowsTotal = dataLines.length, rowsParsed = 0;
  let invalidDate = 0, invalidValue = 0, zeroAmount = 0, duplicates = 0;
  const seen = new Set<string>();
  let unwrappedEmbeddedCSV = false;
  const sampleRows: any[] = [];
  const byPayment: Record<string, { income: number; expense: number }> = {};

  for (let idx = 0; idx < dataLines.length; idx++) {
    const rawLine = dataLines[idx];
    const parts0 = splitCSVSafe(rawLine.replace(/\r$/, ''));
    if (parts0.length === 1 && parts0[0].includes(',')) unwrappedEmbeddedCSV = true;

    const parsed = isExtrato ? parseExtratoLine(rawLine) : parseFaturaLine(rawLine);
    if (!parsed) {
      if (!isExtrato && !isFatura) {
        const len = parts0.length;
        const fallbackParsed = (len >= 4) ? parseExtratoLine(rawLine) : (len >= 3 ? parseFaturaLine(rawLine) : null);
        if (!fallbackParsed) continue;
      } else {
        continue;
      }
    }
    const tx = (parsed || ({} as Transacao));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) { invalidDate++; continue; }
    if (!Number.isFinite(tx.amount)) { invalidValue++; continue; }
    if (tx.amount === 0) { zeroAmount++; continue; }

    const key = `${tx.date}||${tx.description}||${tx.amount.toFixed(2)}||${tx.origin}`;
    if (seen.has(key)) { duplicates++; continue; }
    seen.add(key);
    out.push(tx);
    rowsParsed++;

    if (AUDIT_MODE && AUDIT_SAMPLING && sampleRows.length < AUDIT_MAX_LOG_LINES) {
      const valueRaw = isExtrato ? splitCSVSafe(rawLine)[1] : splitCSVSafe(rawLine)[2];
      sampleRows.push({ rowIndex: idx + (hasHeader ? 2 : 1), dateRaw: splitCSVSafe(rawLine)[0], dateParsed: tx.date, desc: tx.description, valueRaw, valueParsed: tx.amount, type: tx.type, origin: tx.origin });
    }

    const m = byPayment[tx.paymentMethod] || { income: 0, expense: 0 };
    m[tx.type] += tx.amount; byPayment[tx.paymentMethod] = m;
  }

  const byMonth: Record<string, { income: number; expense: number }> = {};
  for (const tx of out) {
    if (tx.includeInTotals) {
      const mk = tx.date.slice(0,7);
      if (!byMonth[mk]) byMonth[mk] = { income: 0, expense: 0 };
      byMonth[mk][tx.type] += tx.amount;
    }
    addMonthly(auditSession.monthly, tx.origin, tx.date, tx.type, tx.amount);
  }

  let faturaIncomeRatioAlert = false;
  if (isFatura) {
    const months = Array.from(new Set(out.map(t => t.date.slice(0,7))));
    for (const m of months) {
      const inc = out.filter(t => t.origin==='fatura' && t.date.startsWith(m) && t.type==='income').reduce((a,b)=>a+b.amount,0);
      const exp = out.filter(t => t.origin==='fatura' && t.date.startsWith(m) && t.type==='expense').reduce((a,b)=>a+b.amount,0);
      const total = inc + exp;
      if (total > 0 && inc / total > 0.7) faturaIncomeRatioAlert = true;
    }
  }

  if (AUDIT_MODE) {
    console.groupCollapsed('[AUDIT][SAMPLES]');
    console.log(sampleRows.length > AUDIT_MAX_LOG_LINES ? [...sampleRows.slice(0, AUDIT_MAX_LOG_LINES), '...(truncado)'] : sampleRows);
    console.groupEnd();

    console.groupCollapsed('[AUDIT][COUNTS]');
    console.log({ rowsTotal, rowsParsed, rowsSkippedInvalidDate: invalidDate, rowsSkippedInvalidValue: invalidValue, rowsZeroAmount: zeroAmount, deduped: duplicates });
    console.groupEnd();

    console.groupCollapsed('[AUDIT][TOTALS]');
    const totalsByMonth = Object.entries(byMonth).map(([month, v]) => ({ month, income: +v.income.toFixed(2), expense: +v.expense.toFixed(2), saldo: +(v.income - v.expense).toFixed(2) }));
    console.log({ byMonth: totalsByMonth, byOrigin: { extrato: fileName.includes('NU_') ? { included: true } : undefined, fatura: fileName.includes('Nubank_') ? { included: false } : undefined }, byPayment });
    console.groupEnd();
  }

  const fileReport = {
    fileName,
    sizeBytes: fileMeta.sizeBytes ?? null,
    encodingDetect: detectEncoding(sourceRaw),
    lineEndings,
    delimiterGuess: delimiterGuess === 'mixed' ? 'mixed' : delimiterGuess,
    quoteAware: true,
    unwrappedEmbeddedCSV,
    headerPresent: hasHeader,
    columnsDetected: splitCSVSafe(lines[0] || ''),
    consistentColumnCount,
    stats: {
      rowsTotal,
      rowsParsed,
      rowsSkipped: { invalidDate, invalidValue, zeroAmount, duplicates },
    },
    samples: sampleRows,
    unitTests: {
      valueParsing: { passed: valueFailed.length === 0, failedCases: valueFailed },
      dateParsing: { passed: dateFailed.length === 0, failedCases: dateFailed },
    },
    reconciliation: computeSessionReconciliation(),
    totals: computeSessionTotals(),
    faturaIncomeRatioAlert,
  };
  auditSession.files.push({ source: { fileName, sizeBytes: fileMeta.sizeBytes ?? null, encodingDetect: detectEncoding(sourceRaw), lineEndings, delimiterGuess, quoteAware: true, unwrappedEmbeddedCSV, headerPresent: hasHeader, columnsDetected: splitCSVSafe(lines[0] || ''), consistentColumnCount }, stats: fileReport.stats, samples: sampleRows, unitTests: fileReport.unitTests, reconciliation: fileReport.reconciliation, totals: fileReport.totals, faturaIncomeRatioAlert });

  return out;
}
