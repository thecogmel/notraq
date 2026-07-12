import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { PriceChangeAlert } from '@/components/PriceChangeAlert';

describe('PriceChangeAlert', () => {
  it('renders up indicator with percentage', () => {
    render(<PriceChangeAlert changePercent={12.5} direction="up" />);
    expect(screen.getByText(/12\.5%/)).toBeTruthy();
    expect(screen.getByText(/↑/)).toBeTruthy();
  });

  it('renders down indicator with percentage', () => {
    render(<PriceChangeAlert changePercent={-8.3} direction="down" />);
    expect(screen.getByText(/8\.3%/)).toBeTruthy();
    expect(screen.getByText(/↓/)).toBeTruthy();
  });

  it('returns null for stable', () => {
    const { toJSON } = render(<PriceChangeAlert changePercent={0} direction="stable" />);
    expect(toJSON()).toBeNull();
  });
});
