import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Protección de la API del agente de WhatsApp (/api/agente/*).
// n8n envía la cabecera `x-agent-secret` con el valor de AGENT_API_SECRET
// (variable de runtime, solo servidor). Si la variable falta o es corta,
// la API queda cerrada para todos.
export function isAgentAuthorized(req: Request): boolean {
  const expected = process.env.AGENT_API_SECRET;
  const received = req.headers.get("x-agent-secret");
  if (!expected || expected.length < 32 || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function badRequest(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
export const HORA_RE = /^\d{2}:\d{2}$/;

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
