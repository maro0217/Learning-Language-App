'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getExpressionsLocal, saveExpressionLocal, toggleSelectLocal } from '@/lib/storage';
import { Expression } from '@/lib/types';

export default function ExpressionsPage() {
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [newExpression, setNewExpression] = useState('');

  useEffect(() => {
    setExpressions(getExpressionsLocal());
  }, []);

  function refresh() {
    setExpressions(getExpressionsLocal());
  }

  function addExpression() {
    const trimmed = newExpression.trim();
    if (!trimmed) return;
    saveExpressionLocal({ text: trimmed });
    setNewExpression('');
    refresh();
  }

  function toggleExpression(id: string) {
    toggleSelectLocal(id);
    refresh();
  }

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader className="items-center justify-between gap-4">
          <div>
            <CardTitle>Expressions</CardTitle>
            <CardDescription>Add and manage the English expressions you want to practice.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="block">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            <Link href="/practice" className="block">
              <Button variant="secondary" size="sm">Practice</Button>
            </Link>
            <Link href="/history" className="block">
              <Button variant="ghost" size="sm">History</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              value={newExpression}
              onChange={(event) => setNewExpression(event.target.value)}
              onKeyPress={(event) => event.key === 'Enter' && addExpression()}
              placeholder="e.g., grapple with"
            />
            <Button onClick={addExpression} disabled={!newExpression.trim()}>
              Add expression
            </Button>
          </div>

          <div className="rounded-3xl border border-input bg-muted p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-muted-foreground">Saved expressions</p>
              <Badge variant="secondary">{expressions.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {expressions.length > 0 ? (
                expressions.map((expr) => (
                  <button
                    key={expr.id}
                    type="button"
                    onClick={() => toggleExpression(expr.id)}
                    className={`flex w-full items-center justify-between rounded-3xl border p-4 text-left transition ${expr.selected ? 'border-primary/60 bg-primary/10' : 'border-input bg-background hover:border-primary/50'}`}
                  >
                    <div>
                      <p className="font-semibold text-foreground">{expr.text}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Used {expr.count || 0} time{expr.count === 1 ? '' : 's'}</p>
                    </div>
                    <Badge variant={expr.selected ? 'secondary' : 'outline'}>
                      {expr.selected ? 'Selected' : 'Select'}
                    </Badge>
                  </button>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-input bg-background p-6 text-center text-sm text-muted-foreground">
                  No saved expressions yet. Add one to begin.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
