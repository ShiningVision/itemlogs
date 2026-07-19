"use client";
import type React from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { Button as DefaultButton } from './Button.default';

const overrides: Record<string, React.ComponentType<any>> = {
  // dark: DarkButton,  <- only add if 'dark' theme ever needs structurally different behavior
};

export function Button(props: any) {
  const { themeName } = useTheme();
  const Component = overrides[themeName] || DefaultButton;
  return <Component {...props} />;
}
