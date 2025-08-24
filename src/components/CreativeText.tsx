import { googleFontFamilies } from '@/constants/googleFontFamilies';
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import WebFont from 'webfontloader';

export type GoogleFontFamily = (typeof googleFontFamilies)[number];
export type DirectionType = 'horizontal' | 'vertical' | 'diagonal';
export type AnimationType = 'none' | 'fade' | 'slide' | 'bounce' | 'glow';
export type TextTransformType =
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'capitalize';

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
  skew?: {
    x?: number;
    y?: number;
  };
}

const CreativeText: React.FC<CreativeTextProps> = ({
  children,
  fontFamily = 'Pacifico',
  fontSize = '72px',
  color = 'white',
  strokeColor = 'black',
  strokeWidth = 8,
  shadow = true,
  gradient,
  animation = 'none',
  responsive = true,
  maxWidth,
  className = '',
  style = {},
  onFontLoad,
  onFontError,
  fallbackFont = 'serif',
  letterSpacing = 'normal',
  lineHeight = 1.2,
  opacity = 1,
  rotation = 0,
  skew = { x: 0, y: 0 },
  textTransform = 'none',
}) => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontError, setFontError] = useState(false);
  const [textDimensions, setTextDimensions] = useState({
    width: 1000,
    height: 300,
  });
  const [textLines, setTextLines] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Memoize processed props
  const processedFontSize = useMemo(() => {
    if (typeof fontSize === 'number') return `${fontSize}px`;
    return fontSize;
  }, [fontSize]);

  const processedMaxWidth = useMemo(() => {
    if (typeof maxWidth === 'number') return `${maxWidth}px`;
    return maxWidth;
  }, [maxWidth]);

  const processedLetterSpacing = useMemo(() => {
    if (typeof letterSpacing === 'number') return `${letterSpacing}px`;
    return letterSpacing;
  }, [letterSpacing]);

  // Get numeric font size
  const numericFontSize = useMemo(() => {
    const match = processedFontSize.match(/(\d+)/);
    return match ? parseInt(match[1]) : 72;
  }, [processedFontSize]);

  // Generate unique IDs for gradients and filters
  const gradientId = useMemo(
    () => `gradient-${Math.random().toString(36).substr(2, 9)}`,
    []
  );
  const filterId = useMemo(
    () => `filter-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  // More robust text measurement
  const measureText = useCallback(
    (text: string, font: string): { width: number; height: number } => {
      try {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.font = `${processedFontSize} "${font}", ${fallbackFont}`;
          const metrics = ctx.measureText(text);
          const width = metrics.width;
          const height =
            metrics.actualBoundingBoxAscent +
              metrics.actualBoundingBoxDescent ||
            metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent ||
            numericFontSize;
          if (width > 0 && height > 0) {
            return { width: Math.ceil(width), height: Math.ceil(height) };
          }
        }
      } catch {
        console.warn('Canvas text measurement failed, falling back to DOM.');
      }

      try {
        const span = document.createElement('span');
        span.style.cssText = `
          font: ${processedFontSize} "${font}", ${fallbackFont};
          visibility: hidden;
          position: absolute;
          top: -9999px;
          left: -9999px;
          white-space: nowrap;
          letter-spacing: ${processedLetterSpacing};
          line-height: 1;
          display: inline-block;
        `;
        span.textContent = text || 'M';
        document.body.appendChild(span);
        const rect = span.getBoundingClientRect();
        const width = rect.width || span.offsetWidth || span.scrollWidth;
        const height = rect.height || span.offsetHeight || span.scrollHeight;
        document.body.removeChild(span);

        return {
          width: Math.ceil(width) || text.length * numericFontSize * 0.6,
          height: Math.ceil(height) || numericFontSize,
        };
      } catch {
        console.warn('DOM text measurement failed, using rough estimate.');
      }

      return {
        width: Math.ceil(text.length * numericFontSize * 0.6),
        height: numericFontSize,
      };
    },
    [processedFontSize, fallbackFont, processedLetterSpacing, numericFontSize]
  );

  // Text line breaking
  const breakTextIntoLines = useCallback(
    (text: string, maxLineWidth: number, font: string) => {
      if (!text || !text.trim()) return [''];
      const words = text.trim().split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const { width } = measureText(testLine, font);

        if (width > maxLineWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
          const wordWidth = measureText(word, font).width;
          if (wordWidth > maxLineWidth && word.length > 1) {
            const chars = word.split('');
            let partialWord = '';
            for (const char of chars) {
              const testPartial = partialWord + char;
              const partialWidth = measureText(testPartial + '-', font).width;
              if (partialWidth > maxLineWidth && partialWord) {
                lines.push(partialWord + '-');
                partialWord = char;
              } else {
                partialWord = testPartial;
              }
            }
            if (partialWord) {
              currentLine = partialWord;
            }
          }
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines.length > 0 ? lines : [''];
    },
    [measureText]
  );

  // Enhanced layout calculation
  const calculateLayout = useCallback(
    (text: string, font: string) => {
      const padding = Math.max(strokeWidth * 4, 20) + 40;
      const minWidth = 300;
      let maxLineWidth: number;
      if (processedMaxWidth && typeof processedMaxWidth === 'string') {
        const numMaxWidth = parseInt(processedMaxWidth) || 800;
        maxLineWidth = Math.max(numMaxWidth - padding, minWidth);
      } else if (processedMaxWidth && typeof processedMaxWidth === 'number') {
        maxLineWidth = Math.max(processedMaxWidth - padding, minWidth);
      } else {
        const singleLineWidth = measureText(text, font).width;
        const idealMaxWidth = Math.min(
          singleLineWidth + padding,
          numericFontSize * 20
        );
        maxLineWidth = Math.max(idealMaxWidth, minWidth);
      }
      const lines = breakTextIntoLines(text, maxLineWidth, font);
      let maxWidth = 0;
      let totalHeight = 0;
      const lineHeights: number[] = [];
      lines.forEach((line, index) => {
        const { width, height } = measureText(line || ' ', font);
        maxWidth = Math.max(maxWidth, width);
        lineHeights.push(height);

        if (index === 0) {
          totalHeight += height;
        } else {
          totalHeight += height * Number(lineHeight);
        }
      });

      const finalWidth = Math.max(maxWidth + padding, minWidth);
      const finalHeight = Math.max(
        totalHeight + padding,
        numericFontSize * 1.5
      );
      return {
        lines,
        width: Math.ceil(finalWidth),
        height: Math.ceil(finalHeight),
        lineHeights,
      };
    },
    [
      strokeWidth,
      numericFontSize,
      lineHeight,
      breakTextIntoLines,
      measureText,
      processedMaxWidth,
    ]
  );

  // Font loading
  useEffect(() => {
    if (!fontFamily) {
      setFontLoaded(true);
      return;
    }

    const loadFont = () => {
      try {
        WebFont.load({
          google: {
            families: [fontFamily],
          },
          active: () => {
            setFontLoaded(true);
            setFontError(false);
            onFontLoad?.();
          },
          inactive: () => {
            setFontError(true);
            onFontError?.(new Error(`Failed to load font: ${fontFamily}`));
          },
          timeout: 15000,
        });
      } catch (error) {
        setFontError(true);
        onFontError?.(error);
      }
    };

    loadFont();
  }, [fontFamily, onFontLoad, onFontError]);

  // Update layout when content or font changes
  useEffect(() => {
    const updateLayout = () => {
      const effectiveFont = fontError ? fallbackFont : fontFamily;
      const layout = calculateLayout(children, effectiveFont || fallbackFont);

      setTextLines(layout.lines);
      setTextDimensions({
        width: layout.width,
        height: layout.height,
      });
      setIsReady(true);
    };

    if (fontLoaded || fontError) {
      const timer = setTimeout(updateLayout, 100);
      return () => clearTimeout(timer);
    }
  }, [
    children,
    fontFamily,
    fallbackFont,
    fontLoaded,
    fontError,
    calculateLayout,
  ]);

  // Recalculate layout on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isReady && responsive) {
        const effectiveFont = fontError ? fallbackFont : fontFamily;
        const layout = calculateLayout(children, effectiveFont || fallbackFont);
        setTextLines(layout.lines);
        setTextDimensions({
          width: layout.width,
          height: layout.height,
        });
      }
    };

    if (responsive) {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [
    isReady,
    responsive,
    fontError,
    fallbackFont,
    fontFamily,
    children,
    calculateLayout,
  ]);

  // Gradient definition
  const renderGradient = () => {
    if (!gradient) return null;
    const { colors, direction = 'horizontal' } = gradient;
    let x1 = '0%',
      y1 = '0%',
      x2 = '100%',
      y2 = '0%';

    switch (direction) {
      case 'vertical':
        x1 = '0%';
        y1 = '0%';
        x2 = '0%';
        y2 = '100%';
        break;
      case 'diagonal':
        x1 = '0%';
        y1 = '0%';
        x2 = '100%';
        y2 = '100%';
        break;
      default:
        x1 = '0%';
        y1 = '0%';
        x2 = '100%';
        y2 = '0%';
    }

    return (
      <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
        {colors.map((color, index) => (
          <stop
            key={index}
            offset={`${(index / (colors.length - 1)) * 100}%`}
            stopColor={color}
          />
        ))}
      </linearGradient>
    );
  };

  // Shadow/filter definition
  const renderFilter = () => {
    if (!shadow) return null;
    const shadowConfig =
      typeof shadow === 'boolean'
        ? {
            offsetX: 6,
            offsetY: 6,
            blur: 0,
            color: 'rgba(0,0,0,0.9)',
            opacity: 1,
          }
        : {
            offsetX: shadow.offsetX ?? 6,
            offsetY: shadow.offsetY ?? 6,
            blur: shadow.blur ?? 0,
            color: shadow.color ?? 'rgba(0,0,0,0.9)',
            opacity: shadow.opacity ?? 1,
          };

    return (
      <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx={shadowConfig.offsetX}
          dy={shadowConfig.offsetY}
          stdDeviation={shadowConfig.blur}
          floodColor={shadowConfig.color}
          floodOpacity={shadowConfig.opacity}
        />
      </filter>
    );
  };

  // Animation class (can stay as is, but should be documented)
  const getAnimationClass = () => {
    switch (animation) {
      case 'fade':
        return 'animate-fade-in';
      case 'slide':
        return 'animate-slide-in';
      case 'bounce':
        return 'animate-bounce';
      case 'glow':
        return 'animate-pulse';
      default:
        return '';
    }
  };

  // Transform
  const getTransform = () => {
    const transforms = [];
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    if (skew.x !== 0) transforms.push(`skewX(${skew.x}deg)`);
    if (skew.y !== 0) transforms.push(`skewY(${skew.y}deg)`);
    return transforms.length > 0 ? transforms.join(' ') : undefined;
  };

  // Y position per line
  const getLineY = (lineIndex: number, totalLines: number) => {
    if (totalLines === 1) {
      return '50%';
    }
    const lineHeightPixels = numericFontSize * Number(lineHeight);
    const totalTextHeight =
      (totalLines - 1) * lineHeightPixels + numericFontSize;
    const startY =
      (textDimensions.height - totalTextHeight) / 2 + numericFontSize * 0.8;
    const y = startY + lineIndex * lineHeightPixels;
    return `${(y / textDimensions.height) * 100}%`;
  };

  const effectiveFontFamily = fontError
    ? fallbackFont
    : fontLoaded
      ? fontFamily
      : fallbackFont;
  console.log(effectiveFontFamily);
  const fillColor = gradient ? `url(#${gradientId})` : color;
  const filterValue = shadow ? `url(#${filterId})` : undefined;

  // Don't render until layout is calculated
  if (!isReady) {
    return (
      <div
        style={{
          width: processedMaxWidth || 'auto',
          height: numericFontSize * 1.5,
          ...style,
        }}
        className={`creative-text-container ${className}`}
      >
        {/* Placeholder */}
      </div>
    );
  }

  return (
    <div
      className={`creative-text-container ${getAnimationClass()} ${className}`}
      style={{
        maxWidth: processedMaxWidth || '100%',
        width: responsive ? '100%' : processedMaxWidth || textDimensions.width,
        transform: getTransform(),
        opacity,
        fontFamily: `'${effectiveFontFamily}', ${fallbackFont}`,
        textTransform: textTransform,
        ...style,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${textDimensions.width} ${textDimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: processedMaxWidth || '100%',
          display: 'block',
        }}
      >
        <defs>
          {renderGradient()}
          {renderFilter()}
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}&display=swap');
            `}
          </style>
        </defs>
        {textLines.map((line, index) => (
          <text
            key={`${index}-${line}`}
            x="50%"
            y={getLineY(index, textLines.length)}
            dominantBaseline="middle"
            textAnchor="middle"
            fontFamily={`${effectiveFontFamily}, ${fallbackFont}`}
            fontSize={processedFontSize}
            fill={fillColor}
            stroke={strokeWidth > 0 ? strokeColor : 'none'}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            paintOrder="stroke fill"
            letterSpacing={processedLetterSpacing}
            filter={filterValue}
            style={{
              fontWeight: 'normal',
              userSelect: 'none',
              fontFamily: `${effectiveFontFamily}, ${fallbackFont}`,
              textTransform: textTransform,
            }}
          >
            {line}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default CreativeText;
