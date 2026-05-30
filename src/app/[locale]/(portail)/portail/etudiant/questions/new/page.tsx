import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { NewTicketForm } from "./NewTicketForm";

export default async function NewTicketPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  // Compute accessible courses + assignments so the user can attach context.
  const { data: cohortLinks } = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("student_id", user.id);
  const myCohortIds = (cohortLinks ?? []).map((c) => c.cohort_id as string);
  const { data: directCourses } = await supabase
    .from("course_students")
    .select("course_id")
    .eq("student_id", user.id);
  let viaCohort: string[] = [];
  if (myCohortIds.length > 0) {
    const { data } = await supabase
      .from("course_cohorts")
      .select("course_id")
      .in("cohort_id", myCohortIds);
    viaCohort = (data ?? []).map((c) => c.course_id as string);
  }
  const courseIds = Array.from(
    new Set([
      ...((directCourses ?? []).map((c) => c.course_id as string)),
      ...viaCohort,
    ]),
  );
  let courses: { id: string; label: string }[] = [];
  let assignments: { id: string; label: string; courseId: string }[] = [];
  if (courseIds.length > 0) {
    const [{ data: courseRows }, { data: asgRows }] = await Promise.all([
      supabase.from("courses").select("id,title").in("id", courseIds),
      supabase.from("assignments").select("id,title,course_id").in("course_id", courseIds),
    ]);
    courses = (courseRows ?? []).map((c) => ({
      id: c.id as string,
      label: c.title as string,
    }));
    assignments = (asgRows ?? []).map((a) => ({
      id: a.id as string,
      label: a.title as string,
      courseId: a.course_id as string,
    }));
  }

  return (
    <>
      <Link
        href={`/${locale}/portail/etudiant/questions`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={13} />
        {dict.portail.tickets.backToList}
      </Link>
      <h1 className="font-display text-2xl text-foreground">{dict.portail.tickets.newCta}</h1>
      <div className="mt-8">
        <NewTicketForm
          locale={locale as Locale}
          dict={dict.portail.tickets}
          userId={user.id}
          courses={courses}
          assignments={assignments}
        />
      </div>
    </>
  );
}
