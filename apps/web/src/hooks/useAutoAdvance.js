import { useCallback, useEffect, useRef, useState } from 'react';

export const ADVANCE_DELAY_MS = 380;

export function useAutoAdvance({ questionIndex, onAnswer, onNext, onComplete, isLast }) {
  const timerRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExiting(false);
  }, [questionIndex]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelect = useCallback(
    (value) => {
      onAnswer(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsExiting(true);
      timerRef.current = setTimeout(() => {
        setIsExiting(false);
        if (isLast) onComplete();
        else onNext();
      }, ADVANCE_DELAY_MS);
    },
    [onAnswer, onNext, onComplete, isLast],
  );

  return { handleSelect, isExiting };
}
