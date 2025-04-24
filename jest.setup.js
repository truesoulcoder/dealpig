// Optional: configure or set up a testing framework before each test.
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock @heroui/ripple package to prevent dynamic import issues
jest.mock('@heroui/ripple', () => ({
  ripple: jest.fn(),
  // Add any other functions or components from the package that you're using
}), { virtual: true });

// Mock @heroui/react since it likely imports from @heroui/ripple
jest.mock('@heroui/react', () => ({
  Button: ({ children, onPress, ...props }) => (
    <button onClick={onPress} {...props}>{children}</button>
  ),
  Input: ({ label, value, onChange, ...props }) => (
    <div>
      <label>{label}</label>
      <input 
        value={value} 
        onChange={(e) => onChange && onChange(e.target.value)} 
        {...props} 
      />
    </div>
  ),
}), { virtual: true });