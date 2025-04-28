'use client';

import React, { useContext } from 'react';
import { useActor } from '@xstate/react';
import { ThemeMachineContext } from '@/app/providers';
import { Switch } from "@heroui/react";

export const ThemeToggle: React.FC = () => {
  const service = useContext(ThemeMachineContext);
  const [state, send] = useActor(service);
  const current = state.value as string;

  return (
    <Switch
      isSelected={current === 'leet'}
      onValueChange={() => send({ type: 'TOGGLE' })}
      classNames={{
        base: current === 'leet' ? 'bg-black border-green-400' : '',
        wrapper: current === 'leet' ? 'border-green-400' : '',
        thumb: current === 'leet' ? 'bg-green-400 border-green-400' : '',
      }}
      aria-label="Cycle theme: light, dark, leet"
    />
  );
};
export default ThemeToggle;