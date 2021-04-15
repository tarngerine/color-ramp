import { useRef, useEffect, useState } from "react";

type Size = {
  x: number;
  y: number;
};

export function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ x: 0, y: 0 });

  useEffect(() => {
    if (!ref.current) return;
    let resize = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setSize({
          x: entry.contentRect.width,
          y: entry.contentRect.height
        });
      });
    });
    resize.observe(ref.current);
  }, [ref, setSize]);

  return [ref, size] as const;
}
