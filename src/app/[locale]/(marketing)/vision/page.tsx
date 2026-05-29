import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { Vision } from "@/components/sections/Vision";
import { Challenge } from "@/components/sections/Challenge";
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
    title: dict.vision.title,
    description: dict.vision.intro,
  };
}

export default async function VisionPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader
        eyebrow={dict.vision.eyebrow}
        title={dict.vision.title}
        intro={dict.vision.intro}
      />
      <Challenge dict={dict} />
      <Vision dict={dict} />
      <Fruits dict={dict} />
      <CTA locale={locale} dict={dict} />
    </>
  );
}
