import type { Request } from "express";

/** Public app URL for links in emails and payment callbacks. */
export function getAppUrl(req?: Request): string {
  const configured = process.env["APP_URL"]?.replace(/\/+$/, "");
  if (configured) return configured;

  const vercel = process.env["VERCEL_URL"]?.replace(/\/+$/, "");
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;

  if (req) {
    const rawProto = req.headers["x-forwarded-proto"];
    const proto =
      (Array.isArray(rawProto) ? rawProto[0] : rawProto) ?? req.protocol;
    const rawHost = req.headers["x-forwarded-host"];
    const host =
      (Array.isArray(rawHost) ? rawHost[0] : rawHost) ??
      req.get("host") ??
      "";
    if (host) return `${proto}://${host}`;
  }

  return "http://localhost:5173";
}
