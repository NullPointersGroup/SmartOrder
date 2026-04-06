import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Form from '../../src/auth/FormView';
import type { FieldConfig } from '../../src/auth/FormModel';
import type { FormViewModel } from '../../src/auth/FormViewModel';

function makeVM(overrides: Partial<FormViewModel> = {}): FormViewModel {
  return {
    values:       { username: '', password: '' },
    fieldErrors:  {},
    errors:       [],
    loading:      false,
    handleChange: vi.fn(),
    handleBlur:   vi.fn(),
    handleSubmit: vi.fn(),
    ...overrides,
  };
}

const BASE_FIELDS: FieldConfig[] = [
  { key: 'username', label: 'Username', type: 'text' },
  { key: 'password', label: 'Password', type: 'password' },
];

const PASSWORD_FIELDS: FieldConfig[] = [
  { key: 'password', label: 'Password', type: 'password' },
];

describe('FormView – rendering e interazioni', () => {
  it('mostra titolo, label campi e pulsante submit', () => {
    render(<Form title="Accedi" submitLabel="Invia" fields={BASE_FIELDS} vm={makeVM()} />);
    expect(screen.getByRole('heading', { name: /accedi/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invia/i })).toBeInTheDocument();
  });

  it('loading=true: pulsante disabilitato con testo Caricamento', () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM({ loading: true })} />);
    expect(screen.getByRole('button', { name: /caricamento/i })).toBeDisabled();
  });

  it('fieldErrors truthy: mostra errore inline', () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM({ fieldErrors: { username: 'Errore' } })} />);
    expect(screen.getByText('Errore')).toBeInTheDocument();
  });

  it('fieldErrors falsy: nessun paragrafo errore', () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM()} />);
    expect(document.querySelectorAll('p.text-sm')).toHaveLength(0);
  });

  it('handleChange chiamato al change', () => {
    const vm = makeVM();
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={vm} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    expect(vm.handleChange).toHaveBeenCalledWith('username', 'mario');
  });

  it('handleBlur chiamato al blur', () => {
    const vm = makeVM();
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={vm} />);
    fireEvent.blur(screen.getByLabelText(/username/i));
    expect(vm.handleBlur).toHaveBeenCalledWith('username');
  });

  it('handleSubmit chiamato al click submit', () => {
    const vm = makeVM();
    render(<Form title="T" submitLabel="Invia" fields={BASE_FIELDS} vm={vm} />);
    fireEvent.click(screen.getByRole('button', { name: /invia/i }));
    expect(vm.handleSubmit).toHaveBeenCalled();
  });

  it('toggle password: click cambia tipo da password a text e viceversa', () => {
    render(<Form title="T" submitLabel="S" fields={PASSWORD_FIELDS} vm={makeVM({ values: { password: '' } })} />);
    const passwordInput = screen.getAllByLabelText(/password/i)[0];
    const toggle = screen.getByRole('button', { name: /mostra password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggle);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('passa placeholder e autoComplete agli input', () => {
    const fieldsWithAttrs: FieldConfig[] = [
      { key: 'username', label: 'Username', type: 'text', placeholder: 'Inserisci username', autoComplete: 'username' },
    ];
    render(<Form title="T" submitLabel="S" fields={fieldsWithAttrs} vm={makeVM()} />);
    const input = screen.getByLabelText(/username/i);
    expect(input).toHaveAttribute('placeholder', 'Inserisci username');
    expect(input).toHaveAttribute('autocomplete', 'username');
  });

  it('cambia borderColor al focus e blurCapture', () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM()} />);
    const input = screen.getByLabelText(/username/i);

    fireEvent.focus(input);
    expect(input.style.borderColor).toBe('var(--color-3)');

    fireEvent.blur(input); // blur normale non cambia colore, blurCapture sì
    fireEvent.blur(input); // trigger onBlurCapture
    expect(input.style.borderColor).toBe('var(--border)');
  });

  it('cambia colore del toggle password al mouse enter/leave', () => {
    render(<Form title="T" submitLabel="S" fields={PASSWORD_FIELDS} vm={makeVM()} />);
    const toggle = screen.getByRole('button', { name: /mostra password/i });

    fireEvent.mouseEnter(toggle);
    expect(toggle.style.color).toBe('var(--text-2)');

    fireEvent.mouseLeave(toggle);
    expect(toggle.style.color).toBe('var(--text-4)');
  });

  it('cambia colore e border del submit al mouse enter/leave', () => {
    render(<Form title="T" submitLabel="Invia" fields={BASE_FIELDS} vm={makeVM()} />);
    const btn = screen.getByRole('button', { name: /invia/i });

    fireEvent.mouseEnter(btn);
    expect(btn.style.backgroundColor).toBe('var(--color-1)');
    expect(btn.style.color).toBe('var(--text-1)');
    expect(btn.style.borderColor).toBe('var(--color-3)');

    fireEvent.mouseLeave(btn);
    expect(btn.style.backgroundColor).toBe('var(--color-3)');
    expect(btn.style.color).toBe('var(--bg-3)');
    expect(btn.style.borderColor).toBe('transparent');
  });

});
