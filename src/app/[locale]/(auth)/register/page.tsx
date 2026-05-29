import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  return <RegisterForm locale={locale as Locale} dict={dict.auth.register} />;
}
