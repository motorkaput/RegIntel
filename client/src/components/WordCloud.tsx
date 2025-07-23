import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface WordData {
  text: string;
  size: number;
  value: number;
  x?: number;
  y?: number;
}

interface WordCloudProps {
  words: { text: string; value: number }[];
  width?: number;
  height?: number;
}

export default function WordCloud({ words, width = 450, height = 450 }: WordCloudProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || words.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Professional color palette matching your local app
    const colors = [
      '#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626',
      '#0891b2', '#65a30d', '#ea580c', '#4338ca', '#be123c',
      '#0d9488', '#9333ea', '#0369a1', '#db2777', '#6366f1'
    ];

    // Font size scale
    const maxValue = Math.max(...words.map(d => d.value));
    const minValue = Math.min(...words.map(d => d.value));
    const fontScale = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([14, 60]);

    // Create layout with expanded word cloud area
    const layout = cloud<WordData>()
      .size([width * 1.5, height]) // Wider word cloud to fill container
      .words(words.map(d => ({
        text: d.text,
        size: fontScale(d.value),
        value: d.value
      })))
      .padding(1) // Tighter padding for more space
      .rotate(() => 0) // No rotation for clean look
      .font('Roboto')
      .fontSize((d: WordData) => d.size)
      .spiral('archimedean')
      .on('end', draw);

    layout.start();

    function draw(words: WordData[]) {
      const svg = d3.select(svgRef.current);
      
      const g = svg
        .append('g')
        .attr('transform', `translate(${(width * 1.5) / 2}, ${height / 2})`);

      g.selectAll('text')
        .data(words)
        .enter().append('text')
        .style('font-size', (d: WordData) => `${d.size}px`)
        .style('font-family', 'Roboto')
        .style('font-weight', '300')
        .style('fill', (d: WordData, i: number) => colors[i % colors.length])
        .style('cursor', 'pointer')
        .attr('text-anchor', 'middle')
        .attr('transform', (d: WordData) => `translate(${d.x || 0}, ${d.y || 0})`)
        .text((d: WordData) => d.text)
        .on('mouseover', function(this: SVGTextElement) {
          d3.select(this).style('opacity', 0.8);
        })
        .on('mouseout', function(this: SVGTextElement) {
          d3.select(this).style('opacity', 1);
        })
        .append('title')
        .text((d: WordData) => `${d.text}: ${d.value} occurrences`);
    }
  }, [words, width, height]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg 
        ref={svgRef} 
        width={width} 
        height={height}
        style={{ fontFamily: 'Roboto, sans-serif' }}
      />
    </div>
  );
}