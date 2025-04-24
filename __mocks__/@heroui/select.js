// Mock for @heroui/select
module.exports = {
  Select: ({ children, onChange, value, 'aria-label': ariaLabel, 'data-testid': dataTestId, ...props }) => ({
    type: 'select',
    props: {
      value,
      onChange: (e) => onChange && onChange(e.target?.value),
      'aria-label': ariaLabel,
      'data-testid': dataTestId || 'template-selector',
      children,
      ...props
    }
  }),
  SelectItem: ({ children, value, ...props }) => ({
    type: 'option',
    props: {
      value,
      children,
      ...props
    }
  })
};