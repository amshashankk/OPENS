import { NextRequest, NextResponse } from "next/server";
import { dbGet } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await dbGet<Record<string, unknown>>(
    "SELECT * FROM User WHERE email = ?",
    [email]
  );
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password as string);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createToken(user.id as string);
  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
    },
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
