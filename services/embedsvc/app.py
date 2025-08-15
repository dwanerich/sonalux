import io, numpy as np, soundfile as sf, openl3
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sonalux Embeddings (Audio Only)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health(): return {"ok": True, "clap": False}

def _pool(emb, mode="mean"):
    import numpy as np
    if isinstance(emb, np.ndarray) and emb.ndim > 1:
        return emb.mean(axis=0) if mode=="mean" else emb.max(axis=0)
    return emb

@app.post("/embed/audio")
async def embed_audio(file: UploadFile = File(...),
                      embedding_size: int = 512,
                      content_type: str = "music",
                      input_repr: str = "mel256",
                      pool: str = "mean"):
    try:
        data = await file.read()
        y, sr = sf.read(io.BytesIO(data), always_2d=False)
        if hasattr(y, "ndim") and y.ndim > 1: y = y.mean(axis=1)
        emb, _ = openl3.get_audio_embedding(y, sr,
            input_repr=input_repr, content_type=content_type, embedding_size=embedding_size)
        vec = _pool(emb, pool).astype(float)
        return {"embedding": vec.tolist(), "shape": list(emb.shape), "sr": int(sr),
                "model": f"openl3-{content_type}-{input_repr}-{embedding_size}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OpenL3 error: {e}")
