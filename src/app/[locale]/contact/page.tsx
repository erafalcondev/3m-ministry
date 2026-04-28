import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { PageHeader } from "@/components/PageHeader";
import { ContactForm } from "@/components/sections/ContactForm";
import { Reveal } from "@/components/ui/Reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.contact.title,
    description: dict.contact.intro,
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader
        eyebrow={dict.contact.eyebrow}
        title={dict.contact.title}
        intro={dict.contact.intro}
      />

      <section className="pb-24 md:pb-32">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <Reveal>
              <div className="space-y-8">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.22em] text-brand">
                    {dict.contact.person}
                  </div>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                    {dict.contact.role}
                  </p>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-start gap-4 rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-md">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
                      <Mail size={18} />
                    </span>
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-muted">
                        Email
                      </div>
                      <a
                        href={`mailto:${dict.contact.email}`}
                        className="mt-1 inline-block text-base text-foreground transition hover:text-brand"
                      >
                        {dict.contact.email}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-md">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
                      <Phone size={18} />
                    </span>
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-muted">
                        {locale === "fr" ? "Téléphone" : "Phone"}
                      </div>
                      <a
                        href={`tel:${dict.contact.phone.replace(/[^0-9+]/g, "")}`}
                        className="mt-1 inline-block text-base text-foreground transition hover:text-brand"
                      >
                        {dict.contact.phone}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-md">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
                      <MapPin size={18} />
                    </span>
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-muted">
                        {locale === "fr" ? "Lieu" : "Location"}
                      </div>
                      <div className="mt-1 text-base text-foreground">
                        {dict.contact.location}
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-3xl border border-border bg-surface/40 p-6 backdrop-blur-md md:p-10">
                <h2 className="font-display text-3xl">{dict.contact.formTitle}</h2>
                <p className="mt-2 text-sm text-muted">{dict.contact.formIntro}</p>
                <div className="mt-8">
                  <ContactForm dict={dict} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
