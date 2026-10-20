export function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function smoothProgress(start: number, end: number, value: number) {
  const progress = clampProgress((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

// Original V2 geometry: both curved edges overscan throughout the covered handoff.
export function waveShape(progress: number) {
  const enter = clampProgress(progress / 0.44);
  const exit = clampProgress((progress - 0.56) / 0.44);
  const top = 1130 - enter * 1320 - exit * 1330;
  const bottom = top + 1440;
  const dy = 38 * Math.sin(progress * Math.PI * 2);
  return `M0 ${top + 40} C195 ${top - 65 + dy} 336 ${top + 115} 540 ${top + 5} S845 ${top - 48} 1000 ${top + 26} L1000 ${bottom + 32} C735 ${bottom - 110} 670 ${bottom + 80} 445 ${bottom + 15} S135 ${bottom - 46} 0 ${bottom + 34} Z`;
}
