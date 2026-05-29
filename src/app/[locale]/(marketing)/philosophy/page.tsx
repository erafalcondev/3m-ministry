import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { Philosophy } from "@/components/sections/Philosophy";
import { Programs } from "@/components/sections/Programs";
import { CTA } from "@/components/sections/CTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.philosophy.title,
    description: dict.philosophy.intro,
  };
}

export default async function PhilosophyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader
        eyebrow={dict.philosophy.eyebrow}
        title={dict.philosophy.title}
        intro={dict.philosophy.intro}
      />
      <Philosophy dict={dict} />
      <Programs locale={locale} dict={dict} compact />
      <CTA locale={locale} dict={dict} />
    </>
  );
}
