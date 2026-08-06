import { CurriculumService } from './services/curriculumService';

async function main() {
  const classes = await CurriculumService.getClasses();
  for (const c of classes) {
    console.log(`Class: ${c.name} (ID: ${c.id})`);
    const subjects = await CurriculumService.getSubjects(c.id);
    for (const s of subjects) {
      const chapters = await CurriculumService.getChapters(s.id, c.id);
      console.log(`  Subject: ${s.name} (ID: ${s.id}, code: ${s.code}) -> ${chapters.length} chapters`);
      if (chapters.length === 0) {
        console.log(`    ⚠️ No chapters found for subject ${s.name} in ${c.name}!`);
      }
      for (const ch of chapters) {
        const topics = await CurriculumService.getTopics(ch.id, c.id);
        if (topics.length === 0) {
          console.log(`    ⚠️ No topics found for chapter ${ch.name} in ${s.name} (${c.name})!`);
        }
      }
    }
  }
}

main();
