from fastapi import FastAPI, Query
from pydantic import BaseModel
import os, json, time, glob, shutil
import numpy as np
import soundfile as sf
import librosa, faiss, openl3

BANK_DIR = "public/bank"
IDX_DIR  = os.path.join(BANK_DIR, "idx")
META_FN  = os.path.join(BANK_DIR, "bank_meta.jsonl")
EMB_FN   = os.path.join(IDX_DIR, "emb.npy")
IDS_FN   = os.path.join(IDX_DIR, "ids.txt")
FAISS_FN = os.path.join(IDX_DIR, "bank.faiss")

app = FastAPI()
@app.get("/health")
def health():
    return {"ok": True}

os.makedirs(BANK_DIR, exist_ok=True)
os.makedirs(IDX_DIR, exist_ok=True)

def _load_index():
  ids = []
  if os.path.exists(IDS_FN):
    with open(IDS_FN) as f: ids = [l.strip() for l in f if l.strip()]
  if os.path.exists(FAISS_FN):
    index = faiss.read_index(FAISS_FN)
  else:
    index = None
  emb = None
  if os.path.exists(EMB_FN):
    emb = np.load(EMB_FN)
  return ids, index, emb

def _save_index(ids, emb, index):
  os.makedirs(IDX_DIR, exist_ok=True)
  with open(IDS_FN, "w") as f: f.write("\n".join(ids))
  np.save(EMB_FN, emb)
  if index is not None:
    faiss.write_index(index, FAISS_FN)

def _append_item(meta, wav_path):
  # compute embedding with openl3
  y, sr = librosa.load(wav_path, sr=48000, mono=True)
  # openl3 returns (embeddings, timestamps)
  emb, ts = openl3.get_audio_embedding(y, sr, content_type="music", input_repr="mel256", embedding_size=512)
  vec = emb.mean(axis=0)  # simple average
  # write meta
  with open(META_FN, "a") as f:
    f.write(json.dumps(meta)+"\n")
  # update index
  ids, index, arr = _load_index()
  ids.append(meta["id"])
  arr = vec[None, :] if arr is None else np.vstack([arr, vec[None, :]])
  if index is None:
    index = faiss.IndexFlatIP(arr.shape[1])
  # normalize for cosine
  faiss.normalize_L2(arr)
  index.reset(); index.add(arr.astype(np.float32))
  _save_index(ids, arr, index)

class IngestBody(BaseModel):
  session_dir: str
  rsg_id: str
  controls: dict | None = None

@app.post("/ingest")
def ingest(b: IngestBody):
  # collect section mixes and drum polys as sources to chop
  sec_files = sorted(glob.glob(os.path.join(b.session_dir, "sec_*", "sec_mix.wav")))
  drum_files = sorted(glob.glob(os.path.join(b.session_dir, "sec_*", "drums_pol_*.wav")))
  added = []

  # loop generator: 2-bar loops from section mixes
  for p in sec_files:
    try:
      y, sr = librosa.load(p, sr=44100, mono=True)
      # 2 bars duration (approx) from bpm in guide name if available
      # fallback 120 bpm
      bpm = 120
      try:
        # parse bpm from rsg_id not reliable; kept simple
        bpm = 120
      except: pass
      bar = 240.0 / bpm  # seconds
      win = int(bar*2*sr)
      for i in range(0, len(y)-win, win):
        seg = y[i:i+win]
        if len(seg) < win: break
        uid = f"loop_{int(time.time()*1000)}_{i}"
        out = os.path.join(BANK_DIR, f"{uid}.wav")
        sf.write(out, seg, sr)
        meta = {"id": uid, "type":"loop", "url": f"/bank/{uid}.wav", "tags":[b.rsg_id, "loop"], "bpm": bpm, "key": None}
        _append_item(meta, out)
        added.append(meta["id"])
    except Exception as e:
      print("loop error", e)

  # one-shots from drums: onset slicing
  for p in drum_files:
    try:
      y, sr = librosa.load(p, sr=44100, mono=True)
      on = librosa.onset.onset_detect(y=y, sr=sr, backtrack=True, units='samples')
      for j, s in enumerate(on):
        end = min(len(y), s + int(0.25*sr))  # 250ms window
        seg = y[s:end]
        if np.max(np.abs(seg)) < 0.05: continue
        uid = f"shot_{int(time.time()*1000)}_{j}"
        out = os.path.join(BANK_DIR, f"{uid}.wav")
        sf.write(out, seg, sr)
        meta = {"id": uid, "type":"one_shot", "url": f"/bank/{uid}.wav", "tags":[b.rsg_id, "drums","one_shot"], "bpm": None, "key": None}
        _append_item(meta, out)
        added.append(meta["id"])
    except Exception as e:
      print("shot error", e)

  return {"ok": True, "added": added}

@app.get("/search")
def search(q: str = Query("", description="space-separated tags"), type: str = Query("any")):
  # simple metadata filter (no query embedding yet)
  items = []
  if os.path.exists(META_FN):
    with open(META_FN) as f:
      for line in f:
        try:
          o = json.loads(line)
          if type != "any" and o.get("type") != type: continue
          if q:
            need = q.lower().split()
            tags = " ".join(o.get("tags",[])).lower()
            if not all(tok in tags for tok in need): continue
          items.append(o)
        except: pass
  # map to public url assuming Next serves /refbank statically (public folder alternative)
  for it in items:
    # if running behind Next static, we can keep url as is
    pass
  return {"ok": True, "items": items[:50]}
