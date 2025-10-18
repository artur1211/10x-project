# 10x-project

> AI-powered flashcard generation platform for efficient spaced repetition learning

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10x-project is an AI-powered flashcard generation system that streamlines the creation of high-quality study materials, enabling learners to leverage spaced repetition learning methodology without the time-consuming manual creation process.

### Key Features

- **AI-Powered Generation**: Transform any educational text into ready-to-study flashcards within minutes
- **Manual Creation**: Create and edit flashcards manually with flexible character limits
- **Spaced Repetition Learning**: Study using an optimized open-source spaced repetition algorithm
- **Study Tracking**: Monitor your progress with study streak counters and daily metrics
- **User Management**: Secure authentication and account management via Supabase

## Tech Stack

### Frontend

- **Astro 5** - Web framework
- **React 19** - UI library for interactive components
- **TypeScript 5** - Type-safe development
- **Tailwind 4** - Utility-first CSS framework
- **Shadcn/ui** - Component library

### Backend

- **Supabase** - Complete backend solution (authentication, database, storage)

### AI Communication

- **OpenRouter.ai** - AI integration with cost-efficient models (Claude Haiku/GPT-3.5-turbo)

### CI/CD and Hosting

- **GitHub Actions** - Continuous integration and deployment
- **DigitalOcean** - Cloud hosting platform

### Code Quality

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit code quality checks

### Testing

- **Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing (see [e2e/README.md](e2e/README.md) for setup)
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking

## Getting Started Locally

### Prerequisites

- **Node.js**: 22.14.0 (specified in `.nvmrc`)
- **npm** package manager
- **Supabase account** for backend services
- **OpenRouter.ai API key** for AI features

### Installation

1. Clone the repository:

```bash
git clone https://github.com/artur1211/10x-project
cd 10x-project
```

2. Ensure you're using the correct Node version:

```bash
nvm use
# or if you don't have nvm
# make sure you're using Node 22.14.0
```

3. Install dependencies:

```bash
npm install
```

4. Set up environment variables:
   Create a `.env` file in the root directory and add your configuration:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter.ai Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
```

5. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

| Script          | Command                 | Description                                        |
| --------------- | ----------------------- | -------------------------------------------------- |
| `dev`           | `npm run dev`           | Start the Astro development server with hot reload |
| `build`         | `npm run build`         | Build the production-ready application             |
| `preview`       | `npm run preview`       | Preview the production build locally               |
| `astro`         | `npm run astro`         | Run Astro CLI commands                             |
| `lint`          | `npm run lint`          | Check code for linting errors                      |
| `lint:fix`      | `npm run lint:fix`      | Automatically fix linting errors                   |
| `format`        | `npm run format`        | Format code with Prettier                          |
| `test`          | `npm run test`          | Run all tests                                      |
| `test:unit`     | `npm run test:unit`     | Run unit tests only                                |
| `test:e2e`      | `npm run test:e2e`      | Run E2E tests                                      |
| `test:coverage` | `npm run test:coverage` | Generate coverage report                           |
| `test:watch`    | `npm run test:watch`    | Run tests in watch mode                            |

## Project Scope

### Technical Constraints

- **Storage Limit**: Maximum 500 flashcards per user account
- **Input Limit**: 1,000-10,000 characters for AI generation
- **Character Limits**:
  - Front side: 10-500 characters
  - Back side: 10-1,000 characters
- **Platform**: Web-only application (Chrome, Firefox, Safari, Edge)

## Project Status

**Current Version**: 0.0.1 (MVP Development Phase)

This project is in active development. The current focus is on building the MVP with core features including AI-powered flashcard generation, manual flashcard management, and spaced repetition learning.

### Success Metrics

- **AI Acceptance Rate**: Target 75% of AI-generated flashcards accepted without modification
- **AI Usage Rate**: Target 75% of total flashcards created using AI generation

## License

License information is not currently specified. Please add a `LICENSE` file to the repository to clarify usage rights.

---

For more detailed product requirements, see [PRD](.ai/prd.md).

For technical stack details, see [Tech Stack](.ai/tech-stack.md).
