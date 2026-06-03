import { NextResponse } from 'next/server';
import { evaluateLocally, generateScenarioMock, PracticeScenario } from '../../../lib/practiceLogic';

async function generateScenarioWithOpenAI(expressions: string[]): Promise<PracticeScenario> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return generateScenarioMock(expressions);
  }

  try {
    const systemPrompt = `You are a conversation practice facilitator. Generate realistic, engaging conversation scenarios for language learners.
Your response must be valid JSON with this structure:
{
  "scenario": "A description of the scenario and context",
  "opening": "The opening message to start the conversation",
  "difficulty": "easy|medium|hard",
  "instruction": "How the user should respond",
  "targetExpressions": ["expr1", "expr2"]
}`;

    const userPrompt = `Generate a realistic conversation scenario that naturally requires the use of these expressions: ${expressions.join(', ')}.
The scenario should feel natural and encourage the learner to use these expressions in context, not just mention them.`;

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
      console.error('OpenAI API error:', response.status, response.statusText);
      return generateScenarioMock(expressions);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return generateScenarioMock(expressions);
    }

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonStr = content;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find JSON object
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }

    const scenario = JSON.parse(jsonStr) as PracticeScenario;

    // Validate required fields
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

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      action?: string;
      expressions?: string[];
      reply?: string;
    };
    const action = body.action || 'evaluate';
    const expressions = body.expressions || [];
    const reply = body.reply || '';

    // Generate a conversation scenario
    if (action === 'generate') {
      const scenario = await generateScenarioWithOpenAI(expressions);
      return NextResponse.json({ ok: true, scenario });
    }

    // Evaluate if expressions were used naturally
    if (action === 'evaluate') {
      const results = evaluateLocally(expressions, reply);
      return NextResponse.json({ ok: true, results });
    }

    return NextResponse.json(
      { ok: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
