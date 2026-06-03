export type EvalResult = Record<string, boolean>;

export type PracticeScenario = {
  scenario: string;
  opening: string;
  difficulty: 'easy' | 'medium' | 'hard';
  instruction: string;
  targetExpressions: string[];
};

export type TranslationExercise = {
  japanesePrompt: string;
  context: string;
  targetExpressions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  modelAnswer: string;
};

export type TranslationEvaluation = {
  results: EvalResult;
  feedback: string;
  correctedAnswer: string;
};

// Simple heuristic: expression counted as "used naturally" if it appears as a substring
// but not only as an isolated mention. We require surrounding non-punctuation characters
// within the reply to consider it natural. This is a conservative mock evaluator.
export function evaluateLocally(expressions: string[], reply: string) {
  const normalized = (s: string) => s.toLowerCase();
  const r = normalized(reply);
  const results: EvalResult = {};
  for (const expr of expressions) {
    const e = normalized(expr);
    const idx = r.indexOf(e);
    if (idx === -1) {
      results[expr] = false;
      continue;
    }
    const before = idx - 1 >= 0 ? r[idx - 1] : '';
    const after = idx + e.length < r.length ? r[idx + e.length] : '';
    const surrounding = (c: string) => (c && /[a-z0-9]/.test(c));
    const natural = surrounding(before) || surrounding(after) || r.trim().length > e.length + 4;
    results[expr] = !!natural;
  }
  return results;
}

export function evaluateTranslationLocally(
  expressions: string[],
  userAnswer: string,
  japanesePrompt: string,
  modelAnswer: string
) {
  const results = evaluateLocally(expressions, userAnswer);
  const usedCount = Object.values(results).filter(Boolean).length;
  const hasAnswer = userAnswer.trim().length > 0;

  let feedback = '';
  if (!hasAnswer) {
    feedback = 'Please write an answer using the target expressions.';
  } else if (usedCount === expressions.length) {
    feedback = 'Great job! You used all target expressions naturally.';
  } else if (usedCount > 0) {
    feedback = 'You used some expressions, but a few were missing or not used naturally. Try again using the target expressions more naturally.';
  } else {
    feedback = 'None of the target expressions were used naturally. Try again with the model answer in mind.';
  }

  const correctedAnswer = modelAnswer;

  return {
    results,
    feedback,
    correctedAnswer
  };
}

export function generatePrompt(expressions: string[]) {
  const texts = expressions.map((t) => `"${t}"`).join(', ');
  return `Practice a casual conversation that naturally uses: ${texts}. You're the conversation partner.`;
}

export function generateTranslationPrompt(expressions: string[]) {
  const texts = expressions.map((t) => `"${t}"`).join(', ');
  return `Create a Japanese-to-English translation exercise that naturally requires the target expressions: ${texts}.`;
}

export function generateScenarioMock(expressions: string[]): PracticeScenario {
  const exprCount = expressions.length;
  let scenario = '';
  let opening = '';
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';

  if (exprCount === 1) {
    const expr = expressions[0];
    scenario = `You're having a casual chat with a friend about recent experiences. Try to naturally use the expression "${expr}" when relevant.`;
    opening = 'Hey! How have things been lately? Anything new?';
    difficulty = 'easy';
  } else if (exprCount === 2) {
    scenario = `You're discussing life decisions with a friend. The conversation should naturally flow to include: "${expressions[0]}" and "${expressions[1]}".`;
    opening = 'I noticed you seem a bit stressed. What\'s on your mind?';
    difficulty = 'medium';
  } else {
    scenario = `You're having a deeper conversation about challenges and perspectives. Try to weave in the following naturally: ${expressions.map((e) => `"${e}"`).join(', ')}.`;
    opening = 'So I wanted to catch up with you. How\'s everything been going?';
    difficulty = 'hard';
  }

  return {
    scenario,
    opening,
    difficulty,
    instruction: 'Reply naturally to the opening message. Try to use the target expressions in your response.',
    targetExpressions: expressions
  };
}

export function generateTranslationExerciseMock(expressions: string[]) {
  const exprCount = expressions.length;
  const difficulty: 'easy' | 'medium' | 'hard' = exprCount <= 1 ? 'easy' : exprCount === 2 ? 'medium' : 'hard';

  const japanesePrompt = exprCount === 0
    ? '最近の出来事について、友達に英語で説明してください。'
    : exprCount === 1
      ? `最近、自分が本当にやりたいことと現実的な選択の間で悩んでいる、と友達に英語で伝えてください。`
      : exprCount === 2
        ? `仕事とプライベートのバランスについて、友達に英語で相談してください。`
        : `最近、将来の計画や心配事について英語で友達に話してください。`;

  const context = exprCount === 0
    ? 'Describe a recent event or feeling in English.'
    : exprCount === 1
      ? 'Explain a personal struggle in a natural way.'
      : exprCount === 2
        ? 'Talk through your schedule and emotional state clearly.'
        : 'Describe your current life situation and your feelings about it.';

  const modelAnswer = exprCount === 0
    ? `I've been thinking about what happened recently and how I feel about it.`
    : exprCount === 1
      ? `I've been grappling with the gap between what I really want to do and what feels realistic.`
      : exprCount === 2
        ? `I'm trying to juggle work and personal time, but it's been hard to keep everything balanced.`
        : `I've been thinking a lot about my future, trying to navigate what feels right and what makes sense.`;

  return {
    japanesePrompt,
    context,
    targetExpressions: expressions,
    difficulty,
    modelAnswer
  };
}
