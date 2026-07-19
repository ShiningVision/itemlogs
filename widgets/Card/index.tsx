"use client";
import type React from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { Card as DefaultCard } from './Card.default';

const overrides: Record<string, React.ComponentType<any>> = {
  // dark: DarkCard,  <- only add if 'dark' theme ever needs structurally different behavior
};

export function Card(props: any) {
  const { themeName } = useTheme();
  const Component = overrides[themeName] || DefaultCard;
  return <Component {...props} />;
}
