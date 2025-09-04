export function formatDateTime(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d);
}

export function nowISO() {
  return new Date().toISOString();
}

