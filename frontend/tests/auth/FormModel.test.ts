import { describe, it, expect } from 'vitest';
import { FormModel } from '../../src/auth/FormModel';
import { LoginModel } from '../../src/auth/LoginModel';
import { RegisterModel } from '../../src/auth/RegisterModel';

class StubModel extends FormModel {
  readonly fields = [
    { key: 'name',  label: 'Nome',  type: 'text'  as const },
    { key: 'email', label: 'Email', type: 'email' as const },
  ];
  async submit() { return { ok: true, errors: [] }; }
}

describe('FormModel – validate', () => {
  const model = new StubModel();

  it('nessun errore se tutti i campi sono compilati', () => {
    expect(Object.keys(model.validate({ name: 'Mario', email: 'mario@x.com' }))).toHaveLength(0);
  });

  it('errore obbligatorio per stringa vuota', () => {
    expect(model.validate({ name: '', email: 'x@x.it' }).name).toMatch(/obbligatorio/i);
  });

  it('errore obbligatorio per stringa di soli spazi', () => {
    expect(model.validate({ name: '   ', email: 'x@x.it' }).name).toMatch(/obbligatorio/i);
  });

  it('errore se la chiave manca dal record (optional chaining)', () => {
    expect(model.validate({ email: 'x@x.it' } as Record<string, string>).name).toMatch(/obbligatorio/i);
  });
});

describe('FormModel – validateField', () => {
  const model = new StubModel();

  it('restituisce errore per campo vuoto', () => {
    expect(model.validateField('name', '')).toMatch(/obbligatorio/i);
  });

  it('restituisce stringa vuota per campo compilato', () => {
    expect(model.validateField('name', 'Mario')).toBe('');
  });
});

describe('LoginModel', () => {
  const model = new LoginModel();

  it('ha campi username (text) e password (password)', () => {
    expect(model.fields.map(f => f.key)).toEqual(['username', 'password']);
    expect(model.fields.find(f => f.key === 'password')?.type).toBe('password');
  });
});

describe('RegisterModel – struttura', () => {
  const model = new RegisterModel();

  it('ha quattro campi: username, email, password, confirmPwd', () => {
    expect(model.fields.map(f => f.key)).toEqual(['username', 'email', 'password', 'confirmPwd']);
  });
});

describe('RegisterModel – username', () => {
  const model = new RegisterModel();
  const base = { email: 'a@b.com', password: 'Password1!', confirmPwd: 'Password1!' };

  it('valido (4–24 alfanumerico)', () => {
    expect(model.validate({ ...base, username: 'mario123' }).username).toBeUndefined();
  });

  it('troppo corto (< 4)', () => {
    expect(model.validate({ ...base, username: 'ab' }).username).toBeTruthy();
  });

  it('troppo lungo (> 24)', () => {
    expect(model.validate({ ...base, username: 'a'.repeat(25) }).username).toBeTruthy();
  });

  it('con spazi', () => {
    expect(model.validate({ ...base, username: 'mario rossi' }).username).toBeTruthy();
  });

  it('vuoto: errore obbligatorio (non entra nel branch regex)', () => {
    expect(model.validate({ ...base, username: '' }).username).toMatch(/obbligatorio/i);
  });
});

describe('RegisterModel – email', () => {
  const model = new RegisterModel();
  const base = { username: 'mario', password: 'Password1!', confirmPwd: 'Password1!' };

  it('valida', () => {
    expect(model.validate({ ...base, email: 'mario@example.com' }).email).toBeUndefined();
  });

  it('senza @', () => {
    expect(model.validate({ ...base, email: 'marioexample.com' }).email).toBeTruthy();
  });

  it('senza TLD', () => {
    expect(model.validate({ ...base, email: 'mario@example' }).email).toBeTruthy();
  });

  it('vuota: errore obbligatorio', () => {
    expect(model.validate({ ...base, email: '' }).email).toMatch(/obbligatorio/i);
  });
});

describe('RegisterModel – password', () => {
  const model = new RegisterModel();
  const base = { username: 'mario', email: 'a@b.com' };

  it('valida', () => {
    expect(model.validate({ ...base, password: 'Password1!', confirmPwd: 'Password1!' }).password).toBeUndefined();
  });

  it('senza maiuscola', () => {
    expect(model.validate({ ...base, password: 'password1!', confirmPwd: 'password1!' }).password).toBeTruthy();
  });

  it('senza numero', () => {
    expect(model.validate({ ...base, password: 'Password!', confirmPwd: 'Password!' }).password).toBeTruthy();
  });

  it('senza carattere speciale', () => {
    expect(model.validate({ ...base, password: 'Password1', confirmPwd: 'Password1' }).password).toBeTruthy();
  });

  it('< 8 caratteri', () => {
    expect(model.validate({ ...base, password: 'Pw1!', confirmPwd: 'Pw1!' }).password).toBeTruthy();
  });

  it('> 24 caratteri', () => {
    const long = 'Aa1!' + 'a'.repeat(21);
    expect(model.validate({ ...base, password: long, confirmPwd: long }).password).toBeTruthy();
  });

  it('vuota: errore obbligatorio', () => {
    expect(model.validate({ ...base, password: '', confirmPwd: '' }).password).toMatch(/obbligatorio/i);
  });
});

describe('RegisterModel – confirmPwd', () => {
  const model = new RegisterModel();
  const base = { username: 'mario', email: 'a@b.com', password: 'Password1!' };

  it('uguale: nessun errore', () => {
    expect(model.validate({ ...base, confirmPwd: 'Password1!' }).confirmPwd).toBeUndefined();
  });

  it('diversa: errore non coincidono', () => {
    expect(model.validate({ ...base, confirmPwd: 'Diversa123!' }).confirmPwd).toBeTruthy();
  });

  it('vuota: errore obbligatorio', () => {
    expect(model.validate({ ...base, confirmPwd: '' }).confirmPwd).toMatch(/obbligatorio/i);
  });
});