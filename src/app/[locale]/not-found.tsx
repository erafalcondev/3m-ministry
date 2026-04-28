import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10 gradient-radial" />
      <div className="container-custom text-center">
        <div className="font-display text-[7rem] leading-none text-brand md:text-[10rem]">404</div>
        <h1 className="mt-4 font-display text-3xl md:text-4xl">Page introuvable</h1>
        <p className="mt-3 text-muted">Cette page n&apos;existe pas — ou plus.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button href="/fr">Retour à l&apos;accueil</Button>
          <Button href="/en" variant="secondary">Home</Button>
        </div>
      </div>
    </section>
  );
}
