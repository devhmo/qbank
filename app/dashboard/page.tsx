import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";
import SubjectPerformanceChart from "@/components/dashboard/SubjectPerformanceChart";
import AccuracyTrendChart from "@/components/dashboard/AccuracyTrendChart";
import WeakestTopicsList from "@/components/dashboard/WeakestTopicsList";
import QuickStartQuizLink from "@/components/dashboard/QuickStartQuizLink";
import {
  computeAccuracyTrend,
  computeOverallStats,
  computeSubjectBreakdownFromRows,
  computeWeakestTopics,
  type DashboardAnswerRow,
} from "@/lib/dashboardStats";

interface QuestionWithSubject {
  id: string;
  topics: {
    name: string;
    systems: { name: string; subjects: { name: string } | null } | null;
  } | null;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, created_at, submitted_at")
    .eq("user_id", user.id);

  const quizList = quizzes ?? [];
  const quizIds = quizList.map((q) => q.id as string);
  const quizDateById = new Map(quizList.map((q) => [q.id as string, q.created_at as string]));
  const completedQuizCount = quizList.filter((q) => q.submitted_at).length;

  let rows: DashboardAnswerRow[] = [];

  if (quizIds.length > 0) {
    const { data: quizQuestions } = await supabase
      .from("quiz_questions")
      .select("quiz_id, question_id, is_correct, selected_choice_id")
      .in("quiz_id", quizIds)
      .not("selected_choice_id", "is", null);

    const answered = quizQuestions ?? [];
    const questionIds = [...new Set(answered.map((q) => q.question_id as string))];

    let questionsById = new Map<string, QuestionWithSubject>();
    if (questionIds.length > 0) {
      const { data: questions } = await supabase
        .from("questions")
        .select(
          `
          id,
          topics ( name, systems ( name, subjects ( name ) ) )
        `
        )
        .in("id", questionIds)
        .returns<QuestionWithSubject[]>();
      questionsById = new Map((questions ?? []).map((q) => [q.id, q]));
    }

    rows = answered.map((qq) => {
      const question = questionsById.get(qq.question_id as string);
      return {
        isCorrect: qq.is_correct as boolean | null,
        subjectName: question?.topics?.systems?.subjects?.name ?? "Uncategorized",
        topicName: question?.topics?.name ?? "Uncategorized",
        quizDate: quizDateById.get(qq.quiz_id as string) ?? new Date().toISOString(),
      };
    });
  }

  const stats = computeOverallStats(rows, completedQuizCount);
  const subjectBreakdown = computeSubjectBreakdownFromRows(rows);
  const weakestTopics = computeWeakestTopics(rows);
  const trend = computeAccuracyTrend(rows, 30);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700">
        Dashboard
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Your progress
      </h1>

      {stats.totalAnswered === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-600">You haven&rsquo;t answered any questions yet.</p>
          <a
            href="/quiz/new"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Take your first quiz
          </a>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Questions answered" value={stats.totalAnswered} />
            <StatCard label="Overall correct" value={`${stats.correctPct}%`} />
            <StatCard label="Completed quizzes" value={stats.completedQuizCount} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="mb-4 text-sm font-medium text-slate-700">
                Performance by subject
              </p>
              <SubjectPerformanceChart data={subjectBreakdown} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="mb-4 text-sm font-medium text-slate-700">
                Accuracy trend (last 30 days)
              </p>
              {trend.length > 0 ? (
                <AccuracyTrendChart data={trend} />
              ) : (
                <p className="flex h-[280px] items-center justify-center text-center text-sm text-slate-500">
                  No activity in the last 30 days.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="mb-4 text-sm font-medium text-slate-700">Weakest topics</p>
              <WeakestTopicsList topics={weakestTopics} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="mb-4 text-sm font-medium text-slate-700">Quick links</p>
              <div className="space-y-3">
                <QuickStartQuizLink scope="bookmarked" label="Bookmarked questions" />
                <QuickStartQuizLink scope="incorrect" label="Previously incorrect" />
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
