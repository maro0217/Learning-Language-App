import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Expression Mining OS',
  description: 'Practice English expressions'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.18),_transparent_30%),linear-gradient(180deg,#020617_0%,#090f1e_100%)]">
          <div className="mx-auto max-w-xl px-4 py-6">{children}</div>
        </div>
      </body>
    </html>
  );
}
