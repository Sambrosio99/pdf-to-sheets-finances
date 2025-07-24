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
    console.log('🚀 Função Google Sheets iniciada')
    
    const { action, transactions, sheetsId } = await req.json()
    console.log('📊 Action:', action)
    console.log('📊 Transações:', transactions?.length || 0)
    
    // Verificar todos os secrets disponíveis
    const allEnvVars = Deno.env.toObject()
    console.log('🔍 Variáveis de ambiente disponíveis:', Object.keys(allEnvVars))
    
    // Tentar diferentes nomes de secrets
    const serviceAccountKey = 
      Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY') ||
      Deno.env.get('CHAVE_DA_CONTA_DO_SERVIÇO_DO_GOOGLE') || 
      Deno.env.get('CHAVE_API_DO_GOOGLE_SHEETS')
    
    console.log('🔑 Secret encontrado:', !!serviceAccountKey)
    
    if (!serviceAccountKey) {
      console.error('❌ NENHUM SECRET ENCONTRADO!')
      const availableSecrets = Object.keys(allEnvVars).filter(key => 
        key.includes('GOOGLE') || key.includes('CHAVE') || key.includes('KEY')
      )
      console.error('❌ Secrets relacionados disponíveis:', availableSecrets)
      
      return new Response(
        JSON.stringify({ 
          error: 'Google Service Account key not found',
          availableSecrets: availableSecrets,
          allKeys: Object.keys(allEnvVars)
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('✅ Secret encontrado! Tamanho:', serviceAccountKey.length)
    console.log('📄 Primeiros 100 chars:', serviceAccountKey.substring(0, 100))
    
    // Testar parse do JSON
    let credentials
    try {
      credentials = JSON.parse(serviceAccountKey)
      console.log('✅ JSON válido!')
      console.log('📧 Client email:', credentials.client_email)
      console.log('🏗️ Project ID:', credentials.project_id)
    } catch (parseError) {
      console.error('❌ Erro no parse do JSON:', parseError.message)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in service account key',
          parseError: parseError.message,
          keyPreview: serviceAccountKey.substring(0, 200)
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Testar autenticação
    console.log('🔐 Testando autenticação...')
    const accessToken = await getAccessToken(serviceAccountKey)
    console.log('✅ Access token obtido!')

    // Teste simples de criação de planilha
    console.log('📊 Testando criação de planilha...')
    
    const createResponse = await fetch(
      'https://sheets.googleapis.com/v4/spreadsheets',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          properties: {
            title: `Teste Dashboard - ${new Date().toLocaleString('pt-BR')}`,
            locale: 'pt_BR'
          }
        })
      }
    )

    console.log('📊 Status da criação:', createResponse.status)

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('❌ Erro na criação:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create spreadsheet',
          status: createResponse.status,
          details: errorText
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const newSheet = await createResponse.json()
    console.log('✅ Planilha criada com sucesso! ID:', newSheet.spreadsheetId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        spreadsheetId: newSheet.spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${newSheet.spreadsheetId}`,
        message: 'Teste de criação bem-sucedido!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro geral:', error)
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