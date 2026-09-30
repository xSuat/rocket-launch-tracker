import { TextStyle } from 'react-native';

export const color = {
  bg: '#000000',
  bgElevated: '#141414',
  bgSheet: '#1A1A1A',
  bgMuted: '#1C1C1C',
  fill: '#FFFFFF',
  fillSoft: '#E8E8E8',
  text: '#FFFFFF',
  textSecondary: '#C8C8C8',
  textTertiary: '#8E8E8E',
  textDisabled: '#5C5C5C',
  textOnFill: '#111111',
  hairline: '#2E2E2E',
  border: '#8E8E8E',
  highlight: 'rgba(255,255,255,0.28)',
  highlightSide: 'rgba(255,255,255,0.16)',
  shade: 'rgba(255,255,255,0.06)',
  scrim: 'rgba(0,0,0,0.72)',
  toastBg: '#F4F4F4',
  toastText: '#111111',
  grabber: '#3A3A3A',
} as const;

export const space = {
  s4: 4,
  s8: 8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s32: 32,
  s48: 48,
} as const;

export const radius = {
  badge: 4,
  control: 10,
  image: 8,
  surface: 16,
  round: 22,
} as const;

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: -0.4 } as TextStyle,
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.2 } as TextStyle,
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' } as TextStyle,
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' } as TextStyle,
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' } as TextStyle,
  calloutStrong: { fontSize: 16, lineHeight: 21, fontWeight: '600' } as TextStyle,
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' } as TextStyle,
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' } as TextStyle,
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.2 } as TextStyle,
  countdown: { fontSize: 40, lineHeight: 44, fontWeight: '600', ...tabular } as TextStyle,
  countdownUnit: { fontSize: 11, lineHeight: 14, fontWeight: '500', letterSpacing: 0.4 } as TextStyle,
  tabLabel: { fontSize: 10, lineHeight: 12, fontWeight: '500' } as TextStyle,
} as const;

export const moonEdge = {
  borderWidth: 1,
  borderTopColor: color.highlight,
  borderRightColor: color.highlightSide,
  borderBottomColor: color.shade,
  borderLeftColor: color.shade,
} as const;

export const theme = { color, space, radius, type, moonEdge };
