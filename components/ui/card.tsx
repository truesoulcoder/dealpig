"use client";

import React from 'react';
import { Card as HeroCard, CardBody, CardHeader as HeroCardHeader, CardFooter as HeroCardFooter } from '@heroui/react';

interface CardProps {
  className?: string;
  children?: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <HeroCard className={className} {...props}>
      {children}
    </HeroCard>
  );
}

interface CardHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <HeroCardHeader className={className} {...props}>
      {children}
    </HeroCardHeader>
  );
}

interface CardTitleProps {
  className?: string;
  children?: React.ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps & React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-medium ${className || ''}`} {...props}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  className?: string;
  children?: React.ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardBody className={className} {...props}>
      {children}
    </CardBody>
  );
}

interface CardFooterProps {
  className?: string;
  children?: React.ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <HeroCardFooter className={className} {...props}>
      {children}
    </HeroCardFooter>
  );
}