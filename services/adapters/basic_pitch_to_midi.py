
import argparse, os, numpy as np, soundfile as sf
from basic_pitch.inference import predict_and_save, load_model
from basic_pitch import ICASSP_2022_MODEL_PATH
import tempfile

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", required=True)
    ap.add_argument("--out_mid", required=True)
    args = ap.parse_args()

    model = load_model(ICASSP_2022_MODEL_PATH)
    tmpdir = tempfile.mkdtemp()
    predict_and_save([args.audio], output_dir=tmpdir, save_midi=True, save_model_outputs=False, sonify_midi=False, model_or_model_path=model)
    # grab first midi file created
    midi = None
    for f in os.listdir(tmpdir):
        if f.endswith(".mid") or f.endswith(".midi"):
            midi = os.path.join(tmpdir, f)
            break
    if not midi:
        open(args.out_mid,"wb").write(b"")  # empty
        return
    # move
    os.replace(midi, args.out_mid)

if __name__ == "__main__":
    main()
