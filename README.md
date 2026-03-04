# Algebra Flow

> This repository contains the source code for Algebra Flow across mobile and web surfaces. The legacy mobile app is built with React Native + Expo, and the new browser experience lives in `apps/web` (Next.js).

## Features

- **Professional Math Input**: Powered by [MathLive](https://github.com/arnog/mathlive) for a Desmos-like math input experience
- **Step-by-Step Solutions**: Detailed explanations help you understand each problem-solving step
- **Automated Problem Generation**: Daily fresh problems generated using OpenAI's o4-mini model via GitHub Actions and synced through S3
- **Progress Tracking**: Monitor your learning journey with detailed statistics
- **Offline-First**: Practice anytime, anywhere - problems sync automatically when connected
- **Multiple Problem Types**: Linear equations, quadratic equations, systems of equations, and more
- **Intelligent Validation**: Advanced math equivalence checking accepts multiple correct answer formats using [MathLive](https://github.com/arnog/mathlive)

## Availability

Algebra Flow is available on the App Store for iOS devices.

[Download on the App Store](https://apps.apple.com/us/app/algebra-flow/id6748621915)

## Web App

- Path: `apps/web`
- Stack: Next.js + React + Zustand + MathLive
- Data source: S3 `latest.json` + batch files
- Deploy target: Vercel

### Web Environment

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_PROBLEMS_LATEST_URL=https://algebra-problems.s3.us-east-2.amazonaws.com/latest.json
# Optional
NEXT_PUBLIC_SENTRY_DSN=
```

### Web Commands

From repository root:

```bash
npm run web:dev
npm run web:typecheck
npm run web:lint
npm run web:build
npm run web:test:e2e
```

## Development

MVP Built during summer 2025 thanks to the generous financial support of Joe Zurier.

## Blog Post

[Link to blog post about the development journey](https://www.notion.so/Algebra-Flow-Development-Report-252239b8222a80d7bae3cc1f9cdd226a?source=copy_link)
