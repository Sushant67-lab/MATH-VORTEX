/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgeTier, MathQuestion, MathTopic, TierInfo } from '../types/math';

export const AGE_TIERS: TierInfo[] = [
  {
    id: 'junior',
    label: 'Junior League',
    ageRange: 'Ages 10–12',
    gradeLevel: 'Grades 5–7',
    description: 'Mental arithmetic, PEMDAS, fractions, negative integers, percentages, and pre-algebra foundations.',
    topics: ['Arithmetic', 'PEMDAS', 'Fractions', 'Integers', 'Percentages', 'Pre-Algebra'],
  },
  {
    id: 'senior',
    label: 'Senior League',
    ageRange: 'Ages 13–16',
    gradeLevel: 'Grades 8–10',
    description: 'Quadratics, exponents & radicals, linear systems, geometry, polynomials, and intro trigonometry.',
    topics: ['Linear Equations', 'Quadratics', 'Radicals', 'Polynomials', 'Trigonometry', 'Geometry'],
  },
  {
    id: 'apex',
    label: 'Apex League',
    ageRange: 'Ages 17–20',
    gradeLevel: 'Grades 11–12+ / College Prep',
    description: 'Calculus derivatives & integrals, logarithms, unit circle, vectors, matrices, and combinatorics.',
    topics: ['Derivatives', 'Integrals', 'Logarithms', 'Unit Circle', 'Vectors & Matrices', 'Probability'],
  },
];

// Helper to shuffle array
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper to generate distinct choices with one correct
function makeChoices(correct: string | number, distractors: (string | number)[]): string[] {
  const correctStr = String(correct);
  const uniqueDistractors = Array.from(new Set(distractors.map(String))).filter(d => d !== correctStr);
  const picked = shuffle(uniqueDistractors).slice(0, 3);

  // If not enough distractors, generate numeric offsets if correct is a number
  let fallbackCount = 1;
  while (picked.length < 3) {
    const num = Number(correct);
    if (!isNaN(num)) {
      const candidate = String(num + (fallbackCount % 2 === 0 ? fallbackCount : -fallbackCount));
      if (candidate !== correctStr && !picked.includes(candidate)) {
        picked.push(candidate);
      }
    } else {
      picked.push(`Option ${picked.length + 1}`);
    }
    fallbackCount++;
  }

  return shuffle([correctStr, ...picked]);
}

// Procedural question generators
export function generateQuestion(tier: AgeTier, specificTopic?: MathTopic): MathQuestion {
  const id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (tier === 'junior') {
    return generateJuniorQuestion(id, specificTopic);
  } else if (tier === 'senior') {
    return generateSeniorQuestion(id, specificTopic);
  } else {
    return generateApexQuestion(id, specificTopic);
  }
}

// -------------------------------------------------------------
// JUNIOR LEAGUE GENERATORS (Ages 10 - 12)
// -------------------------------------------------------------
function generateJuniorQuestion(id: string, specificTopic?: MathTopic): MathQuestion {
  const topics: MathTopic[] = ['arithmetic', 'fractions', 'pre_algebra'];
  const topic = specificTopic || topics[Math.floor(Math.random() * topics.length)];

  if (topic === 'pre_algebra') {
    // ax + b = c
    const a = Math.floor(Math.random() * 7) + 2; // 2 to 8
    const x = Math.floor(Math.random() * 12) + 1; // 1 to 12
    const b = Math.floor(Math.random() * 20) + 1;
    const c = a * x + b;
    const isSubtraction = Math.random() > 0.5;

    if (isSubtraction) {
      const cSub = a * x - b;
      return {
        id,
        tier: 'junior',
        topic: 'pre_algebra',
        topicLabel: 'Pre-Algebra',
        prompt: `Solve for x: ${a}x - ${b} = ${cSub}`,
        correctAnswer: String(x),
        options: makeChoices(x, [x + 1, x - 1, x + 2, x * 2, Math.max(1, x - 2)]),
        explanation: [
          `Step 1: Add ${b} to both sides: ${a}x = ${cSub} + ${b} = ${a * x}`,
          `Step 2: Divide both sides by ${a}: x = ${a * x} / ${a} = ${x}`,
        ],
        hint: `First isolate the term with x by adding ${b} to both sides, then divide by ${a}.`,
        difficulty: 'medium',
      };
    } else {
      return {
        id,
        tier: 'junior',
        topic: 'pre_algebra',
        topicLabel: 'Pre-Algebra',
        prompt: `Solve for x: ${a}x + ${b} = ${c}`,
        correctAnswer: String(x),
        options: makeChoices(x, [x + 1, x - 1, x + 3, Math.max(1, x - 2), x * 2]),
        explanation: [
          `Step 1: Subtract ${b} from both sides: ${a}x = ${c} - ${b} = ${a * x}`,
          `Step 2: Divide both sides by ${a}: x = ${a * x} / ${a} = ${x}`,
        ],
        hint: `Subtract ${b} from both sides first, then divide by ${a}.`,
        difficulty: 'easy',
      };
    }
  }

  if (topic === 'fractions') {
    const fractionTypes = ['add_same_denom', 'add_diff_denom', 'multiply'];
    const subType = fractionTypes[Math.floor(Math.random() * fractionTypes.length)];

    if (subType === 'multiply') {
      const n1 = Math.floor(Math.random() * 3) + 1; // 1 to 3
      const d1 = Math.floor(Math.random() * 3) + 4; // 4 to 6
      const n2 = Math.floor(Math.random() * 3) + 1;
      const d2 = Math.floor(Math.random() * 3) + 3;

      const numProduct = n1 * n2;
      const denProduct = d1 * d2;

      // Find GCD to simplify
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const g = gcd(numProduct, denProduct);
      const simpNum = numProduct / g;
      const simpDen = denProduct / g;
      const answer = `${simpNum}/${simpDen}`;

      return {
        id,
        tier: 'junior',
        topic: 'fractions',
        topicLabel: 'Fractions',
        prompt: `Compute and simplify: (${n1}/${d1}) × (${n2}/${d2})`,
        correctAnswer: answer,
        options: makeChoices(answer, [
          `${simpNum + 1}/${simpDen}`,
          `${simpNum}/${simpDen + 1}`,
          `${n1 + n2}/${d1 + d2}`,
          `${simpNum * 2}/${simpDen}`,
          `${simpNum}/${simpDen * 2}`,
        ]),
        explanation: [
          `Step 1: Multiply numerators: ${n1} × ${n2} = ${numProduct}`,
          `Step 2: Multiply denominators: ${d1} × ${d2} = ${denProduct}`,
          `Step 3: Simplify fraction by dividing by GCD(${g}): ${simpNum}/${simpDen}`,
        ],
        hint: 'Multiply the top numbers together and bottom numbers together, then simplify.',
        difficulty: 'medium',
      };
    } else {
      // Adding fractions
      const d = Math.floor(Math.random() * 5) + 4; // 4 to 8
      const n1 = Math.floor(Math.random() * 3) + 1;
      const n2 = Math.floor(Math.random() * (d - n1 - 1)) + 1;
      const sum = n1 + n2;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const g = gcd(sum, d);
      const answer = g === d ? '1' : `${sum / g}/${d / g}`;

      return {
        id,
        tier: 'junior',
        topic: 'fractions',
        topicLabel: 'Fractions',
        prompt: `Evaluate and simplify: ${n1}/${d} + ${n2}/${d}`,
        correctAnswer: answer,
        options: makeChoices(answer, [
          `${sum}/${d + d}`,
          `${sum + 1}/${d / g}`,
          `${Math.max(1, sum - 1)}/${d / g}`,
          `${sum}/${d}`,
        ]),
        explanation: [
          `Step 1: Since denominators match (${d}), add the numerators: ${n1} + ${n2} = ${sum}`,
          `Step 2: The result is ${sum}/${d}. Simplify if common factors exist: ${answer}`,
        ],
        hint: 'Keep the denominator the same and add the numerators.',
        difficulty: 'easy',
      };
    }
  }

  // Arithmetic / PEMDAS / Integers
  const sub = Math.random();
  if (sub < 0.35) {
    // Negative numbers
    const a = -(Math.floor(Math.random() * 8) + 3);
    const b = Math.floor(Math.random() * 10) + 2;
    const c = -(Math.floor(Math.random() * 6) + 1);
    // a * b + c
    const ans = a * b + c;
    return {
      id,
      tier: 'junior',
      topic: 'arithmetic',
      topicLabel: 'Integers & PEMDAS',
      prompt: `Evaluate: (${a}) × ${b} + (${c})`,
      correctAnswer: String(ans),
      options: makeChoices(ans, [ans + 10, -ans, ans - 10, a * b - c, Math.abs(a) * b + c]),
      explanation: [
        `Step 1: Multiplication before addition: (${a}) × ${b} = ${a * b}`,
        `Step 2: Add negative integer: ${a * b} + (${c}) = ${ans}`,
      ],
      hint: 'A negative times a positive is negative. Remember order of operations!',
      difficulty: 'medium',
    };
  } else if (sub < 0.7) {
    // Order of operations with parenthesis
    const p1 = Math.floor(Math.random() * 5) + 3;
    const p2 = Math.floor(Math.random() * 4) + 2;
    const mult = Math.floor(Math.random() * 6) + 3;
    const add = Math.floor(Math.random() * 15) + 5;
    // add + mult * (p1 - p2)
    const diff = p1 - p2;
    const ans = add + mult * diff;
    return {
      id,
      tier: 'junior',
      topic: 'arithmetic',
      topicLabel: 'Order of Operations',
      prompt: `Calculate: ${add} + ${mult} × (${p1} - ${p2})`,
      correctAnswer: String(ans),
      options: makeChoices(ans, [
        (add + mult) * diff,
        add + mult * (p1 + p2),
        ans + mult,
        ans - mult,
      ]),
      explanation: [
        `Step 1: Evaluate parenthesis first: (${p1} - ${p2}) = ${diff}`,
        `Step 2: Perform multiplication: ${mult} × ${diff} = ${mult * diff}`,
        `Step 3: Perform addition: ${add} + ${mult * diff} = ${ans}`,
      ],
      hint: 'Parentheses first, then multiplication, and finally addition (PEMDAS).',
      difficulty: 'easy',
    };
  } else {
    // Percentages
    const pct = [10, 15, 20, 25, 50, 75][Math.floor(Math.random() * 6)];
    const base = [40, 60, 80, 120, 160, 200][Math.floor(Math.random() * 6)];
    const ans = (pct / 100) * base;
    return {
      id,
      tier: 'junior',
      topic: 'arithmetic',
      topicLabel: 'Percentages',
      prompt: `What is ${pct}% of ${base}?`,
      correctAnswer: String(ans),
      options: makeChoices(ans, [ans + 5, ans - 5, ans * 2, Math.max(1, ans / 2), pct + base]),
      explanation: [
        `Step 1: Convert ${pct}% to a decimal: ${pct / 100}`,
        `Step 2: Multiply by ${base}: ${pct / 100} × ${base} = ${ans}`,
      ],
      hint: `${pct}% is the same as ${pct}/100. Multiply that fraction by ${base}.`,
      difficulty: 'easy',
    };
  }
}

// -------------------------------------------------------------
// SENIOR LEAGUE GENERATORS (Ages 13 - 16)
// -------------------------------------------------------------
function generateSeniorQuestion(id: string, specificTopic?: MathTopic): MathQuestion {
  const topics: MathTopic[] = ['quadratics', 'algebra', 'trigonometry', 'exponents', 'geometry'];
  const topic = specificTopic || topics[Math.floor(Math.random() * topics.length)];

  if (topic === 'quadratics') {
    // Roots r1 and r2
    // (x - r1)(x - r2) = x^2 - (r1+r2)x + (r1*r2) = 0
    const r1 = Math.floor(Math.random() * 7) + 1; // 1 to 7
    let r2 = Math.floor(Math.random() * 7) + 1;
    while (r2 === r1) r2 = Math.floor(Math.random() * 7) + 1;

    const b = -(r1 + r2);
    const c = r1 * r2;
    const bStr = b < 0 ? `- ${Math.abs(b)}x` : `+ ${b}x`;
    const cStr = c < 0 ? `- ${Math.abs(c)}` : `+ ${c}`;

    const sortedRoots = [r1, r2].sort((x, y) => x - y);
    const answer = `${sortedRoots[0]} and ${sortedRoots[1]}`;

    return {
      id,
      tier: 'senior',
      topic: 'quadratics',
      topicLabel: 'Quadratic Equations',
      prompt: `Find the roots of: x² ${bStr} ${cStr} = 0`,
      correctAnswer: answer,
      options: makeChoices(answer, [
        `${-sortedRoots[0]} and ${-sortedRoots[1]}`,
        `${sortedRoots[0]} and ${-sortedRoots[1]}`,
        `${sortedRoots[0] + 1} and ${sortedRoots[1] + 1}`,
        `${sortedRoots[0]} and ${sortedRoots[1] + 2}`,
      ]),
      explanation: [
        `Step 1: Look for two numbers that multiply to ${c} and add up to ${-b}.`,
        `Step 2: Those numbers are ${r1} and ${r2}, giving factorization: (x - ${r1})(x - ${r2}) = 0`,
        `Step 3: Setting each factor to 0 gives x = ${r1} and x = ${r2}.`,
      ],
      hint: `Factor the equation into (x - r₁)(x - r₂) = 0. The sum of the roots equals ${r1 + r2}.`,
      difficulty: 'medium',
    };
  }

  if (topic === 'trigonometry') {
    const specialAngles = [
      { func: 'sin(30°)', val: '1/2', dec: '0.5', note: 'Opposite/Hypotenuse on 30-60-90 triangle' },
      { func: 'cos(60°)', val: '1/2', dec: '0.5', note: 'Adjacent/Hypotenuse on 30-60-90 triangle' },
      { func: 'tan(45°)', val: '1', dec: '1', note: 'Opposite/Adjacent on 45-45-90 isosceles right triangle' },
      { func: 'sin(90°)', val: '1', dec: '1', note: 'y-coordinate at top of unit circle' },
      { func: 'cos(0°)', val: '1', dec: '1', note: 'x-coordinate on right of unit circle' },
      { func: 'sin(45°)', val: '√2/2', dec: '≈ 0.707', note: '1/√2 rationalized is √2/2' },
      { func: 'cos(30°)', val: '√3/2', dec: '≈ 0.866', note: 'Adjacent side on 30-60-90 triangle' },
      { func: 'tan(30°)', val: '√3/3', dec: '≈ 0.577', note: '1/√3 rationalized is √3/3' },
    ];
    const item = specialAngles[Math.floor(Math.random() * specialAngles.length)];

    return {
      id,
      tier: 'senior',
      topic: 'trigonometry',
      topicLabel: 'Trigonometry',
      prompt: `What is the exact value of ${item.func}?`,
      correctAnswer: item.val,
      options: makeChoices(item.val, ['0', '1/2', '√2/2', '√3/2', '1', '√3', '2']),
      explanation: [
        `Step 1: Recall special right triangles (30°-60°-90° and 45°-45°-90°).`,
        `Step 2: For ${item.func}, the exact ratio is ${item.val}. (${item.note})`,
      ],
      hint: `Think of standard unit circle ratios or special right triangles.`,
      difficulty: 'medium',
    };
  }

  if (topic === 'exponents') {
    // Simplifying radicals or exponent rules
    const isRadical = Math.random() > 0.5;
    if (isRadical) {
      // e.g. sqrt(48) = 4*sqrt(3)
      const squares = [
        { orig: '√48', ans: '4√3', k: 16, rem: 3 },
        { orig: '√75', ans: '5√3', k: 25, rem: 3 },
        { orig: '√72', ans: '6√2', k: 36, rem: 2 },
        { orig: '√50', ans: '5√2', k: 25, rem: 2 },
        { orig: '√32', ans: '4√2', k: 16, rem: 2 },
        { orig: '√98', ans: '7√2', k: 49, rem: 2 },
        { orig: '√108', ans: '6√3', k: 36, rem: 3 },
      ];
      const p = squares[Math.floor(Math.random() * squares.length)];
      return {
        id,
        tier: 'senior',
        topic: 'exponents',
        topicLabel: 'Radicals & Exponents',
        prompt: `Simplify the radical: ${p.orig}`,
        correctAnswer: p.ans,
        options: makeChoices(p.ans, ['2√6', '3√5', '2√3', '3√2', '4√2', '6√3', '8√2']),
        explanation: [
          `Step 1: Find the largest perfect square factor: ${p.orig} = √(${p.k} × ${p.rem})`,
          `Step 2: Separate: √${p.k} × √${p.rem}`,
          `Step 3: Since √${p.k} = ${Math.sqrt(p.k)}, we get ${p.ans}.`,
        ],
        hint: `Factor out the highest perfect square (${p.k}).`,
        difficulty: 'medium',
      };
    } else {
      // Exponent rule: (2^a * 2^b) / 2^c = 2^(a+b-c)
      const base = [2, 3, 5][Math.floor(Math.random() * 3)];
      const a = Math.floor(Math.random() * 4) + 2;
      const b = Math.floor(Math.random() * 4) + 2;
      const c = Math.floor(Math.random() * 3) + 1;
      const finalExp = a + b - c;
      const answer = `${base}^${finalExp}`;

      return {
        id,
        tier: 'senior',
        topic: 'exponents',
        topicLabel: 'Exponent Rules',
        prompt: `Simplify: (${base}^${a} × ${base}^${b}) / ${base}^${c}`,
        correctAnswer: answer,
        options: makeChoices(answer, [
          `${base}^${a + b + c}`,
          `${base}^${a * b - c}`,
          `${base}^${finalExp + 1}`,
          `${base}^${Math.max(1, finalExp - 1)}`,
        ]),
        explanation: [
          `Step 1: Product rule: ${base}^${a} × ${base}^${b} = ${base}^(${a}+${b}) = ${base}^${a + b}`,
          `Step 2: Quotient rule: ${base}^${a + b} / ${base}^${c} = ${base}^(${a + b}-${c}) = ${base}^${finalExp}`,
        ],
        hint: 'Add exponents when multiplying like bases, subtract when dividing.',
        difficulty: 'easy',
      };
    }
  }

  // Linear Equations / Slope
  const x1 = Math.floor(Math.random() * 5) + 1;
  const y1 = Math.floor(Math.random() * 5) + 2;
  const slope = Math.floor(Math.random() * 4) + 1;
  const dx = Math.floor(Math.random() * 3) + 1;
  const x2 = x1 + dx;
  const y2 = y1 + slope * dx;

  return {
    id,
    tier: 'senior',
    topic: 'algebra',
    topicLabel: 'Coordinate Geometry',
    prompt: `Find the slope (m) of the line passing through (${x1}, ${y1}) and (${x2}, ${y2})`,
    correctAnswer: String(slope),
    options: makeChoices(slope, [slope + 1, slope - 1, -slope, `1/${slope}`, slope * 2]),
    explanation: [
      `Step 1: Formula for slope: m = (y₂ - y₁) / (x₂ - x₁)`,
      `Step 2: Substitute values: (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2 - x1} = ${slope}`,
    ],
    hint: 'Use the slope formula: m = rise / run = (y₂ - y₁) / (x₂ - x₁).',
    difficulty: 'easy',
  };
}

// -------------------------------------------------------------
// APEX LEAGUE GENERATORS (Ages 17 - 20)
// -------------------------------------------------------------
function generateApexQuestion(id: string, specificTopic?: MathTopic): MathQuestion {
  const topics: MathTopic[] = ['calculus', 'logarithms', 'trigonometry', 'matrices', 'probability'];
  const topic = specificTopic || topics[Math.floor(Math.random() * topics.length)];

  if (topic === 'calculus') {
    const isIntegral = Math.random() > 0.45;
    if (isIntegral) {
      // Definite integral: int_0^b a*x^n dx
      const n = [1, 2, 3][Math.floor(Math.random() * 3)];
      const coef = (n + 1) * (Math.floor(Math.random() * 3) + 1); // divisible by n+1
      const upper = Math.floor(Math.random() * 3) + 1; // 1 to 3
      // Antiderivative: (coef / (n+1)) * x^(n+1)
      const antiCoef = coef / (n + 1);
      const ansVal = antiCoef * Math.pow(upper, n + 1);

      return {
        id,
        tier: 'apex',
        topic: 'calculus',
        topicLabel: 'Definite Integral',
        prompt: `Evaluate: ∫ from 0 to ${upper} of (${coef}x${n > 1 ? `^${n}` : ''}) dx`,
        correctAnswer: String(ansVal),
        options: makeChoices(ansVal, [
          ansVal + antiCoef,
          ansVal - antiCoef,
          ansVal * 2,
          coef * upper,
          Math.max(1, Math.floor(ansVal / 2)),
        ]),
        explanation: [
          `Step 1: Find antiderivative: ∫ ${coef}x^${n} dx = [${coef} / ${n + 1}] x^${n + 1} = ${antiCoef}x^${n + 1}`,
          `Step 2: Evaluate at limits [0 to ${upper}]: ${antiCoef}(${upper})^${n + 1} - ${antiCoef}(0)^${n + 1}`,
          `Step 3: ${antiCoef} × ${Math.pow(upper, n + 1)} - 0 = ${ansVal}`,
        ],
        hint: 'Use power rule of integration: ∫ x^n dx = x^(n+1)/(n+1). Then plug in the upper and lower limits.',
        difficulty: 'medium',
      };
    } else {
      // Derivative: d/dx [ a*x^n - b*x + c ]
      const a = Math.floor(Math.random() * 5) + 2;
      const n = Math.floor(Math.random() * 3) + 3; // 3, 4, 5
      const b = Math.floor(Math.random() * 8) + 2;
      const c = Math.floor(Math.random() * 15) + 1;

      const derivA = a * n;
      const derivN = n - 1;
      const answer = `${derivA}x^${derivN} - ${b}`;

      return {
        id,
        tier: 'apex',
        topic: 'calculus',
        topicLabel: 'Differential Calculus',
        prompt: `Find the derivative: d/dx [ ${a}x^${n} - ${b}x + ${c} ]`,
        correctAnswer: answer,
        options: makeChoices(answer, [
          `${derivA}x^${n} - ${b}`,
          `${a}x^${derivN} - ${b}`,
          `${derivA}x^${derivN} - ${b} + ${c}`,
          `${derivA}x^${derivN}`,
        ]),
        explanation: [
          `Step 1: Power rule on ${a}x^${n}: ${a} × ${n} x^(${n}-1) = ${derivA}x^${derivN}`,
          `Step 2: Derivative of linear term -${b}x is -${b}`,
          `Step 3: Derivative of constant ${c} is 0`,
          `Result: ${answer}`,
        ],
        hint: 'Power rule: d/dx [x^n] = n·x^(n-1). Constant terms differentiate to 0.',
        difficulty: 'easy',
      };
    }
  }

  if (topic === 'logarithms') {
    const logs = [
      { prompt: 'Evaluate: log₂(64)', ans: '6', expl: '2⁶ = 64, so log₂(64) = 6' },
      { prompt: 'Evaluate: log₃(81)', ans: '4', expl: '3⁴ = 81, so log₃(81) = 4' },
      { prompt: 'Evaluate: log₅(125)', ans: '3', expl: '5³ = 125, so log₅(125) = 3' },
      { prompt: 'Evaluate: ln(e⁷)', ans: '7', expl: 'ln and e are inverse operations, ln(e⁷) = 7' },
      { prompt: 'Solve for x: log₄(x) = 3', ans: '64', expl: 'x = 4³ = 64' },
      { prompt: 'Evaluate: log₁₀(0.001)', ans: '-3', expl: '0.001 = 10⁻³, so log₁₀(10⁻³) = -3' },
      { prompt: 'Simplify: log₂(32) - log₂(4)', ans: '3', expl: 'log₂(32/4) = log₂(8) = 3 (since 2³ = 8)' },
    ];
    const item = logs[Math.floor(Math.random() * logs.length)];

    return {
      id,
      tier: 'apex',
      topic: 'logarithms',
      topicLabel: 'Logarithmic Functions',
      prompt: item.prompt,
      correctAnswer: item.ans,
      options: makeChoices(item.ans, ['2', '3', '4', '5', '8', '16', '-2', '-3']),
      explanation: [item.expl],
      hint: 'Remember log_b(y) = x means b^x = y.',
      difficulty: 'medium',
    };
  }

  if (topic === 'matrices') {
    // 2x2 determinant: | a b | / | c d | = ad - bc
    const a = Math.floor(Math.random() * 6) + 1;
    const b = Math.floor(Math.random() * 5) - 2;
    const c = Math.floor(Math.random() * 5) - 2;
    const d = Math.floor(Math.random() * 6) + 1;
    const det = a * d - b * c;

    return {
      id,
      tier: 'apex',
      topic: 'matrices',
      topicLabel: 'Matrices & Linear Algebra',
      prompt: `Compute the determinant of matrix [[${a}, ${b}], [${c}, ${d}]]`,
      correctAnswer: String(det),
      options: makeChoices(det, [det + 2, det - 2, a * d + b * c, -det, a + b + c + d]),
      explanation: [
        `Step 1: Formula for 2×2 determinant: det = ad - bc`,
        `Step 2: Multiply primary diagonal: (${a}) × (${d}) = ${a * d}`,
        `Step 3: Multiply off-diagonal: (${b}) × (${c}) = ${b * c}`,
        `Step 4: Subtract: ${a * d} - (${b * c}) = ${det}`,
      ],
      hint: 'Multiply the main diagonal elements and subtract the anti-diagonal product.',
      difficulty: 'easy',
    };
  }

  // Probability / Combinatorics
  const isComb = Math.random() > 0.5;
  if (isComb) {
    // nCr: 5C2, 6C2, 5C3, 7C2
    const n = [5, 6, 7, 8][Math.floor(Math.random() * 4)];
    const r = 2;
    const ans = (n * (n - 1)) / 2;
    return {
      id,
      tier: 'apex',
      topic: 'probability',
      topicLabel: 'Combinatorics',
      prompt: `Evaluate combinations: ${n}C${r} (number of ways to choose ${r} items from ${n})`,
      correctAnswer: String(ans),
      options: makeChoices(ans, [ans + n, ans - 3, n * r, ans * 2, n * (n - 1)]),
      explanation: [
        `Step 1: Formula: nCr = n! / (r! × (n - r)!)`,
        `Step 2: For ${n}C2: (${n} × ${n - 1}) / (2 × 1) = ${n * (n - 1)} / 2 = ${ans}`,
      ],
      hint: 'Formula: nCr = n! / (r!(n-r)!). For r=2, it simplifies to n(n-1)/2.',
      difficulty: 'medium',
    };
  } else {
    // Dot product of vectors
    const u1 = Math.floor(Math.random() * 5) + 1;
    const u2 = -(Math.floor(Math.random() * 4) + 1);
    const v1 = Math.floor(Math.random() * 4) + 2;
    const v2 = Math.floor(Math.random() * 5) + 1;
    const dot = u1 * v1 + u2 * v2;

    return {
      id,
      tier: 'apex',
      topic: 'matrices',
      topicLabel: 'Vector Calculus',
      prompt: `Find the dot product of vectors u = (${u1}, ${u2}) and v = (${v1}, ${v2})`,
      correctAnswer: String(dot),
      options: makeChoices(dot, [dot + 4, dot - 4, -dot, u1 * v2 + u2 * v1, Math.abs(dot) + 2]),
      explanation: [
        `Step 1: Formula: u · v = (u₁ × v₁) + (u₂ × v₂)`,
        `Step 2: Compute terms: (${u1} × ${v1}) + (${u2} × ${v2}) = ${u1 * v1} + (${u2 * v2}) = ${dot}`,
      ],
      hint: 'Multiply corresponding components and add the results together.',
      difficulty: 'easy',
    };
  }
}
