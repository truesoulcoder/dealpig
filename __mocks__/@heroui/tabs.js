// Mock for @heroui/tabs
module.exports = {
  Tabs: ({ children, onValueChange, 'data-testid': dataTestId, ...props }) => ({
    type: 'div',
    props: {
      'data-testid': dataTestId || 'tabs-container',
      children: Array.isArray(children) 
        ? children.map(child => ({
            ...child,
            props: {
              ...child.props,
              onClick: () => onValueChange && onValueChange(child.props.value)
            }
          }))
        : children,
      ...props
    }
  }),
  Tab: ({ title, value, onClick, 'data-testid': dataTestId, ...props }) => ({
    type: 'button',
    props: {
      onClick: () => onClick && onClick(value),
      'data-testid': dataTestId,
      title,
      value,
      ...props
    }
  })
};