import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusDisplay } from 'emprestimo';

interface StatusBadgeProps {
  status: StatusDisplay;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<StatusDisplay, { bg: string; color: string }> = {
  'Em aberto': { bg: '#EDE9FE', color: '#7C3AED' },
  'Vencendo':  { bg: '#FEF3C7', color: '#D97706' },
  'Em atraso': { bg: '#FEE2E2', color: '#DC2626' },
  'Pago':      { bg: '#D1FAE5', color: '#059669' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { bg, color } = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.label, { color }, size === 'sm' && styles.labelSm]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 11,
  },
});