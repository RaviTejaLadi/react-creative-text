import {
  AnimationType,
  DirectionType,
  GoogleFontFamily,
  TextTransformType,
} from './types';

export interface CreativeTextProps {
  children: string;
  fontFamily?: GoogleFontFamily;
  fontSize?: number | string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadow?:
    | boolean
    | {
        offsetX?: number;
        offsetY?: number;
        blur?: number;
        color?: string;
        opacity?: number;
      };
  gradient?: {
    colors: string[];
    direction?: DirectionType;
  };
  animation?: AnimationType;
  responsive?: boolean;
  maxWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
  onFontLoad?: () => void;
  onFontError?: (error: unknown) => void;
  fallbackFont?: string;
  letterSpacing?: number | string;
  lineHeight?: number | string;
  textTransform?: TextTransformType;
  opacity?: number;
  rotation?: number;
  skew?: { x?: number; y?: number };
}
