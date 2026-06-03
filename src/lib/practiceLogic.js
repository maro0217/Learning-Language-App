export function evaluateLocally(expressions, reply) {
  const normalized = (s) => s.toLowerCase();
  const r = normalized(reply);
  const results = {};
  for (const expr of expressions) {
    const e = normalized(expr);
    const idx = r.indexOf(e);
    if (idx === -1) {
      results[expr] = false;
      continue;
    }
    const before = idx - 1 >= 0 ? r[idx - 1] : '';
    const after = idx + e.length < r.length ? r[idx + e.length] : '';
    const surrounding = (c) => (c && /[a-z0-9]/.test(c));
    const natural = surrounding(before) || surrounding(after) || r.trim().length > e.length + 4;
    results[expr] = !!natural;
  }
  return results;
}

export function generatePrompt(expressions) {
  const texts = expressions.map((t) => `"${t}"`).join(', ');
  return `Practice a casual conversation that naturally uses: ${texts}. You're the conversation partner.`;
}

export function generateScenarioMock(expressions) {
  const exprCount = expressions.length;
  let scenario = '';
  let opening = '';
  let difficulty = 'medium';

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
