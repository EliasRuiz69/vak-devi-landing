import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const serviceId = searchParams.get("serviceId");
  const fecha = searchParams.get("fecha");
  const skipAdvance = searchParams.get("skipAdvance") === "1";

  if (!serviceId || !fecha) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const result = await getAvailableSlots(createAdminClient(), serviceId, fecha, { skipAdvance });
  if (!result.ok) {
    return NextResponse.json({ error: "Service or config not found" }, { status: 404 });
  }

  return NextResponse.json({ slots: result.slots });
}
