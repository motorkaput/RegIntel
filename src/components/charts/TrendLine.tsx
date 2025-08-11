'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface TrendPoint {
  week_start: Date;
  avg_score: number;
  count: number;
}

interface TrendLineProps {
  data: TrendPoint[];
  title: string;
  color?: string;
  height?: number;
  showTable?: boolean;
}

export default function TrendLine({ 
  data, 
  title, 
  color = '#3b82f6', 
  height = 300,
  showTable = false 
}: TrendLineProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Format data for recharts
  const chartData = data.map(point => ({
    date: point.week_start.toLocaleDateString(),
    score: Math.round(point.avg_score * 100) / 100,
    count: point.count,
    week: point.week_start.toISOString().split('T')[0]
  }));

  // Calculate trend
  const getTrend = () => {
    if (data.length < 2) return { direction: 'neutral', change: 0 };
    
    const recent = data.slice(-3).reduce((sum, point) => sum + point.avg_score, 0) / Math.min(3, data.length);
    const older = data.slice(0, 3).reduce((sum, point) => sum + point.avg_score, 0) / Math.min(3, data.length);
    const change = recent - older;
    
    return {
      direction: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'neutral',
      change: Math.round(Math.abs(change) * 100) / 100
    };
  };

  const trend = getTrend();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{`Week of ${label}`}</p>
          <p className="text-blue-600">
            {`Score: ${payload[0].value}`}
          </p>
          <p className="text-gray-600">
            {`Tasks: ${payload[0].payload.count}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>{title}</CardTitle>
            {trend.direction !== 'neutral' && (
              <div className="flex items-center space-x-1">
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.change}
                </span>
              </div>
            )}
          </div>
          
          {showTable && (
            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === 'chart' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('chart')}
                data-testid="button-chart-view"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                data-testid="button-table-view"
              >
                Table
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'chart' ? (
          <div style={{ height }} role="img" aria-label={`${title} trend chart`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[1, 5]}
                  tick={{ fontSize: 12 }}
                  tickCount={5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead className="text-right">Average Score</TableHead>
                  <TableHead className="text-right">Task Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((point, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{point.date}</TableCell>
                    <TableCell className="text-right">{point.score}</TableCell>
                    <TableCell className="text-right">{point.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {data.length === 0 && (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <p>No trend data available for the selected period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}