"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A0A0F" }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#96FC03]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#96FC03" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#F0F0F5] mb-2">Cek Email Kamu</h1>
          <p className="text-sm text-[#8B949E]">
            Kami sudah kirim link konfirmasi ke <strong className="text-[#F0F0F5]">{email}</strong>.
            Klik link di email untuk mengaktifkan akun.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="mt-6">
              Kembali ke Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A0A0F" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/images/cuanterus-logo.png" alt="Cuanterus" className="h-10 mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-[#F0F0F5]">Buat Akun Baru</h1>
          <p className="text-sm text-[#8B949E] mt-2">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#96FC03] hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="fullName"
            label="Nama Lengkap"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Daftar
          </Button>
        </form>
      </div>
    </div>
  );
}
