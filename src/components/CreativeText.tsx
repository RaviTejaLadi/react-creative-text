import { GoogleFontFamily } from '@/constants/googleFontFamilies';
import { cn } from '@/utils';
import React, { useEffect } from 'react';
import WebFont from 'webfontloader';

export interface CreativeTextProps {
  children: string;
  fontFamily?: GoogleFontFamily;
  fontSize?: number | string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadow?: boolean;
  className?: string;
}

const CreativeText: React.FC<CreativeTextProps> = ({
  children,
  fontFamily = 'Pacifico',
  fontSize = '72px',
  color = 'white',
  strokeColor = 'black',
  strokeWidth = 8,
  shadow = true,
  className = '',
}) => {
  // Load Google font dynamically if provided
  useEffect(() => {
    if (fontFamily) {
      WebFont.load({
        google: {
          families: [fontFamily],
        },
      });
    }
  }, [fontFamily]);

  return (
    <div className={cn(className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 300"
        preserveAspectRatio="xMinYMin meet"
        className="w-full h-auto"
      >
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontFamily={fontFamily}
          fontSize={fontSize}
          fill={color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          paintOrder="stroke"
          style={{
            filter: shadow
              ? 'drop-shadow(6px 6px 0px rgba(0,0,0,0.9))'
              : 'none',
          }}
        >
          {children}
        </text>
      </svg>
    </div>
  );
};

export default CreativeText;
