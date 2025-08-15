// route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ ok: true, route: '/api/wild-card-upload' });
}

export async function POST(req) {
  const form = await req.formData().catch(()=>null);
  const hasFile = !!form?.get('file');
  return Response.json({ ok: true, stage: 'dry', hasFile });
}
