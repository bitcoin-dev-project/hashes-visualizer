import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import XMSSPage from './XMSS';

function openLesson() {
  return render(<HelmetProvider><MemoryRouter><XMSSPage /></MemoryRouter></HelmetProvider>);
}
function createSignature() {
  fireEvent.click(screen.getByRole('button', { name: 'Sign a message', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: /Create signature/ }));
}

test('signs a message, verifies it, and detects independently changed messages and proof nodes', () => {
  openLesson();
  createSignature();
  expect(screen.getByRole('status')).toHaveTextContent('Ready to verify');
  fireEvent.click(screen.getByRole('button', { name: /Check root/ }));
  expect(screen.getByRole('status')).toHaveTextContent('Signature verified');
  expect(document.querySelector('.xm-root-comparison')).toHaveClass('is-match');
  fireEvent.click(screen.getByRole('button', { name: /Change message/ }));
  fireEvent.click(screen.getByRole('button', { name: /Check root/ }));
  expect(screen.getByRole('status')).toHaveTextContent('Root mismatch');
  const roots = document.querySelectorAll('.xm-root-comparison code');
  expect(roots[0].textContent).not.toBe(roots[1].textContent);
  fireEvent.click(screen.getByRole('button', { name: /Restore message/ }));
  fireEvent.click(screen.getByRole('button', { name: /Alter a sibling/ }));
  fireEvent.click(screen.getByRole('button', { name: /Check root/ }));
  expect(screen.getByRole('status')).toHaveTextContent('Root mismatch');
  fireEvent.click(screen.getByRole('button', { name: /Restore proof/ }));
  fireEvent.click(screen.getByRole('button', { name: /Check root/ }));
  expect(screen.getByRole('status')).toHaveTextContent('Signature verified');
});

test('a spent key cannot sign again and a new tree changes the public root', () => {
  const { container } = openLesson();
  const root = container.querySelector('.xm-public-key code').textContent;
  createSignature();
  expect(screen.getByLabelText('7 of 8 one-time keys available')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /02 Sign a message/ }));
  expect(screen.queryByRole('button', { name: /Create signature/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Choose a fresh key/ })).toBeInTheDocument();
  expect(container.querySelector('.xm-public-key code')).toHaveTextContent(root);
  fireEvent.click(screen.getByRole('button', { name: /New tree & fresh keys/ }));
  expect(container.querySelector('.xm-public-key code').textContent).not.toBe(root);
  expect(screen.getByLabelText('8 of 8 one-time keys available')).toBeInTheDocument();
});

test('supports keyboard leaf selection and regenerates on height changes', () => {
  openLesson();
  fireEvent.keyDown(screen.getByRole('button', { name: 'One-time key 1, available' }), { key: 'Enter' });
  expect(screen.getByRole('button', { name: 'One-time key 1, available' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: /4 16 keys/ }));
  expect(screen.getByLabelText('16 of 16 one-time keys available')).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /XMSS tree with 16/ })).toBeInTheDocument();
});
