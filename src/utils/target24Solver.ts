/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Target24Puzzle {
  id: string;
  numbers: number[];
  target: number;
  difficulty: 'easy' | 'medium' | 'hard';
  hint: string;
  solution: string;
}

// Curated collection of classic and tricky 24-game puzzles
export const CURATED_24_PUZZLES: Target24Puzzle[] = [
  {
    id: 'p24_1',
    numbers: [6, 4, 3, 2],
    target: 24,
    difficulty: 'easy',
    hint: 'Try grouping (6 - 2) with (4 + 3 - 1) or 6 × 4 = 24.',
    solution: '6 × 4 × (3 - 2) = 24',
  },
  {
    id: 'p24_2',
    numbers: [3, 8, 3, 8],
    target: 24,
    difficulty: 'hard',
    hint: 'Division by a fraction! 8 ÷ (something small).',
    solution: '8 ÷ (3 - 8 ÷ 3) = 24',
  },
  {
    id: 'p24_3',
    numbers: [1, 3, 4, 6],
    target: 24,
    difficulty: 'medium',
    hint: 'Divide 6 by (1 - 3/4) = 6 ÷ 0.25 = 24.',
    solution: '6 ÷ (1 - 3 ÷ 4) = 24',
  },
  {
    id: 'p24_4',
    numbers: [7, 7, 3, 3],
    target: 24,
    difficulty: 'hard',
    hint: '7 × (3 + 3/7) = 21 + 3 = 24.',
    solution: '(3 + 3 ÷ 7) × 7 = 24',
  },
  {
    id: 'p24_5',
    numbers: [5, 5, 5, 1],
    target: 24,
    difficulty: 'medium',
    hint: '5 × 5 = 25. How do you subtract 1 using the remaining 5 and 1?',
    solution: '5 × 5 - (5 ÷ 5) or 5 × (5 - 1 ÷ 5) = 24',
  },
  {
    id: 'p24_6',
    numbers: [4, 4, 10, 10],
    target: 24,
    difficulty: 'medium',
    hint: 'Try (10 × 10 - 4) ÷ 4.',
    solution: '(10 × 10 - 4) ÷ 4 = 24',
  },
  {
    id: 'p24_7',
    numbers: [2, 3, 4, 5],
    target: 24,
    difficulty: 'easy',
    hint: 'Multiply (5 + 3 - 2) × 4 or 2 × 3 × 4.',
    solution: '(5 + 3 - 2) × 4 = 24',
  },
  {
    id: 'p24_8',
    numbers: [1, 2, 3, 4],
    target: 24,
    difficulty: 'easy',
    hint: '1 × 2 × 3 × 4 = 24 (Factorial 4!).',
    solution: '1 × 2 × 3 × 4 = 24',
  },
  {
    id: 'p24_9',
    numbers: [8, 8, 3, 3],
    target: 24,
    difficulty: 'hard',
    hint: 'Combine 8 and 3 to reach 8 × 3 = 24 using the other pair.',
    solution: '8 ÷ (3 - 8 ÷ 3) = 24',
  },
  {
    id: 'p24_10',
    numbers: [9, 9, 6, 2],
    target: 24,
    difficulty: 'medium',
    hint: '9 + 9 + 6 = 24... wait, where does 2 go? Try (9 - 6) × (9 - 1).',
    solution: '(9 - 6 + 9) × 2 = 24',
  },
  {
    id: 'p24_11',
    numbers: [4, 6, 8, 2],
    target: 24,
    difficulty: 'easy',
    hint: '8 × 6 = 48, then divide by (4 - 2).',
    solution: '(8 × 6) ÷ (4 - 2) = 24',
  },
  {
    id: 'p24_12',
    numbers: [3, 3, 7, 7],
    target: 24,
    difficulty: 'hard',
    hint: 'Distribute (3 + 3/7) × 7.',
    solution: '(3 + 3 ÷ 7) × 7 = 24',
  },
];

// Helper to evaluate mathematical expression safely without eval()
export function safeEvaluate(expr: string): { val: number | null; error?: string } {
  try {
    // Clean string: replace visual symbols × and ÷
    const cleaned = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');

    // Strict validation: only allowed digits, +, -, *, /, (, )
    if (!/^[0-9+\-*/().]+$/.test(cleaned)) {
      return { val: null, error: 'Contains invalid characters' };
    }

    // Check balanced parentheses
    let balance = 0;
    for (const char of cleaned) {
      if (char === '(') balance++;
      if (char === ')') balance--;
      if (balance < 0) return { val: null, error: 'Mismatched parentheses' };
    }
    if (balance !== 0) return { val: null, error: 'Unclosed parentheses' };

    // Parse tokens and evaluate using shunting yard algorithm
    const tokens: (string | number)[] = [];
    let i = 0;
    while (i < cleaned.length) {
      const ch = cleaned[i];
      if (/[0-9]/.test(ch)) {
        let numStr = '';
        while (i < cleaned.length && /[0-9.]/.test(cleaned[i])) {
          numStr += cleaned[i];
          i++;
        }
        tokens.push(parseFloat(numStr));
      } else {
        tokens.push(ch);
        i++;
      }
    }

    // Shunting yard to RPN
    const output: (string | number)[] = [];
    const ops: string[] = [];
    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];
      if (typeof token === 'number') {
        output.push(token);
      } else if (token === '(') {
        ops.push(token);
      } else if (token === ')') {
        while (ops.length > 0 && ops[ops.length - 1] !== '(') {
          output.push(ops.pop()!);
        }
        ops.pop(); // Remove '('
      } else if ('+-*/'.includes(token)) {
        while (
          ops.length > 0 &&
          ops[ops.length - 1] !== '(' &&
          precedence[ops[ops.length - 1]] >= precedence[token]
        ) {
          output.push(ops.pop()!);
        }
        ops.push(token);
      }
    }
    while (ops.length > 0) {
      output.push(ops.pop()!);
    }

    // Evaluate RPN
    const stack: number[] = [];
    for (const item of output) {
      if (typeof item === 'number') {
        stack.push(item);
      } else {
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) return { val: null, error: 'Syntax error' };
        let res = 0;
        if (item === '+') res = a + b;
        else if (item === '-') res = a - b;
        else if (item === '*') res = a * b;
        else if (item === '/') {
          if (Math.abs(b) < 1e-9) return { val: null, error: 'Division by zero' };
          res = a / b;
        }
        stack.push(res);
      }
    }

    if (stack.length !== 1) return { val: null, error: 'Invalid expression' };
    return { val: stack[0] };
  } catch {
    return { val: null, error: 'Could not compute expression' };
  }
}

// Validates whether the user's expression used all required numbers exactly once
export function validateNumbersUsed(expr: string, targetNumbers: number[]): boolean {
  // Extract all numbers in expression
  const matches = expr.match(/\b\d+\b/g);
  if (!matches) return false;

  const used = matches.map(Number).sort((a, b) => a - b);
  const required = [...targetNumbers].sort((a, b) => a - b);

  if (used.length !== required.length) return false;
  return used.every((val, idx) => val === required[idx]);
}
