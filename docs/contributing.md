# Contributing to DealPig

Thank you for your interest in contributing to DealPig! This guide will help you get started with development and outline our contribution process.

## Code of Conduct

We expect all contributors to follow our Code of Conduct, which can be summarized as:

- Be respectful and inclusive
- Exercise empathy and kindness
- Provide and gracefully accept constructive feedback
- Focus on what is best for the community

## Development Setup

### Prerequisites

- Node.js (v18.x or later)
- npm (v9.x or later)
- Git
- A Supabase account (for database)
- A Google Cloud Platform account (for Gmail API)

### Setting Up Your Development Environment

1. **Fork and Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/dealpig.git
   cd dealpig
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**

   Copy the example environment file and configure your variables:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your development credentials.

4. **Set Up Local Supabase**

   You can either:
   - Use a Supabase cloud instance for development
   - Run Supabase locally with Docker:

   ```bash
   npm install -g supabase
   supabase start
   ```

   Then run the setup script:

   ```bash
   cat supabase/setup-complete-schema.sql | supabase db execute
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

   Your development server will be available at http://localhost:3000

## Branching Strategy

We follow a simplified Git flow:

- `main`: Production-ready code
- `dev`: Development branch for feature integration
- `feature/{name}`: Feature branches
- `fix/{name}`: Bug fix branches
- `docs/{name}`: Documentation update branches

## Development Workflow

1. **Create a Feature Branch**

   ```bash
   git checkout dev
   git pull
   git checkout -b feature/amazing-feature
   ```

2. **Make Your Changes**

   Implement your feature or fix, following the coding standards.

3. **Write Tests**

   All new features should include tests. Run the tests to ensure they pass:

   ```bash
   npm test
   ```

4. **Format and Lint Your Code**

   ```bash
   npm run lint
   npm run format
   ```

5. **Commit Your Changes**

   We use conventional commit messages:

   ```bash
   git commit -m "feat: add amazing feature"
   ```

   Common prefixes:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

6. **Push Your Branch**

   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create a Pull Request**

   Open a PR from your feature branch to the `dev` branch.

## Pull Request Process

1. **Fill in the PR Template**
   - Describe the changes
   - Link any relevant issues
   - Add screenshots for UI changes

2. **Code Review**
   - At least one maintainer must review and approve
   - Address any feedback or requested changes

3. **Passing CI**
   - All tests must pass
   - Code must meet linting standards
   - TypeScript must compile without errors

4. **Merging**
   - Maintainers will merge approved PRs
   - PRs are typically squashed and merged

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Ensure proper typing of all variables, functions, and components
- Avoid using `any` type whenever possible

### React & Next.js

- Follow React hooks best practices
- Use functional components with hooks, not class components
- Prefer server components where possible
- Keep components small and focused on a single responsibility

### CSS/Styling

- Use TailwindCSS utility classes
- Follow the project's design system and component guidelines
- Ensure all UI is fully responsive
- Support dark and light mode where applicable

### Testing

- Write tests for new features and bug fixes
- Aim for high test coverage of critical paths
- Structure tests in a clear and readable manner

## Documentation Guidelines

- Update documentation when adding or changing features
- Document all public APIs and components
- Include JSDoc comments for functions and interfaces
- Keep README and docs up to date

## Performance Considerations

- Consider server vs. client components carefully
- Optimize database queries for performance
- Be mindful of bundle size
- Use React.memo, useMemo, and useCallback appropriately

## Accessibility Guidelines

- Follow WCAG 2.1 AA standards
- Ensure proper keyboard navigation
- Use semantic HTML elements
- Add appropriate ARIA attributes when necessary
- Maintain sufficient color contrast

## Security Guidelines

- Never store sensitive credentials in code
- Validate all user inputs
- Use prepared statements for database queries
- Implement proper authentication and authorization checks
- Follow security best practices for Next.js applications

## Reporting Bugs

If you find a bug, please report it by creating an issue. Include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (browser, OS, etc.)

## Suggesting Features

Feature suggestions are welcome! Create an issue with:

- A clear, descriptive title
- Detailed description of the feature
- Any relevant mockups or examples
- Use cases for the feature
- How it benefits the project

## Getting Help

If you need help with contributing:

- Check the documentation
- Ask questions in project discussions
- Reach out to maintainers

## License

By contributing to DealPig, you agree that your contributions will be licensed under the project's MIT license.

Thank you for contributing to DealPig!