// Mock for @heroui/card
module.exports = {
  Card: ({ children, 'data-testid': dataTestId, ...props }) => ({
    type: 'div',
    props: {
      'data-testid': dataTestId || 'heroui-card',
      children,
      ...props
    }
  }),
  CardHeader: ({ children, ...props }) => ({
    type: 'div',
    props: {
      'data-testid': 'card-header',
      children,
      ...props
    }
  }),
  CardBody: ({ children, ...props }) => ({
    type: 'div',
    props: {
      'data-testid': 'card-body',
      children,
      ...props
    }
  }),
  CardFooter: ({ children, ...props }) => ({
    type: 'div',
    props: {
      'data-testid': 'card-footer',
      children,
      ...props
    }
  })
};