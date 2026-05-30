"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, X, Check } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type ProfileDict = Dictionary["portail"]["profile"];

type Initial = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  roleTitle: string;
  location: string;
  role: string;
};

function initials(name: string, email: string): string {
  const src = (name && name.trim()) || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function ProfileForm({
  dict,
  initial,
}: {
  locale: Locale;
  dict: ProfileDict;
  initial: Initial;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [roleTitle, setRoleTitle] = useState(initial.roleTitle);
  const [location, setLocation] = useState(initial.location);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${initial.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(pub.publicUrl);
    setUploading(false);
  }

  async function removeAvatar() {
    setAvatarUrl("");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          phone: phone || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
          role_title: roleTitle || null,
          location: location || null,
        })
        .eq("id", initial.id);
      if (upErr) {
        setError(upErr.message);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    });
  }

  return (
    <motion.form
      onSubmit={save}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      {/* Avatar */}
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          {avatarUrl ? (
            <span className="relative block h-24 w-24 overflow-hidden rounded-full border border-white/10">
              <Image src={avatarUrl} alt={fullName || initial.email} fill sizes="96px" className="object-cover" />
            </span>
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand text-xl font-medium text-[#031019]">
              {initials(fullName, initial.email)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{dict.avatarLabel}</span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-brand px-4 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)]">
              <Upload size={12} />
              {avatarUrl ? dict.avatarChangeCta : dict.avatarUploadCta}
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {avatarUrl && (
              <button
                type="button"
                onClick={removeAvatar}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-muted hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200"
              >
                <X size={12} />
                {dict.avatarRemoveCta}
              </button>
            )}
          </div>
        </div>
      </div>

      <Field label={dict.nameLabel}>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={dict.titleLabel}>
          <input
            type="text"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder={dict.titlePlaceholder}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
        <Field label={dict.locationLabel}>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={dict.locationPlaceholder}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
      </div>

      <Field label={dict.phoneLabel}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={dict.phonePlaceholder}
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>

      <Field label={dict.bioLabel}>
        <textarea
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={dict.bioPlaceholder}
          className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {saved && (
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <Check size={14} />
          {dict.saved}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
      >
        {pending ? dict.saving : dict.saveCta}
      </button>
    </motion.form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}
