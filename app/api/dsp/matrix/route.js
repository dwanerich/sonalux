'use server';

function buildFilter({ profile = 'clean', I = -12, TP = -1.0 }) {
  // shared mastering tail
  const master = `loudnorm=I=${I}:TP=${TP}:LRA=7,alimiter=limit=${Math.min(0.89, Math.pow(10, TP/20))}`;

  // basic building blocks (FFmpeg)
  const hiPass     = `highpass=f=30`;
  const lowShelf   = `equalizer=f=120:t=l:width_type=o:width=1.0:g=2`;
  const hiShelf    = `equalizer=f=8000:t=h:width_type=o:width=1.5:g=3`;
  const compGentle = `acompressor=ratio=2.5:threshold=-14dB:attack=12:release=120:makeup=3`;
  const compPunch  = `acompressor=ratio=4:threshold=-10dB:attack=5:release=60:makeup=4`;
  const dnorm      = `dynaudnorm=f=150:s=10`;

  let graph;
  switch (String(profile).toLowerCase()) {
    case 'gloss': // add air, gentle glue
      graph = [hiPass, hiShelf, compGentle, master].join(',');
      break;
    case 'punch': // transient focus + normalization
      graph = [hiPass, compPunch, dnorm, master].join(',');
      break;
    case 'warm': // low shelf + gentle comp
      graph = [hiPass, lowShelf, compGentle, master].join(',');
      break;
    case 'clean':
    default:
      graph = [hiPass, master].join(',');
  }
  return { profile, filtergraph: graph, I, TP };
}

export async function POST(req) {
  try {
    const { profile = 'clean', I = -12, TP = -1.0 } = await req.json();
    const res = buildFilter({ profile, I, TP });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: e.message }), { status: 500 });
  }
}
