import { describe, it, expect } from 'vitest';
import { FormModel } from '../../src/auth/FormModel';
import { LoginModel } from '../../src/auth/LoginModel';
import { RegisterModel } from '../../src/auth/RegisterModel';

class StubModel extends FormModel {
  readonly fields = [
    { key: 'name',  label: 'Nome',  type: 'text'  as const },
    { key: 'email', label: 'Email', type: 'email' as const },
  ];
  async submit(_v: Record<string, string>) {
    return { ok: true, errors: [] };
  }
}


describe('FormModel – validate', () => {
  const model = new StubModel();

  it('non restituisce errori se tutti i campi sono compilati', () => {
    const errors = model.validate({ name: 'Mario', email: 'mario@x.com' });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('segnala campo obbligatorio per ogni chiave vuota', () => {
    const errors = model.validate({ name: '', email: '' });
    expect(errors.name).toMatch(/obbligatorio/i);
    expect(errors.email).toMatch(/obbligatorio/i);
  });

  it('segnala solo i campi effettivamente vuoti', () => {
    const errors = model.validate({ name: 'Mario', email: '' });
    expect(errors.name).toBeUndefined();
    expect(errors.email).toMatch(/obbligatorio/i);
  });

  it('tratta le stringhe di soli spazi come vuote', () => {
    const errors = model.validate({ name: '   ', email: 'x@x.it' });
    expect(errors.name).toMatch(/obbligatorio/i);
  });
});


describe('FormModel – validateField', () => {
  const model = new StubModel();

  it('restituisce stringa vuota per campo compilato', () => {
    expect(model.validateField('name', 'Mario')).toBe('');
  });

  it('restituisce messaggio di errore per campo vuoto', () => {
    expect(model.validateField('name', '')).toMatch(/obbligatorio/i);
  });
});


describe('LoginModel – struttura campi', () => {
  const model = new LoginModel();

  it('ha esattamente due campi: username e password', () => {
    const keys = model.fields.map(f => f.key);
    expect(keys).toEqual(['username', 'password']);
  });

  it('il campo password è di tipo "password"', () => {
    const pwd = model.fields.find(f => f.key === 'password');
    expect(pwd?.type).toBe('password');
  });

  it('il campo username è di tipo "text"', () => {
    const usr = model.fields.find(f => f.key === 'username');
    expect(usr?.type).toBe('text');
  });
});


describe('LoginModel – validate', () => {
  const model = new LoginModel();

  it('segnala errore se username è vuoto (RF-OB_23)', () => {
    const errors = model.validate({ username: '', password: 'Password1!' });
    expect(errors.username).toBeTruthy();
  });

  it('segnala errore se password è vuota (RF-OB_25)', () => {
    const errors = model.validate({ username: 'mario', password: '' });
    expect(errors.password).toBeTruthy();
  });

  it('nessun errore con dati validi', () => {
    const errors = model.validate({ username: 'mario', password: 'Password1!' });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('RegisterModel – struttura campi', () => {
  const model = new RegisterModel();

  it('ha quattro campi: username, email, password, confirmPwd', () => {
    const keys = model.fields.map(f => f.key);
    expect(keys).toEqual(['username', 'email', 'password', 'confirmPwd']);
  });

  it('i campi password e confirmPwd hanno tipo "password"', () => {
    const pwdFields = model.fields.filter(f => f.type === 'password');
    expect(pwdFields).toHaveLength(2);
  });

  it('il campo email ha tipo "email"', () => {
    const emailField = model.fields.find(f => f.key === 'email');
    expect(emailField?.type).toBe('email');
  });

  it('il campo username ha tipo "text"', () => {
    const usrField = model.fields.find(f => f.key === 'username');
    expect(usrField?.type).toBe('text');
  });
});


describe('RegisterModel – validazione username', () => {
  const model = new RegisterModel();
  const base = { email: 'a@b.com', password: 'Password1!', confirmPwd: 'Password1!' };

  it('username valido (4–24 caratteri alfanumerici/underscore) non genera errori', () => {
    expect(model.validate({ ...base, username: 'mario123' }).username).toBeUndefined();
  });

  it('username con meno di 4 caratteri genera errore (RF-OB_05)', () => {
    expect(model.validate({ ...base, username: 'ab' }).username).toBeTruthy();
  });

  it('username con più di 24 caratteri genera errore (RF-OB_05, RF-OB_06)', () => {
    expect(model.validate({ ...base, username: 'a'.repeat(25) }).username).toBeTruthy();
  });

  it('username con esattamente 4 caratteri è valido (limite inferiore)', () => {
    expect(model.validate({ ...base, username: 'abcd' }).username).toBeUndefined();
  });

  it('username con esattamente 24 caratteri è valido (limite superiore)', () => {
    expect(model.validate({ ...base, username: 'a'.repeat(24) }).username).toBeUndefined();
  });

  it('username con spazi genera errore', () => {
    expect(model.validate({ ...base, username: 'mario rossi' }).username).toBeTruthy();
  });

  it('username vuoto genera errore "obbligatorio"', () => {
    expect(model.validate({ ...base, username: '' }).username).toMatch(/obbligatorio/i);
  });
});

describe('RegisterModel – validazione email', () => {
  const model = new RegisterModel();
  const base = { username: 'mario', password: 'Password1!', confirmPwd: 'Password1!' };

  it('email valida non genera errori', () => {
    expect(model.validate({ ...base, email: 'mario@example.com' }).email).toBeUndefined();
  });

  it('email senza @ genera errore (RF-OB_20)', () => {
    expect(model.validate({ ...base, email: 'marioexample.com' }).email).toBeTruthy();
  });

  it('email senza dominio genera errore', () => {
    expect(model.validate({ ...base, email: 'mario@' }).email).toBeTruthy();
  });

  it('email senza TLD genera errore', () => {
    expect(model.validate({ ...base, email: 'mario@example' }).email).toBeTruthy();
  });

  it('email con TLD di 2 caratteri è valida', () => {
    expect(model.validate({ ...base, email: 'mario@x.it' }).email).toBeUndefined();
  });

  it('email vuota genera errore "obbligatorio"', () => {
    expect(model.validate({ ...base, email: '' }).email).toMatch(/obbligatorio/i);
  });
});

describe('RegisterModel – validazione password', () => {
  const model = new RegisterModel();
  const base = { username: 'mario', email: 'a@b.com' };
  const valid = 'Password1!';

  it('password valida non genera errori', () => {
    expect(model.validate({ ...base, password: valid, confirmPwd: valid }).password).toBeUndefined();
  });

  it('password senza maiuscola genera errore (RF-OB_09)', () => {
    expect(model.validate({ ...base, password: 'password1!', confirmPwd: 'password1!' }).password).toBeTruthy();
  });

  it('password senza minuscola genera errore (RF-OB_09)', () => {
    expect(model.validate({ ...base, password: 'PASSWORD1!', confirmPwd: 'PASSWORD1!' }).password).toBeTruthy();
  });

  it('password senza numero genera errore (RF-OB_09)', () => {
    expect(model.validate({ ...base, password: 'Password!', confirmPwd: 'Password!' }).password).toBeTruthy();
  });

  it('password senza carattere speciale genera errore (RF-OB_09)', () => {
    expect(model.validate({ ...base, password: 'Password1', confirmPwd: 'Password1' }).password).toBeTruthy();
  });

  it('password con meno di 8 caratteri genera errore (RF-OB_09)', () => {
    expect(model.validate({ ...base, password: 'Pw1!', confirmPwd: 'Pw1!' }).password).toBeTruthy();
  });

  it('password con più di 24 caratteri genera errore (RF-OB_10)', () => {
    const long = 'Aa1!' + 'a'.repeat(21); // 25 caratteri
    expect(model.validate({ ...base, password: long, confirmPwd: long }).password).toBeTruthy();
  });

  it('password con esattamente 8 caratteri validi è accettata (limite inferiore)', () => {
    expect(model.validate({ ...base, password: 'Passw1!a', confirmPwd: 'Passw1!a' }).password).toBeUndefined();
  });

  it('password con esattamente 24 caratteri validi è accettata (limite superiore)', () => {
    const pwd = 'Aa1!' + 'a'.repeat(20); // 24 caratteri
    expect(model.validate({ ...base, password: pwd, confirmPwd: pwd }).password).toBeUndefined();
  });

  it('password vuota genera errore "obbligatorio"', () => {
    expect(model.validate({ ...base, password: '', confirmPwd: '' }).password).toMatch(/obbligatorio/i);
  });
});

describe('RegisterModel – validazione conferma password', () => {
  const model = new RegisterModel();
  const base = { username: 'mario', email: 'a@b.com', password: 'Password1!' };

  it('conferma uguale alla password non genera errori (RF-OB_15)', () => {
    expect(model.validate({ ...base, confirmPwd: 'Password1!' }).confirmPwd).toBeUndefined();
  });

  it('conferma diversa genera errore (RF-OB_16)', () => {
    expect(model.validate({ ...base, confirmPwd: 'Diversa123!' }).confirmPwd).toBeTruthy();
  });

  it('conferma vuota genera errore "obbligatorio"', () => {
    expect(model.validate({ ...base, confirmPwd: '' }).confirmPwd).toMatch(/obbligatorio/i);
  });

  it('la validazione è case-sensitive', () => {
    expect(model.validate({ ...base, confirmPwd: 'password1!' }).confirmPwd).toBeTruthy();
  });
});

describe('RegisterModel – validazione combinata', () => {
  const model = new RegisterModel();

  it('tutti i campi vuoti producono esattamente 4 errori', () => {
    const errs = model.validate({ username: '', email: '', password: '', confirmPwd: '' });
    expect(Object.keys(errs)).toHaveLength(4);
  });

  it('un solo campo errato produce un solo errore', () => {
    const errs = model.validate({
      username:   'mario',
      email:      'a@b.com',
      password:   'Password1!',
      confirmPwd: 'Sbagliata9!',
    });
    expect(Object.keys(errs)).toHaveLength(1);
    expect(errs.confirmPwd).toBeTruthy();
  });
});
