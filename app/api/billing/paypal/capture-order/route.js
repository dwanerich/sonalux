
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
    const { orderId } = await req.json();
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const r = await client().execute(request);
    return NextResponse.json({ ok:true, result: r.result });
  }catch(e){
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
