import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  ProcedureTypeValue: number;
  ProcedureTypeName: string;
  RawTransaction: {
    transaction: {
      sourceId: string;
      destId: string;
      amount: string;
      tickNumber: number;
      inputType: number;
      inputSize: number;
      inputHex: string;
      signatureHex: string;
      txId: string;
    };
    timestamp: string;
    moneyFlew: boolean;
  };
  ParsedTransaction: {
    IssuerAddress: string;
    AssetName: string;
    Price: number;
    NumberOfShares: number;
  };
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

    const payload: WebhookPayload = await req.json();
    
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

    const { RawTransaction, ParsedTransaction, ProcedureTypeValue, ProcedureTypeName } = payload;
    const { transaction, timestamp, moneyFlew } = RawTransaction;

    // Insert event into database
    const { data: eventData, error: eventError } = await supabase
      .from('qx_events')
      .upsert({
        procedure_type_value: ProcedureTypeValue,
        procedure_type_name: ProcedureTypeName,
        source_id: transaction.sourceId,
        dest_id: transaction.destId,
        amount: transaction.amount,
        tick_number: transaction.tickNumber,
        tx_id: transaction.txId,
        input_type: transaction.inputType,
        input_hex: transaction.inputHex,
        signature_hex: transaction.signatureHex,
        timestamp: parseInt(timestamp),
        money_flew: moneyFlew,
        issuer_address: ParsedTransaction.IssuerAddress,
        asset_name: ParsedTransaction.AssetName,
        price: ParsedTransaction.Price,
        number_of_shares: ParsedTransaction.NumberOfShares,
        raw_payload: payload,
      }, { onConflict: 'tx_id' })
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
        address: transaction.sourceId,
        last_seen_at: new Date().toISOString(),
      }, { 
        onConflict: 'address',
        ignoreDuplicates: false 
      });

    if (sourceWalletError) {
      console.error('Error upserting source wallet:', sourceWalletError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: eventData?.id,
        message: 'Event processed successfully' 
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