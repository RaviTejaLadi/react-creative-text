import { GoogleFontFamily } from '@/constants/googleFontFamilies';
import { cn } from '@/utils';
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import WebFont from 'webfontloader';

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
    direction?: 'horizontal' | 'vertical' | 'diagonal';
  };
  animation?: 'none' | 'fade' | 'slide' | 'bounce' | 'glow';
  responsive?: boolean;
  maxWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
  onFontLoad?: () => void;
  onFontError?: (error: unknown) => void;
  fallbackFont?: string;
  letterSpacing?: number | string;
  lineHeight?: number | string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
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
}) => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontError, setFontError] = useState(false);
  const [textDimensions, setTextDimensions] = useState({
    width: 1000,
    height: 300,
  });
  const [textLines, setTextLines] = useState<string[]>([]);
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

  // Create a persistent canvas for text measurement
  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    return canvasRef.current;
  }, []);

  // More accurate text measurement
  const measureText = useCallback(
    (text: string, font: string) => {
      const canvas = getCanvas();
      const context = canvas.getContext('2d');
      if (!context) return { width: 0, height: numericFontSize };

      // Set font with proper formatting
      const fontStyle = `${processedFontSize} "${font}", ${fallbackFont}`;
      context.font = fontStyle;

      const metrics = context.measureText(text);
      const width = metrics.width;

      // Calculate height more accurately
      const height =
        (metrics.actualBoundingBoxAscent || numericFontSize * 0.8) +
        (metrics.actualBoundingBoxDescent || numericFontSize * 0.2);

      return { width, height };
    },
    [processedFontSize, fallbackFont, numericFontSize, getCanvas]
  );

  // Smart line breaking based on actual text width
  const breakTextIntoLines = useCallback(
    (text: string, maxLineWidth: number, font: string) => {
      if (!text.trim()) return [''];

      const words = text.trim().split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const { width } = measureText(testLine, font);

        if (width > maxLineWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
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

  // Calculate optimal dimensions and line breaks
  const calculateLayout = useCallback(
    (text: string, font: string) => {
      const padding = strokeWidth * 4 + 40;
      const minWidth = 300;

      // Calculate dimensions based on actual content
      let maxWidth = 0;
      let totalHeight = 0;

      // Determine maximum line width
      let maxLineWidth: number;
      if (processedMaxWidth) {
        const numMaxWidth =
          typeof processedMaxWidth === 'number'
            ? processedMaxWidth
            : typeof processedMaxWidth === 'string'
              ? parseInt(processedMaxWidth)
              : minWidth;
        maxLineWidth = Math.max(numMaxWidth - padding, minWidth);
      } else {
        // Use a reasonable default based on font size
        maxLineWidth = Math.max(numericFontSize * 15, 800);
      }

      // Break text into lines
      const lines = breakTextIntoLines(text, maxLineWidth, font);

      lines.forEach((line, index) => {
        const { width, height } = measureText(line, font);
        maxWidth = Math.max(maxWidth, width);

        if (index === 0) {
          totalHeight += height;
        } else {
          totalHeight += height * Number(lineHeight);
        }
      });

      const finalWidth = Math.max(maxWidth + padding, minWidth);
      const finalHeight = Math.max(totalHeight + padding, 100);

      return {
        lines,
        width: Math.ceil(finalWidth),
        height: Math.ceil(finalHeight),
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

  // Load Google font dynamically
  useEffect(() => {
    if (!fontFamily) return;

    const loadFont = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          WebFont.load({
            google: {
              families: [fontFamily],
            },
            active: () => {
              setFontLoaded(true);
              setFontError(false);
              onFontLoad?.();
              resolve();
            },
            inactive: () => {
              setFontError(true);
              onFontError?.(new Error(`Failed to load font: ${fontFamily}`));
              reject(new Error(`Failed to load font: ${fontFamily}`));
            },
            timeout: 10000, // Increased timeout for better reliability
          });
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
    if (fontLoaded || fontError) {
      const effectiveFont = fontError ? fallbackFont : fontFamily;
      const layout = calculateLayout(children, effectiveFont || fallbackFont);

      setTextLines(layout.lines);
      setTextDimensions({
        width: layout.width,
        height: layout.height,
      });
    }
  }, [
    children,
    fontFamily,
    fallbackFont,
    fontLoaded,
    fontError,
    calculateLayout,
  ]);

  // Generate gradient definition
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
      default: // horizontal
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

  // Generate shadow/filter definition
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

  // Generate animation class
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

  // Generate transform string
  const getTransform = () => {
    const transforms = [];
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    if (skew.x !== 0) transforms.push(`skewX(${skew.x}deg)`);
    if (skew.y !== 0) transforms.push(`skewY(${skew.y}deg)`);
    return transforms.length > 0 ? transforms.join(' ') : undefined;
  };

  // Calculate Y position for each line
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
  const fillColor = gradient ? `url(#${gradientId})` : color;
  const filterValue = shadow ? `url(#${filterId})` : undefined;

  return (
    <div
      className={cn(
        'creative-text-container',
        responsive && 'w-full',
        getAnimationClass(),
        className
      )}
      style={{
        maxWidth: processedMaxWidth,
        transform: getTransform(),
        opacity,
        ...style,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${textDimensions.width} ${textDimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
        className={cn(
          'creative-text-svg',
          responsive ? 'w-full h-auto' : 'w-auto h-auto'
        )}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      >
        <defs>
          {renderGradient()}
          {renderFilter()}
        </defs>

        {textLines.map((line, index) => (
          <text
            key={index}
            x="50%"
            y={getLineY(index, textLines.length)}
            dominantBaseline="middle"
            textAnchor="middle"
            fontFamily={effectiveFontFamily}
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
