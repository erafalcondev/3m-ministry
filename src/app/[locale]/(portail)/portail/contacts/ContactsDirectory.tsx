"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Mail, Phone, Search, MapPin, Users } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type ContactsDict = Dictionary["portail"]["contacts"];
type RoleLabels = Dictionary["portail"]["common"]["roles"];

type Role = "student" | "coach" | "coordinator" | "director" | "admin";

export type DirectoryContact = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string;
  phone: string;
  roleTitle: string;
  location: string;
  bio: string;
};

const ROLE_OPTIONS: Role[] = ["student", "coach", "coordinator", "director", "admin"];

const ROLE_COLORS: Record<Role, string> = {
  student: "border-brand/30 bg-brand/10 text-brand",
  coach: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  coordinator: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  director: "border-purple-400/30 bg-purple-400/10 text-purple-200",
  admin: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

function initials(name: string, email: string): string {
  const src = (name && name.trim()) || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function ContactsDirectory({
  dict,
  roleLabels,
  contacts,
}: {
  locale: Locale;
  dict: ContactsDict;
  roleLabels: RoleLabels;
  contacts: DirectoryContact[];
}) {
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filterRole && c.role !== filterRole) return false;
      if (q) {
        const hay = `${c.fullName} ${c.email} ${c.phone} ${c.roleTitle} ${c.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [contacts, query, filterRole]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.searchPlaceholder}
            className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted/70 focus:border-brand/60 focus:outline-none"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="h-10 rounded-full border border-white/10 bg-background/70 px-4 text-xs text-foreground focus:border-brand/60 focus:outline-none"
        >
          <option value="">{dict.filterAllRoles}</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {roleLabels[r]}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted">
          {filtered.length} {dict.results}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <Users size={36} className="text-muted/60" />
          <p className="mt-4 text-sm text-muted">{dict.empty}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-start gap-3">
                {c.avatarUrl ? (
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10">
                    <Image src={c.avatarUrl} alt={c.fullName || c.email} fill sizes="48px" className="object-cover" />
                  </span>
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-medium text-[#031019]">
                    {initials(c.fullName, c.email)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.fullName || c.email}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${ROLE_COLORS[c.role]}`}
                  >
                    {roleLabels[c.role]}
                  </span>
                  {c.roleTitle && (
                    <p className="mt-1 text-xs text-muted">{c.roleTitle}</p>
                  )}
                </div>
              </div>

              {c.location && (
                <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <MapPin size={11} />
                  {c.location}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs text-brand transition hover:bg-brand/25"
                >
                  <Mail size={12} />
                  {dict.emailCta}
                </a>
                {c.phone && (
                  <a
                    href={`tel:${c.phone.replace(/[^+\d]/g, "")}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted transition hover:border-brand/40 hover:text-foreground"
                  >
                    <Phone size={12} />
                    {dict.callCta}
                  </a>
                )}
              </div>

              {c.bio && (
                <p className="text-xs text-muted line-clamp-3 text-pretty">{c.bio}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
