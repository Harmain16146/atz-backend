"use client";

import Image from "next/image";
import { useAuth } from "./components/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Database, LogOut } from "lucide-react";
import logoDesign from "./assets/logoDesign.png";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#222222] text-[#F7CE46]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7CE46]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#222222] text-[#F7CE46] flex flex-col">
      <nav className="bg-[#222222] border-b border-[#F7CE46] sticky top-0 z-10">
        <div className="max-w-7xl  px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src={logoDesign} alt="Logo" width={40} height={40} />
            <h1 className="text-2xl font-bold text-[#F7CE46]">ATZ Goldsmith</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/data")}
              className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-[#F7CE46] text-[#222222] text-sm font-medium rounded-md hover:bg-yellow-400"
            >
              <Database className="w-4 h-4" /> View Data
            </button>
            <button
              onClick={() => {
                signOut();
                router.push("/signin");
              }}
              className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold mb-4">
          Welcome to ATC Management System
        </h2>
        <p className="text-lg mb-8 max-w-xl">
          Effortlessly manage your data, employees, and inventory with precision
          and clarity.
        </p>
        <button
          onClick={() => router.push("/data")}
          className="inline-flex items-center cursor-pointer gap-2 px-8 py-4 bg-[#F7CE46] text-[#222222] text-lg font-semibold rounded-md hover:bg-yellow-400"
        >
          <Database className="w-5 h-5" /> View Data
        </button>
      </main>
    </div>
  );
}
