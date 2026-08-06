import { DynamicParsedFormula } from "./DynamicFormulaExtractor";

export type QuestionType = "mcq" | "fill_in_blank";

export interface PracticeQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For MCQs
  correctAnswer: string;
  explanation: string;
  relatedConcept?: string;
  relatedFormula?: string;
}

function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export const DynamicQuestionGenerator = {
  generateQuestions(
    formulas: DynamicParsedFormula[],
    ragContent: string,
    topic: string
  ): PracticeQuestion[] {
    const questions: PracticeQuestion[] = [];
    let idCounter = 1;

    // Collect all unique meanings and units for MCQ distractor options
    const allMeanings = new Set<string>();
    const allUnits = new Set<string>();

    formulas.forEach((f) => {
      f.anatomy?.forEach((row) => {
        if (row.meaning) allMeanings.add(row.meaning);
        if (row.unit) allUnits.add(row.unit);
      });
    });

    const meaningOptions = Array.from(allMeanings);
    const unitOptions = Array.from(allUnits).filter(u => u.length > 0);

    const getDistractors = (correct: string, source: string[], count: number = 3) => {
      const filtered = source.filter((s) => s.toLowerCase() !== correct.toLowerCase());
      const shuffled = shuffle(filtered);
      let distractors = shuffled.slice(0, count);
      
      // Fallbacks if we don't have enough options
      if (distractors.length < count) {
          const fallbacks = ["Energy", "Power", "Momentum", "Velocity", "Distance", "Time", "Frequency", "Mass", "Acceleration"];
          distractors = [...distractors, ...shuffle(fallbacks).slice(0, count - distractors.length)];
      }
      return distractors;
    };

    // 1. Generate questions from formulas
    formulas.forEach((formula) => {
      // Anatomy based MCQs (Meanings)
      formula.anatomy?.forEach((row) => {
        // Meaning MCQ
        if (row.meaning && meaningOptions.length >= 2) {
          const distractors = getDistractors(row.meaning, meaningOptions);
          const options = shuffle([row.meaning, ...distractors]);
          
          questions.push({
            id: `q-${idCounter++}`,
            type: "mcq",
            question: `In the context of ${topic}, what does the symbol '${row.symbol}' represent?`,
            options,
            correctAnswer: row.meaning,
            explanation: `'${row.symbol}' stands for ${row.meaning} in this topic.`,
            relatedConcept: row.meaning,
            relatedFormula: formula.raw
          });
        }

        // Unit MCQ
        if (row.unit && unitOptions.length >= 2) {
          const distractors = getDistractors(row.unit, unitOptions);
          const options = shuffle([row.unit, ...distractors]);
          
          questions.push({
            id: `q-${idCounter++}`,
            type: "mcq",
            question: `What is the SI unit for ${row.meaning}?`,
            options,
            correctAnswer: row.unit,
            explanation: `The standard unit for ${row.meaning} is ${row.unit}.`,
            relatedConcept: row.meaning,
            relatedFormula: formula.raw
          });
        }
      });

      // Fill in the blanks from the equation itself
      if (formula.resultSymbol && formula.anatomy && formula.anatomy.length >= 2) {
        const resMeaning = formula.anatomy.find(r => r.symbol === formula.resultSymbol)?.meaning;
        
        const variables = formula.anatomy.filter(r => r.symbol !== formula.resultSymbol);
        
        if (resMeaning && variables.length > 0) {
            // Create a conceptual equation: Voltage = Current * Resistance
            let conceptualEq = formula.expression;
            variables.forEach(v => {
                // simple replace for words
                const reg = new RegExp(`\\b${v.symbol}\\b`, 'g');
                conceptualEq = conceptualEq.replace(reg, v.meaning);
            });
            
            // Pick a variable to blank out
            const blankVar = variables[Math.floor(Math.random() * variables.length)];
            const blankedEq = conceptualEq.replace(blankVar.meaning, "______");

            questions.push({
              id: `q-${idCounter++}`,
              type: "fill_in_blank",
              question: `${resMeaning} = ${blankedEq}`,
              correctAnswer: blankVar.meaning,
              explanation: `According to the formula, ${resMeaning} is calculated by substituting ${blankVar.meaning} into the equation.`,
              relatedConcept: resMeaning,
              relatedFormula: formula.raw
            });
        }
      }
    });

    // 2. Parse basic definitions from RAG text for Fill-in-the-blanks
    // Look for patterns like "**Noun** is defined as..." or "**Noun**: The rate of..."
    const boldRegex = /\*\*(.*?)\*\*(?:\s*is defined as|\s*:|\s*is the)\s*([^.]+\.)/gi;
    let match;
    while ((match = boldRegex.exec(ragContent)) !== null) {
      if (questions.length > 25) break; // limit
      const term = match[1].trim();
      const definition = match[2].trim();
      
      if (term.length > 2 && term.length < 30 && definition.length < 150) {
        questions.push({
            id: `q-${idCounter++}`,
            type: "fill_in_blank",
            question: `${definition.replace(new RegExp(term, 'gi'), "______")}`,
            correctAnswer: term,
            explanation: `${term} is defined as ${definition}`,
            relatedConcept: term
        });
      }
    }

    // Final shuffle and trim to 15 questions max to keep the quiz focused
    return shuffle(questions).slice(0, 15);
  }
};
