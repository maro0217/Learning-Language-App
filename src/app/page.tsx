'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getExpressionsLocal, getHistoryLocal } from '@/lib/storage';
import { HistoryEntry } from '@/lib/types';

export default function Page() {
  const [expressions, setExpressions] = useState(0);
  const [selected, setSelected] = useState(0);
  const [uses, setUses] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const expressionsList = getExpressionsLocal();
    setExpressions(expressionsList.length);
    setSelected(expressionsList.filter((expr) => expr.selected).length);
    setUses(expressionsList.reduce((sum, expr) => sum + (expr.count || 0), 0));
    setHistory(getHistoryLocal());
  }, []);

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Expression Mining</CardTitle>
          <CardDescription>Practice English expressions with Japanese-to-English drills.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-input bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Total expressions</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{expressions}</p>
          </div>
          <div className="rounded-3xl border border-input bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Selected for practice</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{selected}</p>
          </div>
          <div className="rounded-3xl border border-input bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Total uses</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{uses}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Navigate to the page you need.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Link href="/practice" className="block">
            <Button className="w-full">Go to Practice</Button>
          </Link>
          <Link href="/expressions" className="block">
            <Button variant="secondary" className="w-full">Add / Manage Expressions</Button>
          </Link>
          <Link href="/history" className="block">
            <Button variant="ghost" className="w-full">View History</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent successful answers</CardTitle>
          <Badge variant="secondary">{history.length}</Badge>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.slice(0, 3).map((entry, index) => (
                <div key={`${entry.expression}-${index}`} className="rounded-3xl border border-input bg-background p-4">
                  <p className="font-semibold text-foreground">{entry.expression}</p>
                  <p className="text-sm text-muted-foreground">{new Date(entry.usedAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No successful practice attempts yet.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
