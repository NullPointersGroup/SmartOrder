import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../../src/auth/Register';
import { vi } from 'vitest';
vi.mock('../../src/auth/AuthAPI', () => ({
  register: vi.fn(),
}));

describe('Register', () => {
  it('chiama onRegister se registrazione ok', async () => {
    const onRegister = vi.fn();
    render(<Register onRegister={onRegister} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario123' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'mario@example.com' } });
    const [pwd, confirm] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwd, { target: { value: 'Password1!' } });
    fireEvent.change(confirm, { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));
    await waitFor(() => expect(onRegister).toHaveBeenCalled());
  });
});