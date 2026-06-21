import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';

export default function LineChart({ data = [], labels = [], color = '#6c63ff', height = 160, width = 300 }) {
  if (!data || data.length < 2) {
    return (
      <View style={[styles.empty, { height, width }]}>
        <Text style={styles.emptyText}>Sem dados suficientes</Text>
      </View>
    );
  }

  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 32;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const getX = (i) => paddingLeft + (i / (data.length - 1)) * chartW;
  const getY = (v) => paddingTop + chartH - ((v - minVal) / range) * chartH;

  // Build SVG path
  const points = data.map((v, i) => `${getX(i)},${getY(v)}`);
  const linePath = `M ${points.join(' L ')}`;

  // Fill path (closed)
  const fillPath = `M ${getX(0)},${getY(minVal)} L ${points.join(' L ')} L ${getX(data.length - 1)},${getY(minVal)} Z`;

  const gradId = `grad_${color.replace('#', '')}`;

  // Y-axis ticks
  const yTicks = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Y-axis ticks */}
      {yTicks.map((tick, i) => {
        const y = getY(tick);
        const label = tick >= 0 ? `+${tick.toFixed(0)}` : tick.toFixed(0);
        return (
          <React.Fragment key={i}>
            <Line
              x1={paddingLeft}
              y1={y}
              x2={paddingLeft + chartW}
              y2={y}
              stroke="rgba(128,128,128,0.2)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <SvgText
              x={paddingLeft - 4}
              y={y + 4}
              textAnchor="end"
              fontSize="9"
              fill="rgba(128,128,128,0.8)"
            >
              {label}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Fill */}
      <Path d={fillPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <Path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {data.map((v, i) => (
        <Circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill={color} />
      ))}

      {/* X-axis labels */}
      {labels.map((label, i) => {
        if (i % Math.ceil(labels.length / 5) !== 0 && i !== labels.length - 1) return null;
        return (
          <SvgText
            key={i}
            x={getX(i)}
            y={height - 6}
            textAnchor="middle"
            fontSize="9"
            fill="rgba(128,128,128,0.8)"
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
