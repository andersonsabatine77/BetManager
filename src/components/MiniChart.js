import React from 'react';
import { View } from 'react-native';

export default function MiniChart({ data, color = '#7c3aed', height = 80, showArea = true }) {
  if (!data || data.length < 2) return <View style={{ height }} />;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) || 1;

  const W = 300;
  const H = height;
  const pad = 4;

  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (W - pad * 2),
    y: pad + (1 - (v - min) / range) * (H - pad * 2),
  }));

  const segments = pts.slice(1).map((pt, i) => {
    const prev = pts[i];
    const dx = pt.x - prev.x;
    const dy = pt.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const cx = (prev.x + pt.x) / 2;
    const cy = (prev.y + pt.y) / 2;
    return { cx, cy, len, angle };
  });

  return (
    <View style={{ height: H, width: '100%', position: 'relative' }}>
      {segments.map((seg, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${(seg.cx / W) * 100}%`,
            top: seg.cy - 1.5,
            width: (seg.len / W) * 100 + '%',
            height: 3,
            backgroundColor: color,
            borderRadius: 2,
            transform: [
              { translateX: -(seg.len / 2) },
              { rotate: `${seg.angle}deg` },
              { translateX: seg.len / 2 },
            ],
          }}
        />
      ))}
      {pts.map((pt, i) => (
        <View
          key={`d${i}`}
          style={{
            position: 'absolute',
            left: `${(pt.x / W) * 100}%`,
            top: pt.y - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            marginLeft: -4,
          }}
        />
      ))}
    </View>
  );
}
