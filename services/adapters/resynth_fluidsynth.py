
import argparse, subprocess, os, sys

def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--sf2", required=True)
  ap.add_argument("--mid", required=True)
  ap.add_argument("--out", required=True)
  ap.add_argument("--gain", default="0.5")
  args = ap.parse_args()
  # fluidsynth -F out.wav -g 0.7 sf2file midifile
  cmd = ["fluidsynth", "-F", args.out, "-g", args.gain, args.sf2, args.mid]
  p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
  if p.returncode != 0:
    sys.stderr.write(p.stderr.decode("utf-8"))
    sys.exit(p.returncode)

if __name__ == "__main__":
  main()
