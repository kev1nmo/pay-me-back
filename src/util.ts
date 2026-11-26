export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

export const groupLink = (id: string) =>
  `${location.origin}${location.pathname}#/g/${id}`;
