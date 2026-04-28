import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { Programs } from "@/components/sections/Programs";
import { Partner } from "@/components/sections/Partner";
import { CTA } from "@/components/sections/CTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.programs.title,
    description: dict.programs.intro,
  };
}

export default async function ProgramsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader
        eyebrow={dict.programs.eyebrow}
        title={dict.programs.title}
        intro={dict.programs.intro}
      />
      <Programs locale={locale} dict={dict} />
      <Partner locale={locale} dict={dict} showCta={false} />
      <CTA locale={locale} dict={dict} />
    </>
  );
}
