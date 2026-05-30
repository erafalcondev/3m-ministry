import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AuthBackground } from "@/components/auth/AuthBackground";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const backLabel = dict.auth.login.backHome;
  const otherLocale: Locale = locale === "fr" ? "en" : "fr";

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      <AuthBackground />

      <header className="relative z-10 flex items-center justify-between p-6 md:p-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/${otherLocale}/login`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted transition hover:border-brand/50 hover:bg-brand/10 hover:text-foreground"
            aria-label={`Switch to ${otherLocale.toUpperCase()}`}
          >
            {otherLocale.toUpperCase()}
          </Link>
          <Link href={`/${locale}`} className="flex items-center gap-2" aria-label="3M Ministry">
            <span className="relative h-8 w-8">
              <Image src="/3m-logo.png" alt="3M Ministry" fill sizes="32px" className="object-contain" priority />
            </span>
            <span className="hidden text-sm font-medium tracking-wide sm:block">3M Ministry</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-7rem)] items-center justify-center px-6 pb-16 pt-4 md:pt-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="relative z-10 px-6 pb-6 text-center text-xs text-muted">
        Église La Cité Mascouche · 3M Ministry
      </footer>
    </div>
  );
}
