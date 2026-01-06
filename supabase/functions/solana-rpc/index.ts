import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Public Solana RPC endpoints (fallback chain)
const SOLANA_RPC_URLS = [
  "https://solana-mainnet.g.alchemy.com/v2/demo",
  "https://rpc.ankr.com/solana",
  "https://api.mainnet-beta.solana.com"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    console.log('RPC Request:', body.method);

    let lastError = null;
    
    // Try each RPC endpoint until one works
    for (const rpcUrl of SOLANA_RPC_URLS) {
      try {
        console.log('Trying RPC:', rpcUrl.split('/')[2]);
        
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        
        // Check if there's an RPC error (not HTTP error)
        if (data.error && (data.error.code === -32401 || data.error.message?.includes('rate limit'))) {
          console.log('RPC error, trying next endpoint:', data.error.message);
          lastError = data.error.message;
          continue;
        }

        console.log('RPC success from:', rpcUrl.split('/')[2]);
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fetchError: unknown) {
        const errMsg = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
        console.log('Fetch error, trying next endpoint:', errMsg);
        lastError = errMsg;
        continue;
      }
    }

    // All endpoints failed
    console.error('All RPC endpoints failed:', lastError);
    return new Response(
      JSON.stringify({ error: 'All RPC endpoints failed', details: lastError }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Solana RPC proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
