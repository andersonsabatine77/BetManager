import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { formatBRL } from '../utils/formatters';

const Y_AXIS_WIDTH = 64;

export default function MiniChart({ data, color = '#7c3aed', height = 110 }) {
  const [width, setWidth] = useState(0);

  if (!data || data.length < 2) return <View style={{ height }} />;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) || 1;
  const mid = (min + max) / 2;

  const padRight = 4;
  const padTop = 6;
  const padBottom = 4;
  const W = width > 0 ? width : 260;
  const H = height;

  const toX = (i) => (i / (values.length - 1)) * (W - padRight);
  const toY = (v) => padTop + (1 - (v - min) / range) * (H - padTop - padBottom);

  const pts = values.map((v, i) => ({ x: toX(i), y: toY(v) }));

  const segments = pts.slice(1).map((pt, i) => {
    const prev = pts[i];
    const dx = pt.x - prev.x;
    const dy = pt.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { cx: (prev.x + pt.x) / 2, cy: (prev.y + pt.y) / 2, len, angle };
  });

  const labels = data.map(d => d.label || '');
  const firstLabel = labels[0];
  const lastLabel = labels[labels.length - 1];
  const midLabelIdx = Math.floor(labels.length / 2);
  const midLabel = labels[midLabelIdx] !== firstLabel && labels[midLabelIdx] !== lastLabel
    ? labels[midLabelIdx] : null;

  const yLabelColor = '#94a3b8';
  const positiveColor = '#22c55e';
  const negativeColor = '#ef4444';
  const maxColor = max >= 0 ? positiveColor : negativeColor;
  const minColor = min >= 0 ? positiveColor : negativeColor;

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {/* Eixo Y — escala de valores */}
        <View style={{ width: Y_AXIS_WIDTH, height: H, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 }}>
          <Text style={{ fontSize: 9, color: maxColor, fontWeight: '700' }}>{formatBRL(max)}</Text>
          <Text style={{ fontSize: 9, color: yLabelColor }}>{formatBRL(mid)}</Text>
          <Text style={{ fontSize: 9, color: minColor, fontWeight: '700' }}>{formatBRL(min)}</Text>
        </View>

        {/* Área do gráfico */}
        <View
          style={{ flex: 1, height: H, overflow: 'hidden' }}
          onLayout={e => setWidth(e.nativeEvent.layout.width)}
        >
          {/* Linhas de grade horizontais */}
          {[0, 0.5, 1].map(frac => (
            <View key={frac} style={{
              position: 'absolute',
              left: 0, right: 0,
              top: padTop + (1 - frac) * (H - padTop - padBottom) - 0.5,
              height: 1,
              backgroundColor: '#ffffff10',
            }} />
          ))}

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
      </View>

      {/* Eixo X — datas */}
      <View style={{ flexDirection: 'row', marginLeft: Y_AXIS_WIDTH, marginTop: 4 }}>
        <Text style={{ fontSize: 9, color: yLabelColor }}>{firstLabel}</Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          {midLabel && <Text style={{ fontSize: 9, color: yLabelColor }}>{midLabel}</Text>}
        </View>
        <Text style={{ fontSize: 9, color: yLabelColor }}>{lastLabel}</Text>
      </View>
    </View>
  );
}
