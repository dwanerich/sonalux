import json, pathlib, faiss, numpy as np
from sentence_transformers import SentenceTransformer

def main():
  model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
  texts, ids = [], []
  with open("refbank/refs.jsonl") as f:
    for line in f:
      obj = json.loads(line)
      ids.append(obj["id"])
      blob = " ".join([obj.get("title",""), " ".join(obj.get("tags",[])), obj.get("notes","")])
      texts.append(blob.strip())
  emb = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
  index = faiss.IndexFlatIP(emb.shape[1]); index.add(emb.astype(np.float32))
  pathlib.Path("refbank/idx").mkdir(parents=True, exist_ok=True)
  faiss.write_index(index, "refbank/idx/refs.faiss")
  with open("refbank/idx/ids.txt","w") as f: f.write("\n".join(ids))
  print(f"indexed {len(ids)} refs")

if __name__ == "__main__":
  main()
