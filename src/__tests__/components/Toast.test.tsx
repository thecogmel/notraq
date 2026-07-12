import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { Toast } from '@/components/Toast';

describe('Toast', () => {
  it('renders title and message when visible', () => {
    render(
      <Toast visible title="Erro" message="Algo deu errado" variant="error" onDismiss={jest.fn()} />
    );
    expect(screen.getByText('Erro')).toBeTruthy();
    expect(screen.getByText('Algo deu errado')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { toJSON } = render(
      <Toast visible={false} title="Hidden" onDismiss={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('calls onDismiss when X is pressed', () => {
    const onDismiss = jest.fn();
    render(<Toast visible title="Test" variant="info" onDismiss={onDismiss} />);
    // The X button is a Pressable — find and press it
    const dismissButton = screen.getByTestId('icon-X');
    fireEvent.press(dismissButton.parent!);
    expect(onDismiss).toHaveBeenCalled();
  });
});
