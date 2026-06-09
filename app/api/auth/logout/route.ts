import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSession();
    session.destroy(); // ✅ Elimina la cookie inmediatamente del navegador
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}