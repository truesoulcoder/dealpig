// Mock for @heroui/spinner
module.exports = {
  Spinner: ({ 'aria-label': ariaLabel, ...props }) => ({
    type: 'div',
    props: {
      'aria-label': ariaLabel,
      'data-testid': 'spinner',
      children: 'Loading...',
      ...props
    }
  })
};