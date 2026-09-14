import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

test('home links to the SHA-256 and ChaCha20 visualizers', () => {
  render(
    <HelmetProvider>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </HelmetProvider>
  );
  expect(screen.getByRole('heading', { name: 'SHA-256' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'ChaCha20' })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /ChaCha20/ })).toHaveLength(2);
});
