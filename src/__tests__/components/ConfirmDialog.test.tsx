import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders title and message when visible', () => {
    render(
      <ConfirmDialog
        visible
        title="Excluir?"
        message="Essa ação não pode ser desfeita."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText('Excluir?')).toBeTruthy();
    expect(screen.getByText('Essa ação não pode ser desfeita.')).toBeTruthy();
  });

  it('calls onConfirm when confirm button is pressed', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog
        visible
        title="Test"
        message="Message"
        confirmLabel="Sim"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );
    fireEvent.press(screen.getByText('Sim'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is pressed', () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        visible
        title="Test"
        message="Message"
        cancelLabel="Não"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.press(screen.getByText('Não'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses default labels', () => {
    render(
      <ConfirmDialog visible title="T" message="M" onConfirm={jest.fn()} onCancel={jest.fn()} />
    );
    expect(screen.getByText('Confirmar')).toBeTruthy();
    expect(screen.getByText('Cancelar')).toBeTruthy();
  });
});
