"use server";

import { cookies } from "next/headers";

export async function setAuthCookie(uid: string) {
  const authCookie = cookies();

  // Secure auth token (HTTP-only for security)
  authCookie.set("auth_token", uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
  });

  authCookie.set("middleware_token", "true", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const authCookie = cookies();
  authCookie.delete("auth_token");
  authCookie.delete("middleware_token");
}
