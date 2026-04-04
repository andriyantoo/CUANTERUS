"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
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
          <h1 className="text-2xl font-bold text-[#F0F0F5] mb-2">Cek Email Kamu</h1>
          <p className="text-sm text-[#8B949E]">
            Kami sudah kirim link reset password ke <strong className="text-[#F0F0F5]">{email}</strong>.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="mt-6">Kembali ke Login</Button>
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
            <img src="/images/sidebar logo.png" alt="Cuanterus" className="h-10 mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-[#F0F0F5]">Lupa Password</h1>
          <p className="text-sm text-[#8B949E] mt-2">Masukkan email untuk reset password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Kirim Link Reset
          </Button>
        </form>

        <div className="text-center mt-4">
          <Link href="/login" className="text-sm text-[#8B949E] hover:text-[#96FC03]">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
