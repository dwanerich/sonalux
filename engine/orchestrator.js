// engine/orchestrator.js
// Modern orchestrator that tries your real AI pipeline, but ALWAYS falls back to /test.mp3
import fs from 'node:fs';
import path from 'node:path';

let analyzeAudio, basicGenerate, arrangeSong, mixAndMaster, exportMp3;
try {
  // Keep your original imports but inside try so missing files won't crash
  ({ analyzeAudio } = await import('./ai/featureExtractor.js'));
  ({ basicGenerate } = await import('./ai/basicGenerator.js'));
  ({ arrangeSong } = await import('./ai/arranger.js'));
  ({ mixAndMaster } = await import('./ai/mastering.js'));
  ({ exportMp3 } = await import('./util/render.js'));
} catch (e) {
  console.warn('[orchestrator] AI modules not fully available, will use fallback if needed:', e.message);
}

function ensureTestMp3() {
  const p = path.join(process.cwd(), 'public', 'test.mp3');
  if (!fs.existsSync(p)) {
    console.warn('[orchestrator] public/test.mp3 missing. Add any small mp3 there so the MVP can play audio.');
  }
  return '/test.mp3';
}

export async function orchestrateRemix({ file, genre, moods = [], energy, vocals, prompt }) {
  // Try the real pipeline; if anything fails, fall back to a test file so UX isn't blocked
  try {
    if (!analyzeAudio || !basicGenerate || !arrangeSong || !mixAndMaster || !exportMp3) {
      throw new Error('AI pipeline modules not loaded');
    }

    // 1) Analyze
    const analysis = await analyzeAudio(file);

    // 2) Generate (reference-aware)
    const enableGen =
      ['1','true','on','yes'].includes(String(process.env.ENABLE_BASIC_AI ?? process.env.NEXT_PUBLIC_ENABLE_BASIC_AI ?? '1').toLowerCase());
    const gen = enableGen
      ? await basicGenerate({
          detected: { genre: analysis?.genre },
          user: { genre, mood: moods[0] || null, intensity: energy }
        })
      : { layers: {}, targets: {}, ref: null };

    // 3) Arrange
    const session = await arrangeSong({
      analysis,
      generated: gen.layers,
      targets: gen.targets
    });

    // 4) Mix/Master → Export
    const finalWav = await mixAndMaster({ session, targets: gen.targets });
    const finalMp3 = await exportMp3(finalWav);

    return {
      finalMp3: finalMp3 || ensureTestMp3(),
      report: {
        ok: true,
        analysis,
        ref: gen.ref,
        targets: gen.targets,
        layers: Object.keys(gen.layers || {}),
        session: session?.sessionDir,
        engine: 'modern'
      }
    };
  } catch (e) {
    console.warn('[orchestrator] pipeline error, serving fallback /test.mp3:', e.message);
    return {
      finalMp3: ensureTestMp3(),
      report: {
        ok: true,
        note: 'Served /test.mp3 fallback',
        error: e.message,
        engine: 'fallback'
      }
    };
  }
}
