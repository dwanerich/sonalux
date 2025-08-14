export function mulberry32(seed=1){
  let t = seed >>> 0;
  return function(){
    t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}
export const randInt = (r,a,b)=>Math.floor(r()*(b-a+1))+a;
export const choice = (r,arr)=>arr[Math.floor(r()*arr.length)];
