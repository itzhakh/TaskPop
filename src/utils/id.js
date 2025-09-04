export function uid(prefix = "") {
  if (crypto && crypto.randomUUID) return prefix + crypto.randomUUID();
  const rnd = Math.random().toString(36).slice(2, 10);
  return prefix + Date.now().toString(36) + rnd;
}

