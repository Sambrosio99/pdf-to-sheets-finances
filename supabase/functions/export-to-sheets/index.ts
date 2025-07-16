
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
    
    // Get Google Sheets credentials from Supabase secrets
    const GOOGLE_CLIENT_ID = Deno.env.get('ID_DO_CLIENTE_DO_GOOGLE')
    
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Sheets credentials not configured')
    }

    // For now, return a mock response since we need to set up OAuth flow
    // In a real implementation, this would:
    // 1. Use OAuth to authenticate with Google
    // 2. Create a new spreadsheet
    // 3. Format the data and add it to sheets
    // 4. Return the spreadsheet URL

    console.log('Exporting transactions:', transactions?.length || 0)
    
    // Mock response - in production this would be the actual Google Sheets URL
    const mockSpreadsheetUrl = `https://docs.google.com/spreadsheets/d/mock-sheet-id/edit`
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        spreadsheetUrl: mockSpreadsheetUrl,
        message: 'Export functionality will be completed after Google OAuth setup'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

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
