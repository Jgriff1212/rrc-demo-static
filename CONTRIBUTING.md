# Contributing to Reveal

Thank you for your interest in contributing to Reveal! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/reveal-app.git
   cd reveal-app
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up Supabase**
   - Follow the setup instructions in the main README
   - Use local Supabase for development

4. **Run the app**
   ```bash
   yarn mobile
   ```

## Code Guidelines

### TypeScript

- Use TypeScript for all new files
- Enable strict mode
- Define interfaces for all props and state
- Avoid `any` types

### React/React Native

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use React Query for server state
- Use Zustand for client state

### Naming Conventions

- **Components**: PascalCase (e.g., `TreemapBoard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useTasks.ts`)
- **Utils**: camelCase (e.g., `formatPeriodKey`)
- **Constants**: UPPER_SNAKE_CASE

### File Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── board/        # Board-specific components
│   └── task/         # Task-specific components
├── screens/          # Full screen components
├── hooks/            # Custom React hooks
├── lib/              # Third-party integrations
├── store/            # State management
└── types/            # TypeScript type definitions
```

## Testing

### Running Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test treemap.test.ts

# Run with coverage
yarn test --coverage
```

### Writing Tests

- Write tests for all new features
- Aim for >80% code coverage
- Test edge cases and error scenarios
- Use descriptive test names

Example:
```typescript
describe('calculateProgress', () => {
  it('should return 0.5 for half completion', () => {
    expect(calculateProgress(5, 10)).toBe(0.5);
  });

  it('should handle zero total', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });
});
```

## Commit Messages

Use semantic commit messages:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add weekly board view
fix: correct treemap layout calculation
docs: update setup instructions
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Follow code guidelines
   - Write/update tests
   - Update documentation

3. **Test your changes**
   ```bash
   yarn lint
   yarn type-check
   yarn test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feat/your-feature-name
   ```

6. **Create Pull Request**
   - Provide clear description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure CI passes

## Code Review

All submissions require review. We look for:

- Code quality and style consistency
- Test coverage
- Documentation updates
- No breaking changes (or properly documented)
- Performance considerations

## Feature Requests

To request a feature:

1. Check if it already exists in Issues
2. Create a new issue with `feature` label
3. Describe the use case and proposed solution
4. Wait for maintainer feedback before implementing

## Bug Reports

When reporting bugs, include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Device/OS information
- Screenshots or videos if applicable
- Error messages or logs

## Questions?

- Create a Discussion for general questions
- Join our Discord community
- Email developers@reveal-app.com

Thank you for contributing! 🎉
