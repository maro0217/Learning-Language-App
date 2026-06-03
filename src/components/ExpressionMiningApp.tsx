'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { Expression, HistoryEntry } from '@/lib/types';
import { TranslationExercise } from '@/lib/practiceLogic';
import { seedExpressions } from '@/lib/seedData';
import {
  getExpressionsLocal,
  saveExpressionLocal,
  toggleSelectLocal,
  getHistoryLocal,
  saveHistoryLocal,
  incrementUsageCountLocal,
  initializeSeedLocal
} from '@/lib/storage';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import DarkToggle from './ui/DarkToggle';

type Screen = 'expressions' | 'practice' | 'history';

export default function ExpressionMiningApp() {
  const [screen, setScreen] = useState<Screen>('expressions');
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [newExpr, setNewExpr] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [exercise, setExercise] = useState<TranslationExercise | null>(null);
  const [answer, setAnswer] = useState('');
  const [evaluationResults, setEvaluationResults] = useState<Record<string, boolean>>({});
  const [evaluationFeedback, setEvaluationFeedback] = useState('');
  const [correctedAnswer, setCorrectedAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [practiceError, setPracticeError] = useState('');

  useEffect(() => {
    initializeSeedLocal(seedExpressions);
    load();
  }, []);

  function load() {
    setExpressions(getExpressionsLocal());
    setHistory(getHistoryLocal());
  }

  function addExpression() {
    const trimmed = newExpr.trim();
    if (!trimmed) return;
    saveExpressionLocal({ text: trimmed });
    setNewExpr('');
    load();
  }

  function toggleSelect(id: string) {
    toggleSelectLocal(id);
    setExpressions(getExpressionsLocal());
  }

  function resetPracticeState() {
    setExercise(null);
    setAnswer('');
    setEvaluationResults({});
    setEvaluationFeedback('');
    setCorrectedAnswer('');
    setPracticeError('');
  }

  async function startPractice() {
    const selected = expressions.filter((e) => e.selected).map((e) => e.text);
    const targets = selected.length ? selected : expressions.map((e) => e.text);

    if (!expressions.length) {
      setPracticeError('Add at least one expression before you start practice.');
      return;
    }

    setPracticeError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_translation', expressions: targets })
      });
      const data = await res.json() as {
        ok?: boolean;
        exercise?: TranslationExercise;
      };

      if (data.ok && data.exercise) {
        setExercise(data.exercise);
        setAnswer('');
        setEvaluationResults({});
        setEvaluationFeedback('');
        setCorrectedAnswer('');
        setScreen('practice');
      } else {
        setPracticeError('Could not generate a translation exercise right now.');
      }
    } catch (err) {
      console.error(err);
      setPracticeError('Unable to create the translation exercise.');
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAnswer() {
    if (!exercise) return;
    if (!answer.trim()) {
      setPracticeError('Please enter your answer before submitting.');
      return;
    }

    const selected = expressions.filter((e) => e.selected).map((e) => e.text);
    const targets = selected.length ? selected : expressions.map((e) => e.text);
    const textToIds = Object.fromEntries(expressions.map((expr) => [expr.text, expr.id]));

    setPracticeError('');
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
      const data = await res.json() as {
        ok?: boolean;
        results?: Record<string, boolean>;
        feedback?: string;
        correctedAnswer?: string;
      };

      if (data.ok && data.results) {
        setEvaluationResults(data.results);
        setEvaluationFeedback(data.feedback || 'Review the results below.');
        setCorrectedAnswer(data.correctedAnswer || '');

        const now = new Date().toISOString();
        const successes: HistoryEntry[] = [];
        for (const [exprText, ok] of Object.entries(data.results)) {
          if (ok) {
            const id = textToIds[exprText];
            if (id) incrementUsageCountLocal(id);
            successes.push({ expression: exprText, usedAt: now });
          }
        }
        if (successes.length) {
          const current = getHistoryLocal();
          saveHistoryLocal([...successes, ...current]);
        }
        load();
      } else {
        setPracticeError('Could not evaluate your answer.');
      }
    } catch (err) {
      console.error(err);
      setPracticeError('Unable to evaluate your answer right now.');
    } finally {
      setIsLoading(false);
    }
  }

  function goToScreen(target: Screen) {
    setScreen(target);
    if (target === 'expressions') {
      resetPracticeState();
    }
  }

  const selectedCount = expressions.filter((e) => e.selected).length;
  const totalUses = expressions.reduce((sum, expr) => sum + (expr.count || 0), 0);
  const activeTargets = expressions.filter((e) => e.selected).map((e) => e.text);

  const sortedHistory = [...history].sort((a, b) => (a.usedAt < b.usedAt ? 1 : -1));
  const topExpressions = [...expressions]
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-xl flex-col gap-5 pb-24">
        <div className="flex flex-col gap-4 rounded-3xl border border-input bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Expression Mining</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">Learn with expression-focused translation drills</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={screen === 'expressions' ? 'secondary' : 'ghost'} size="sm" onClick={() => goToScreen('expressions')}>
              Expressions
            </Button>
            <Button variant={screen === 'practice' ? 'secondary' : 'ghost'} size="sm" onClick={() => goToScreen('practice')}>
              Practice
            </Button>
            <Button variant={screen === 'history' ? 'secondary' : 'ghost'} size="sm" onClick={() => goToScreen('history')}>
              History
            </Button>
            <DarkToggle />
          </div>
        </div>

        {practiceError ? (
          <div className="rounded-3xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive-foreground">
            {practiceError}
          </div>
        ) : null}

        {screen === 'expressions' && (
          <>
            <Card>
              <CardHeader className="items-center justify-between gap-4">
                <div>
                  <CardTitle>Add a new expression</CardTitle>
                  <CardDescription>Save English expressions and select the ones you want to practice.</CardDescription>
                </div>
                <Sparkles className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input
                    value={newExpr}
                    onChange={(event) => setNewExpr(event.target.value)}
                    onKeyPress={(event) => event.key === 'Enter' && addExpression()}
                    placeholder="e.g., grapple with"
                  />
                  <Button onClick={addExpression} disabled={!newExpr.trim()}>
                    Add expression
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="items-center justify-between gap-4">
                <div>
                  <CardTitle>Saved expressions</CardTitle>
                  <CardDescription>Choose the expressions you'd like to include in the next drill.</CardDescription>
                </div>
                <Badge variant="secondary">{expressions.length} total</Badge>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[340px] rounded-3xl border border-input bg-background p-3">
                  <div className="space-y-3">
                    {expressions.length > 0 ? (
                      expressions.map((expr) => (
                        <button
                          key={expr.id}
                          type="button"
                          onClick={() => toggleSelect(expr.id)}
                          className={`w-full rounded-3xl border p-4 text-left transition ${expr.selected ? 'border-primary/60 bg-primary/10' : 'border-input bg-card hover:border-primary/50'}`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-foreground">{expr.text}</p>
                              <p className="mt-2 text-sm text-muted-foreground">Used {expr.count || 0} time{expr.count === 1 ? '' : 's'}</p>
                            </div>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${expr.selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-input bg-muted p-6 text-center text-sm text-muted-foreground">
                        Your expression library is empty. Add a phrase to get started.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Selected</p>
                  <p className="text-3xl font-semibold text-foreground">{selectedCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total uses</p>
                  <p className="text-3xl font-semibold text-foreground">{totalUses}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Practice mode</p>
                  <p className="text-3xl font-semibold text-foreground">{selectedCount > 0 ? 'Selected' : 'All saved'}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button onClick={startPractice} disabled={isLoading || !expressions.length} className="w-full sm:w-auto">
                {isLoading ? 'Preparing practice…' : 'Start practice'}
              </Button>
              <Button variant="secondary" onClick={() => setScreen('history')} className="w-full sm:w-auto">
                View history
              </Button>
            </div>
          </>
        )}

        {screen === 'practice' && (
          <>
            {exercise ? (
              <>
                <Card>
                  <CardHeader className="items-start justify-between gap-4 sm:flex-row">
                    <div>
                      <CardTitle>Translation drill</CardTitle>
                      <CardDescription>Translate the Japanese prompt into English using the target expressions.</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{exercise.difficulty}</Badge>
                      <Badge variant="outline">{exercise.targetExpressions.length} target{exercise.targetExpressions.length === 1 ? '' : 's'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-3xl border border-input bg-muted p-4">
                      <p className="text-sm font-medium text-muted-foreground">Japanese prompt</p>
                      <p className="mt-3 text-base leading-7 text-foreground">{exercise.japanesePrompt}</p>
                    </div>
                    {exercise.context ? (
                      <div className="rounded-3xl border border-input bg-background p-4">
                        <p className="text-sm font-medium text-muted-foreground">Context</p>
                        <p className="mt-3 text-foreground">{exercise.context}</p>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {exercise.targetExpressions.map((expr) => (
                        <Badge key={expr} variant="outline">
                          {expr}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="items-center justify-between gap-4">
                    <CardTitle>Your answer</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => goToScreen('expressions')}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to expressions
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder="Write your English translation here."
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <Button onClick={submitAnswer} disabled={isLoading || !answer.trim()}>
                        {isLoading ? 'Checking answer…' : 'Submit answer'}
                      </Button>
                      <Button variant="secondary" onClick={() => goToScreen('history')}>
                        See your history
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {evaluationFeedback ? (
                  <Card>
                    <CardHeader className="items-center justify-between gap-4">
                      <CardTitle>Evaluation</CardTitle>
                      <Badge variant={Object.values(evaluationResults).every(Boolean) ? 'secondary' : 'outline'}>
                        {Object.values(evaluationResults).every(Boolean) ? 'Passed' : 'Review'}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{evaluationFeedback}</p>
                      <div className="space-y-3">
                        {Object.entries(evaluationResults).map(([expr, ok]) => (
                          <div key={expr} className={`flex items-center justify-between gap-3 rounded-3xl border p-4 ${ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-destructive/20 bg-destructive/10 text-destructive-foreground'}`}>
                            <div>
                              <p className="font-semibold">{expr}</p>
                              <p className="text-sm text-muted-foreground">{ok ? 'Used naturally' : 'Not used naturally'}</p>
                            </div>
                            <CheckCircle2 className={`h-6 w-6 ${ok ? 'text-emerald-300' : 'text-destructive-foreground'}`} />
                          </div>
                        ))}
                      </div>
                      {correctedAnswer ? (
                        <div className="rounded-3xl border border-input bg-background p-4">
                          <p className="text-sm font-medium text-muted-foreground">Model answer</p>
                          <p className="mt-3 text-foreground">{correctedAnswer}</p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}
              </>
            ) : (
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No exercise is loaded yet.</p>
                  <div className="mt-4 flex gap-3">
                    <Button onClick={startPractice} disabled={isLoading || !expressions.length}>
                      {isLoading ? 'Preparing…' : 'Load practice exercise'}
                    </Button>
                    <Button variant="secondary" onClick={() => goToScreen('expressions')}>
                      Choose expressions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {screen === 'history' && (
          <>
            <Card>
              <CardHeader className="items-center justify-between gap-4 sm:flex-row">
                <div>
                  <CardTitle>Practice history</CardTitle>
                  <CardDescription>Track successful uses and the expressions you use most.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => goToScreen('expressions')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Expressions
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-input bg-muted p-5">
                  <p className="text-sm font-medium text-muted-foreground">Most used expressions</p>
                  <div className="mt-4 space-y-3">
                    {topExpressions.length > 0 ? (
                      topExpressions.map((expr, index) => (
                        <div key={expr.id} className="flex items-center justify-between rounded-3xl border border-input bg-background p-4">
                          <div>
                            <p className="font-semibold text-foreground">{expr.text}</p>
                            <p className="text-sm text-muted-foreground">Used {expr.count || 0} time{expr.count === 1 ? '' : 's'}</p>
                          </div>
                          <Badge variant="secondary">#{index + 1}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No expressions have been used yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-input bg-muted p-5">
                  <p className="text-sm font-medium text-muted-foreground">Recent successful uses</p>
                  <ScrollArea className="mt-4 h-[260px] rounded-3xl border border-input bg-background p-3">
                    <div className="space-y-3">
                      {sortedHistory.length > 0 ? (
                        sortedHistory.map((item, index) => (
                          <div key={`${item.expression}-${index}`} className="rounded-3xl border border-input/80 bg-muted p-4">
                            <p className="font-semibold text-foreground">{item.expression}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{new Date(item.usedAt).toLocaleString()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-input/60 bg-background p-6 text-center text-sm text-muted-foreground">
                          No successful practice results yet.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
