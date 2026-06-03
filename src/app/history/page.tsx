'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getExpressionsLocal, getHistoryLocal } from '@/lib/storage';
import { Expression, HistoryEntry } from '@/lib/types';

export default function HistoryPage() {
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setExpressions(getExpressionsLocal());
    setHistory(getHistoryLocal());
  }, []);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => (a.usedAt < b.usedAt ? 1 : -1)),
    [history]
  );

  const topExpressions = useMemo(
    () => [...expressions].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 5),
    [expressions]
  );

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader className="items-center justify-between gap-4">
          <div>
            <CardTitle>History</CardTitle>
            <CardDescription>Review successful expression usage and your most-used phrases.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="block">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            <Link href="/expressions" className="block">
              <Button variant="secondary" size="sm">Expressions</Button>
            </Link>
            <Link href="/practice" className="block">
              <Button variant="ghost" size="sm">Practice</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-input bg-muted p-5">
            <p className="text-sm font-medium text-muted-foreground">Most-used expressions</p>
            <div className="mt-4 space-y-3">
              {topExpressions.length > 0 ? (
                topExpressions.map((expression, index) => (
                  <div key={expression.id} className="flex items-center justify-between rounded-3xl border border-input bg-background p-4">
                    <div>
                      <p className="font-semibold text-foreground">{expression.text}</p>
                      <p className="text-sm text-muted-foreground">Used {expression.count || 0} time{expression.count === 1 ? '' : 's'}</p>
                    </div>
                    <Badge variant="secondary">#{index + 1}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No used expressions yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-input bg-muted p-5">
            <p className="text-sm font-medium text-muted-foreground">Recent successful uses</p>
            <div className="mt-4 space-y-3">
              {sortedHistory.length > 0 ? (
                sortedHistory.map((entry, index) => (
                  <div key={`${entry.expression}-${index}`} className="rounded-3xl border border-input bg-background p-4">
                    <p className="font-semibold text-foreground">{entry.expression}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{new Date(entry.usedAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-input/60 bg-background p-6 text-center text-sm text-muted-foreground">
                  No successful history yet. Practice to record your progress.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
