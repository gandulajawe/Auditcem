"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, Factory, AlertCircle, Eye, EyeOff, Sparkles, Key, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@factory.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Login tidak valid. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      // Success
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Login client error:", err);
      setErrorMsg("Gagal terhubung ke server. Silakan coba beberapa saat lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6A0DAD]/10 via-[#FAFAFD] to-[#F7C6D9]/30 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#6A0DAD]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#F2A7C6]/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl border border-[#F7C6D9] p-8 space-y-6 relative z-10 transition-all">
        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-[#6A0DAD] to-[#A569BD] text-white rounded-2xl shadow-lg shadow-[#6A0DAD]/30 ring-4 ring-[#F7C6D9]/50">
            <Factory className="w-9 h-9" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7C6D9]/60 text-[#6A0DAD] text-xs font-semibold rounded-full border border-[#F2A7C6] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#6A0DAD]" />
              CEM Footwear Plant Audit
            </span>
            <h1 className="text-2xl font-black text-[#6A0DAD] tracking-tight">
              The Audit Crucible
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Fase Bulan 4 - 6 | Portal Autentikasi User & Auditor
            </p>
          </div>
        </div>

        {/* Security Info Banner */}
        <div className="bg-[#FAF7FB] border border-[#F2A7C6]/60 rounded-2xl p-3.5 text-xs text-gray-600 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#6A0DAD] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-800">Sistem Autentikasi RBAC Database</p>
            <p className="text-gray-500 mt-0.5">
              Terenkripsi cookie JWT httpOnly. Terproteksi rate-limiting DB & RBAC per user.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase">
              Email Akun User
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-5 h-5 text-[#A569BD]" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@factory.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 focus:border-[#6A0DAD] focus:bg-white focus:ring-2 focus:ring-[#6A0DAD]/20 rounded-xl text-sm transition-all outline-none text-gray-800 placeholder-gray-400 font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase">
              Kata Sandi Akses
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5 text-[#A569BD]" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password sistem..."
                className="w-full pl-10 pr-11 py-3 bg-gray-50/80 border border-gray-200 focus:border-[#6A0DAD] focus:bg-white focus:ring-2 focus:ring-[#6A0DAD]/20 rounded-xl text-sm transition-all outline-none text-gray-800 placeholder-gray-400 font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#6A0DAD] transition-colors"
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6A0DAD] to-[#A569BD] hover:from-[#580B90] hover:to-[#9455AC] text-white font-bold rounded-xl shadow-lg shadow-[#6A0DAD]/30 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi Akun User...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Masuk Ke Dashboard Audit</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-2 border-t border-gray-100 text-center space-y-1">
          <p className="text-[11px] text-gray-500 font-medium">
            Certified Engineering Manager (CEM) — Program Audit Sepatu On-Site
          </p>
          <p className="text-[10px] text-gray-400">
            Akun Default: admin@factory.com (Role: Admin)
          </p>
        </div>
      </div>
    </div>
  );
}
