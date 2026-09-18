import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, test, expect } from 'vitest';
import App from './App';

const getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: '1' } } } });
const listBottles = vi.fn().mockResolvedValue([]);
const getBottle = vi.fn().mockResolvedValue({
  id: 'b1',
  status: 'en_cave',
  acquisitionMode: 'achat',
  acquisitionSource: 'Caviste',
  pricePaid: 10,
  acquisitionDate: '2026-01-01',
  wine: { name: 'Test Wine' },
});
const listTastingRecords = vi.fn().mockResolvedValue([]);

vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock('./repositories/bottleRepository', () => ({
  createSupabaseBottleRepository: () => ({ listBottles, getBottle }),
}));

vi.mock('./repositories/tastingRepository', () => ({
  createSupabaseTastingRepository: () => ({ listTastingRecords }),
}));

test('renders the CaveAVin title when authenticated', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(await screen.findByText(/CaveAVin/i)).toBeInTheDocument();
});

const routeCases: Array<{ path: string; find: () => Promise<HTMLElement> }> = [
  { path: '/login', find: () => screen.findByRole('button', { name: /se connecter/i }) },
  { path: '/', find: () => screen.findByRole('heading', { name: /a boire bientot/i }) },
  { path: '/add-bottle', find: () => screen.findByRole('heading', { name: /ajouter une bouteille/i }) },
  { path: '/cellar', find: () => screen.findByRole('heading', { name: /ma cave/i }) },
  { path: '/bottles/b1', find: () => screen.findByRole('heading', { name: /test wine/i }) },
  { path: '/bottles/b1/taste', find: () => screen.findByRole('heading', { name: /deguster cette bouteille/i }) },
  { path: '/history', find: () => screen.findByRole('heading', { name: /historique des degustations/i }) },
];

test.each(routeCases)('renders a recognizable element for $path', async ({ path, find }) => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
  expect(await find()).toBeInTheDocument();
});

test('redirects to the login form when there is no session', async () => {
  getSession.mockResolvedValueOnce({ data: { session: null } });

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByRole('button', { name: /se connecter/i })).toBeInTheDocument();
});
