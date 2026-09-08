/**
 * Safely joins a base URL and a path, preventing double slashes.
 * 
 * @param base The base URL (e.g., "http://localhost:8001" or "/")
 * @param path The path to append (e.g., "/api/simulations")
 * @returns The joined URL
 */
export function joinUrl(base: string, path: string): string {
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  if (!path) return base.replace(/\/+$/, "");
  
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  
  return `${normalizedBase}/${normalizedPath}`;
}
