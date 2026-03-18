/** Format monétaire français */
export function fMoney(n) {
  return Math.round(n).toLocaleString("fr-FR");
}

/** Générer un ID unique */
export function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Clamp a value between min and max */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
