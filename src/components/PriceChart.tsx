import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Text } from '@/components/ui/text';

interface DataPoint {
  value: number;
  date: Date;
}

interface Props {
  data: DataPoint[];
}

export function PriceChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <View className="items-center rounded-lg bg-muted p-4">
        <Text className="text-sm text-muted-foreground">
          Dados insuficientes para gráfico (mín. 2 registros)
        </Text>
      </View>
    );
  }

  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  const labelInterval = Math.ceil(sorted.length / 4);

  const chartData = sorted.map((point, idx) => ({
    value: point.value,
    label: idx % labelInterval === 0 ? format(point.date, 'dd/MM', { locale: ptBR }) : '',
    dataPointText: `R$${point.value.toFixed(2).replace('.', ',')}`,
  }));

  const values = sorted.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || 1;

  return (
    <View className="gap-2">
      <Text className="text-base font-bold text-foreground">Evolução de Preço</Text>
      <View className="rounded-lg bg-card p-3">
        <LineChart
          data={chartData}
          width={260}
          height={160}
          spacing={Math.max(40, 260 / chartData.length)}
          color="#3b82f6"
          dataPointsColor="#3b82f6"
          thickness={2}
          startFillColor="rgba(59,130,246,0.15)"
          endFillColor="rgba(59,130,246,0.01)"
          areaChart
          curved
          yAxisOffset={Math.floor(minValue - padding)}
          xAxisLabelTextStyle={{ fontSize: 9, color: '#888' }}
          yAxisTextStyle={{ fontSize: 9, color: '#888' }}
          hideDataPoints={chartData.length > 10}
          showVerticalLines
          verticalLinesColor="rgba(0,0,0,0.05)"
          noOfSections={4}
        />
      </View>
    </View>
  );
}
