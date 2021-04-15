import { useCallback, useEffect, useRef, useState } from "react";
import { Position } from "../types";

type Point = {
  x: number;
  y: number;
};

type DragArgs = {
  onStart?: () => void;
  onMove?: (position: Point) => void;
  onStop?: () => void;
};

export default function useDrag({ onStart, onMove, onStop }: DragArgs) {
  const targetRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const offsetRef = useRef<Point>();
  const startRef = useRef<Point>();

  useEffect(() => {
    if (!targetRef.current) {
      return;
    }
    const target = targetRef.current;

    function start(e: MouseEvent) {
      if (isDraggingRef.current) {
        return;
      }
      isDraggingRef.current = true;
      offsetRef.current = { x: 0, y: 0 };
      startRef.current = { x: e.pageX, y: e.pageY };
      if (onStart) {
        onStart();
      }
    }

    function stop() {
      if (!isDraggingRef.current) {
        return;
      }
      isDraggingRef.current = false;
      if (onStop) {
        onStop();
      }
      offsetRef.current = { x: 0, y: 0 };
      startRef.current = undefined;
    }

    target.addEventListener("mousedown", start);
    document.addEventListener("mouseup", stop);

    function move(e: MouseEvent) {
      if (!isDraggingRef.current || !startRef.current) {
        return;
      }
      e.preventDefault(); // prevent text selection
      offsetRef.current.x = e.pageX - startRef.current!.x;
      offsetRef.current.y = e.pageY - startRef.current!.y;
      if (onMove) {
        onMove({
          x: offsetRef.current.x,
          y: offsetRef.current.y
        });
      }
    }

    document.addEventListener("mousemove", move);

    return () => {
      target.removeEventListener("mousedown", start);
      document.removeEventListener("mouseup", stop);
      document.removeEventListener("mousemove", move);
    };
  }, [isDraggingRef, targetRef, onStart, onStop, onMove, offsetRef, startRef]);

  return targetRef;
}

function pixelToPosition(pixel: number, controlWidth: number) {
  return pixel / controlWidth;
}

function clampPosition(position: number) {
  return Math.min(1, Math.max(0, position));
}

export function useDragPosition(
  position: number,
  controlWidth: number,
  providedOnMove: (position: Position) => void
) {
  const positionRef = useRef<Position>(position);
  const startPositionRef = useRef<Position>(position);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  const onStart = useCallback(() => {
    startPositionRef.current = positionRef.current;
  }, []);
  const onMove = useCallback(
    (positionPixel) => {
      providedOnMove(
        clampPosition(
          startPositionRef.current +
            pixelToPosition(positionPixel.x, controlWidth)
        )
      );
    },
    [controlWidth, providedOnMove]
  );
  const dragRef = useDrag({ onStart, onMove });
  return dragRef;
}
