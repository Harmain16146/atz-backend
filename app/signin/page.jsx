"use client";

import { useEffect } from "react";
import SignIn from "../components/auth/SignIn";
import { useAuth } from "../components/auth/AuthContext";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { user } = useAuth();
  console.log("user", user);

  const router = useRouter();
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user]);
  return <SignIn />;
}
