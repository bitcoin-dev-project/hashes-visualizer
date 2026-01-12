import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SHA-256 header', () => {
  render(<App />);
  const headerElement = screen.getByText(/SHA-256/i);
  expect(headerElement).toBeInTheDocument();
});
