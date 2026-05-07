import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const existing = await dbGet("SELECT id FROM User WHERE email = ?", [email]);
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const id = "c" + randomBytes(12).toString("hex");
  const hashed = await hashPassword(password);
  const now = new Date().toISOString();

  await dbRun(
    "INSERT INTO User (id, name, email, password, bio, avatar, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, name || null, email, hashed, null, null, now, now]
  );

  const user = { id, name: name || null, email, bio: null, avatar: null };

  const token = createToken(id);
  const response = NextResponse.json({ user });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
