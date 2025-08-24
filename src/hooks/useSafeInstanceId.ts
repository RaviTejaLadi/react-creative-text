import { useRef } from 'react';

let __ctCounter = 0;
export function useSafeInstanceId(prefix = 'ct'): string {
  const ref = useRef<string>();
  if (!ref.current) {
    __ctCounter += 1;
    ref.current = `${prefix}-${__ctCounter}`;
  }
  return ref.current!;
}
