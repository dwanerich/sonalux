from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import faiss, numpy as np, re

app = FastAPI()
emb = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
zshot = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

INDEX = faiss.read_index("refbank/idx/refs.faiss")
IDS = open("refbank/idx/ids.txt").read().splitlines()

GENRES = ["trap","pop","rnb","afro","edm"]
MOODS  = ["dark","moody","hype","chill","bright"]
BPM_RE = re.compile(r"(\d{2,3})\s*bpm", re.I)
KEYS = ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"]

class Req(BaseModel):
    prompt: str
    genre: str | None = None
    mood: str | None = None
    intensity: str | None = None

@app.post("/map")
def map_prompt(r: Req):
    genre = r.genre or zshot(r.prompt, GENRES)["labels"][0]
    mood  = r.mood  or zshot(r.prompt, MOODS)["labels"][0]
    inten = r.intensity or "med"
    vec = emb.encode([r.prompt], normalize_embeddings=True).astype(np.float32)
    D, I = INDEX.search(vec, 5)
    refs = [IDS[i] for i in I[0]]
    bpm_hint = None
    m = BPM_RE.search(r.prompt)
    if m:
        try: bpm_hint = int(m.group(1))
        except: pass
    key_hint = None
    for k in KEYS:
        if re.search(fr"\b{k}[mM]?(in)?\b", r.prompt):
            key_hint = k; break
    return {"rsg_id": f"{genre}:{mood}:v1", "controls": {"genre": genre, "mood": mood, "intensity": inten}, "refs_used": refs, "targets": {"bpm_hint": bpm_hint, "key_hint": key_hint}}
