'use client';

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTheme } from 'next-themes';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const { theme } = useTheme();

  return (
    <Picker
      data={data}
      onEmojiSelect={(emoji: any) => onEmojiSelect(emoji.native)}
      theme={theme === 'dark' ? 'dark' : 'light'}
      previewPosition="none"
      skinTonePosition="none"
      searchPosition="none"
      navPosition="none"
      perLine={8}
      maxFrequentRows={0}
    />
  );
}
