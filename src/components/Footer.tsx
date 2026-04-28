import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function Footer({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const links = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/vision`, label: dict.nav.vision },
    { href: `/${locale}/philosophy`, label: dict.nav.philosophy },
    { href: `/${locale}/programs`, label: dict.nav.programs },
    { href: `/${locale}/partner`, label: dict.nav.partner },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  return (
    <footer className="relative mt-16 border-t border-border/60 bg-surface/40">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
      <div className="container-custom grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href={`/${locale}`} className="inline-flex items-center gap-3">
            <span className="relative h-10 w-10">
              <Image src="/3m-logo.png" alt="3M Ministry" fill sizes="40px" className="object-contain" />
            </span>
            <div>
              <div className="text-base font-semibold tracking-tight">3M Ministry</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted">
                Multiply Movement Mascouche
              </div>
            </div>
          </Link>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
            {dict.footer.blurb}
          </p>
          <p className="mt-6 max-w-md font-display text-base italic leading-relaxed text-foreground/80">
            {dict.footer.verse}
          </p>
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-brand">
            {dict.footer.nav}
          </div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-foreground/80 transition hover:text-brand"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-brand">
            {dict.footer.contact}
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-foreground/80">
            <li>{dict.contact.person}</li>
            <li>
              <a
                href={`mailto:${dict.contact.email}`}
                className="transition hover:text-brand"
              >
                {dict.contact.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${dict.contact.phone.replace(/[^0-9+]/g, "")}`}
                className="transition hover:text-brand"
              >
                {dict.contact.phone}
              </a>
            </li>
            <li className="text-muted">{dict.contact.location}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container-custom flex flex-col gap-3 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <span>{dict.footer.legal}</span>
          <div className="flex items-center gap-4">
            <Link href="/fr" className="hover:text-foreground">FR</Link>
            <span className="text-muted/40">·</span>
            <Link href="/en" className="hover:text-foreground">EN</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
