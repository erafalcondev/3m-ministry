import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { Partner } from "@/components/sections/Partner";
import { Programs } from "@/components/sections/Programs";
import { Fruits } from "@/components/sections/Fruits";
import { CTA } from "@/components/sections/CTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.partner.title,
    description: dict.partner.intro,
  };
}

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader
        eyebrow={dict.partner.eyebrow}
        title={dict.partner.title}
        intro={dict.partner.intro}
      />
      <Partner locale={locale} dict={dict} showCta={false} />
      <Fruits dict={dict} />
      <Programs locale={locale} dict={dict} compact />
      <CTA locale={locale} dict={dict} />
    </>
  );
}
