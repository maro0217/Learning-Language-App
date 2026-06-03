'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getExpressionsLocal, getHistoryLocal, incrementUsageCountLocal, saveHistoryLocal } from '@/lib/storage';
import { Expression, HistoryEntry } from '@/lib/types';
import { TranslationExercise } from '@/lib/practiceLogic';

export default function PracticePage() {
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [exercise, setExercise] = useState<TranslationExercise | null>(null);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState('');
  const [corrected, setCorrected] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setExpressions(getExpressionsLocal());
  }, []);

  const targets = useMemo(() => {
    const selected = expressions.filter((expr) => expr.selected).map((expr) => expr.text);
    return selected.length > 0 ? selected : expressions.map((expr) => expr.text);
  }, [expressions]);

  const idMap = useMemo(() => Object.fromEntries(expressions.map((expr) => [expr.text, expr.id])), [expressions]);

  async function loadExercise() {
    if (!expressions.length) {
      setError('No expressions found. Add an expression first.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_translation', expressions: targets })
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.exercise) {
        const message = data?.error || (data.ok ? 'Invalid exercise response' : `API returned ${res.status}`);
        console.error('Practice generation error:', message, data);
        setError(message);
        return;
      }
      setExercise(data.exercise);
      setAnswer('');
      setResults({});
      setFeedback('');
      setCorrected('');
    } catch (err) {
      console.error('Practice generation error:', err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAnswer() {
    if (!exercise) return;
    if (!answer.trim()) {
      setError('Please enter an answer before submitting.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_translation',
          expressions: targets,
          userAnswer: answer,
          japanesePrompt: exercise.japanesePrompt,
          modelAnswer: exercise.modelAnswer
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.results) {
        const message = data?.error || (data.ok ? 'Invalid evaluation response' : `API returned ${res.status}`);
        console.error('Practice evaluation error:', message, data);
        setError(message);
        return;
      }

      setResults(data.results || {});
      setFeedback(data.feedback || 'Review the results below.');
      setCorrected(data.correctedAnswer || '');

      const now = new Date().toISOString();
      const successes: HistoryEntry[] = [];
      for (const [exprText, ok] of Object.entries(data.results || {})) {
        if (ok) {
          const id = idMap[exprText];
          if (id) {
            incrementUsageCountLocal(id);
          }
          successes.push({ expression: exprText, usedAt: now });
        }
      }
      if (successes.length) {
        saveHistoryLocal([...successes, ...getHistoryLocal()]);
      }
      setExpressions(getExpressionsLocal());
    } catch (err) {
      console.error('Practice evaluation error:', err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader className="items-center justify-between gap-4">
          <div>
            <CardTitle>Translation Practice</CardTitle>
            <CardDescription>Use saved expressions in a Japanese-to-English drill.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="block">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            <Link href="/expressions" className="block">
              <Button variant="secondary" size="sm">Expressions</Button>
            </Link>
            <Link href="/history" className="block">
              <Button variant="ghost" size="sm">History</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="rounded-3xl border border-input bg-muted p-4">
              <p className="text-sm text-muted-foreground">Target expressions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {targets.length > 0 ? (
                  targets.map((expression) => (
                    <Badge key={expression} variant="outline">{expression}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No expressions available yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-3xl border border-input bg-muted p-4">
              <p className="text-sm text-muted-foreground">Practice mode</p>
              <p className="mt-2 text-foreground">{expressions.filter((expr) => expr.selected).length > 0 ? 'Selected expressions' : 'All saved expressions'}</p>
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive-foreground">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={loadExercise} disabled={isLoading || !expressions.length} className="w-full sm:w-auto">
              {isLoading ? 'Loading exercise…' : 'Generate exercise'}
            </Button>
            <Button variant="secondary" onClick={() => setExercise(null)} className="w-full sm:w-auto">
              Reset exercise
            </Button>
          </div>

          {exercise ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="items-center justify-between gap-4">
                  <CardTitle>Exercise</CardTitle>
                  <Badge variant="secondary">{exercise.difficulty}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-3xl border border-input bg-background p-4">
                    <p className="text-sm font-medium text-muted-foreground">Japanese prompt</p>
                    <p className="mt-3 text-foreground">{exercise.japanesePrompt}</p>
                  </div>
                  <div className="rounded-3xl border border-input bg-muted p-4">
                    <p className="text-sm font-medium text-muted-foreground">Context</p>
                    <p className="mt-3 text-foreground">{exercise.context}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {exercise.targetExpressions.map((expression) => (
                      <Badge key={expression} variant="outline">{expression}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your answer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Write your English translation here."
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={submitAnswer} disabled={isLoading || !answer.trim()} className="w-full sm:w-auto">
                      {isLoading ? 'Checking…' : 'Submit answer'}
                    </Button>
                    <Button variant="ghost" onClick={loadExercise} className="w-full sm:w-auto">
                      New exercise
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {feedback ? (
                <Card>
                  <CardHeader className="items-center justify-between gap-4">
                    <CardTitle>Evaluation</CardTitle>
                    <Badge variant={Object.values(results).every(Boolean) ? 'secondary' : 'outline'}>
                      {Object.values(results).every(Boolean) ? 'Passed' : 'Review'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{feedback}</p>
                    <div className="space-y-3">
                      {Object.entries(results).map(([expression, ok]) => (
                        <div key={expression} className={`flex items-center justify-between gap-3 rounded-3xl border p-4 ${ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-destructive/20 bg-destructive/10 text-destructive-foreground'}`}>
                          <div>
                            <p className="font-semibold">{expression}</p>
                            <p className="text-sm text-muted-foreground">{ok ? 'Used naturally' : 'Not used naturally'}</p>
                          </div>
                          <Badge variant={ok ? 'secondary' : 'destructive'}>{ok ? 'OK' : 'No'}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-3xl border border-input bg-background p-4">
                      <p className="text-sm font-medium text-muted-foreground">Model answer</p>
                      <p className="mt-3 text-foreground">{corrected}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
