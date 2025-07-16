
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transactions } = await req.json()
    
    console.log('Exporting transactions:', transactions?.length || 0)
    
    // Criar dados formatados para a planilha
    const csvData = [
      ['Data', 'Descrição', 'Categoria', 'Método de Pagamento', 'Valor', 'Tipo', 'Status'],
      ...transactions.map((t: any) => [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.description,
        t.category,
        t.paymentMethod,
        t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        t.type === 'income' ? 'Receita' : 'Despesa',
        t.status === 'paid' ? 'Pago' : 'Pendente'
      ])
    ];

    // Converter para CSV
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Retornar o CSV diretamente para download
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="transacoes_financeiras.csv"',
      },
    });

  } catch (error) {
    console.error('Export error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Export failed'
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
