import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

interface SparklineProps {
  prices: number[];
  direction?: 'up' | 'down' | 'stable';
  width?: number;
  height?: number;
}

export function Sparkline({ prices, direction, width = 56, height = 22 }: SparklineProps) {
  if (prices.length < 2) return <View style={{ width, height }} />;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = prices
    .map((price, i) => {
      const x = padding + (i / (prices.length - 1)) * innerW;
      const y = padding + innerH - ((price - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor =
    direction === 'up' ? '#f87171' : direction === 'down' ? '#34d399' : '#71717a';

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
