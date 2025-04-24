// Mock for @heroui/react
module.exports = {
  Table: ({ children, ...props }) => ({ type: 'table', props: { ...props, children } }),
  TableHeader: ({ children, ...props }) => ({ type: 'thead', props: { ...props, children } }),
  TableColumn: ({ children, ...props }) => ({ type: 'th', props: { ...props, children } }),
  TableBody: ({ children, ...props }) => ({ type: 'tbody', props: { ...props, children } }),
  TableRow: ({ children, ...props }) => ({ type: 'tr', props: { ...props, children } }),
  TableCell: ({ children, ...props }) => ({ type: 'td', props: { ...props, children } }),
  Chip: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "chip" } }),
  Button: ({ children, ...props }) => ({ type: 'button', props: { ...props, children, "data-testid": "button" } }),
  Tooltip: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "tooltip" } }),
  Pagination: (props) => ({ type: 'div', props: { ...props, "data-testid": "pagination" } }),
  Input: ({ placeholder, ...props }) => ({ type: 'input', props: { placeholder, ...props, "data-testid": "input" } }),
  Dropdown: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "dropdown" } }),
  DropdownTrigger: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "dropdown-trigger" } }),
  DropdownMenu: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "dropdown-menu" } }),
  DropdownItem: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "dropdown-item" } }),
  Card: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "card" } }),
  CardHeader: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "card-header" } }),
  CardBody: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "card-body" } }),
  CardFooter: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "card-footer" } }),
  Select: ({ children, ...props }) => ({ type: 'select', props: { ...props, children, "data-testid": "select" } }),
  SelectItem: ({ children, ...props }) => ({ type: 'option', props: { ...props, children, "data-testid": "select-item" } }),
  Tabs: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "tabs" } }),
  Tab: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "tab" } }),
  Spinner: (props) => ({ type: 'div', props: { ...props, "data-testid": "spinner" } }),
  // Modal components
  Modal: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "modal" } }),
  ModalContent: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "modal-content" } }),
  ModalHeader: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "modal-header" } }),
  ModalBody: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "modal-body" } }),
  ModalFooter: ({ children, ...props }) => ({ type: 'div', props: { ...props, children, "data-testid": "modal-footer" } }),
  // Hooks
  useDisclosure: () => ({
    isOpen: false,
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onToggle: jest.fn()
  }),
  // Other components
  Checkbox: ({ children, ...props }) => ({ type: 'input', props: { type: 'checkbox', ...props, children, "data-testid": "checkbox" } }),
};