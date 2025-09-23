import { useEffect } from "react";
import "./BooPicker.css";
import {toBooColor} from './Boo.tsx';

interface BooPickerProps {
  color: number | undefined;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function BooPicker({ color, onColorChange }: BooPickerProps) {
  useEffect(() => {
    const canvasEl = document.getElementById(
      "boo-picker-canvas",
    ) as HTMLCanvasElement;
    if (!canvasEl) {
      return;
    }

    const ctx = canvasEl.getContext("2d");
    if (!ctx) {
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, canvasEl.width, 0);
    const numStops = 8;
    for (let i = 0; i <= numStops; i++) {
      const x = i / numStops ;
      gradient.addColorStop(x, toBooColor(x * 360));
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
  }, []);

  return (
    <>
      <div className="boo-picker">
        <canvas id="boo-picker-canvas" className="boo-canvas"></canvas>
        <input
          type="range"
          className="boo-range-input"
          min="0"
          max="360"
          step="0.01"
          value={color ?? 0}
          onChange={onColorChange}
        />
      </div>
    </>
  );
}

export default BooPicker;
