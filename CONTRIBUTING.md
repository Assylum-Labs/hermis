# Contributing to Hermis

Thank you for your interest in contributing to the Hermis! We welcome contributions of all kinds, from bug fixes and documentation improvements to new features and examples.

## Types of Contributions

We appreciate various forms of contributions:

- **Bug Fixes**: Help us fix issues and improve stability
- **New Features**: Propose and implement new functionality
- **Documentation**: Improve or add to our documentation
- **Examples**: Create sample applications and use cases
- **Tests**: Add or improve test coverage

## Before You Start

**Please open an issue first** to discuss any significant changes before investing time in implementation. This ensures:

- Your contribution aligns with the project's goals and direction
- We can provide guidance and feedback early in the process
- There's no duplication of effort with other contributors
- The approach fits with our architecture and design philosophy

For minor changes like typo fixes or small documentation updates, feel free to submit a PR directly.

## System Requirements

Before you begin, ensure you have:

- **Node.js**: Version 18 or higher
- **pnpm**: Version 10.5.2 or higher (install with `npm install -g pnpm`)
- **Git**: For version control

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/solana-headless-sdk.git
cd solana-headless-sdk

# Add the upstream remote
git remote add upstream https://github.com/Assylum-Labs/hermis.git
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the entire monorepo.

### 3. Build All Packages

```bash
pnpm build
```

This uses Turborepo to build all packages in the correct dependency order.

## Project Structure

This is a pnpm monorepo with the following structure:

```
.
├── packages/
│   ├── core/                    # Core wallet logic (@hermis/solana-headless-core)
│   ├── adapter-base/            # Framework-agnostic adapter (@hermis/solana-headless-adapter-base)
│   ├── react-core/              # React hooks and components (@hermis/solana-headless-react)
│   ├── wallet-standard/         # Wallet standard implementation
│   ├── errors/                  # Error handling utilities
│   └── format-config/           # Shared configuration
├── apps/
│   ├── sample-dapp/             # Vanilla JS demo application
│   └── sample-react-dapp/       # React demo application
└── docs/                        # Mintlify documentation
```

## Development Workflow

### Making Changes

1. **Create a new branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** in the appropriate package(s)

3. **Build the affected package(s)**:
   ```bash
   # Build all packages
   pnpm build

   # Build a specific package
   cd packages/adapter-base
   pnpm build
   ```

4. **Run tests**:
   ```bash
   # Run tests for a specific package
   cd packages/adapter-base
   pnpm test

   # Watch mode for development
   pnpm test:watch
   ```

### Working with the Monorepo

This project uses **Turborepo** for efficient builds and **pnpm workspaces** for dependency management.

**Key commands:**

```bash
# Build all packages (respects dependency graph)
pnpm build

# Clean all build artifacts
pnpm clean

# Run a command in a specific package
pnpm --filter "@hermis/solana-headless-react" build
pnpm --filter "@hermis/solana-headless-react" test
```

**Adding dependencies:**

```bash
# Add a dependency to a specific package
pnpm --filter "@hermis/solana-headless-react" add react-query

# Add a dev dependency to the root
pnpm add -D -w typescript
```

## Testing Guidelines

We use **Jest** for testing across all packages.

### Writing Tests

- Place tests in `__tests__/` directories within each package
- Name test files with `.test.ts` or `.test.tsx` extension
- Follow the arrange-act-assert pattern
- Mock external dependencies appropriately

**Example test structure:**

```typescript
import { describe, test, expect } from '@jest/globals';
import { YourFunction } from '../src/your-module';

describe('YourFunction', () => {
  test('should handle basic case', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = YourFunction(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Running Tests

```bash
# Run tests for a package
cd packages/adapter-base
pnpm test

# Run tests in watch mode
pnpm test:watch
```

**Note:** Always build packages before running tests, as some tests depend on built artifacts.

## Code Style

### TypeScript

- All code should be written in TypeScript
- Use strict type checking
- Avoid `any` types when possible
- Export all public types and interfaces

### General Guidelines

- Write clear, self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable and function names
- Follow existing code patterns in the project

## Submitting Pull Requests

### Before Submitting

1. Ensure all tests pass: `pnpm test`
2. Build all packages successfully: `pnpm build`
3. Update documentation if needed
4. Add tests for new functionality

### PR Requirements

1. **Link to an issue**: Reference the issue your PR addresses
2. **Clear description**: Explain what changes you made and why
3. **Test coverage**: Include tests for new features or bug fixes
4. **Documentation updates**: Update relevant docs in the `docs/` directory
5. **Changeset**: Add a changeset for versioning (see below)

### Creating a Changeset

We use **Changesets** for version management. Before submitting your PR, add a changeset:

```bash
# For a patch (bug fix)
pnpm patch

# For a minor version (new feature)
pnpm minor

# For a major version (breaking change)
pnpm major
```

This will create a file in `.changeset/` describing your changes. Edit this file to provide a clear description of what changed.

**Example changeset:**

```markdown
---
"@hermis/solana-headless-react": minor
---

Add useTokenBalance hook for querying SPL token balances
```

### PR Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge your PR
4. Your changes will be included in the next release

## Documentation

Our documentation is built with **Mintlify** and hosted at [docs.hermis.io](https://docs.hermis.io).

### Contributing to Docs

Documentation files are located in the `docs/` directory:

- **Quick Start Guides**: `docs/quickstart/`
- **API Reference**: `docs/api-reference/`
- **Cookbook**: `docs/cookbook/`
- **Examples**: `docs/examples/`

To update documentation:

1. Edit the relevant `.mdx` file
2. Test locally if possible
3. Submit a PR with your documentation changes

**Documentation standards:**

- Use clear, concise language
- Include code examples
- Test all code snippets
- Follow the existing documentation structure
- Add images or diagrams where helpful

## Versioning and Releases

### Version Management

We follow **Semantic Versioning** (semver):

- **Patch** (1.0.x): Bug fixes and minor changes
- **Minor** (1.x.0): New features (backwards compatible)
- **Major** (x.0.0): Breaking changes

### Release Process (Maintainers)

```bash
# 1. Version packages based on changesets
pnpm version-packages

# 2. Build and publish to npm
pnpm release
```

### Pre-release Workflow

For beta or alpha releases:

```bash
# Enter pre-release mode
pnpm prerelease

# Add changesets as usual
pnpm patch  # or minor/major

# Exit pre-release mode when ready
pnpm graduate
```

## Package Development

### Creating a New Package

1. Create a new directory in `packages/`
2. Add `package.json` with required fields:
   ```json
   {
     "name": "@hermis/package-name",
     "version": "0.0.0",
     "main": "./dist/index.cjs",
     "module": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "import": "./dist/index.js",
         "require": "./dist/index.cjs"
       }
     },
     "scripts": {
       "build": "tsup",
       "test": "jest"
     }
   }
   ```
3. Add `tsup.config.ts` for build configuration
4. Add `tsconfig.json` extending base config
5. Create `src/index.ts` as entry point
6. Update root `pnpm-workspace.yaml` if needed

### Dependencies Between Packages

Use workspace protocol for internal dependencies:

```json
{
  "dependencies": {
    "@hermis/solana-headless-core": "workspace:*"
  }
}
```

## Communication Channels

- **GitHub Issues**: For bug reports, feature requests, and discussions
- **GitHub Pull Requests**: For code contributions
- **Twitter**: [@Hermis_xyz](https://twitter.com/Hermis_xyz) for updates

## Getting Help

If you have questions or need help:

1. Check the [documentation](https://docs.hermis.io)
2. Search existing [GitHub Issues](https://github.com/Assylum-Labs/hermis/issues)
3. Open a new issue with your question
4. Be specific and provide context

## License

By contributing to Hermis, you agree that your contributions will be licensed under the Apache 2.0 License.

---

Thank you for contributing to Hermis! Your efforts help make Solana development more accessible and flexible for everyone.
