import { useSafeInstanceId } from '@/hooks/useSafeInstanceId';
import { loadGoogleFontOnce } from '@/utils/load-font-once';
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { googleFontFamilies } from '@/constants/googleFontFamilies';

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
  skew?: { x?: number; y?: number };
}

const CreativeText: React.FC<CreativeTextProps> = ({
  children,
  fontFamily = 'Pacifico',
  fontSize = '12px',
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
  ...props
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

  // URL-safe unique ids per instance
  const uid = useSafeInstanceId();
  const gradientId = `${uid}-gradient`;
  const filterId = `${uid}-filter`;

  // Memoize processed props
  const processedFontSize = useMemo(
    () => (typeof fontSize === 'number' ? `${fontSize}px` : fontSize),
    [fontSize]
  );

  const processedMaxWidth = useMemo(
    () => (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth),
    [maxWidth]
  );

  const processedLetterSpacing = useMemo(
    () =>
      typeof letterSpacing === 'number' ? `${letterSpacing}px` : letterSpacing,
    [letterSpacing]
  );

  const numericFontSize = useMemo(() => {
    const match = processedFontSize.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 72;
  }, [processedFontSize]);

  // Measurement
  const measureText = useCallback(
    (text: string, font: string): { width: number; height: number } => {
      try {
        if (!canvasRef.current)
          canvasRef.current = document.createElement('canvas');
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.font = `${processedFontSize} "${font}", ${fallbackFont}`;
          const metrics = ctx.measureText(text);
          const width = metrics.width;
          const height =
            metrics.actualBoundingBoxAscent +
              metrics.actualBoundingBoxDescent ||
            metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent ||
            numericFontSize;
          if (width > 0 && height > 0)
            return { width: Math.ceil(width), height: Math.ceil(height) };
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
            if (partialWord) currentLine = partialWord;
          }
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines.length > 0 ? lines : [''];
    },
    [measureText]
  );

  const calculateLayout = useCallback(
    (text: string, font: string) => {
      const padding = Math.max(strokeWidth * 4, 20) + 40;
      const minWidth = 300;

      let maxLineWidth: number;
      if (processedMaxWidth && typeof processedMaxWidth === 'string') {
        const numMaxWidth = parseInt(processedMaxWidth, 10) || 800;
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
        totalHeight += index === 0 ? height : height * Number(lineHeight);
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

  // Load font once
  useEffect(() => {
    setFontLoaded(false);
    setFontError(false);
    loadGoogleFontOnce(
      fontFamily,
      () => {
        setFontLoaded(true);
        setFontError(false);
        onFontLoad?.();
      },
      (e) => {
        setFontError(true);
        onFontError?.(e);
      }
    );
  }, [fontFamily, onFontLoad, onFontError]);

  // Update layout when content or font changes
  useEffect(() => {
    const update = () => {
      const effectiveFont = fontError ? fallbackFont : fontFamily;
      const layout = calculateLayout(children, effectiveFont || fallbackFont);
      setTextLines(layout.lines);
      setTextDimensions({ width: layout.width, height: layout.height });
      setIsReady(true);
    };
    if (fontLoaded || fontError) {
      update();
    }
  }, [
    children,
    fontFamily,
    fallbackFont,
    fontLoaded,
    fontError,
    calculateLayout,
  ]);

  // Recalculate layout on resize
  useEffect(() => {
    if (!responsive) return;
    const handleResize = () => {
      const effectiveFont = fontError ? fallbackFont : fontFamily;
      const layout = calculateLayout(children, effectiveFont || fallbackFont);
      setTextLines(layout.lines);
      setTextDimensions({ width: layout.width, height: layout.height });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [
    responsive,
    fontError,
    fallbackFont,
    fontFamily,
    children,
    calculateLayout,
  ]);

  const renderGradient = () => {
    if (!gradient) return null;
    const { colors, direction = 'horizontal' } = gradient;
    const safeColors = colors?.length ? colors : [color];
    const x1 = '0%',
      y1 = '0%';
    let x2 = '100%',
      y2 = '0%';
    if (direction === 'vertical') {
      x2 = '0%';
      y2 = '100%';
    } else if (direction === 'diagonal') {
      x2 = '100%';
      y2 = '100%';
    }

    const stopsCount = Math.max(safeColors.length - 1, 1);

    return (
      <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
        {safeColors.map((c, i) => (
          <stop key={i} offset={`${(i / stopsCount) * 100}%`} stopColor={c} />
        ))}
      </linearGradient>
    );
  };

  const renderFilter = () => {
    if (!shadow) return null;
    const cfg =
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
          dx={cfg.offsetX}
          dy={cfg.offsetY}
          stdDeviation={cfg.blur}
          floodColor={cfg.color}
          floodOpacity={cfg.opacity}
        />
      </filter>
    );
  };

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

  const getTransform = () => {
    const t: string[] = [];
    if (rotation) t.push(`rotate(${rotation}deg)`);
    if (skew.x) t.push(`skewX(${skew.x}deg)`);
    if (skew.y) t.push(`skewY(${skew.y}deg)`);
    return t.length ? t.join(' ') : undefined;
  };

  const getLineY = (lineIndex: number, totalLines: number) => {
    if (totalLines === 1) return '50%';
    const lineHeightPx = numericFontSize * Number(lineHeight);
    const totalTextHeight = (totalLines - 1) * lineHeightPx + numericFontSize;
    const startY =
      (textDimensions.height - totalTextHeight) / 2 + numericFontSize * 0.8;
    const y = startY + lineIndex * lineHeightPx;
    return `${(y / textDimensions.height) * 100}%`;
  };

  const effectiveFontFamily = fontError
    ? fallbackFont
    : fontLoaded
      ? fontFamily
      : fallbackFont;

  const fillColor = gradient ? `url(#${gradientId})` : color;
  const filterValue = shadow ? `url(#${filterId})` : undefined;

  if (!isReady) {
    return (
      <div
        className={`creative-text-container ${className}`}
        style={{
          width: processedMaxWidth || 'auto',
          height: numericFontSize * 1.5,
          position: 'relative',
          isolation: 'isolate',
          ...style,
        }}
        {...props}
      />
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
        textTransform,
        position: 'relative',
        isolation: 'isolate',
        ...style,
      }}
      {...props}
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
        role="img"
        aria-label={children}
      >
        <defs>
          {renderGradient()}
          {renderFilter()}
        </defs>

        {textLines.map((line, index) => (
          <text
            key={`${uid}-line-${index}`}
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
              textTransform,
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
