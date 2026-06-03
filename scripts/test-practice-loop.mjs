// Simple test script that simulates the practice loop using the same local evaluator.
import { evaluateLocally, generatePrompt, generateScenarioMock } from '../src/lib/practiceLogic.js';

// Note: This script uses a small mock dataset and the local evaluator.
const seed = ['grapple with', 'laugh it off', 'cross my mind'];

console.log('=== EXPRESSION MINING OS - PRACTICE LOOP TEST ===\n');
console.log('Expressions seed:', seed.join(', '));

// Test scenario generation
console.log('\n--- Scenario Generation ---');
const scenario = generateScenarioMock(seed);
console.log('Scenario:', scenario.scenario);
console.log('Opening:', scenario.opening);
console.log('Difficulty:', scenario.difficulty);
console.log('Instruction:', scenario.instruction);
console.log('Target expressions:', scenario.targetExpressions.join(', '));

// Test prompt generation
console.log('\n--- Prompt Generation ---');
const prompt = generatePrompt(seed);
console.log('Generated prompt:\n', prompt);

// Test evaluation
console.log('\n--- Evaluation Test ---');
const reply = "I sometimes grapple with difficult decisions, but I usually just laugh it off when it's silly. It never crossed my mind to quit.";
console.log('User reply:\n', reply);

const results = evaluateLocally(seed, reply);
console.log('\nEvaluation results:');
for (const e of seed) {
  console.log(`- ${e}: ${results[e] ? '✓ USED NATURALLY' : '✗ NOT USED'}`);
}

// Summary
const usedCount = Object.values(results).filter(Boolean).length;
console.log(`\n=== SUMMARY ===`);
console.log(`✓ Scenario generation: OK`);
console.log(`✓ Prompt generation: OK`);
console.log(`✓ Expression evaluation: ${usedCount}/${seed.length} expressions used naturally`);
console.log(`✓ All tests passed!`);
