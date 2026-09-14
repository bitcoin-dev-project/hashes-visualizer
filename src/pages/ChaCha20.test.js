import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import ChaCha20Page from './ChaCha20';

function setup() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <ChaCha20Page />
      </MemoryRouter>
    </HelmetProvider>
  );
}

test('walks from state to ciphertext and back, and recovers a Unicode message', () => {
  setup();
  expect(screen.getByRole('heading', { name: 'Start with sixteen words.' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Start mixing' }));
  expect(screen.getByRole('heading', { name: 'Column round 1 of 20' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /01 a = a \+ b ADD/ }));
  expect(screen.getByText('After operation 1 / 12')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Round 2, diagonal' }));
  expect(screen.getByRole('heading', { name: 'Diagonal round 2 of 20' })).toBeVisible();
  fireEvent.change(screen.getByLabelText(/Message/), { target: { value: '你好 🔐 café' } });
  expect(screen.getByRole('heading', { name: 'Start with sixteen words.' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Skip to ciphertext' }));
  expect(screen.getByTestId('chacha-output').textContent).toMatch(/^[0-9a-f]+$/);
  fireEvent.click(screen.getByRole('button', { name: 'Decrypt', exact: true }));
  expect(screen.getByTestId('chacha-output')).toHaveTextContent('你好 🔐 café');
  fireEvent.click(screen.getByRole('button', { name: 'Previous step' }));
  expect(screen.getByRole('heading', { name: 'Your 64-byte keystream block.' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Reset walkthrough' }));
  expect(screen.getByRole('heading', { name: 'Start with sixteen words.' })).toBeVisible();
});

test('switches blocks and rejects invalid inputs without showing stale output', () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: /RFC example/ }));
  expect(within(screen.getByLabelText('Keystream block')).getAllByRole('option')).toHaveLength(2);
  fireEvent.change(screen.getByLabelText('Keystream block'), { target: { value: '1' } });
  expect(screen.getByRole('button', { name: 'Word 12, counter, 00000002' })).toBeVisible();
  fireEvent.change(screen.getByLabelText('Starting counter'), { target: { value: '4294967295' } });
  expect(screen.getByRole('alert')).toHaveTextContent('overflow');
  expect(screen.getByRole('button', { name: 'Play walkthrough' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Nonce'), { target: { value: 'xyz' } });
  expect(screen.getByRole('alert')).toHaveTextContent('24 hex digits');
  expect(screen.queryByTestId('chacha-output')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Simple example' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/Message/), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Skip to ciphertext' }));
  expect(screen.getByTestId('chacha-output')).toHaveTextContent('(empty)');
});

test('authenticated receiver rejects tampering and accepts restoration', () => {
  setup();
  fireEvent.click(screen.getByText('And what about Poly1305?'));
  expect(screen.getByText('Verified')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /Flip one ciphertext bit/ }));
  expect(screen.getByText('Pay Bob $90')).toBeVisible();
  expect(screen.getByText('Rejected')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Restore original message' }));
  expect(screen.getByText('Verified')).toBeVisible();
});

test('playback stops at the end, pauses, and resets on edits', () => {
  jest.useFakeTimers();
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Play walkthrough' }));
  act(() => {
    jest.advanceTimersByTime(900);
  });
  expect(screen.getByRole('heading', { name: 'Column round 1 of 20' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Pause walkthrough' }));
  act(() => {
    jest.advanceTimersByTime(900);
  });
  expect(screen.getByText('1 / 83')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /01 Build state/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Word 7, key 3, 0f0e0d0c' }));
  fireEvent.click(screen.getByRole('button', { name: /03 Add original/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Play walkthrough' }));
  act(() => {
    jest.advanceTimersByTime(900);
  });
  expect(screen.getByRole('button', { name: /^Byte 28:/ })).toHaveAttribute('aria-pressed', 'true');
  act(() => {
    jest.advanceTimersByTime(900);
  });
  expect(screen.getByRole('button', { name: 'Play walkthrough' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Starting counter'), { target: { value: '2' } });
  expect(screen.getByText('0 / 83')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Play walkthrough' })).toBeEnabled();
  jest.useRealTimers();
});
