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
        <Link href={`/${locale}`} className="flex items-center gap-2" aria-label="3M Ministry">
          <span className="relative h-8 w-8">
            <Image src="/3m-logo.png" alt="3M Ministry" fill sizes="32px" className="object-contain" priority />
          </span>
          <span className="hidden text-sm font-medium tracking-wide sm:block">3M Ministry</span>
        </Link>
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
