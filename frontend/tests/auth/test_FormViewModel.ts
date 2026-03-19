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
  it('tutti i valori sono stringhe vuote', () => {
    const { result } = renderHook(() => useFormViewModel(makeModel(), vi.fn()));
    expect(result.current.values).toEqual({ username: '', password: '' });
  });

  it('fieldErrors è oggetto vuoto', () => {
    const { result } = renderHook(() => useFormViewModel(makeModel(), vi.fn()));
    expect(result.current.fieldErrors).toEqual({});
  });

  it('errors è array vuoto', () => {
    const { result } = renderHook(() => useFormViewModel(makeModel(), vi.fn()));
    expect(result.current.errors).toHaveLength(0);
  });

  it('loading è false', () => {
    const { result } = renderHook(() => useFormViewModel(makeModel(), vi.fn()));
    expect(result.current.loading).toBe(false);
  });
});


describe('useFormViewModel – handleChange', () => {
  it('aggiorna il valore del campo corretto', () => {
    const { result } = renderHook(() => useFormViewModel(makeModel(), vi.fn()));
    act(() => { result.current.handleChange('username', 'mario'); });
    expect(result.current.values.username).toBe('mario');
  });

  it('non altera gli altri campi', () => {
    const { result } = renderHook(() => useFormViewModel(makeModel(), vi.fn()));
    act(() => { result.current.handleChange('username', 'mario'); });
    expect(result.current.values.password).toBe('');
  });

  it('azzera il fieldError del campo modificato', () => {
    const model = makeModel();
    vi.mocked(model.validateField).mockReturnValueOnce('Errore username');
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    act(() => { result.current.handleBlur('username'); });
    act(() => { result.current.handleChange('username', 'mario'); });

    expect(result.current.fieldErrors.username).toBe('');
  });

  it('non azzera gli errori degli altri campi', () => {
    const model = makeModel();
    vi.mocked(model.validateField).mockReturnValueOnce('Errore password');
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    act(() => { result.current.handleBlur('password'); });
    act(() => { result.current.handleChange('username', 'mario'); });

    expect(result.current.fieldErrors.password).toBe('Errore password');
  });
});


describe('useFormViewModel – handleBlur', () => {
  it('chiama model.validateField con il campo e il valore corrente', () => {
    const model = makeModel();
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    act(() => { result.current.handleChange('username', 'mario'); });
    act(() => { result.current.handleBlur('username'); });

    expect(model.validateField).toHaveBeenCalledWith('username', 'mario');
  });

  it('imposta fieldErrors[key] con il valore restituito da validateField', () => {
    const model = makeModel();
    vi.mocked(model.validateField).mockReturnValue('Username troppo corto');
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    act(() => { result.current.handleBlur('username'); });

    expect(result.current.fieldErrors.username).toBe('Username troppo corto');
  });

  it('lascia fieldErrors[key] vuoto se validateField restituisce stringa vuota', () => {
    const model = makeModel();
    vi.mocked(model.validateField).mockReturnValue('');
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    act(() => { result.current.handleBlur('username'); });

    expect(result.current.fieldErrors.username).toBe('');
  });
});


describe('useFormViewModel – handleSubmit, validazione client', () => {
  beforeEach(() => vi.clearAllMocks());

  it('se ci sono errori di validazione NON chiama model.submit', async () => {
    const model = makeModel({ validateResult: { username: 'Obbligatorio' } });
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(model.submit).not.toHaveBeenCalled();
  });

  it('imposta i fieldErrors ricevuti dalla validazione client', async () => {
    const model = makeModel({ validateResult: { password: 'Password non valida' } });
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(result.current.fieldErrors.password).toBe('Password non valida');
  });

  it('chiama preventDefault sull\'evento', async () => {
    const model = makeModel();
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));
    const event = fakeEvent();

    await act(async () => { await result.current.handleSubmit(event); });

    expect(event.preventDefault).toHaveBeenCalled();
  });
});


describe('useFormViewModel – handleSubmit, submit con successo', () => {
  it('chiama onSuccess con il token restituito dal server', async () => {
    const model     = makeModel({ submitResult: { ok: true, errors: [], token: 'jwt-tok' } });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useFormViewModel(model, onSuccess));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(onSuccess).toHaveBeenCalledWith('jwt-tok');
  });

  it('loading torna false al termine del submit', async () => {
    const { result } = renderHook(() => useFormViewModel(makeModel(), vi.fn()));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(result.current.loading).toBe(false);
  });

  it('errors viene svuotato prima del submit successivo', async () => {
    const model = makeModel({ submitResult: { ok: false, errors: ['Vecchio errore'] } });
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    // Secondo submit con successo: errors deve azzerarsi
    vi.mocked(model.submit).mockResolvedValue({ ok: true, errors: [], token: 'tok' });
    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(result.current.errors).toHaveLength(0);
  });
});


describe('useFormViewModel – handleSubmit, errore dal server', () => {
  it('imposta errors con la lista proveniente dal server (RF-OB_28)', async () => {
    const model = makeModel({ submitResult: { ok: false, errors: ['Username o password errati'] } });
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(result.current.errors).toContain('Username o password errati');
  });

  it('NON chiama onSuccess in caso di errore server', async () => {
    const model     = makeModel({ submitResult: { ok: false, errors: ['Errore'] } });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useFormViewModel(model, onSuccess));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('loading torna false anche in caso di errore server', async () => {
    const model = makeModel({ submitResult: { ok: false, errors: ['Errore'] } });
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(result.current.loading).toBe(false);
  });
});


describe('useFormViewModel – handleSubmit, eccezione di rete', () => {
  it('imposta errors con "Errore di connessione" se submit lancia eccezione', async () => {
    const model = makeModel();
    vi.mocked(model.submit).mockRejectedValue(new Error('Network failure'));
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(result.current.errors).toContain('Errore di connessione');
  });

  it('loading torna false anche dopo eccezione', async () => {
    const model = makeModel();
    vi.mocked(model.submit).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useFormViewModel(model, vi.fn()));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(result.current.loading).toBe(false);
  });

  it('NON chiama onSuccess se submit lancia eccezione', async () => {
    const model     = makeModel();
    const onSuccess = vi.fn();
    vi.mocked(model.submit).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useFormViewModel(model, onSuccess));

    await act(async () => { await result.current.handleSubmit(fakeEvent()); });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
