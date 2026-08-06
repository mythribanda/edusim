import { createFileRoute } from "@tanstack/react-router";
import FormulaLabPage from "@/components/formula-lab/FormulaLabPage";

export const Route = createFileRoute("/formula-lab/$topic")({
  component: FormulaLabRoute,
});

function FormulaLabRoute() {
  const { topic } = Route.useParams();
  
  // Retrieve optional query params safely using TanStack Router search constraints if needed
  const search = Route.useSearch() as any;
  const classId = search.classId;
  const subject = search.subject;
  const formulaExpression = search.formulaExpression;
  const formulaMeaning = search.formulaMeaning;

  return (
    <FormulaLabPage
      topic={topic || "Topic"}
      classId={classId}
      subject={subject}
      formulaExpression={formulaExpression}
      formulaMeaning={formulaMeaning}
    />
  );
}
