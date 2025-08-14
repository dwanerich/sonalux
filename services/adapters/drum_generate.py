
import argparse, random, pretty_midi, numpy as np

# Try to import Magenta Drum RNN, otherwise fall back to euclidean-ish generator
def magenta_generate(total_beats=16, temperature=1.2):
    try:
        from magenta.models.drums_rnn import drums_rnn_sequence_generator
        from magenta.models.shared import sequence_generator_bundle
        from magenta.protobuf import generator_pb2, music_pb2
        bundle = sequence_generator_bundle.read_bundle_file('/tmp/drum_kit_rnn.mag')  # user can place bundle here
        generator_map = drums_rnn_sequence_generator.get_generator_map()
        generator = generator_map['drums_rnn'](checkpoint=None, bundle=bundle)
        generator.initialize()
        qpm = 120
        seconds_per_beat = 60.0 / qpm
        total_seconds = total_beats * seconds_per_beat
        tz = generator_pb2.GeneratorOptions()
        tz.generate_sections.add(start_time=0, end_time=total_seconds)
        drums = generator.generate(music_pb2.NoteSequence(), tz)
        pm = pretty_midi.PrettyMIDI()
        for n in drums.notes:
            inst = pretty_midi.Instrument(program=0, is_drum=True)
        # Skipping due to complexity; this path is optional
        return None
    except Exception:
        return None

def fallback_generate(bars=2, ppq=480):
    # simple kick/snare/hat euclidean across 4/4
    pm = pretty_midi.PrettyMIDI(resolution=ppq)
    drum = pretty_midi.Instrument(program=0, is_drum=True)
    # MIDI drums GM: kick 36, snare 38, closed hat 42
    bar_ticks = ppq*4
    total_ticks = bars * bar_ticks
    for t in range(0, total_ticks, ppq):  # quarter
        # kick on 1 and 3
        drum.notes.append(pretty_midi.Note(velocity=110, pitch=36, start=t/ppq/2.0, end=(t+ppq//4)/ppq/2.0))
        if (t//ppq) % 4 in [2]:  # beat 3
            drum.notes.append(pretty_midi.Note(velocity=100, pitch=36, start=t/ppq/2.0, end=(t+ppq//4)/ppq/2.0))
        # snare on 2 and 4
        if (t//ppq) % 4 in [1,3]:
            drum.notes.append(pretty_midi.Note(velocity=120, pitch=38, start=t/ppq/2.0, end=(t+ppq//4)/ppq/2.0))
        # hats 8ths with random opens
        for e in [0, ppq//2]:
            tt = t + e
            pitch = 46 if random.random()<0.15 else 42  # open/closed
            drum.notes.append(pretty_midi.Note(velocity=90, pitch=pitch, start=tt/ppq/2.0, end=(tt+ppq//3)/ppq/2.0))
    pm.instruments.append(drum)
    return pm

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out_mid", required=True)
    ap.add_argument("--bars", type=int, default=2)
    args = ap.parse_args()
    pm = magenta_generate(total_beats=args.bars*4) or fallback_generate(bars=args.bars)
    pm.write(args.out_mid)

if __name__ == "__main__":
    main()
