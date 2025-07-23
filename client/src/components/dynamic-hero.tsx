import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DynamicHeroProps {
  title: string;
  subtitle: string;
}

export default function DynamicHero({ title, subtitle }: DynamicHeroProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!titleRef.current || !subtitleRef.current) return;

    // Clear previous content
    d3.select(titleRef.current).selectAll('*').remove();
    d3.select(subtitleRef.current).selectAll('*').remove();

    // Random color palette
    const colors = ['#1e40af', '#7c3aed', '#dc2626', '#059669', '#ea580c', '#0891b2'];
    
    // Random animation type
    const animations = ['scatter', 'wave', 'spiral', 'bounce'];
    const selectedAnimation = animations[Math.floor(Math.random() * animations.length)];

    // Title animation
    const titleWords = title.split(' ');
    const titleContainer = d3.select(titleRef.current);
    
    titleWords.forEach((word, i) => {
      const wordSpan = titleContainer
        .append('span')
        .style('display', 'inline-block')
        .style('margin-right', '0.5rem')
        .style('color', colors[Math.floor(Math.random() * colors.length)])
        .style('font-weight', '300')
        .style('font-size', 'clamp(2.5rem, 8vw, 4rem)')
        .style('opacity', 0)
        .text(word);

      // Apply random animation
      switch (selectedAnimation) {
        case 'scatter':
          wordSpan
            .style('transform', `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(${Math.random() * 20 - 10}deg)`)
            .transition()
            .duration(800)
            .delay(i * 150)
            .style('opacity', 1)
            .style('transform', 'translate(0px, 0px) rotate(0deg)');
          break;
        case 'wave':
          wordSpan
            .style('transform', `translateY(${Math.sin(i) * 30}px)`)
            .transition()
            .duration(600)
            .delay(i * 100)
            .style('opacity', 1)
            .style('transform', 'translateY(0px)');
          break;
        case 'spiral':
          const angle = i * 45;
          const radius = 30;
          wordSpan
            .style('transform', `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) scale(0.5)`)
            .transition()
            .duration(700)
            .delay(i * 120)
            .style('opacity', 1)
            .style('transform', 'translate(0px, 0px) scale(1)');
          break;
        case 'bounce':
          wordSpan
            .style('transform', 'scale(0) translateY(-50px)')
            .transition()
            .duration(500)
            .delay(i * 80)
            .style('opacity', 1)
            .style('transform', 'scale(1) translateY(0px)')
            .transition()
            .duration(200)
            .style('transform', 'scale(1.1) translateY(-5px)')
            .transition()
            .duration(200)
            .style('transform', 'scale(1) translateY(0px)');
          break;
      }
    });

    // Subtitle animation with staggered character reveal
    const subtitleChars = subtitle.split('');
    const subtitleContainer = d3.select(subtitleRef.current);
    
    subtitleChars.forEach((char, i) => {
      const charSpan = subtitleContainer
        .append('span')
        .style('color', colors[Math.floor(Math.random() * colors.length)])
        .style('font-weight', '300')
        .style('font-size', 'clamp(1.25rem, 4vw, 2rem)')
        .style('opacity', 0)
        .text(char === ' ' ? '\u00A0' : char);

      charSpan
        .transition()
        .duration(50)
        .delay(1000 + i * 30)
        .style('opacity', 1);
    });

    // Accent line animation
    const accentLine = titleContainer
      .append('div')
      .style('width', '0px')
      .style('height', '1px')
      .style('background', `linear-gradient(90deg, ${colors[0]}, transparent)`)
      .style('margin-top', '3rem');

    accentLine
      .transition()
      .duration(800)
      .delay(1500)
      .style('width', '6rem');

  }, [title, subtitle]);

  return (
    <section className="py-12 section-divider bg-gradient-to-br from-surface-white via-surface-light to-surface-grey">
      <div className="container-section">
        <div className="max-w-4xl">
          <div ref={titleRef} className="mb-6 leading-tight tracking-tight" />
          <div ref={subtitleRef} className="leading-relaxed" />
        </div>
      </div>
    </section>
  );
}