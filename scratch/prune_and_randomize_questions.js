const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

async function main() {
  console.log('=== Step 1: Fetch all chapters and questions ===');
  const { data: chs, error: chErr } = await supabase
    .from('chapters')
    .select('id, title, chapter_code, subject_id, subjects(name)')
    .order('created_at', { ascending: true });

  if (chErr) throw chErr;

  const { data: allQuestions, error: qErr } = await supabase
    .from('questions')
    .select('id, chapter_id, subject_id, correct_option, question_options(id, option_key)')
    .order('created_at', { ascending: true });

  if (qErr) throw qErr;

  console.log(`Total chapters found: ${chs.length}`);
  console.log(`Total questions found: ${allQuestions.length}`);

  const keepQuestionIds = [];
  const deleteQuestionIds = [];
  const updates = [];

  // Options pool for fallback
  const fallbackOptions = ['a', 'b', 'c', 'd'];

  for (const chapter of chs) {
    const chapterQuestions = allQuestions.filter(q => q.chapter_id === chapter.id);
    console.log(`\nChapter [${chapter.chapter_code}] "${chapter.title}": ${chapterQuestions.length} questions available.`);

    // Select exactly 70 questions (or all if <= 70)
    const keepForChapter = chapterQuestions.slice(0, 70);
    const deleteForChapter = chapterQuestions.slice(70);

    console.log(`  -> Keeping: ${keepForChapter.length}, Deleting: ${deleteForChapter.length}`);

    for (const q of keepForChapter) {
      keepQuestionIds.push(q.id);
      
      // Determine available option keys
      const availKeys = (q.question_options && q.question_options.length > 0)
        ? q.question_options.map(o => (o.option_key || 'a').toLowerCase())
        : fallbackOptions;

      // Randomly choose 1 option
      const randomOption = availKeys[Math.floor(Math.random() * availKeys.length)];

      updates.push({
        id: q.id,
        correct_option: randomOption
      });
    }

    for (const q of deleteForChapter) {
      deleteQuestionIds.push(q.id);
    }
  }

  // Any questions with null or invalid chapter_id
  const unmappedQuestions = allQuestions.filter(q => !q.chapter_id || !chs.some(c => c.id === q.chapter_id));
  for (const q of unmappedQuestions) {
    if (!deleteQuestionIds.includes(q.id) && !keepQuestionIds.includes(q.id)) {
      deleteQuestionIds.push(q.id);
    }
  }

  console.log('\n=== Summary of Plan ===');
  console.log(`Questions to KEEP: ${keepQuestionIds.length} (Target: 420)`);
  console.log(`Questions to DELETE: ${deleteQuestionIds.length} (Total: ${allQuestions.length} - ${keepQuestionIds.length} = ${allQuestions.length - keepQuestionIds.length})`);
  console.log(`Updates to apply (random correct_option): ${updates.length}`);

  console.log('\n=== Step 2: Applying random correct_option updates to the 420 selected questions ===');
  // Batch update in chunks of 50
  for (let i = 0; i < updates.length; i += 50) {
    const chunk = updates.slice(i, i + 50);
    for (const item of chunk) {
      const { error: upErr } = await supabase
        .from('questions')
        .update({ correct_option: item.correct_option })
        .eq('id', item.id);
      if (upErr) {
        console.error(`Failed to update question ${item.id}:`, upErr);
      }
    }
    process.stdout.write(`Updated ${Math.min(i + 50, updates.length)} / ${updates.length} questions...\r`);
  }
  console.log('\nAll 420 selected questions updated with randomly chosen correct options.');

  console.log('\n=== Step 3: Deleting remaining questions and their associated options ===');
  // Batch delete in chunks of 50
  for (let i = 0; i < deleteQuestionIds.length; i += 50) {
    const chunk = deleteQuestionIds.slice(i, i + 50);
    
    // First delete dependent question_options
    await supabase
      .from('question_options')
      .delete()
      .in('question_id', chunk);

    // Delete paper_questions if any
    try {
      await supabase.from('paper_questions').delete().in('question_id', chunk);
    } catch (_) {}
    
    // Delete question_tags if any
    try {
      await supabase.from('question_tags').delete().in('question_id', chunk);
    } catch (_) {}

    // Delete question_bank_items if any
    try {
      await supabase.from('question_bank_items').delete().in('question_id', chunk);
    } catch (_) {}

    // Now delete from questions table
    const { error: qDelErr } = await supabase
      .from('questions')
      .delete()
      .in('id', chunk);

    if (qDelErr) {
      console.error(`Failed to delete questions chunk:`, qDelErr);
    }
    process.stdout.write(`Deleted ${Math.min(i + 50, deleteQuestionIds.length)} / ${deleteQuestionIds.length} questions...\r`);
  }
  console.log('\nDeletion of extra questions complete.');

  console.log('\n=== Step 4: Verification ===');
  const { count: finalCount, error: countErr } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  console.log(`Final Question Count in Supabase: ${finalCount}`);

  const { data: finalQs } = await supabase
    .from('questions')
    .select('id, chapter_id, correct_option, chapters(title, chapter_code, subjects(name))');

  const finalMap = {};
  const optionDistribution = { a: 0, b: 0, c: 0, d: 0 };
  const subjectMap = {};

  finalQs.forEach(q => {
    const chTitle = q.chapters?.title || 'Unknown';
    const subName = q.chapters?.subjects?.name || 'Unknown';
    finalMap[chTitle] = (finalMap[chTitle] || 0) + 1;
    subjectMap[subName] = (subjectMap[subName] || 0) + 1;
    const opt = (q.correct_option || '').toLowerCase();
    optionDistribution[opt] = (optionDistribution[opt] || 0) + 1;
  });

  console.log('\nPer Chapter Question Counts:');
  console.table(finalMap);

  console.log('\nPer Subject Question Counts:');
  console.table(subjectMap);

  console.log('\nCorrect Answer Distribution across 420 Questions:');
  console.table(optionDistribution);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
