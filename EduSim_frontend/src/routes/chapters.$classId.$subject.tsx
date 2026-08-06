import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CurriculumService } from "@/services/curriculumService";
import { Card, PageWrapper } from "@/components/Card";
import { Crumbs } from "@/components/Crumbs";

export const Route = createFileRoute("/chapters/$classId/$subject")({
  component: ChaptersPage,
  loader: async ({ params }) => {
    try {
      const [classes, subjects] = await Promise.all([
        CurriculumService.getClasses(),
        CurriculumService.getSubjects(Number(params.classId)),
      ]);
      const c = classes.find((cls) => cls.id === Number(params.classId));
      if (!c) throw notFound();

      const s = subjects.find(
        (sub) =>
          (sub.code || "").toLowerCase() === (params.subject || "").toLowerCase() ||
          (sub.id || "").toLowerCase() === (params.subject || "").toLowerCase()
      );
      if (!s) throw notFound();

      const chapters = await CurriculumService.getChapters(s.id, Number(params.classId));
      
      console.log("[DEBUG] selectedClass:", c);
      console.log("[DEBUG] selectedSubject:", s);
      console.log("[DEBUG] chapters loaded:", chapters);

      return { c, s, chapters };
    } catch (e) {
      console.error("[DEBUG] Error in chapters loader:", e);
      throw notFound();
    }
  },
});

function ChaptersPage() {
  const { c, s, chapters } = Route.useLoaderData();
  const safeChapters = Array.isArray(chapters) ? chapters : [];
  const chapterCount = safeChapters.length;

  return (
    <PageWrapper>
      <Crumbs
        items={[
          { label: "Home", to: "/" },
          { label: c.name, to: "/subjects/$classId", params: { classId: String(c.id) } },
          { label: s.name },
        ]}
      />

      <h1 className="text-3xl font-bold mb-2">
        {s.name} <span className="text-muted-foreground text-lg">— Chapters</span>
      </h1>

      <p className="text-muted-foreground mb-8">{chapterCount} chapters available</p>

      {chapterCount === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-dashed border-border rounded-2xl">
          No chapters available.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {safeChapters.map((chapter, i) => (
            <Link
              key={chapter.name}
              to="/topics/$classId/$subject/$chapter"
              params={{
                classId: String(c.id),
                subject: s.id,
                chapter: chapter.name,
              }}
            >
              <Card delay={i * 0.02}>
                <div className="text-xs font-bold text-primary mb-2">CHAPTER</div>

                <div className="text-lg font-bold mb-2">{chapter.name}</div>

                <p className="text-xs text-muted-foreground">
                  Chapter {i + 1} of {safeChapters.length}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
