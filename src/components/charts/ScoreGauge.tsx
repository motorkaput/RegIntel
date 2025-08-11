'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreGaugeProps {
  value: number;
  title: string;
  subtitle?: string;
  previousValue?: number;
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
}

export default function ScoreGauge({ 
  value, 
  title, 
  subtitle, 
  previousValue, 
  size = 'md',
  showTrend = true 
}: ScoreGaugeProps) {
  const percentage = (value / 5) * 100;
  const prevPercentage = previousValue ? (previousValue / 5) * 100 : 0;
  
  const getColor = (score: number) => {
    if (score >= 4.5) return '#10b981'; // green
    if (score >= 3.5) return '#3b82f6'; // blue
    if (score >= 2.5) return '#eab308'; // yellow
    if (score >= 1.5) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Average';
    if (score >= 1.5) return 'Below Average';
    return 'Poor';
  };

  const getTrend = () => {
    if (!previousValue || !showTrend) return null;
    
    const change = value - previousValue;
    if (Math.abs(change) < 0.1) {
      return { direction: 'neutral', change: 0, icon: Minus };
    }
    
    return {
      direction: change > 0 ? 'up' : 'down',
      change: Math.abs(change),
      icon: change > 0 ? TrendingUp : TrendingDown
    };
  };

  const trend = getTrend();
  const color = getColor(value);
  const label = getLabel(value);

  // Size configurations
  const sizeConfig = {
    sm: { 
      gauge: 80, 
      stroke: 6, 
      text: 'text-lg', 
      subtitle: 'text-xs',
      container: 'p-3'
    },
    md: { 
      gauge: 120, 
      stroke: 8, 
      text: 'text-2xl', 
      subtitle: 'text-sm',
      container: 'p-4'
    },
    lg: { 
      gauge: 160, 
      stroke: 10, 
      text: 'text-3xl', 
      subtitle: 'text-base',
      container: 'p-6'
    }
  };

  const config = sizeConfig[size];
  const radius = (config.gauge - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-center">{title}</CardTitle>
        {subtitle && (
          <p className={`text-center text-gray-600 ${config.subtitle}`}>
            {subtitle}
          </p>
        )}
      </CardHeader>
      <CardContent className={`text-center ${config.container}`}>
        <div className="relative inline-flex items-center justify-center">
          {/* Background circle */}
          <svg 
            width={config.gauge} 
            height={config.gauge}
            className="transform -rotate-90"
            role="img"
            aria-label={`Score gauge showing ${value} out of 5`}
          >
            <circle
              cx={config.gauge / 2}
              cy={config.gauge / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={config.stroke}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={config.gauge / 2}
              cy={config.gauge / 2}
              r={radius}
              stroke={color}
              strokeWidth={config.stroke}
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-bold ${config.text}`} style={{ color }}>
              {value.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              out of 5
            </div>
          </div>
        </div>

        {/* Label and trend */}
        <div className="mt-4 space-y-2">
          <div className={`font-medium ${config.subtitle}`} style={{ color }}>
            {label}
          </div>
          
          {trend && (
            <div className="flex items-center justify-center space-x-1">
              <trend.icon 
                className={`h-4 w-4 ${
                  trend.direction === 'up' ? 'text-green-600' : 
                  trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                }`} 
              />
              <span className={`text-sm font-medium ${
                trend.direction === 'up' ? 'text-green-600' : 
                trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend.change > 0 ? trend.change.toFixed(1) : 'No change'}
              </span>
            </div>
          )}
        </div>

        {/* Accessibility data table */}
        <div className="sr-only">
          <table>
            <caption>Score details</caption>
            <tbody>
              <tr>
                <td>Current Score:</td>
                <td>{value} out of 5</td>
              </tr>
              <tr>
                <td>Rating:</td>
                <td>{label}</td>
              </tr>
              {previousValue && (
                <tr>
                  <td>Previous Score:</td>
                  <td>{previousValue} out of 5</td>
                </tr>
              )}
              {trend && (
                <tr>
                  <td>Trend:</td>
                  <td>{trend.direction} by {trend.change.toFixed(1)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}