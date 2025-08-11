'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3 } from 'lucide-react';

interface DistBarProps {
  distribution: Record<number, number>;
  title: string;
  color?: string;
  height?: number;
  showTable?: boolean;
}

const SCORE_LABELS = {
  1: 'Not Done',
  2: 'Partial',
  3: 'As Required',
  4: 'Exceeded',
  5: 'Company Benchmark'
};

const SCORE_COLORS = {
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#eab308', // yellow
  4: '#3b82f6', // blue
  5: '#10b981', // green
};

export default function DistBar({ 
  distribution, 
  title, 
  color = '#3b82f6', 
  height = 300,
  showTable = false 
}: DistBarProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Convert distribution to chart data
  const chartData = Object.entries(distribution).map(([score, count]) => ({
    score: parseInt(score),
    label: `${score} - ${SCORE_LABELS[parseInt(score) as keyof typeof SCORE_LABELS]}`,
    count,
    color: SCORE_COLORS[parseInt(score) as keyof typeof SCORE_COLORS]
  }));

  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  // Calculate percentages
  const chartDataWithPercentages = chartData.map(item => ({
    ...item,
    percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{data.label}</p>
          <p className="text-blue-600">
            {`Count: ${data.count}`}
          </p>
          <p className="text-gray-600">
            {`Percentage: ${data.percentage}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { payload, ...rest } = props;
    return <Bar {...rest} fill={payload.color} />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          
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
          <div style={{ height }} role="img" aria-label={`${title} distribution chart`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataWithPercentages}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="score" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `Score ${value}`}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]}
                  shape={<CustomBar />}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Score</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartDataWithPercentages.map((item) => (
                  <TableRow key={item.score}>
                    <TableCell className="font-medium">{item.score}</TableCell>
                    <TableCell>{SCORE_LABELS[item.score as keyof typeof SCORE_LABELS]}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">{item.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm font-medium">
                <span>Total:</span>
                <span>{total} tasks</span>
              </div>
            </div>
          </div>
        )}

        {total === 0 && (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <p>No distribution data available for the selected period</p>
          </div>
        )}

        {/* Legend for accessibility */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600 mb-2">Score Scale:</div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            {Object.entries(SCORE_LABELS).map(([score, label]) => (
              <div key={score} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: SCORE_COLORS[parseInt(score) as keyof typeof SCORE_COLORS] }}
                />
                <span>{score}: {label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}