import { View } from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Stop, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui/text';

interface DataPoint {
  value: number;
  date: Date;
}

interface Props {
  data: DataPoint[];
  color?: string;
}

const W = 345;
const H = 160;
const PX = 12; // horizontal padding
const PT = 14; // top padding
const PB = 26; // bottom padding (for labels)

export function PriceChart({ data, color: colorProp }: Props) {
  if (data.length < 2) {
    return (
      <View className="items-center p-4">
        <Text className="text-sm text-zinc-500">
          Dados insuficientes para gráfico (mín. 2 registros)
        </Text>
      </View>
    );
  }

  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  const values = sorted.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const n = sorted.length;

  // Determine color from trend
  const trend = values[n - 1] > values[0] ? 'up' : values[n - 1] < values[0] ? 'down' : 'stable';
  const lineColor = colorProp ?? (trend === 'up' ? '#f87171' : trend === 'down' ? '#34d399' : '#71717a');

  // Calculate points
  const pts = sorted.map((point, i) => ({
    x: +(PX + i * ((W - 2 * PX) / (n - 1))).toFixed(1),
    y: +(PT + (1 - (point.value - min) / range) * (H - PT - PB)).toFixed(1),
  }));

  // SVG line (polyline points)
  const linePoints = pts.map((p) => `${p.x},${p.y}`).join(' ');

  // SVG area path
  const bottomY = (H - PB).toFixed(1);
  const areaPath = `M ${pts[0].x},${bottomY} ` + pts.map((p) => `L ${p.x},${p.y}`).join(' ') + ` L ${pts[n - 1].x},${bottomY} Z`;

  // X-axis labels (show max 6)
  const labelInterval = Math.max(1, Math.ceil(n / 6));
  const labels = sorted
    .map((point, i) => ({
      x: pts[i].x,
      label: format(point.date, 'dd/MM', { locale: ptBR }),
    }))
    .filter((_, i) => i % labelInterval === 0 || i === n - 1);

  return (
    <View style={{ width: '100%', aspectRatio: W / H }}>
      <Svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
        <Defs>
          <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.30" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Area fill */}
        <Path d={areaPath} fill="url(#chartGrad)" />

        {/* Line */}
        <Polyline
          points={linePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {pts.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="#09090b"
            stroke={lineColor}
            strokeWidth={2}
          />
        ))}

        {/* X-axis labels */}
        {labels.map((l, i) => (
          <SvgText
            key={i}
            x={l.x}
            y={154}
            fill="#52525b"
            fontSize="10.5"
            fontFamily="system-ui"
            textAnchor="middle"
          >
            {l.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
