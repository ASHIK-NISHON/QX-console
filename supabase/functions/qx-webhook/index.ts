import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  ProcedureTypeValue: number;
  ProcedureTypeName: string;
  sourceId: string;
  destId: string;
  amount: number | string;
  tickNumber: number;
  timestamp: string;
  moneyFlow: boolean;
  IssuerAddress: string;
  AssetName: string;
  Price: number;
  NumberOfShares: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawPayload = await req.json();
    
    // Handle array or single object
    const payloads: WebhookPayload[] = Array.isArray(rawPayload) ? rawPayload : [rawPayload];
    
    console.log('Received webhook payload:', JSON.stringify(payloads, null, 2));

    const results = [];
    
    for (const payload of payloads) {
      // Generate a unique tx_id from tickNumber and sourceId
      const txId = `${payload.tickNumber}-${payload.sourceId}-${Date.now()}`;
      
      // Parse timestamp - could be ISO string or unix timestamp
      let timestampMs: number;
      if (typeof payload.timestamp === 'string') {
        timestampMs = new Date(payload.timestamp).getTime();
      } else {
        timestampMs = payload.timestamp;
      }

      // Insert event into database
      const { data: eventData, error: eventError } = await supabase
        .from('qx_events')
        .insert({
          procedure_type_value: payload.ProcedureTypeValue,
          procedure_type_name: payload.ProcedureTypeName,
          source_id: payload.sourceId,
          dest_id: payload.destId,
          amount: String(payload.amount),
          tick_number: payload.tickNumber,
          tx_id: txId,
          timestamp: timestampMs,
          money_flew: payload.moneyFlow,
          issuer_address: payload.IssuerAddress,
          asset_name: payload.AssetName,
          price: payload.Price,
          number_of_shares: payload.NumberOfShares,
          raw_payload: payload,
        })
        .select()
        .single();

      if (eventError) {
        console.error('Error inserting event:', eventError);
        throw eventError;
      }

      console.log('Event inserted:', eventData?.id);

      // Upsert source wallet
      const { error: sourceWalletError } = await supabase
        .from('wallets')
        .upsert({
          address: payload.sourceId,
          last_seen_at: new Date().toISOString(),
        }, { 
          onConflict: 'address',
          ignoreDuplicates: false 
        });

      if (sourceWalletError) {
        console.error('Error upserting source wallet:', sourceWalletError);
      }

      results.push({ event_id: eventData?.id });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `${results.length} event(s) processed successfully` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
