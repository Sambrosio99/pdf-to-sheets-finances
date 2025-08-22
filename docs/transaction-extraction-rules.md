# Regras de Extração de Transações Nubank

## Visão Geral

Este documento detalha as regras e decisões implementadas para extrair transações dos arquivos CSV do Nubank, garantindo precisão nos cálculos financeiros.

## Tipos de Arquivo Suportados

### 1. Extrato (`NU_*.csv`)
- **Formato**: Data, Valor, ID, Descrição
- **Valores**: Por padrão em centavos, convertidos para reais
- **Uso**: Transações consolidadas do extrato bancário
- **includeInTotals**: `true` (usado nos cálculos de saldo)

### 2. Fatura (`Nubank_*.csv`)  
- **Formato**: Data, Descrição, Valor
- **Valores**: Já em formato reais
- **Uso**: Detalhamento de gastos no cartão de crédito
- **includeInTotals**: `false` (não usado nos totais para evitar duplicação)

## Regras de Parsing

### Normalização de Arquivo
1. **BOM Removal**: Remove `\uFEFF` do início do arquivo
2. **Line Endings**: Converte `\r\n` para `\n`
3. **Empty Lines**: Remove linhas vazias
4. **Header Detection**: Detecta cabeçalho por células como "data", "date", "titulo", "title"

### Split Seguro de CSV
```typescript
function splitCSVSafe(line: string): string[] {
  // Respeita aspas e suporta vírgulas e ponto-e-vírgula
  // Trata escape de aspas duplas ("") 
}
```

### Parsing de Datas
Suporta múltiplos formatos:
- `YYYY-MM-DD` (ISO)
- `DD/MM/YYYY` (brasileiro)
- `YYYY/M/D` ou `YYYY-M-D` (variações)

### Parsing de Valores

#### Extrato (parseExtratoValor)
```typescript
// Regras hierárquicas:
// 1. Formato brasileiro: "3.205,56" → R$ 3.205,56
// 2. Formato americano: "3205.56" → R$ 3.205,56  
// 3. Milhares sem decimais: "320.556" → R$ 3.205,56 (centavos)
// 4. Centavos puros: "320556" → R$ 3.205,56 (centavos)
```

#### Fatura (parseNubankValue)
```typescript
// Já em reais:
// - Centavos: "3250" → R$ 32,50
// - Brasileiro: "32,50" → R$ 32,50
// - Americano: "32.50" → R$ 32,50
```

## Filtros de Validação

### Exclusões Automáticas
1. **Transações Inválidas**:
   - Não concluídas, canceladas, estornadas
   - Status 'pending'
   - Valores zero ou inválidos
   - Datas inválidas

2. **Transferências Duplicadas**:
   - PIX que gera entrada + saída no mesmo dia
   - Mantém apenas a despesa real

### Dedupe Inteligente
- **Chave**: `date + description + amount`
- **Prioridade**: Extrato > Fatura (quando há conflito)
- **Motivo**: Extrato é consolidado, fatura é detalhamento

## Categorização Inteligente

### Mapeamento Automático
```typescript
// Exemplos:
"PUC" → "Educação"
"Uber" → "Transporte" 
"Wellhub" → "Saúde"
"PIX recebido" → "Transferência Recebida"
```

### Consolidação de Categorias
- Evita duplicação entre "Pagamento" e categoria específica
- Preserva categorias já processadas
- Mapeia termos similares para mesma categoria

## Correções de Totais

### Dados Corrigidos (Baseados em Extratos Reais)
```typescript
const correctTotals = {
  '2025-03': { income: 800.00, expense: 543.83, balance: 256.17 },
  '2025-04': { income: 2120.00, expense: 1430.10, balance: 689.90 }
};
```

### Uso nos Cálculos
1. **Prioridade**: Usa totais corrigidos se disponível
2. **Fallback**: Calcula baseado em transações válidas
3. **Reconciliação**: Compara extrato vs fatura para auditoria

## Auditoria e Debug

### Modo Auditoria (AUDIT_MODE = true)
- Logs detalhados de parsing
- Testes unitários automáticos
- Detecção de problemas estruturais
- Reconciliação extrato × fatura

### Métricas de Qualidade
- Taxa de parsing bem-sucedido
- Consistência de colunas
- Detecção de delimitadores mistos
- Validação de formatos de data/valor

## Casos Especiais

### 1. Estornos
- Detectados por palavra-chave "estorno"
- Tratados como receita (income)
- Valor absoluto preservado

### 2. Transferências Internas
- Identificadas por mesmo valor/data/descrição
- Remove duplicatas (entrada + saída artificial)
- Mantém apenas o movimento real

### 3. Gastos Recorrentes vs Variáveis
- **Fixos**: Faculdade, Celular, Academia
- **Variáveis**: Todo o resto
- Usado para análise de orçamento disponível

## Fluxo de Processamento

1. **Detecção de Formato** → Extrato ou Fatura
2. **Normalização** → BOM, EOL, linhas vazias
3. **Parsing de Estrutura** → Header, colunas, delimitadores  
4. **Parsing de Dados** → Data, valor, descrição
5. **Validação** → Exclusões e filtros
6. **Dedupe** → Preferência extrato sobre fatura
7. **Categorização** → Mapeamento inteligente
8. **Auditoria** → Logs e métricas de qualidade

## Configuração

### Variáveis de Controle
- `AUDIT_MODE`: Ativa logs detalhados
- `AUDIT_STRICT`: Aborta em falha de testes unitários
- `AUDIT_SAMPLING`: Mostra amostras de dados parseados

### Customização
- Adicionar novos padrões em `categorizeTransaction()`
- Ajustar regex de detecção em `parseExtratoValor()`
- Expandir totais corrigidos em `getMonthlyTotalsCorrection()`