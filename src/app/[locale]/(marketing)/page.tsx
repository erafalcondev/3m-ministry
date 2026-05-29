import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { Hero } from "@/components/sections/Hero";
import { Challenge } from "@/components/sections/Challenge";
import { Vision } from "@/components/sections/Vision";
import { Philosophy } from "@/components/sections/Philosophy";
import { Programs } from "@/components/sections/Programs";
import { Fruits } from "@/components/sections/Fruits";
import { Partner } from "@/components/sections/Partner";
import { CTA } from "@/components/sections/CTA";
import { Partners } from "@/components/sections/Partners";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <>
      <Hero locale={locale} dict={dict} />
      <Partners dict={dict} />
      <Challenge dict={dict} />
      <Vision dict={dict} />
      <Philosophy dict={dict} />
      <Programs locale={locale} dict={dict} compact />
      <Fruits dict={dict} />
      <Partner locale={locale} dict={dict} />
      <CTA locale={locale} dict={dict} />
    </>
  );
}
