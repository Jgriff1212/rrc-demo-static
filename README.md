# Reveal - Task Completion Meets AI-Generated Art

**Reveal** is a cross-platform mobile app (iOS & Android) that gamifies task completion by progressively revealing AI-generated artwork. Built with React Native (Expo), TypeScript, Supabase, and designed for production deployment.

## 🎯 Core Concept

- Create **daily, weekly, or monthly** task boards
- Each task has a **priority** (High, Medium, Low) that determines its tile size on a treemap grid
- Completing tasks **reveals portions** of a hidden AI-generated image
- Finishing all tasks unlocks a **5-15s shareable animation** with checkmarks and reveal
- **Reveal + Real** mode composites your selfie with the final image
- **Daily community challenge** uses a shared base image seed for leaderboards

## 📦 Project Structure

```
reveal-app/
├── apps/
│   ├── mobile/              # React Native (Expo) mobile app
│   │   ├── app/            # Expo Router screens
│   │   ├── src/
│   │   │   ├── components/ # UI, board, task components
│   │   │   ├── screens/    # Main screens
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── lib/        # API client, Supabase config
│   │   │   └── store/      # Zustand state management
│   │   └── assets/         # Icons, splash, art packs
│   └── web/                # (Optional) Next.js landing page
├── packages/
│   └── shared/             # Shared types, treemap algorithm, utils
├── supabase/
│   ├── migrations/         # SQL schema migrations
│   └── functions/          # Edge Functions (TypeScript/Deno)
│       ├── image-request/  # AI image generation
│       ├── image-moderate/ # Content moderation
│       ├── video-compose/  # Animation generation
│       ├── leaderboard/    # Daily rankings
│       └── share-reveal-real/ # Photo compositing
└── README.md
```

## 🛠 Tech Stack

### Mobile App
- **React Native (Expo)** - Cross-platform framework
- **TypeScript** - Type safety
- **Expo Router** - File-based navigation
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Native Reanimated 3** - Animations
- **React Native Skia** - Advanced graphics (checkmarks, reveal masks)
- **expo-camera** - Camera access for Reveal+Real

### Backend
- **Supabase** - Backend-as-a-Service
  - **Postgres** - Database with RLS (Row Level Security)
  - **Auth** - Magic link authentication
  - **Storage** - AI images, user shares
  - **Edge Functions** - Serverless functions (Deno/TypeScript)

### Infrastructure
- **Monorepo** - Yarn workspaces
- **ESLint + Prettier** - Code quality
- **Jest + React Native Testing Library** - Unit tests
- **Detox** - E2E tests (scaffold included)

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Yarn** >= 1.22.0
- **Supabase CLI** - [Install](https://supabase.com/docs/guides/cli)
- **Expo CLI** - `npm install -g expo-cli`
- **iOS Simulator** (macOS) or **Android Studio** (for emulators)

### 1. Clone & Install

```bash
git clone <repository-url>
cd reveal-app
yarn install
```

### 2. Set Up Supabase

#### Option A: Local Development (Recommended)

```bash
# Start Supabase local instance
cd supabase
supabase start

# Note the API URL and anon key from output
```

#### Option B: Cloud Instance

1. Create project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key

#### Run Migrations

```bash
# Apply database schema
supabase db reset

# Or for cloud:
supabase link --project-ref <your-project-ref>
supabase db push
```

#### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy image-request
supabase functions deploy image-moderate
supabase functions deploy video-compose
supabase functions deploy leaderboard
supabase functions deploy share-reveal-real

# Set environment secrets
supabase secrets set IMAGE_PROVIDER=mock
supabase secrets set MODERATION_PROVIDER=none
```

### 3. Configure Mobile App

```bash
cd apps/mobile

# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
```

**.env file:**

```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_FUNCTIONS_URL=http://localhost:54321/functions/v1
EXPO_PUBLIC_IMAGE_PROVIDER=mock
EXPO_PUBLIC_REVENUECAT_API_KEY=stub-key
EXPO_PUBLIC_ENABLE_REVEAL_REAL=true
EXPO_PUBLIC_ENABLE_LEADERBOARD=true
EXPO_PUBLIC_DEV_MODE=true
```

### 4. Run Mobile App

```bash
# Start Expo dev server
yarn mobile

# Or run on specific platform
yarn mobile:ios
yarn mobile:android
```

## 📱 Development Workflow

### Running the App

```bash
# From repository root
yarn mobile              # Start Expo server
yarn mobile:ios          # Run on iOS simulator
yarn mobile:android      # Run on Android emulator

# Watch Supabase functions logs
supabase functions logs
```

### Testing

```bash
# Run all tests
yarn test

# Run specific package tests
cd packages/shared
yarn test

# Run mobile tests
cd apps/mobile
yarn test

# E2E tests (Detox - requires setup)
# yarn e2e:ios
# yarn e2e:android
```

### Code Quality

```bash
# Lint
yarn lint

# Type check
yarn type-check

# Format
yarn format
```

## 🗄 Database Schema

### Key Tables

- **users** - Extends Supabase auth.users
- **profiles** - User profiles with streak, tier, preferences
- **tasks** - User tasks with priority, period, completion status
- **boards** - Period-based task collections
- **ai_images** - Generated images with seeds and metadata
- **reveals** - Tracks which tiles have been revealed
- **leaderboards** - Daily/weekly/monthly top finishers
- **shares** - User-created shares (image, video, reveal+real)

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only access their own data
- Leaderboards are publicly readable
- AI images are shared (community seeds)

See `supabase/migrations/20240101000000_initial_schema.sql` for full schema.

## 🎨 Treemap Algorithm

The board uses a **squarified treemap** layout to convert task priorities into tile sizes:

- **High priority** = weight 3
- **Medium priority** = weight 2
- **Low priority** = weight 1

Algorithm implemented in `packages/shared/src/treemap.ts` with comprehensive tests.

```typescript
import { treemap, priorityToWeight } from '@reveal/shared';

const items = tasks.map(task => ({
  id: task.id,
  weight: priorityToWeight(task.priority),
  data: task,
}));

const tiles = treemap(items, boardWidth, boardHeight);
```

## 🖼 AI Image Generation

### Provider Pattern

The app uses an **adapter pattern** for AI image generation:

- **MockImageProvider** - Returns Lorem Picsum placeholders (default)
- **HttpImageProvider** - Calls external API (Stability AI, Replicate, OpenAI)

### Configuration

Set environment variables to switch providers:

```env
IMAGE_PROVIDER=http
IMAGE_PROVIDER_URL=https://api.stability.ai/v1/generation/...
IMAGE_PROVIDER_API_KEY=your-api-key
```

### Implementation

See `supabase/functions/image-request/index.ts` for provider implementations.

## 📹 Video Composition

Video generation is stubbed in the MVP. For production:

1. Use **ffmpeg-kit-react-native** for video processing
2. Render animation frames with **React Native Skia**
3. Orchestrate via Edge Function (`video-compose`)
4. Store in Supabase Storage
5. Return signed URL

Current implementation returns mock video URLs.

## 📸 Reveal + Real

The camera feature allows users to composite their selfie with the final reveal:

- **Opt-in** via Settings (disabled by default)
- **Dual-camera or sequential capture** with guided UI
- **Layout options**: split, picture-in-picture, blended overlay
- **Privacy filters**: blur, pixelate, artify

Enable in Settings screen. Camera permissions requested on first use.

## 💰 Monetization (RevenueCat Stub)

Revenue integration is stubbed for development. See `apps/mobile/src/lib/revenue-cat.ts`.

### Tiers

- **Free**: 1 daily board, standard images, watermarked shares
- **Pro**: Unlimited boards, no watermark, premium styles, streak insurance
- **Creator**: Host themed challenges (scaffold only)

To integrate real RevenueCat:

1. Install `@revenuecat/purchases-react-native`
2. Replace mock implementation
3. Configure products in RevenueCat dashboard
4. Update entitlement checks

## 🏆 Leaderboards

Daily leaderboards rank users by completion time:

- **Community seed** ensures fair comparison
- **Anonymized display names** for privacy
- **Opt-in/opt-out** in Settings
- **User percentile** ranking

Leaderboards generated via `leaderboard` Edge Function.

## 🔐 Security & Privacy

### Authentication
- Magic link email auth (no passwords)
- JWT tokens with auto-refresh
- Secure storage with expo-secure-store

### Data Privacy
- RLS policies enforce data isolation
- Camera opt-in required for Reveal+Real
- Leaderboard participation is opt-in
- User data export available in Settings

### Content Moderation
- Keyword filter for prompts
- External moderation API stub (OpenAI Moderation)
- NSFW blocking before image generation

## 🧪 Testing Strategy

### Unit Tests
- **Treemap algorithm** - `packages/shared/src/treemap.test.ts`
- **Utility functions** - `packages/shared/src/utils.test.ts`
- **Components** - `apps/mobile/src/components/**/__tests__`

### Integration Tests
- API client functions
- React Query hooks
- Edge Functions (Deno test)

### E2E Tests (Detox)
- Onboarding flow
- Task creation & completion
- Board reveal
- Share functionality

Run tests with:
```bash
yarn test
```

## 📦 Building for Production

### iOS

```bash
cd apps/mobile

# Build development
expo build:ios

# Or use EAS Build (recommended)
eas build --platform ios
```

Requirements:
- Apple Developer account ($99/year)
- App Store Connect setup
- Code signing certificates

### Android

```bash
cd apps/mobile

# Build APK
expo build:android

# Or use EAS Build
eas build --platform android
```

Requirements:
- Google Play Developer account ($25 one-time)
- Signing keystore

### Deployment Checklist

- [ ] Set production Supabase URL/keys
- [ ] Configure real AI image provider
- [ ] Enable RevenueCat with actual products
- [ ] Set up Sentry/analytics
- [ ] Configure push notifications
- [ ] Generate app icons & splash screens
- [ ] Write App Store/Play Store descriptions
- [ ] Create privacy policy & terms of service
- [ ] Test on physical devices
- [ ] Submit to app stores

## 🔧 Environment Variables

### Mobile App

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | - |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | - |
| `EXPO_PUBLIC_FUNCTIONS_URL` | Edge Functions URL | Same as Supabase URL |
| `EXPO_PUBLIC_IMAGE_PROVIDER` | `mock` or `http` | `mock` |
| `EXPO_PUBLIC_IMAGE_PROVIDER_URL` | AI image API URL | - |
| `EXPO_PUBLIC_IMAGE_PROVIDER_API_KEY` | AI image API key | - |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | RevenueCat key | `stub-key` |
| `EXPO_PUBLIC_ENABLE_REVEAL_REAL` | Enable camera feature | `true` |
| `EXPO_PUBLIC_ENABLE_LEADERBOARD` | Enable leaderboards | `true` |

### Edge Functions

Set via `supabase secrets set KEY=value`:

| Variable | Description |
|----------|-------------|
| `IMAGE_PROVIDER` | `mock` or `http` |
| `IMAGE_PROVIDER_URL` | AI image API URL |
| `IMAGE_PROVIDER_API_KEY` | AI image API key |
| `MODERATION_PROVIDER` | `none` or `http` |
| `MODERATION_API_URL` | Moderation API URL |
| `MODERATION_API_KEY` | Moderation API key |

## 🎨 Customization

### Art Packs

Add new art styles by:
1. Creating style prompt templates in `image-request` function
2. Adding style selector in Settings screen
3. Updating `ai_images.style_pack` enum

### Tile Weights

Adjust priority weights in database:

```sql
UPDATE settings
SET value = '{"high": 5, "medium": 3, "low": 1}'::jsonb
WHERE key = 'weights';
```

Or via Settings screen (admin feature).

## 📚 Assumptions & Design Decisions

### Assumptions

1. **Target Audience**: Productivity enthusiasts who enjoy gamification
2. **Usage Pattern**: Daily check-ins, 5-10 tasks per board
3. **Device Support**: iOS 13+, Android 8+
4. **Network**: Requires internet for sync; offline mode for task creation
5. **Image Generation**: 5-10s latency acceptable; cached for period

### Design Decisions

1. **Monorepo**: Easier code sharing between mobile and potential web app
2. **Supabase**: Faster development than custom backend
3. **Treemap Layout**: Visually represents priority while optimizing space
4. **Mock Providers**: Allows development without external API dependencies
5. **Expo**: Simplifies React Native setup and OTA updates
6. **TypeScript**: Type safety reduces runtime errors
7. **RLS Policies**: Security by default at database level

## 🐛 Known Limitations (MVP)

- Video composition returns mock URLs (not actual rendered videos)
- Reveal+Real compositing is stubbed
- Calendar/Reminders integration not implemented
- FFmpeg video processing not integrated
- No offline sync conflict resolution
- Push notifications not configured
- Analytics/crash reporting not integrated

These are scaffolded and documented for post-MVP implementation.

## 🤝 Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint/Prettier rules
- Write tests for new features
- Document complex algorithms
- Use semantic commit messages

### Pull Request Process

1. Create feature branch
2. Write/update tests
3. Ensure `yarn lint` and `yarn test` pass
4. Update README if needed
5. Submit PR with clear description

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

- **Treemap Algorithm**: Based on "Squarified Treemaps" by Bruls, Huizing, and van Wijk
- **Design Inspiration**: Habitica, Streaks, Way of Life
- **Placeholder Images**: Lorem Picsum

## 📞 Support

For questions or issues:
- Create a GitHub issue
- Email: support@reveal-app.com
- Discord: [Your Discord Server]

---

**Built with ❤️ for productivity enthusiasts**

🎯 Complete tasks. Reveal art. Build streaks. 🎨
