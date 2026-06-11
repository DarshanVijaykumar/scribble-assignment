import { useCallback, useEffect, useRef } from "react";
import type { Point, Stroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  onNewStroke: (stroke: Stroke) => void;
  onClear: () => void;
}

function redrawAll(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }
}

function getCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

export function DrawingCanvas({ strokes, isDrawer, onNewStroke, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    redrawAll(ctx, strokes);
  }, [strokes]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawer) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(event.pointerId);
      isDrawingRef.current = true;
      const pt = getCanvasPoint(canvas, event.nativeEvent);
      currentPointsRef.current = [pt];
    },
    [isDrawer]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawer || !isDrawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pt = getCanvasPoint(canvas, event.nativeEvent);
      currentPointsRef.current.push(pt);

      const pts = currentPointsRef.current;
      if (pts.length >= 2) {
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
    },
    [isDrawer]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;
    const pts = currentPointsRef.current;
    if (pts.length > 0) {
      onNewStroke({ points: pts });
    }
    currentPointsRef.current = [];
  }, [isDrawer, onNewStroke]);

  return (
    <div className="drawing-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={700}
        height={500}
        className="drawing-canvas"
        style={{
          cursor: isDrawer ? "crosshair" : "default",
          touchAction: "none",
          display: "block",
          width: "100%",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {isDrawer && (
        <div className="button-row button-row--compact" style={{ marginTop: "0.5rem" }}>
          <button className="button button--secondary" type="button" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
