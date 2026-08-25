export const AUTH_PROTECTED_PATHS = [
  '/requests',
  '/orders',
] as const;

export function isAuthProtectedPath(pathname: string): boolean {
  return AUTH_PROTECTED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
