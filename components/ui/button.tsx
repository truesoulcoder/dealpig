import * as React from "react"

interface buttonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'flat';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}
export const Button: React.FC<buttonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      className={`button ${variant} ${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}