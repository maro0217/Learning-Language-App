'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { Expression, HistoryEntry } from '@/lib/types';
import { PracticeScenario } from '@/lib/practiceLogic';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import DarkToggle from './ui/DarkToggle';

type Screen = 'home' | 'practice' | 'history';
type HomeTab = 'library' | 'insights';

export default function ExpressionMiningApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [homeTab, setHomeTab] = useState<HomeTab>('library');
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [newExpr, setNewExpr] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [scenario, setScenario] = useState<PracticeScenario | null>(null);
  const [userReply, setUserReply] = useState('');
  const [lastResult, setLastResult] = useState<Record<string, boolean>>({});
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

  async function startPractice() {
    const selected = expressions.filter((e) => e.selected);
    if (!selected.length) {
      setPracticeError('Select at least one expression to practice.');
      return;
    }
    setPracticeError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', expressions: selected.map((s) => s.text) })
      });
      const data = await res.json() as { ok?: boolean; scenario?: PracticeScenario };
      if (data.ok && data.scenario) {
        setScenario(data.scenario);
        setUserReply('');
        setLastResult({});
        setScreen('practice');
      }
    } catch (err) {
      console.error(err);
      setPracticeError('Unable to create conversation scenario.');
    } finally {
      setIsLoading(false);
    }
  }

  async function evaluateReply() {
    if (!scenario) return;
    const selected = expressions.filter((e) => e.selected);
    if (!userReply.trim()) {
      setPracticeError('Please type a reply before submitting.');
      return;
    }
    setPracticeError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evaluate', expressions: selected.map((s) => s.text), reply: userReply })
      });
      const data = await res.json() as { ok?: boolean; results?: Record<string, boolean> };
      if (data.ok && data.results) {
        setLastResult(data.results);
        const now = new Date().toISOString();
        const successes: HistoryEntry[] = [];
        for (const e of selected) {
          const ok = data.results[e.text];
          if (ok) {
            incrementUsageCountLocal(e.id);
            successes.push({ expression: e.text, usedAt: now });
          }
        }
        if (successes.length) {
          const current = getHistoryLocal();
          saveHistoryLocal([...successes, ...current]);
        }
        load();
      }
    } catch (err) {
      console.error(err);
      setPracticeError('Unable to evaluate your reply right now.');
    } finally {
      setIsLoading(false);
    }
  }

  function exitPractice() {
    setScenario(null);
    setUserReply('');
    setLastResult({});
    setPracticeError('');
    setScreen('home');
  }

  const selectedCount = expressions.filter((e) => e.selected).length;
  const totalUses = expressions.reduce((sum, expr) => sum + (expr.count || 0), 0);
  const readinessPercent = expressions.length ? Math.round((selectedCount / expressions.length) * 100) : 0;
  const hasResults = Object.keys(lastResult).length > 0;
  const successCount = Object.values(lastResult).filter(Boolean).length;
  const totalCount = Object.keys(lastResult).length;

  if (screen === 'home') {
    return (
      <div className="min-h-screen px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-xl flex-col gap-5 pb-28">
          <Card>
            <CardHeader className="items-start justify-between gap-4 sm:flex-row">
              <div>
                <CardTitle>Expression Mining</CardTitle>
                <CardDescription>Practice targeted English phrases with AI-powered conversation prompts.</CardDescription>
              </div>
              <DarkToggle />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-input bg-muted p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.24em]">Expressions</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{expressions.length}</p>
              </div>
              <div className="rounded-3xl border border-input bg-muted p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.24em]">Selected</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{selectedCount}</p>
              </div>
              <div className="rounded-3xl border border-input bg-muted p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.24em]">Uses</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{totalUses}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="items-center justify-between gap-4">
              <div>
                <CardTitle>Add a new expression</CardTitle>
                <CardDescription>Save natural phrase candidates and keep your practice goal-focused.</CardDescription>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input
                  value={newExpr}
                  onChange={(event) => setNewExpr(event.target.value)}
                  onKeyPress={(event) => event.key === 'Enter' && addExpression()}
                  placeholder="e.g., break the ice"
                />
                <Button onClick={addExpression} disabled={!newExpr.trim()}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="items-center justify-between gap-4">
              <div>
                <CardTitle>Expression library</CardTitle>
                <CardDescription>Tap a phrase to queue it for your next practice scenario.</CardDescription>
              </div>
              <Badge variant="secondary">{expressions.length} total</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
<Tabs value={homeTab} onValueChange={(value) => setHomeTab(value as HomeTab)}>                <TabsList>
                  <TabsTrigger value="library">Library</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>
                <TabsContent value="library">
                  <ScrollArea className="h-[320px] rounded-3xl border border-input bg-background p-3">
                    <div className="space-y-3">
                      {expressions.map((expr) => (
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
                      ))}
                      {expressions.length === 0 && (
                        <div className="rounded-3xl border border-dashed border-input bg-muted p-6 text-center text-sm text-muted-foreground">
                          Your expression library is empty. Add a phrase to get started.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="insights">
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-input bg-muted p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Practice readiness</p>
                        <Badge variant="outline">{selectedCount} selected</Badge>
                      </div>
                      <div className="mt-4">
                        <Progress value={readinessPercent} />
                      </div>
                    </div>
                    <div className="rounded-3xl border border-input bg-muted p-5">
                      <p className="text-sm font-medium text-muted-foreground">Active streak</p>
                      <p className="mt-3 text-3xl font-semibold text-foreground">{history.length} sessions</p>
                      <p className="mt-2 text-sm text-muted-foreground">Review your recent progress in the history tab.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {practiceError ? (
            <div className="rounded-3xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive-foreground">
              {practiceError}
            </div>
          ) : null}
        </div>

        <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-input/80 bg-background/95 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl gap-3">
            <Button variant="secondary" onClick={() => setScreen('history')}>History</Button>
            <Button onClick={startPractice} disabled={selectedCount === 0 || isLoading}>
              {isLoading ? 'Starting...' : `Practice (${selectedCount})`}
            </Button>
          </div>
        </footer>
      </div>
    );
  }

  if (screen === 'practice' && scenario) {
    return (
      <div className="min-h-screen px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-xl flex-col gap-5 pb-28">
          <Card>
            <CardHeader className="items-center justify-between gap-4 sm:flex-row">
              <div>
                <CardTitle>Practice conversation</CardTitle>
                <CardDescription>Reply naturally and earn usage credit for the phrases you select.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={exitPractice}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Home
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-input bg-muted p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">Scenario</p>
                  <Badge variant="secondary">{scenario.difficulty}</Badge>
                </div>
                <p className="mt-4 text-base leading-7 text-foreground">{scenario.scenario}</p>
              </div>

              <div className="rounded-3xl border border-input bg-background p-5">
                <p className="text-sm font-medium text-muted-foreground">Target expressions</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {scenario.targetExpressions.map((expr) => (
                    <Badge key={expr} variant="outline">
                      {expr}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-input bg-muted p-5">
                <p className="text-sm font-medium text-muted-foreground">Their opening message</p>
                <div className="mt-3 rounded-3xl bg-background p-4 text-foreground">“{scenario.opening}”</div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">Your reply</label>
                <Textarea
                  value={userReply}
                  onChange={(event) => setUserReply(event.target.value)}
                  placeholder="Write a fluent, natural reply using the target phrases."
                />
              </div>

              {practiceError ? (
                <div className="rounded-3xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive-foreground">
                  {practiceError}
                </div>
              ) : null}

              {hasResults ? (
                <Card>
                  <CardHeader className="items-center justify-between gap-4">
                    <div>
                      <CardTitle>{successCount === totalCount ? 'Perfect reply' : 'Evaluation results'}</CardTitle>
                      <CardDescription>{successCount}/{totalCount} expressions used naturally</CardDescription>
                    </div>
                    <Badge variant={successCount === totalCount ? 'secondary' : 'outline'}>
                      {successCount === totalCount ? 'Success' : 'Partial'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(lastResult).map(([expr, ok]) => (
                      <div
                        key={expr}
                        className={`flex items-center justify-between gap-3 rounded-3xl border p-4 ${ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-destructive/20 bg-destructive/10 text-destructive-foreground'}`}
                      >
                        <div>
                          <p className="font-semibold">{expr}</p>
                          <p className="text-sm text-muted-foreground">{ok ? 'Used naturally' : 'Not used naturally'}</p>
                        </div>
                        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-destructive/20 text-destructive-foreground'}`}>
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-input/80 bg-background/95 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl gap-3">
            <Button variant="secondary" onClick={exitPractice}>Back</Button>
            <Button onClick={evaluateReply} disabled={isLoading || !userReply.trim()}>
              {isLoading ? 'Checking...' : 'Submit reply'}
            </Button>
          </div>
        </footer>
      </div>
    );
  }

  if (screen === 'history') {
    const groupedByExpr: Record<string, number> = {};
    for (const item of history) {
      groupedByExpr[item.expression] = (groupedByExpr[item.expression] || 0) + 1;
    }
    const topExpressions = Object.entries(groupedByExpr)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const sortedHistory = [...history].sort((a, b) => (a.usedAt < b.usedAt ? 1 : -1));

    return (
      <div className="min-h-screen px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-xl flex-col gap-5 pb-28">
          <Card>
            <CardHeader className="items-center justify-between gap-4 sm:flex-row">
              <div>
                <CardTitle>Usage history</CardTitle>
                <CardDescription>Review every phrase you’ve practiced and tracked.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setScreen('home')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Home
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-input bg-muted p-5">
                  <p className="text-sm font-medium text-muted-foreground">Top expressions</p>
                  <div className="mt-4 space-y-3">
                    {topExpressions.length > 0 ? (
                      topExpressions.map(([expression, count], index) => (
                        <div key={expression} className="flex items-center justify-between rounded-3xl border border-input bg-background p-4">
                          <div>
                            <p className="font-semibold text-foreground">{expression}</p>
                            <p className="text-sm text-muted-foreground">Used {count} time{count === 1 ? '' : 's'}</p>
                          </div>
                          <Badge variant="secondary">#{index + 1}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No practice history yet.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-3xl border border-input bg-muted p-5">
                  <p className="text-sm font-medium text-muted-foreground">Recent activity</p>
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
                          No history yet. Practice to populate your timeline.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
