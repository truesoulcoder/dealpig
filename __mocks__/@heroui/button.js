// Mock for @heroui/button
module.exports = {
  Button: ({ children, onClick, isLoading, 'data-testid': dataTestId, ...props }) => ({
    type: 'button',
    props: {
      onClick,
      'data-testid': dataTestId || 'heroui-button',
      children: isLoading ? 'Loading...' : children,
      ...props
    }
  })
};