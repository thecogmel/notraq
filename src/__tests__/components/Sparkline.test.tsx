import React from 'react';
import { render } from '@testing-library/react-native';

import { Sparkline } from '@/components/Sparkline';

describe('Sparkline', () => {
  it('renders without crashing with valid data', () => {
    const { toJSON } = render(<Sparkline prices={[10, 12, 11, 14, 13]} direction="up" />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders empty view when less than 2 prices', () => {
    const { toJSON } = render(<Sparkline prices={[10]} direction="stable" />);
    const tree = toJSON();
    // Should render just a View placeholder
    expect(tree).not.toBeNull();
  });

  it('renders empty view when no prices', () => {
    const { toJSON } = render(<Sparkline prices={[]} />);
    expect(toJSON()).not.toBeNull();
  });
});
