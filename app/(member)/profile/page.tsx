"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { User, Lock, Save, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, profile, loading } = useUser();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Gagal menyimpan profil.");
    } else {
      toast.success("Profil berhasil disimpan!");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error("Password baru tidak boleh kosong.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setChangingPassword(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error(error.message || "Gagal mengubah password.");
    } else {
      toast.success("Password berhasil diubah!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0F5]">Profil</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Kelola informasi profil dan keamanan akunmu.
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#96FC03]/10 flex items-center justify-center text-[#96FC03]">
            <User size={24} />
          </div>
          <div>
            <CardTitle>{profile?.full_name || "Member"}</CardTitle>
            <p className="text-sm text-[#8B949E]">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            id="email"
            label="Email"
            value={user?.email ?? ""}
            disabled
            className="opacity-60 cursor-not-allowed"
          />
          <Input
            id="full_name"
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            id="phone"
            label="No. Telepon"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="pt-2">
            <Button
              onClick={handleSaveProfile}
              loading={saving}
              size="sm"
            >
              <Save size={16} className="mr-1.5" />
              Simpan Profil
            </Button>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#222229] flex items-center justify-center text-[#8B949E]">
            <Lock size={20} />
          </div>
          <CardTitle>Ubah Password</CardTitle>
        </div>

        <div className="space-y-4">
          <Input
            id="new_password"
            label="Password Baru"
            type="password"
            placeholder="Minimal 6 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            id="confirm_password"
            label="Konfirmasi Password Baru"
            type="password"
            placeholder="Ulangi password baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={handleChangePassword}
              loading={changingPassword}
              size="sm"
            >
              <Lock size={16} className="mr-1.5" />
              Ubah Password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
