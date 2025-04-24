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
  useRipple: jest.fn(() => ({ rippleEffect: jest.fn() })),
  Ripple: () => ({ children }) => children, // Add Ripple component mock
  // Add any other functions or components from the package that you're using
}), { virtual: true });

// Mock @heroui/react/outline since it's used in leadsTable.tsx
jest.mock('@heroui/react/outline', () => ({
  // Add common icons or components
  SearchIcon: () => <svg data-testid="search-icon" />,
  SortAscendingIcon: () => <svg data-testid="sort-asc-icon" />,
  SortDescendingIcon: () => <svg data-testid="sort-desc-icon" />,
  // Add more icons as needed
  ChevronDownIcon: () => <svg data-testid="chevron-down-icon" />,
  ChevronUpIcon: () => <svg data-testid="chevron-up-icon" />,
  ChevronRightIcon: () => <svg data-testid="chevron-right-icon" />,
  ChevronLeftIcon: () => <svg data-testid="chevron-left-icon" />,
}), { virtual: true });

// Mock @heroui/react since it likely imports from @heroui/ripple
jest.mock('@heroui/react', () => ({
  Button: ({ children, onPress, onClick, ...props }) => (
    <button onClick={onClick || onPress} {...props}>{children}</button>
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
  // Adding more common HeroUI components
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  Table: ({ children, ...props }) => <table {...props}>{children}</table>,
  Tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  Tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,

  Td: ({ children, ...props }) => <td {...props}>{children}</td>,
  Th: ({ children, ...props }) => <th {...props}>{children}</th>,
  Thead: ({ children, ...props }) => <thead {...props}>{children}</thead>,
  Select: ({ children, ...props }) => <select {...props}>{children}</select>,
  Checkbox: ({ checked, onChange, ...props }) => (
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onChange && onChange(e)} 
      {...props} 
    />
  ),
  FormControl: ({ children, ...props }) => <div {...props}>{children}</div>,
  FormLabel: ({ children, ...props }) => <label {...props}>{children}</label>,
  Modal: ({ isOpen, onClose, children, ...props }) => (
    isOpen ? <div role="dialog" {...props}>{children}</div> : null
  ),
  ModalOverlay: ({ children, ...props }) => <div {...props}>{children}</div>,
  ModalContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  ModalHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  ModalBody: ({ children, ...props }) => <div {...props}>{children}</div>,
  ModalFooter: ({ children, ...props }) => <div {...props}>{children}</div>,
}), { virtual: true });

// Mock any additional libraries that your tests might need
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'Test User', email: 'test@example.com' } },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));