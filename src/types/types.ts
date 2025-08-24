import { googleFontFamilies } from '@/constants/googleFontFamilies';

export type GoogleFontFamily = (typeof googleFontFamilies)[number];
export type DirectionType = 'horizontal' | 'vertical' | 'diagonal';
export type AnimationType = 'none' | 'fade' | 'slide' | 'bounce' | 'glow';
export type TextTransformType =
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'capitalize';
