import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { cedula, pin } = await req.json();
    if (!cedula || !pin) return NextResponse.json({ error: "Campos requeridos" }, { status: 400 });

    const { data: user, error: dbError } = await supabase
      .from("users")
      .select("cedula, pin_hash")
      .eq("cedula", cedula)
      .single();

    if (dbError || !user) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    const isValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isValid) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    // ✅ Ahora TS reconoce .isLoggedIn y .cedula gracias al tipo explícito
    const session = await getSession();
    session.isLoggedIn = true;
    session.cedula = user.cedula;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("💥 ERROR CRÍTICO EN LOGIN:", err);
    return NextResponse.json({ error: "Error interno: " + err.message }, { status: 500 });
  }
}