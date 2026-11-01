/* Generated landscape art for popular-route cards (data: URI backgrounds, identical to v5). */
export const SCENE_PAL = [['#ffb86b', '#ff6b6b', '#5b3a8a', '#2b2350'], ['#9be7ff', '#4f9de8', '#2f5fa8', '#173363'], ['#ffe29a', '#ffa45c', '#c2485d', '#4a2245'], ['#b8f0c8', '#4fbf8c', '#2a7a6a', '#123d3f'], ['#ffd1e8', '#e37fb1', '#8c4f9e', '#3b2759'], ['#cde3ff', '#7fa8e3', '#4a6aa8', '#22305c']];
export function sceneUri(i: number) {
  const [a, b, c, d] = SCENE_PAL[i % SCENE_PAL.length], o = (i * 37) % 120;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="220" fill="url(#s)"/><circle cx="${300 - o}" cy="70" r="26" fill="#fff" opacity=".55"/><path d="M0 150L${60 + o / 3} 80 ${130 + o / 4} 125 ${200 + o / 5} 60 ${280 - o / 4} 120 ${340} 85 400 130V220H0z" fill="${c}" opacity=".85"/><path d="M${200 + o / 5} 60l-14 16 7-2 7 6 7-6 7 2z" fill="#fff" opacity=".8"/><path d="M0 190Q100 150 200 180T400 170V220H0z" fill="${d}"/><path d="M0 205Q120 190 220 200T400 196" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="8 8"/></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/'/g, '%27');
}
