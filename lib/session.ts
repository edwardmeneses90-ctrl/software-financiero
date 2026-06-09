import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  cedula: string;
  isLoggedIn: boolean;
}

const SECRET = process.env.SESSION_SECRET || "nextjs_session_secret_must_be_32chars_long_2024!";

if (SECRET.length < 32) {
  throw new Error("SESSION_SECRET debe tener al menos 32 caracteres en .env.local");
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, {
    cookieName: "finanzas_session",
    password: SECRET,
    cookieOptions: {
      secure: false, // 🔒 Obligatorio false para http://localhost. En Vercel cámbialo a true.
      httpOnly: true,
      sameSite: "lax",
      // ❌ SIN maxAge ni expires → Cookie de sesión pura. Expira al cerrar el navegador.
    },
  });
}