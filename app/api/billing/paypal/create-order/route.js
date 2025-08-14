
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import paypal from '@paypal/checkout-server-sdk';

function client(){
  const env = process.env.PAYPAL_ENV === 'live'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
  return new paypal.core.PayPalHttpClient(env);
}

export async function POST(req){
  try{
    const { value='9.99', currency='USD' } = await req.json();
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({ intent:'CAPTURE', purchase_units:[{ amount:{ currency_code:currency, value } }] });
    const r = await client().execute(request);
    return NextResponse.json({ ok:true, id: r.result.id });
  }catch(e){
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
