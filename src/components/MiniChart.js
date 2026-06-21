import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { formatBRL } from '../utils/formatters';

export default function MiniChart({ data, color = '#7c3aed', height = 100 }) {
  const [width, setWidth] = useState(0);

  if (!data || data.length < 2) return <View style={{ height }} />;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) || 1;

  const padLeft = 4;
  const padRight = 4;
  const padTop = 6;
  const padBottom = 0;

  const W = width > 0 ? width : 300;
  const H = height;

  const pts = values.map((v, i) => ({
    x: padLeft + (i / (values.length - 1)) * (W - padLeft - padRight),
    y: padTop + (1 - (v - min) / range) * (H - padTop - padBottom),
  }));

  const segments = pts.slice(1).map((pt, i) => {
    const prev = pts[i];
    const dx = pt.x - prev.x;
    const dy = pt.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { cx: (prev.x + pt.x) / 2, cy: (prev.y + pt.y) / 2, len, angle };
  });

  // X-axis labels: first and last date
  const labels = data.map(d => d.label || '');
  const firstLabel = labels[0];
  const lastLabel = labels[labels.length - 1];
  const midLabel = labels[Math.floor(labels.length / 2)];

  return (
    <View>
      {/* Y-axis reference values */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
        <Text style={{ fontSize: 10, color: color, opacity: 0.7 }}>{formatBRL(max)}</Text>
        <Text style={{ fontSize: 10, color: '#999', opacity: 0.7 }}>{formatBRL(min)}</Text>
      </View>

      {/* Chart area */}
      <View
        style={{ height: H, width: '100%', overflow: 'hidden' }}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 && (
          <>
            {segments.map((seg, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: seg.cx - seg.len / 2,
                  top: seg.cy - 1.5,
                  width: seg.len,
                  height: 3,
                  backgroundColor: color,
                  borderRadius: 2,
                  transform: [{ rotate: `${seg.angle}deg` }],
                }}
              />
            ))}
            {pts.map((pt, i) => (
              <View
                key={`d${i}`}
                style={{
                  position: 'absolute',
                  left: pt.x - 4,
                  top: pt.y - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: color,
                }}
              />
            ))}
          </>
        )}
      </View>

      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: 9, color: '#999' }}>{firstLabel}</Text>
        {midLabel && midLabel !== firstLabel && midLabel !== lastLabel && (
          <Text style={{ fontSize: 9, color: '#999' }}>{midLabel}</Text>
        )}
        <Text style={{ fontSize: 9, color: '#999' }}>{lastLabel}</Text>
      </View>
    </View>
  );
}
