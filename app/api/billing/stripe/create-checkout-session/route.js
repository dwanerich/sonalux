
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req){
  try{
    const { mode='payment', priceId } = await req.json();
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId || (mode==='subscription'? process.env.STRIPE_PRICE_SUB : process.env.STRIPE_PRICE_PRO), quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/?paid=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/?paid=0`
    });
    return NextResponse.json({ ok:true, url: session.url });
  }catch(e){
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
