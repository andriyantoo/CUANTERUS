"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Password tidak sama.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A0A0F" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/images/cuanterus-logo.png" alt="Cuanterus" className="h-10 mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-[#F0F0F5]">Reset Password</h1>
          <p className="text-sm text-[#8B949E] mt-2">Masukkan password baru kamu.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="password"
            label="Password Baru"
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            id="confirm"
            label="Konfirmasi Password"
            type="password"
            placeholder="Ulangi password baru"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Simpan Password
          </Button>
        </form>
      </div>
    </div>
  );
}
