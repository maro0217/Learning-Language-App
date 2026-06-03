import { NextResponse } from 'next/server';
import {
  evaluateLocally,
  evaluateTranslationLocally,
  generateScenarioMock,
  generateTranslationExerciseMock,
  PracticeScenario,
  TranslationExercise
} from '../../../lib/practiceLogic';

async function generateScenarioWithOpenAI(expressions: string[]): Promise<PracticeScenario> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return generateScenarioMock(expressions);
  }

  try {
    const systemPrompt = `You are a conversation practice facilitator. Generate realistic, engaging conversation scenarios for language learners.\nYour response must be valid JSON with this structure:\n{\n  "scenario": "A description of the scenario and context",\n  "opening": "The opening message to start the conversation",\n  "difficulty": "easy|medium|hard",\n  "instruction": "How the user should respond",\n  "targetExpressions": ["expr1", "expr2"]\n}`;

    const userPrompt = `Generate a realistic conversation scenario that naturally requires the use of these expressions: ${expressions.join(', ')}. The scenario should feel natural and encourage the learner to use these expressions in context, not just mention them.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText, responseText);
      return generateScenarioMock(expressions);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return generateScenarioMock(expressions);
    }

    let jsonStr = content;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }

    const scenario = JSON.parse(jsonStr) as PracticeScenario;
    if (
      scenario.scenario &&
      scenario.opening &&
      scenario.difficulty &&
      scenario.instruction &&
      Array.isArray(scenario.targetExpressions)
    ) {
      return scenario;
    }

    return generateScenarioMock(expressions);
  } catch (err) {
    console.error('Error generating scenario with OpenAI:', err);
    return generateScenarioMock(expressions);
  }
}

async function generateTranslationWithOpenAI(expressions: string[]): Promise<TranslationExercise> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return generateTranslationExerciseMock(expressions);
  }

  try {
    const systemPrompt = `You are a translation exercise generator. Create a Japanese-to-English translation prompt that naturally requires the target expressions. Return valid JSON with this structure:\n{\n  "japanesePrompt": "Natural Japanese prompt.",\n  "context": "Optional situation or context.",\n  "targetExpressions": ["expr1", "expr2"],\n  "difficulty": "easy|medium|hard",\n  "modelAnswer": "Natural English answer that uses the target expressions."\n}`;

    const userPrompt = `Generate a Japanese prompt and a model answer that naturally uses these English expressions: ${expressions.join(', ')}. The Japanese prompt should be natural and appropriate to the target expressions.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText, responseText);
      return generateTranslationExerciseMock(expressions);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return generateTranslationExerciseMock(expressions);
    }

    let jsonStr = content;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }

    const exercise = JSON.parse(jsonStr) as TranslationExercise;
    if (
      exercise.japanesePrompt &&
      typeof exercise.context === 'string' &&
      Array.isArray(exercise.targetExpressions) &&
      exercise.difficulty &&
      exercise.modelAnswer
    ) {
      return exercise;
    }

    return generateTranslationExerciseMock(expressions);
  } catch (err) {
    console.error('Error generating translation exercise with OpenAI:', err);
    return generateTranslationExerciseMock(expressions);
  }
}

async function evaluateTranslationWithOpenAI(
  expressions: string[],
  userAnswer: string,
  japanesePrompt: string,
  modelAnswer: string
) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return evaluateTranslationLocally(expressions, userAnswer, japanesePrompt, modelAnswer);
  }

  try {
    const systemPrompt = `You are a language learning evaluator. Determine whether the learner's English answer uses each target expression naturally and whether it matches the Japanese prompt. Respond with valid JSON:\n{\n  "results": {"expr1": true, "expr2": false},\n  "feedback": "Short feedback.",\n  "correctedAnswer": "A corrected/ideal answer."\n}`;

    const userPrompt = `Japanese prompt: ${japanesePrompt}\nModel answer: ${modelAnswer}\nLearner answer: ${userAnswer}\nTarget expressions: ${expressions.join(', ')}\nEvaluate whether each target expression is used naturally and the answer is relevant to the prompt.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText, responseText);
      return evaluateTranslationLocally(expressions, userAnswer, japanesePrompt, modelAnswer);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return evaluateTranslationLocally(expressions, userAnswer, japanesePrompt, modelAnswer);
    }

    let jsonStr = content;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }

    const evaluation = JSON.parse(jsonStr) as {
      results?: Record<string, boolean>;
      feedback?: string;
      correctedAnswer?: string;
    };

    if (evaluation.results && typeof evaluation.feedback === 'string' && typeof evaluation.correctedAnswer === 'string') {
      return {
        results: evaluation.results,
        feedback: evaluation.feedback,
        correctedAnswer: evaluation.correctedAnswer
      };
    }

    return evaluateTranslationLocally(expressions, userAnswer, japanesePrompt, modelAnswer);
  } catch (err) {
    console.error('Error evaluating translation with OpenAI:', err);
    return evaluateTranslationLocally(expressions, userAnswer, japanesePrompt, modelAnswer);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      action?: string;
      expressions?: string[];
      reply?: string;
      userAnswer?: string;
      japanesePrompt?: string;
      modelAnswer?: string;
    };
    const action = body.action || 'evaluate';
    const expressions = body.expressions || [];

    if (action === 'generate') {
      const scenario = await generateScenarioWithOpenAI(expressions);
      return NextResponse.json({ ok: true, scenario });
    }

    if (action === 'evaluate') {
      const results = evaluateLocally(expressions, body.reply || '');
      return NextResponse.json({ ok: true, results });
    }

    if (action === 'generate_translation') {
      const exercise = await generateTranslationWithOpenAI(expressions);
      return NextResponse.json({ ok: true, exercise });
    }

    if (action === 'evaluate_translation') {
      const japanesePrompt = body.japanesePrompt || '';
      const modelAnswer = body.modelAnswer || '';
      const userAnswer = body.userAnswer || '';
      const evaluation = await evaluateTranslationWithOpenAI(expressions, userAnswer, japanesePrompt, modelAnswer);
      return NextResponse.json({ ok: true, ...evaluation });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
