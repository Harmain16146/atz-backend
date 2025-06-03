"use server";

import { cookies } from "next/headers";

export async function setAuthCookie(uid: string) {
  const authCookie = cookies();

  // Used for API calls, should not be accessible from JS (server-only)
  authCookie.set("auth_token", uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/", // ✅ important for middleware
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Used for middleware checks (must be readable in middleware, so not httpOnly)
  authCookie.set("middleware_token", "true", {
    httpOnly: false, // ⚠️ must be false so middleware can read it
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/", // ✅ important for routing logic
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const authCookie = cookies();
  authCookie.delete("auth_token");
  authCookie.delete("middleware_token");
}
