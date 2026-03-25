import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../src/auth/Login';
import { vi } from 'vitest';
vi.mock('../../src/auth/AuthAPI', () => ({
  login: vi.fn(),
}));

describe('Login', () => {
  it('chiama onLogin se login ok', async () => {
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'Pass1!' } });
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));
    await waitFor(() => expect(onLogin).toHaveBeenCalled());
  });
});