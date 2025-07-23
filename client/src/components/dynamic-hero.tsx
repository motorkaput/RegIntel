import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DynamicHeroProps {
  title: string;
  subtitle: string;
}

export default function DynamicHero({ title, subtitle }: DynamicHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawFractal();
    };

    // Fractal generation functions
    const drawMandelbrot = () => {
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.createImageData(width, height);
      
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const cx = (x - width / 2) * 4 / width;
          const cy = (y - height / 2) * 4 / height;
          
          let zx = 0, zy = 0;
          let iterations = 0;
          const maxIterations = 100;
          
          while (zx * zx + zy * zy < 4 && iterations < maxIterations) {
            const temp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = temp;
            iterations++;
          }
          
          const pixelIndex = (y * width + x) * 4;
          const intensity = iterations === maxIterations ? 0 : (iterations / maxIterations) * 255;
          
          imageData.data[pixelIndex] = intensity * 0.3; // R
          imageData.data[pixelIndex + 1] = intensity * 0.3; // G
          imageData.data[pixelIndex + 2] = intensity * 0.3; // B
          imageData.data[pixelIndex + 3] = 60; // A (low opacity)
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    };

    const drawJulia = () => {
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.createImageData(width, height);
      
      // Random Julia set parameters
      const cReal = Math.random() * 0.8 - 0.4;
      const cImag = Math.random() * 0.8 - 0.4;
      
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let zx = (x - width / 2) * 3 / width;
          let zy = (y - height / 2) * 3 / height;
          
          let iterations = 0;
          const maxIterations = 80;
          
          while (zx * zx + zy * zy < 4 && iterations < maxIterations) {
            const temp = zx * zx - zy * zy + cReal;
            zy = 2 * zx * zy + cImag;
            zx = temp;
            iterations++;
          }
          
          const pixelIndex = (y * width + x) * 4;
          const intensity = iterations === maxIterations ? 0 : (iterations / maxIterations) * 255;
          
          imageData.data[pixelIndex] = intensity * 0.2;
          imageData.data[pixelIndex + 1] = intensity * 0.2;
          imageData.data[pixelIndex + 2] = intensity * 0.2;
          imageData.data[pixelIndex + 3] = 40;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    };

    const drawDragonCurve = () => {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      let x = centerX;
      let y = centerY;
      let direction = 0; // 0: right, 1: up, 2: left, 3: down
      const step = 3;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Generate dragon curve sequence
      let sequence = [1];
      for (let i = 0; i < 14; i++) {
        const newSequence = [...sequence, 1];
        for (let j = sequence.length - 1; j >= 0; j--) {
          newSequence.push(1 - sequence[j]);
        }
        sequence = newSequence;
      }
      
      for (const turn of sequence) {
        const dx = step * Math.cos(direction * Math.PI / 2);
        const dy = step * Math.sin(direction * Math.PI / 2);
        x += dx;
        y += dy;
        ctx.lineTo(x, y);
        direction = (direction + (turn ? 1 : -1) + 4) % 4;
      }
      
      ctx.stroke();
    };

    const drawFractal = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Random fractal selection
      const fractals = [drawMandelbrot, drawJulia, drawDragonCurve];
      const selectedFractal = fractals[Math.floor(Math.random() * fractals.length)];
      selectedFractal();
    };

    // Initial setup
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const combinedText = `${title}: ${subtitle}`;

  return (
    <section ref={containerRef} className="relative py-12 section-divider overflow-hidden">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}
      />
      <div className="relative z-10 container-section">
        <div className="max-w-4xl">
          <h1 className="text-responsive-lg font-light text-gray-900 leading-relaxed tracking-tight">
            {combinedText}
          </h1>
        </div>
      </div>
    </section>
  );
}