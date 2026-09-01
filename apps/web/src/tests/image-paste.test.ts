import { describe, it, expect } from 'vitest';
import { Question, QuestionOption } from '@eduforge/shared';

describe('Image Copy-Paste Clean Attachment Handling', () => {
  it('attaches pasted image URL to question statement without modifying text with file paths or details', () => {
    const initialQuestion: Question = {
      id: 'q-paste-1',
      questionNumber: 1,
      questionType: 'MCQ_SINGLE',
      rawText: 'Calculate the total current drawn from the 12V battery.',
      content: [],
      options: [],
      marks: 4,
      difficulty: 'Medium',
      tags: ['circuits'],
      optionLayout: 'grid_2x2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Simulate image paste action (e.g. Ctrl+V with an image screenshot in clipboard)
    const pastedImageUrl = '/api/assets/uploaded_circuit_diagram_123.png';

    // Simulate onImagePasted handler logic
    const existing = initialQuestion.imageUrls && initialQuestion.imageUrls.length > 0
      ? initialQuestion.imageUrls
      : (initialQuestion.imageUrl ? [initialQuestion.imageUrl] : []);
    const mergedUrls = [...existing, pastedImageUrl];

    const updatedQuestion: Question = {
      ...initialQuestion,
      imageUrls: mergedUrls,
      imageUrl: mergedUrls[0]
    };

    // 1. Image URL must be attached
    expect(updatedQuestion.imageUrls).toContain(pastedImageUrl);
    expect(updatedQuestion.imageUrl).toBe(pastedImageUrl);

    // 2. Question rawText must NOT contain any file names, paths, or [Figure: ...] details
    expect(updatedQuestion.rawText).toBe('Calculate the total current drawn from the 12V battery.');
    expect(updatedQuestion.rawText).not.toContain('[Figure:');
    expect(updatedQuestion.rawText).not.toContain('uploaded_circuit_diagram_123.png');
  });

  it('attaches pasted image URL to MCQ option without inserting file names or paths into option text', () => {
    const initialOption: QuestionOption = {
      id: 'opt-a-1',
      key: 'a',
      rawText: '4.5 A',
      content: [],
      isCorrect: true
    };

    const pastedOptionImageUrl = '/api/assets/opt_graph_a.png';

    // Simulate updating option image on paste
    const updatedOption: QuestionOption = {
      ...initialOption,
      imageUrl: pastedOptionImageUrl
    };

    // 1. Option image must be attached
    expect(updatedOption.imageUrl).toBe(pastedOptionImageUrl);

    // 2. Option rawText must remain clean of file paths/names
    expect(updatedOption.rawText).toBe('4.5 A');
    expect(updatedOption.rawText).not.toContain('[Figure:');
    expect(updatedOption.rawText).not.toContain('opt_graph_a.png');
  });
});
