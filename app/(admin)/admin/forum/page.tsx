"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { PRODUCT_NAMES } from "@/lib/constants";
import type { ForumChannel, Product } from "@/lib/types";
import { Plus, Hash, Megaphone, MessageSquare, Trash2, Eye, EyeOff, Link2, Save, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminForumPage() {
  const [channels, setChannels] = useState<ForumChannel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [productId, setProductId] = useState("");
  const [channelType, setChannelType] = useState("text");
  const [saving, setSaving] = useState(false);

  // Discord webhook editing
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  const supabase = createClient();

  async function fetchData() {
    const [chRes, pRes] = await Promise.all([
      supabase.from("forum_channels").select("*, product:products(*)").order("sort_order"),
      supabase.from("products").select("*").eq("is_active", true),
    ]);
    setChannels((chRes.data ?? []) as ForumChannel[]);
    setProducts((pRes.data ?? []) as Product[]);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const maxOrder = channels.reduce((max, ch) => Math.max(max, ch.sort_order), 0);

    await supabase.from("forum_channels").insert({
      name,
      slug,
      icon: icon || null,
      description: description || null,
      product_id: productId || null,
      channel_type: channelType,
      sort_order: maxOrder + 1,
    });

    setName(""); setSlug(""); setIcon(""); setDescription(""); setProductId(""); setChannelType("text");
    setShowForm(false);
    setSaving(false);
    fetchData();
  }

  async function saveWebhook(channelId: string) {
    setSavingWebhook(true);
    await supabase
      .from("forum_channels")
      .update({ discord_webhook_url: webhookUrl.trim() || null })
      .eq("id", channelId);
    toast.success("Discord webhook disimpan!");
    setSavingWebhook(false);
    setEditingWebhook(null);
    fetchData();
  }

  async function toggleActive(channel: ForumChannel) {
    await supabase.from("forum_channels").update({ is_active: !channel.is_active }).eq("id", channel.id);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus channel ini? Semua thread di dalamnya akan ikut terhapus.")) return;
    await supabase.from("forum_channels").delete().eq("id", id);
    fetchData();
  }

  const typeIcons: Record<string, typeof Hash> = { text: Hash, forum: MessageSquare, announcement: Megaphone };

  if (loading) {
    return <div className="space-y-4 max-w-5xl"><Skeleton className="h-10 w-48" />{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  // Group by product
  const grouped: Record<string, ForumChannel[]> = {};
  channels.forEach((ch) => {
    const key = ch.product_id ? PRODUCT_NAMES[ch.product?.slug ?? ""] ?? "Other" : "General";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ch);
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forum Channels</h1>
          <p className="text-sm text-[#8B949E] mt-1">Manage forum channels, mirip Discord server.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-1.5" /> Tambah Channel
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardTitle className="mb-4">Channel Baru</CardTitle>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input id="name" label="Nama" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Crypto Discussion" required />
              <Input id="slug" label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="crypto-discussion" required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input id="icon" label="Emoji Icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🗣️" />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F0F0F5]">Produk (opsional)</label>
                <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30">
                  <option value="">Global (semua member)</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F0F0F5]">Tipe</label>
                <select value={channelType} onChange={(e) => setChannelType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30">
                  <option value="text">Text</option>
                  <option value="forum">Forum (thread-based)</option>
                  <option value="announcement">Announcement (admin only)</option>
                </select>
              </div>
            </div>
            <Input id="desc" label="Deskripsi (opsional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Channel untuk diskusi crypto..." />
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>Buat Channel</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Channel List */}
      {Object.entries(grouped).map(([group, chs]) => (
        <div key={group}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#8B949E] mb-2">{group}</h2>
          <div className="space-y-1">
            {chs.map((ch) => {
              const TypeIcon = typeIcons[ch.channel_type] || Hash;
              const hasWebhook = !!(ch as any).discord_webhook_url;
              return (
                <div key={ch.id} className="rounded-xl bg-[#131318] border border-[#222229]">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <TypeIcon size={16} className="text-[#8B949E] flex-shrink-0" />
                    <span className="text-sm">{ch.icon}</span>
                    <span className="text-sm font-medium text-[#F0F0F5] flex-1">{ch.name}</span>
                    {hasWebhook && (
                      <Badge variant="blue" className="text-[10px]">
                        <MessageCircle size={10} className="mr-1" />Discord
                      </Badge>
                    )}
                    <Badge variant={ch.is_active ? "lime" : "gray"} className="text-[10px]">
                      {ch.is_active ? "Active" : "Hidden"}
                    </Badge>
                    <Badge variant="gray" className="text-[10px]">{ch.channel_type}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingWebhook(editingWebhook === ch.id ? null : ch.id);
                      setWebhookUrl((ch as any).discord_webhook_url || "");
                    }}>
                      <Link2 size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(ch)}>
                      {ch.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(ch.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  {editingWebhook === ch.id && (
                    <div className="px-4 pb-3 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Discord Webhook URL (dari Channel Settings → Integrations → Webhooks)"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#0A0A0F] border border-[#222229] text-[#F0F0F5] text-xs placeholder:text-[#8B949E]/60 focus:outline-none focus:ring-1 focus:ring-[#96FC03]/30"
                      />
                      <Button size="sm" loading={savingWebhook} onClick={() => saveWebhook(ch.id)}>
                        <Save size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
