import { render, screen, fireEvent } from '@testing-library/react';
import AuthPage from '../../src/auth/AuthPage';
import { vi } from 'vitest';

const mockNavigate = vi.fn();
const mockSetAuth = vi.fn();

vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
vi.mock('../../src/auth/authStore', () => ({ useAuthStore: () => ({ setAuth: mockSetAuth }) }));
vi.mock('../../src/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

describe('AuthPage', () => {
  beforeEach(() => { mockNavigate.mockClear(); mockSetAuth.mockClear(); });

  it('switch tab da login a register e ritorno', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /^registrati$/i })[0]);
    expect(screen.getByText(/crea account/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /^accedi$/i })[0]);
    expect(screen.getByRole('heading', { name: /accedi/i })).toBeInTheDocument();
  });
});