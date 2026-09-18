import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the CaveAVin title', () => {
  render(<App />);
  expect(screen.getByText(/CaveAVin/i)).toBeInTheDocument();
});
