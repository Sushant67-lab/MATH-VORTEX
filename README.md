# ⚡ MathVortex — Competitive Mathematics Arena

> An interactive math battle and problem-solving web game designed for **ages 10 to 20** (Middle School, High School, and Pre-College / College Prep).

![MathVortex](https://img.shields.io/badge/MathVortex-Live%20Arena-06b6d4?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## 🎮 Game Overview

MathVortex divides mathematical challenges into **three skill tiers** spanning ages 10 to 20:

1. **Junior League (Ages 10–12 / Grades 5–7)**
   - Mental arithmetic speed, PEMDAS / Order of Operations
   - Fractions & Decimals (addition, multiplication, simplifying)
   - Pre-algebra basics ($ax + b = c$), negative integers, and percentages

2. **Senior League (Ages 13–16 / Grades 8–10)**
   - Quadratic equations (roots, factoring, vertex)
   - Exponent rules and radical simplifications ($\sqrt{72} = 6\sqrt{2}$)
   - Linear equations, coordinates & slopes ($m = \frac{y_2 - y_1}{x_2 - x_1}$)
   - Special right triangle trigonometry ratios ($\sin, \cos, \tan$)

3. **Apex League (Ages 17–20 / Grades 11–12+ / College Prep)**
   - Differential calculus (power rule, derivatives of polynomials & trig)
   - Integral calculus ($\int_a^b ax^n dx$ definite integrals)
   - Logarithmic properties ($\log_b x$, $\ln(e^x)$)
   - $2\times2$ matrix determinants ($\det = ad - bc$) & vector dot products
   - Combinatorics ($nCr$) & probability

---

## 🕹️ 5 Game Modes

- ⚡ **Speed Sprint**: 60-second rapid-fire blitz. Combo multipliers ($1.5\times$, $2\times$, $3\times$), keyboard shortcuts (`1`–`4` or `A`–`D`), +2s rapid bonuses, and full problem review with step-by-step solutions.
- 🤖 **AI Math Duel**: Turn-based combat against 3 AI opponents (*Byte* for Junior, *Turing* for Senior, *Euler* for Apex) with dynamic health bars, shields, and battle logs.
- 🎯 **Target 24 Crafter**: The iconic 24 math puzzle. Combine 4 numbers using operations ($+, -, \times, \div, ()$) with a real-time formula evaluator, validator, and hint system.
- 🏰 **Formula Dungeons (Boss Rush)**: Climb through 5 progressive dungeon floors against mathematical Titans (*The Integroid*, *The Parabola Hydra*, *The Radical Golem*, *The Trigonometric Sphinx*, and *The Calculus Colossus*).
- 🔬 **Practice Lab**: Untimed exploratory mode with step-by-step mathematical reasoning, tutor hints, and scratchpad scribbling.

---

## 💾 Save & Restore Progress Feature

- **Personalized Profile**: Set your player/student username (e.g. `Sushant`).
- **Unique Save Key**: Every profile receives a 7-character recovery key (e.g. `VTX-7777`) for 1-click recovery.
- **Cross-Session Persistence**: Automatically tracks XP, levels, rank titles (from *Math Apprentice* to *Grand Fields Medalist*), accuracy, highest streaks, and personal bests.
- **Restore Anywhere**: Enter your Player Name or Save Key on any device to restore your scores.
- **Offline JSON Backup**: Download a `.json` backup file or restore previously downloaded save files.
- **Hall of Fame Leaderboard**: View top scores across saved players.

---

## 🎨 Creative & Accessible Features

- ✏️ **Interactive Scratchpad**: Built-in canvas whiteboard with pen, eraser, color swatches, line thickness, undo, and clear controls for rough calculations.
- 🔊 **Synthesized Web Audio FX**: Low-latency browser audio for clicks, correct answers, combos, damage hits, and victory fanfares (with mute toggle).

---

## 🚀 Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/Sushant67-lab/math-game.git
cd math-game

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🌐 How to Publish on GitHub Pages

This repository includes an automatic GitHub Actions deployment workflow (`.github/workflows/deploy.yml`):

1. Go to your repository on GitHub (`https://github.com/Sushant67-lab/<your-repo>`).
2. Click **Settings** (top tab).
3. On the left sidebar, click **Pages**.
4. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
5. Push your code to the `main` branch:
   ```bash
   git add .
   git commit -m "feat: add README and GitHub Pages deployment workflow"
   git push origin main
   ```
6. GitHub will automatically build and publish your game! Your live URL will be:
   `https://Sushant67-lab.github.io/<your-repo>/`

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8 with relative base path support
- **Styling**: Tailwind CSS v4 + Plus Jakarta Sans & JetBrains Mono fonts
- **Icons**: Lucide React
- **Audio**: Web Audio API oscillator synthesis
- **State & Storage**: LocalStorage multi-slot engine + JSON file import/export + Express REST persistence

---

## 📄 License

Apache-2.0 License.
