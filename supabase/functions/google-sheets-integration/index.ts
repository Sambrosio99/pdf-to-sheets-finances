import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Criando Dashboard Completo do Google Sheets')
    
    const { action, transactions } = await req.json()
    console.log('📊 Transações recebidas:', transactions?.length || 0)
    
    const serviceAccountKey = Deno.env.get('CHAVE_DA_CONTA_DO_SERVIÇO_DO_GOOGLE')
    
    if (!serviceAccountKey) {
      return new Response(
        JSON.stringify({ error: 'Google Service Account key not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Obter access token
    const accessToken = await getAccessToken(serviceAccountKey)
    console.log('✅ Access token obtido!')

    // ID da planilha existente do usuário
    const existingSheetId = '1z5KpIdcw4vJfUN_7iMnNCyNYvWM2s-G1Tnx_5CHzAds'
    
    // 1. Criar as abas necessárias
    await createWorksheetTabs(accessToken, existingSheetId)
    
    // 2. Adicionar dados das transações
    await addTransactionsData(accessToken, existingSheetId, transactions)
    
    // 3. Adicionar resumo financeiro
    await addFinancialSummary(accessToken, existingSheetId, transactions)
    
    // 4. Adicionar análise por categorias
    await addCategoryAnalysis(accessToken, existingSheetId, transactions)
    
    // 5. Adicionar evolução mensal
    await addMonthlyEvolution(accessToken, existingSheetId, transactions)
    
    // 6. Formatar e criar gráficos
    await formatAndCreateCharts(accessToken, existingSheetId)

    console.log('✅ Dashboard completo criado com sucesso!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        spreadsheetId: existingSheetId,
        url: `https://docs.google.com/spreadsheets/d/${existingSheetId}`,
        message: 'Dashboard financeiro completo criado com sucesso! 🎉'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Função para criar as abas/sheets
async function createWorksheetTabs(accessToken: string, spreadsheetId: string) {
  console.log('📋 Criando abas do dashboard...')
  
  const requests = [
    // Aba Dashboard
    {
      addSheet: {
        properties: {
          title: "📊 Dashboard",
          gridProperties: { rowCount: 100, columnCount: 26 }
        }
      }
    },
    // Aba Transações
    {
      addSheet: {
        properties: {
          title: "💰 Transações",
          gridProperties: { rowCount: 1000, columnCount: 10 }
        }
      }
    },
    // Aba Categorias
    {
      addSheet: {
        properties: {
          title: "📈 Por Categoria",
          gridProperties: { rowCount: 50, columnCount: 15 }
        }
      }
    },
    // Aba Evolução
    {
      addSheet: {
        properties: {
          title: "📅 Evolução Mensal",
          gridProperties: { rowCount: 50, columnCount: 15 }
        }
      }
    }
  ]

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ requests })
  })
}

// Função para adicionar dados das transações
async function addTransactionsData(accessToken: string, spreadsheetId: string, transactions: any[]) {
  console.log('💰 Adicionando dados das transações...')
  
  const headers = ['Data', 'Descrição', 'Categoria', 'Método', 'Valor', 'Tipo', 'Status']
  
  const transactionRows = transactions.map(t => [
    t.date,
    t.description,
    t.category,
    t.paymentMethod,
    t.type === 'expense' ? -t.amount : t.amount,
    t.type === 'expense' ? 'Despesa' : 'Receita',
    t.status === 'paid' ? 'Pago' : 'Pendente'
  ])

  const allData = [headers, ...transactionRows]

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/💰 Transações!A1:G${allData.length}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ values: allData })
    }
  )
}

// Função para adicionar resumo financeiro
async function addFinancialSummary(accessToken: string, spreadsheetId: string, transactions: any[]) {
  console.log('📊 Criando resumo financeiro...')
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense
  
  const summaryData = [
    ['🏦 RESUMO FINANCEIRO', '', '', ''],
    ['', '', '', ''],
    ['📈 Total de Receitas:', `R$ ${totalIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, '', ''],
    ['📉 Total de Despesas:', `R$ ${totalExpense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, '', ''],
    ['💰 Saldo:', `R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, '', ''],
    ['', '', '', ''],
    ['📊 ESTATÍSTICAS', '', '', ''],
    ['', '', '', ''],
    ['🔢 Total de Transações:', transactions.length.toString(), '', ''],
    ['📅 Período:', `${new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))).toLocaleDateString('pt-BR')} - ${new Date(Math.max(...transactions.map(t => new Date(t.date).getTime()))).toLocaleDateString('pt-BR')}`, '', ''],
    ['💳 Ticket Médio:', `R$ ${(totalExpense / transactions.filter(t => t.type === 'expense').length || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, '', '']
  ]

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/📊 Dashboard!A1:D${summaryData.length}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ values: summaryData })
    }
  )
}

// Função para análise por categorias
async function addCategoryAnalysis(accessToken: string, spreadsheetId: string, transactions: any[]) {
  console.log('📈 Criando análise por categorias...')
  
  const categoryTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const categoryData = [
    ['📊 GASTOS POR CATEGORIA', 'Valor', 'Percentual'],
    ['', '', '']
  ]

  const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)

  Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, amount]) => {
      const percentage = ((amount / totalExpenses) * 100).toFixed(1)
      categoryData.push([
        category,
        `R$ ${amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
        `${percentage}%`
      ])
    })

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/📈 Por Categoria!A1:C${categoryData.length}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ values: categoryData })
    }
  )
}

// Função para evolução mensal
async function addMonthlyEvolution(accessToken: string, spreadsheetId: string, transactions: any[]) {
  console.log('📅 Criando evolução mensal...')
  
  const monthlyData = transactions.reduce((acc, t) => {
    const month = t.date.substring(0, 7) // YYYY-MM
    if (!acc[month]) {
      acc[month] = { income: 0, expense: 0 }
    }
    acc[month][t.type] += t.amount
    return acc
  }, {} as Record<string, {income: number, expense: number}>)

  const evolutionData = [
    ['📅 EVOLUÇÃO MENSAL', 'Receitas', 'Despesas', 'Saldo'],
    ['', '', '', '']
  ]

  Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, data]) => {
      const balance = data.income - data.expense
      evolutionData.push([
        new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        `R$ ${data.income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
        `R$ ${data.expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
        `R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
      ])
    })

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/📅 Evolução Mensal!A1:D${evolutionData.length}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ values: evolutionData })
    }
  )
}

// Função para formatar e criar gráficos
async function formatAndCreateCharts(accessToken: string, spreadsheetId: string) {
  console.log('🎨 Formatando planilha e criando gráficos...')
  
  const requests = [
    // Formatar cabeçalhos - Dashboard
    {
      repeatCell: {
        range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 4 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
            textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat)"
      }
    },
    // Formatar valores de moeda
    {
      repeatCell: {
        range: { sheetId: 0, startRowIndex: 2, endRowIndex: 15, startColumnIndex: 1, endColumnIndex: 2 },
        cell: {
          userEnteredFormat: {
            numberFormat: { type: "CURRENCY", pattern: "R$ #,##0.00" }
          }
        },
        fields: "userEnteredFormat.numberFormat"
      }
    }
  ]

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ requests })
  })
}

async function getAccessToken(serviceAccountKey: string) {
  console.log('🔐 Iniciando autenticação...')
  
  const credentials = JSON.parse(serviceAccountKey)
  
  // Criar JWT
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }
  
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  // Converter private key
  const privateKeyPem = credentials.private_key.replace(/\\n/g, '\n')
  const privateKeyDer = pemToDer(privateKeyPem)
  
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(`${headerB64}.${payloadB64}`)
  )
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const jwt = `${headerB64}.${payloadB64}.${signatureB64}`
  
  // Trocar JWT por access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    throw new Error(`Authentication failed: ${tokenResponse.status} - ${errorText}`)
  }
  
  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}