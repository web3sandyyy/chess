# Chess Master - AI Chess Coach 🎯♟️

A **Play & Learn** chess platform where AI teaches you through contextual explanations during gameplay. Play against 10 difficulty levels while receiving **real-time chess education** from an AI coach powered by Google Gemini.

## Features

### 🎮 Game Features
- **10 Difficulty Levels**: From random moves to full Stockfish engine
- **Drag & Drop**: Intuitive piece movement with visual indicators
- **Valid Move Highlights**: See legal moves for any piece
- **Player vs Computer** or **Player vs Player** modes

### 🎓 AI Coach Features (Gemini 2.0 Flash)
- **5 Coach Prompt Types**:
  1. **Good Move Detection**: Automatic praise when you make a strong move (+0.8 eval gain)
  2. **Mistake Analysis**: Gentle feedback when you blunder with suggested improvements
  3. **Opening Recognition**: Identifies 100+ chess openings and explains key ideas
  4. **Hint System**: Click for a suggested move with explanation
  5. **Positional Tips**: Periodic advice every 5 moves
- **Typewriter Effect**: Coach messages appear naturally
- **Message History**: Review past coach advice

### 📚 Opening Explorer
- **100+ Openings Database**: ECO codes from A00 to E97
- **Search Functionality**: Find any opening by name or ECO code
- **Opening Details**: View move sequences and key ideas

### 🔧 Technical Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with dark gradient theme
- **State Management**: Zustand
- **Chess Logic**: chess.js
- **AI Engine**: Stockfish (levels 6-10) + Custom Minimax (levels 1-5)
- **AI Coach**: Google Gemini 2.0 Flash

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and install
npm install

# Create environment file
cp .env.example .env

# Add your Gemini API key to .env
# Get yours at: https://aistudio.google.com/
VITE_GEMINI_API_KEY=your-api-key-here

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI Coach | Yes (for coach features) |

## Project Structure

```
src/
├── components/
│   ├── chess/          # Board, Game, Piece components
│   └── coach/          # CoachChat, OpeningSidebar, DifficultySlider
├── hooks/
│   ├── useChess.ts     # Chess game logic hook
│   └── useCoach.ts     # AI coach hook with 5 prompt types
├── lib/chess/
│   ├── engine.ts       # Minimax + Stockfish engine
│   ├── coach.ts        # Gemini prompts and fallbacks
│   ├── openings.json   # 100+ opening database
│   └── openingDetector.ts
├── store/
│   └── chessStore.ts   # Zustand global state
└── types/
    └── stockfish.d.ts  # TypeScript definitions
```

## Difficulty Levels

| Level | Name | Engine | Description |
|-------|------|--------|-------------|
| 1 | Beginner | Random | Picks any legal move |
| 2 | Casual | Greedy | Prioritizes captures |
| 3 | Easy | Minimax 2 | 2-move lookahead |
| 4 | Medium | Minimax 3 | 3-move lookahead |
| 5 | Hard | Minimax 4 | 4-move lookahead |
| 6 | Expert | Stockfish | Depth 8 |
| 7 | Master | Stockfish | Depth 11 |
| 8 | Grandmaster | Stockfish | Depth 14 |
| 9 | Super GM | Stockfish | Depth 17 |
| 10 | Maximum | Stockfish | Depth 20 |

## License

MIT

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
