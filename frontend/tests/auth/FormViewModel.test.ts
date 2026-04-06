import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormViewModel } from '../../src/auth/FormViewModel';
import type { FormModel, SubmitResult } from '../../src/auth/FormModel';

function makeModel(overrides?: {
  validateResult?: Record<string, string>;
  submitResult?:  SubmitResult;
}): FormModel {
  return {
    fields: [
      { key: 'username', label: 'Username', type: 'text'     },
      { key: 'password', label: 'Password', type: 'password' },
    ],
    validate:      vi.fn().mockReturnValue(overrides?.validateResult ?? {}),
    validateField: vi.fn().mockReturnValue(''),
    submit:        vi.fn().mockResolvedValue(
      overrides?.submitResult ?? { ok: true, errors: [], token: 'tok' }
    ),
  } as unknown as FormModel;
}

const fakeEvent = () => ({ preventDefault: vi.fn() } as unknown as React.SyntheticEvent);

describe('useFormViewModel – stato iniziale', () => {
  //TU-F_46
  it('values vuoti, fieldErrors vuoto, errors vuoto, loading false', () => {
    const { result } = renderHook(() => useFormViewModel(makeModel(), vi.fn()));
    expect(result.current.values).toEqual({ username: '', password: '' });
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.errors).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });
});

describe('useFormViewModel – handleChange', () => {
  //TU-F_47
  it('aggiorna il valore e azzera il fieldError del campo', () => {
    const model = makeModel();
    vi.mocked(model.validateField).mockReturnValueOnce('Errore');
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    act(() => { result.current.handleBlur('username'); });
    expect(result.current.fieldErrors.username).toBe('Errore');

    act(() => { result.current.handleChange('username', 'mario'); });
    expect(result.current.values.username).toBe('mario');
    expect(result.current.fieldErrors.username).toBe('');
  });

  //TU-F_48
  it('non altera gli altri campi', () => {
    const { result } = renderHook(() => useFormViewModel(makeModel(), vi.fn()));
    act(() => { result.current.handleChange('username', 'mario'); });
    expect(result.current.values.password).toBe('');
  });
});

describe('useFormViewModel – handleBlur', () => {
  //TU-F_49
  it('chiama validateField e imposta fieldErrors', () => {
    const model = makeModel();
    vi.mocked(model.validateField).mockReturnValue('Username troppo corto');
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    act(() => { result.current.handleBlur('username'); });

    expect(model.validateField).toHaveBeenCalledWith('username', '', expect.any(Object));
    expect(result.current.fieldErrors.username).toBe('Username troppo corto');
  });
});

describe('useFormViewModel – handleSubmit', () => {
  beforeEach(() => vi.clearAllMocks());

  //TU-F_50
  it('errori di validazione: NON chiama submit', async () => {
    const model = makeModel({ validateResult: { username: 'Obbligatorio' } });
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(model.submit).not.toHaveBeenCalled();
    expect(result.current.fieldErrors.username).toBe('Obbligatorio');
    expect(result.current.loading).toBe(false);
  });

  //TU-F_51
  it('res.ok=true: chiama onSuccess con token, loading torna false', async () => {
    const model     = makeModel({ submitResult: { ok: true, errors: [], token: 'jwt-tok' } });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useFormViewModel(model, onSuccess));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(onSuccess).toHaveBeenCalledWith('jwt-tok');
    expect(result.current.loading).toBe(false);
  });

  //TU-F_52
  it('res.ok=true senza token: chiama onSuccess con undefined', async () => {
    const model     = makeModel({ submitResult: { ok: true, errors: [] } });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useFormViewModel(model, onSuccess));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(onSuccess).toHaveBeenCalledWith(undefined);
  });

  //TU-F_53
  it('res.ok=false: imposta errors, NON chiama onSuccess, loading false', async () => {
    const model     = makeModel({ submitResult: { ok: false, errors: ['Username o password errati'] } });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useFormViewModel(model, onSuccess));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(result.current.errors).toContain('Username o password errati');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  //TU-F_54
  it('submit lancia eccezione: imposta Errore di connessione, loading false', async () => {
    const model     = makeModel();
    const onSuccess = vi.fn();
    vi.mocked(model.submit).mockRejectedValue(new Error('Network failure'));
    const { result } = renderHook(() => useFormViewModel(model, onSuccess));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(result.current.errors).toContain('Errore di connessione');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});