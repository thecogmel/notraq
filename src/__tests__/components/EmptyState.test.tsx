import React from 'react';
import { render } from '@testing-library/react-native';

import { EmptyState } from '@/components/EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    const { getByText } = render(<EmptyState title="Nenhum produto" description="Escaneie uma nota" />);
    expect(getByText('Nenhum produto')).toBeTruthy();
    expect(getByText('Escaneie uma nota')).toBeTruthy();
  });

  it('renders default icon', () => {
    const { getByText } = render(<EmptyState title="Test" description="Desc" />);
    expect(getByText('🛒')).toBeTruthy();
  });

  it('renders custom icon', () => {
    const { getByText } = render(<EmptyState icon="📋" title="Test" description="Desc" />);
    expect(getByText('📋')).toBeTruthy();
  });
});
