import HNSWLib from 'hnswlib-node';

export function buildIndex(dim, space='cosine', maxElements=100000) {
  const idx = new HNSWLib(space, dim);
  idx.initIndex(maxElements, 16, 200); // M=16, efConstruction=200 (good default)
  return idx;
}

export function addVectors(idx, vectors, ids) {
  idx.addPoints(vectors, ids); // ids: int[] same length as vectors
}

export function search(idx, qVec, k=5, efSearch=64) {
  idx.setEf(efSearch);
  const { neighbors, distances } = idx.searchKNN(qVec, k);
  return neighbors.map((id, i) => ({ id, score: 1 - distances[i] })); // cosine → similarity
}
