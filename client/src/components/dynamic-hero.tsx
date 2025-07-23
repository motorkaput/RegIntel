import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DynamicHeroProps {
  title: string;
  subtitle: string;
}

export default function DynamicHero({ title, subtitle }: DynamicHeroProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    if (!container) return;

    // Clear previous content
    svg.selectAll('*').remove();

    const createStreamgraph = () => {
      // Get fresh container dimensions
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear and set SVG dimensions
      svg.selectAll('*').remove();
      svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

      // Generate sample data for streamgraph
      const n = 20; // number of layers
      const m = Math.max(50, Math.floor(width / 4)); // Scale points based on width

      // Random color schemes - changes on each refresh
      const colorSchemes = [
        d3.schemeBlues[9],
        d3.schemeGreens[9],
        d3.schemePurples[9],
        d3.schemeOranges[9],
        d3.schemeReds[9],
        d3.schemeGreys[9]
      ];
      const selectedColors = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
      const color = d3.scaleOrdinal(selectedColors);

      // Generate data with bumps function (similar to Observable example)
      const bumps = (n: number, m: number) => {
        const a = new Array(n).fill(0);
        for (let i = 0; i < m; ++i) {
          const x = 1 / (0.1 + Math.random());
          const y = 2 * Math.random() - 0.5;
          const z = 10 / (0.1 + Math.random());
          for (let j = 0; j < n; ++j) {
            const w = (j / n - y) * z;
            a[j] += x * Math.exp(-w * w);
          }
        }
        return a;
      };

      const data = d3.transpose(Array.from({length: n}, () => bumps(m, 10)));

      // Create stack
      const stack = d3.stack()
        .keys(d3.range(n).map(String))
        .offset(d3.stackOffsetWiggle)
        .order(d3.stackOrderInsideOut);

      // Transform data for stacking
      const stackData = data.map((d, i) => {
        const obj: any = { index: i };
        d.forEach((value, j) => {
          obj[j.toString()] = value;
        });
        return obj;
      });

      const series = stack(stackData);

      // Scales - ensure full width coverage
      const x = d3.scaleLinear()
        .domain([0, m - 1])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain(d3.extent(series.flat(2).filter(d => d !== undefined)) as [number, number] || [0, 1])
        .range([height, 0]);

      // Area generator
      const area = d3.area<any>()
        .x((d, i) => x(i))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveBasis);

      // Create paths
      const paths = svg.selectAll('path')
        .data(series)
        .enter().append('path')
        .attr('d', area)
        .attr('fill', (d, i) => color(i.toString()))
        .attr('opacity', 0.15)
        .attr('stroke', 'none');

      // Animation
      paths
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('opacity', 0.2);
    };

    // Initial creation
    createStreamgraph();

    // Resize handler
    const handleResize = () => {
      createStreamgraph();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const combinedText = `${title}: ${subtitle}`;

  return (
    <section ref={containerRef} className="relative py-18 section-divider overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
        <svg 
          ref={svgRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>
      <div className="relative z-10 container-section">
        <div className="max-w-4xl">
          <h1 className="text-responsive-lg font-light text-gray-900 leading-tight tracking-tight">
            {combinedText}
          </h1>
        </div>
      </div>
    </section>
  );
}