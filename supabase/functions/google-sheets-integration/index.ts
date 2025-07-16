
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
    const { action, transactions, sheetsId } = await req.json()
    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY')
    
    if (!apiKey) {
      throw new Error('Google Sheets API key not configured')
    }

    console.log(`Google Sheets Integration - Action: ${action}`)

    if (action === 'create_complete_dashboard') {
      return await createCompleteDashboard(transactions, apiKey)
    } else if (action === 'update_sheets') {
      return await updateExistingSheets(transactions, sheetsId, apiKey)
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Google Sheets Integration error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function createCompleteDashboard(transactions: any[], apiKey: string) {
  // Criar uma nova planilha com estrutura completa
  const createResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: {
          title: `Dashboard Financeiro - ${new Date().toLocaleDateString('pt-BR')}`,
          locale: 'pt_BR',
          timeZone: 'America/Sao_Paulo'
        },
        sheets: [
          { properties: { title: 'Dashboard' } },
          { properties: { title: 'Transações' } },
          { properties: { title: 'Orçamento Mensal' } },
          { properties: { title: 'Metas Financeiras' } },
          { properties: { title: 'Análises' } },
          { properties: { title: 'Projeções' } },
          { properties: { title: 'Configurações' } }
        ]
      })
    }
  )

  if (!createResponse.ok) {
    throw new Error('Erro ao criar planilha no Google Sheets')
  }

  const newSheet = await createResponse.json()
  const spreadsheetId = newSheet.spreadsheetId

  // Estruturar dados para inserção
  const sheetData = prepareSheetData(transactions)
  
  // Inserir dados em todas as abas
  await insertDataToSheets(spreadsheetId, sheetData, apiKey)
  
  // Criar gráficos e formatação
  await createChartsAndFormatting(spreadsheetId, apiKey)

  return new Response(
    JSON.stringify({ 
      success: true, 
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      message: 'Dashboard completo criado com sucesso!'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function prepareSheetData(transactions: any[]) {
  const monthlyIncome = 1682
  const fixedExpenses = { faculdade: 509, celular: 40, academia: 89 }
  const totalFixedExpenses = Object.values(fixedExpenses).reduce((sum, val) => sum + val, 0)

  // Preparar dados das transações
  const transactionsData = [
    ['Data', 'Descrição', 'Categoria', 'Método de Pagamento', 'Valor', 'Tipo', 'Status'],
    ...transactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.description,
      t.category,
      t.paymentMethod,
      t.amount,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.status === 'paid' ? 'Pago' : 'Pendente'
    ])
  ]

  // Dados do dashboard principal
  const dashboardData = [
    ['DASHBOARD FINANCEIRO PESSOAL', '', '', '', ''],
    ['', '', '', '', ''],
    ['💰 RESUMO EXECUTIVO', '', '', '', ''],
    ['Salário Mensal Líquido', `R$ ${monthlyIncome.toLocaleString('pt-BR')}`, '', '', ''],
    ['Gastos Fixos Totais', `R$ ${totalFixedExpenses.toLocaleString('pt-BR')}`, '', '', ''],
    ['Renda Livre Disponível', `R$ ${(monthlyIncome - totalFixedExpenses).toLocaleString('pt-BR')}`, '', '', ''],
    ['', '', '', '', ''],
    ['📊 ANÁLISE DO MÊS ATUAL', '', '', '', ''],
    ['Total de Receitas', '=SUMIF(Transações!F:F,"Receita",Transações!E:E)', '', '', ''],
    ['Total de Despesas', '=SUMIF(Transações!F:F,"Despesa",Transações!E:E)', '', '', ''],
    ['Saldo do Mês', '=B9-B10', '', '', ''],
    ['Taxa de Uso da Renda Livre', '=B10/B6', '', '', ''],
    ['', '', '', '', ''],
    ['🎯 METAS FINANCEIRAS', '', '', '', ''],
    ['Reserva de Emergência (Meta: 3 salários)', `R$ ${(monthlyIncome * 3).toLocaleString('pt-BR')}`, '', '', ''],
    ['Progresso Reserva', '=B16*0.2', 'Meta atingida:', '=B17/B16', ''],
    ['Meta do Baixo Musical', 'R$ 2.000,00', '', '', ''],
    ['Progresso Baixo', '=B16*0.15', 'Meta atingida:', '=B19/B18', '']
  ]

  // Dados do orçamento mensal
  const budgetData = [
    ['ORÇAMENTO MENSAL DETALHADO', '', '', '', ''],
    ['', '', '', '', ''],
    ['Categoria', 'Planejado', 'Realizado', 'Diferença', 'Status'],
    ['RECEITAS', '', '', '', ''],
    ['Salário', monthlyIncome, '=SUMIF(Transações!F:F,"Receita",Transações!E:E)', '=C5-B5', '=IF(C5>=B5,"✅","⚠️")'],
    ['', '', '', '', ''],
    ['GASTOS FIXOS', '', '', '', ''],
    ['Faculdade', 509, '=SUMIF(Transações!C:C,"Educação",Transações!E:E)', '=C8-B8', '=IF(C8<=B8,"✅","🚨")'],
    ['Celular', 40, '=SUMIF(Transações!C:C,"Telefone",Transações!E:E)', '=C9-B9', '=IF(C9<=B9,"✅","🚨")'],
    ['Academia', 89, '=SUMIF(Transações!C:C,"Saúde",Transações!E:E)', '=C10-B10', '=IF(C10<=B10,"✅","🚨")'],
    ['', '', '', '', ''],
    ['GASTOS VARIÁVEIS', '', '', '', ''],
    ['Alimentação', 300, '=SUMIF(Transações!C:C,"Alimentação",Transações!E:E)', '=C13-B13', '=IF(C13<=B13,"✅","🚨")'],
    ['Transporte', 150, '=SUMIF(Transações!C:C,"Transporte",Transações!E:E)', '=C14-B14', '=IF(C14<=B14,"✅","🚨")'],
    ['Lazer', 200, '=SUMIF(Transações!C:C,"Lazer",Transações!E:E)', '=C15-B15', '=IF(C15<=B15,"✅","🚨")'],
    ['Compras Pessoais', 150, '=SUMIF(Transações!C:C,"Compras",Transações!E:E)', '=C16-B16', '=IF(C16<=B16,"✅","🚨")'],
    ['', '', '', '', ''],
    ['INVESTIMENTOS E METAS', '', '', '', ''],
    ['Reserva de Emergência', 300, '=SUMIF(Transações!C:C,"Investimento",Transações!E:E)*0.6', '=C19-B19', '=IF(C19>=B19,"✅","⚠️")'],
    ['Baixo Musical', 200, '=SUMIF(Transações!C:C,"Investimento",Transações!E:E)*0.4', '=C20-B20', '=IF(C20>=B20,"✅","⚠️")'],
    ['', '', '', '', ''],
    ['TOTAIS', '', '', '', ''],
    ['Total Planejado', '=SUM(B5,B8:B10,B13:B16,B19:B20)', '', '', ''],
    ['Total Realizado', '=SUM(C5,C8:C10,C13:C16,C19:C20)', '', '', ''],
    ['Diferença Final', '=B23-B24', '', '', '']
  ]

  return {
    transactions: transactionsData,
    dashboard: dashboardData,
    budget: budgetData
  }
}

async function insertDataToSheets(spreadsheetId: string, sheetData: any, apiKey: string) {
  const requests = [
    {
      range: 'Transações!A1',
      values: sheetData.transactions
    },
    {
      range: 'Dashboard!A1',
      values: sheetData.dashboard
    },
    {
      range: 'Orçamento Mensal!A1',
      values: sheetData.budget
    }
  ]

  for (const request of requests) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${request.range}?valueInputOption=USER_ENTERED&key=${apiKey}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: request.values
        })
      }
    )
  }
}

async function createChartsAndFormatting(spreadsheetId: string, apiKey: string) {
  // Criar gráficos e formatação avançada
  const requests = [
    // Formatação do cabeçalho
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 5
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
            textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
          }
        },
        fields: 'userEnteredFormat'
      }
    },
    // Gráfico de pizza para gastos por categoria
    {
      addChart: {
        chart: {
          spec: {
            title: 'Gastos por Categoria',
            pieChart: {
              domain: {
                sourceRange: {
                  sources: [{
                    sheetId: 1,
                    startRowIndex: 1,
                    endRowIndex: 20,
                    startColumnIndex: 2,
                    endColumnIndex: 3
                  }]
                }
              },
              series: {
                sourceRange: {
                  sources: [{
                    sheetId: 1,
                    startRowIndex: 1,
                    endRowIndex: 20,
                    startColumnIndex: 4,
                    endColumnIndex: 5
                  }]
                }
              }
            }
          },
          position: {
            overlayPosition: {
              anchorCell: { sheetId: 0, rowIndex: 25, columnIndex: 0 }
            }
          }
        }
      }
    }
  ]

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    }
  )
}

async function updateExistingSheets(transactions: any[], sheetsId: string, apiKey: string) {
  const sheetData = prepareSheetData(transactions)
  
  // Atualizar apenas os dados das transações
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Transações!A1:clear?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } }
  )

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Transações!A1?valueInputOption=USER_ENTERED&key=${apiKey}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: sheetData.transactions })
    }
  )

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Planilha atualizada com sucesso!'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
