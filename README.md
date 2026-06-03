# Expression Mining OS — MVP

Local-first Next.js app to add, practice, and track English expressions with AI-powered conversation scenarios.

## Features
- **Add expressions** manually
- **Select expressions** for practice
- **AI-generated scenarios** (OpenAI or mock)
- **Practice conversations** with realistic dialogue flow
- **Detect usage** automatically
- **Track history** in localStorage
- **Mobile-first UI** responsive and touch-friendly
- **Mobile-first UI** responsive and touch-friendly
- **UI stack:** Radix UI + shadcn-inspired components + Tailwind

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **(Optional) Add OpenAI API key:**
   - Copy `.env.local.example` to `.env.local`
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=sk-...
     OPENAI_MODEL=gpt-4o-mini
     ```
   - If no key, the app uses mock scenarios automatically

3. **Test the practice loop:**
   ```bash
   npm run test:practice-loop
   ```

4. **Typecheck:**
   ```bash
   npm run typecheck
   ```

5. **Build:**
   ```bash
   npm run build
   ```

6. **Run dev server:**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## Architecture
- **Frontend:** React + TypeScript + Tailwind (mobile-first)
- **Backend:** Next.js API route with OpenAI integration
- **Storage:** Browser localStorage
- **Fallback:** Mock evaluator if API key missing

## Files
- Config: `package.json`, `tsconfig.json`, `next.config.ts`, Tailwind/PostCSS/ESLint
- App: `src/app/{layout,page,globals.css}`, `src/app/api/practice/route.ts`
- Components: `src/components/ExpressionMiningApp.tsx`
 - Components: `src/components/ExpressionMiningApp.tsx`, `src/components/ui/*` (shadcn-style primitives)
- Lib: `src/lib/{types,seedData,storage,practiceLogic}.ts`
- Scripts: `scripts/test-practice-loop.mjs`
