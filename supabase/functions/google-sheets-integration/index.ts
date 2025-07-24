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
    
    console.log('🚀 Iniciando criação do dashboard completo...')
    
    // 1. Limpar planilha primeiro
    console.log('🧹 Passo 1: Limpando planilha...')
    await clearExistingSheets(accessToken, existingSheetId)
    console.log('✅ Planilha limpa!')
    
    // 2. Criar as abas necessárias e obter IDs
    console.log('📋 Passo 2: Criando abas...')
    const sheetIds = await createWorksheetTabs(accessToken, existingSheetId)
    console.log('✅ Abas criadas! IDs:', sheetIds)
    
    // 3. Adicionar dados das transações
    console.log('💰 Passo 3: Adicionando transações...')
    await addTransactionsData(accessToken, existingSheetId, transactions, sheetIds.transactionsId)
    console.log('✅ Transações adicionadas!')
    
    // 4. Adicionar resumo financeiro
    console.log('📊 Passo 4: Criando resumo financeiro...')
    await addFinancialSummary(accessToken, existingSheetId, transactions, sheetIds.dashboardId)
    console.log('✅ Resumo financeiro criado!')
    
    // 5. Adicionar análise por categorias
    console.log('📈 Passo 5: Criando análise por categorias...')
    await addCategoryAnalysis(accessToken, existingSheetId, transactions, sheetIds.categoryId)
    console.log('✅ Análise por categorias criada!')
    
    // 6. Adicionar evolução mensal
    console.log('📅 Passo 6: Criando evolução mensal...')
    await addMonthlyEvolution(accessToken, existingSheetId, transactions, sheetIds.monthlyId)
    console.log('✅ Evolução mensal criada!')
    
    // 7. Formatar e criar gráficos
    console.log('🎨 Passo 7: Formatando planilha...')
    await formatAndCreateCharts(accessToken, existingSheetId, sheetIds)
    console.log('✅ Formatação aplicada!')

    console.log('🎉 Dashboard completo criado com sucesso!')

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

// Função para limpar sheets existentes
async function clearExistingSheets(accessToken: string, spreadsheetId: string) {
  console.log('🧹 Limpando sheets existentes...')
  
  try {
    // Obter informações da planilha para ver quais sheets existem
    const spreadsheetInfo = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!spreadsheetInfo.ok) {
      console.log('⚠️ Erro ao obter info da planilha, continuando...')
      return
    }
    
    const info = await spreadsheetInfo.json()
    const requests = []
    
    // Deletar sheets específicos se existirem
    const sheetsToDelete = ['📊 Dashboard', '💰 Transações', '📈 Por Categoria', '📅 Evolução Mensal']
    
    for (const sheet of info.sheets || []) {
      if (sheetsToDelete.includes(sheet.properties.title)) {
        requests.push({
          deleteSheet: {
            sheetId: sheet.properties.sheetId
          }
        })
      }
    }
    
    if (requests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ requests })
      })
      console.log('✅ Sheets antigos deletados!')
    }
    
  } catch (error) {
    console.log('⚠️ Erro ao limpar sheets (pode ser normal):', error.message)
  }
}

// Função para criar as abas/sheets
async function createWorksheetTabs(accessToken: string, spreadsheetId: string) {
  console.log('📋 Criando abas do dashboard...')
  
  try {
    const requests = [
      // Aba Dashboard
      {
        addSheet: {
          properties: {
            title: "Dashboard",
            gridProperties: { rowCount: 100, columnCount: 26 }
          }
        }
      },
      // Aba Transações
      {
        addSheet: {
          properties: {
            title: "Transacoes",
            gridProperties: { rowCount: 1000, columnCount: 10 }
          }
        }
      },
      // Aba Categorias
      {
        addSheet: {
          properties: {
            title: "Por Categoria",
            gridProperties: { rowCount: 50, columnCount: 15 }
          }
        }
      },
      // Aba Evolução
      {
        addSheet: {
          properties: {
            title: "Evolucao Mensal",
            gridProperties: { rowCount: 50, columnCount: 15 }
          }
        }
      }
    ]

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ requests })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('⚠️ Erro ao criar abas:', errorText)
      // Continuar mesmo com erro
    } else {
      const result = await response.json()
      console.log('📋 Resultado da criação:', result)
    }
    
    // Buscar os IDs das sheets criadas
    const sheetInfo = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    
    const info = await sheetInfo.json()
    const sheets = info.sheets || []
    
    const sheetIds = {
      dashboardId: sheets.find(s => s.properties.title === "Dashboard")?.properties.sheetId,
      transactionsId: sheets.find(s => s.properties.title === "Transacoes")?.properties.sheetId,
      categoryId: sheets.find(s => s.properties.title === "Por Categoria")?.properties.sheetId,
      monthlyId: sheets.find(s => s.properties.title === "Evolucao Mensal")?.properties.sheetId,
    }
    
    console.log('📋 IDs das sheets:', sheetIds)
    return sheetIds
    
  } catch (error) {
    console.log('❌ Erro ao criar abas:', error.message)
    throw error
  }
}

// Função para adicionar dados das transações
async function addTransactionsData(accessToken: string, spreadsheetId: string, transactions: any[], sheetId?: number) {
  console.log('💰 Adicionando dados das transações...')
  console.log('💰 Total de transações:', transactions.length)
  
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
  console.log('💰 Dados preparados - linhas:', allData.length)

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transacoes!A1:G${allData.length}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ values: allData })
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Erro ao adicionar transações:', errorText)
    } else {
      console.log('✅ Transações enviadas com sucesso!')
    }
  } catch (error) {
    console.log('❌ Erro ao adicionar transações:', error.message)
  }
}

// Função para adicionar resumo financeiro
async function addFinancialSummary(accessToken: string, spreadsheetId: string, transactions: any[], sheetId?: number) {
  console.log('📊 Criando resumo financeiro...')
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense
  
  console.log('📊 Calculados - Receitas:', totalIncome, 'Despesas:', totalExpense, 'Saldo:', balance)
  
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

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Dashboard!A1:D${summaryData.length}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ values: summaryData })
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Erro ao adicionar resumo:', errorText)
    } else {
      console.log('✅ Resumo financeiro enviado!')
    }
  } catch (error) {
    console.log('❌ Erro ao adicionar resumo:', error.message)
  }
}

// Função para análise por categorias
async function addCategoryAnalysis(accessToken: string, spreadsheetId: string, transactions: any[], sheetId?: number) {
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

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Por Categoria!A1:C${categoryData.length}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ values: categoryData })
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Erro ao adicionar categorias:', errorText)
    } else {
      console.log('✅ Análise por categorias enviada!')
    }
  } catch (error) {
    console.log('❌ Erro ao adicionar categorias:', error.message)
  }
}

// Função para evolução mensal
async function addMonthlyEvolution(accessToken: string, spreadsheetId: string, transactions: any[], sheetId?: number) {
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

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Evolucao Mensal!A1:D${evolutionData.length}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ values: evolutionData })
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Erro ao adicionar evolução mensal:', errorText)
    } else {
      console.log('✅ Evolução mensal enviada!')
    }
  } catch (error) {
    console.log('❌ Erro ao adicionar evolução mensal:', error.message)
  }
}

// Função para formatar e criar gráficos
async function formatAndCreateCharts(accessToken: string, spreadsheetId: string, sheetIds?: any) {
  console.log('🎨 Formatando planilha e criando gráficos...')
  
  try {
    const requests = [
      // Formatar cabeçalhos - Dashboard
      {
        repeatCell: {
          range: { sheetId: sheetIds?.dashboardId || 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 4 },
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
          range: { sheetId: sheetIds?.dashboardId || 0, startRowIndex: 2, endRowIndex: 15, startColumnIndex: 1, endColumnIndex: 2 },
          cell: {
            userEnteredFormat: {
              numberFormat: { type: "CURRENCY", pattern: "R$ #,##0.00" }
            }
          },
          fields: "userEnteredFormat.numberFormat"
        }
      }
    ]

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ requests })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Erro ao formatar:', errorText)
    } else {
      console.log('✅ Formatação aplicada!')
    }
  } catch (error) {
    console.log('❌ Erro ao formatar:', error.message)
  }
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