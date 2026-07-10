const ADMIN_HOST_PREFIX = "admin.";

export function isAdminHost(hostname: string): boolean {
  return hostname.startsWith(ADMIN_HOST_PREFIX);
}

/** Origin of the main storefront, derived by stripping the "admin." prefix from the current host. */
export function getStoreOrigin(): string {
  if (typeof window === "undefined") return "";
  const { protocol, host } = window.location;
  const storeHost = host.startsWith(ADMIN_HOST_PREFIX) ? host.slice(ADMIN_HOST_PREFIX.length) : host;
  return `${protocol}//${storeHost}`;
}

/**
 * Resolves a canonical "/admin/..." path to the correct href for the current host.
 * On the admin subdomain, proxy.ts transparently rewrites bare paths to "/admin/...",
 * so links must drop the "/admin" prefix there to avoid a double "/admin/admin/..." 404.
 */
export function adminHref(canonicalAdminPath: string): string {
  if (typeof window !== "undefined" && isAdminHost(window.location.hostname)) {
    const stripped = canonicalAdminPath.replace(/^\/admin/, "");
    return stripped === "" ? "/" : stripped;
  }
  return canonicalAdminPath;
}
