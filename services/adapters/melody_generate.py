
import argparse, random, pretty_midi

SCALES = {
    "aeolian": [0,2,3,5,7,8,10],
    "ionian": [0,2,4,5,7,9,11]
}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out_mid", required=True)
    ap.add_argument("--bars", type=int, default=2)
    ap.add_argument("--key", default="C")
    ap.add_argument("--scale", default="aeolian")
    args = ap.parse_args()
    steps = SCALES.get(args.scale, SCALES["aeolian"])
    base_map = { 'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11 }
    base = base_map.get(args.key, 0)

    pm = pretty_midi.PrettyMIDI(resolution=480)
    inst = pretty_midi.Instrument(program=81)  # Lead 2 (sawtooth)
    tick = 0
    ppq = pm.resolution
    bar_ticks = ppq*4
    total = args.bars * bar_ticks
    while tick < total:
        step = random.choice(steps)
        octv = random.choice([5,6])
        pitch = 12*octv + base + step
        dur = random.choice([ppq//2, ppq, ppq + ppq//2])
        inst.notes.append(pretty_midi.Note(velocity=96, pitch=pitch, start=tick/ppq/2.0, end=(tick+dur)/ppq/2.0))
        tick += dur
    pm.instruments.append(inst)
    pm.write(args.out_mid)

if __name__ == "__main__":
    main()
