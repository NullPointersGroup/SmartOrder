import { login, type LoginDto, register, type RegisterDto } from './api';

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder?: string;
  autoComplete?: string;
}

export interface SubmitResult {
  ok: boolean;
  errors: string[];
}
const USERNAME_REGEX = /^\w{4,24}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~])[A-Za-z\d!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export abstract class FormModel {
  abstract readonly fields: FieldConfig[];
  abstract submit(values: Record<string, string>): Promise<SubmitResult>;

  validate(values: Record<string, string>): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    for (const field of this.fields) {
      if (!values[field.key]?.trim()) {
        fieldErrors[field.key] = `Il campo ${field.label} è obbligatorio`;
      }
    }
    return fieldErrors;
  }

  validateField(key: string, value: string): string {
    const allValues = Object.fromEntries(this.fields.map(f => [f.key, '']));
    const errors = this.validate({ ...allValues, [key]: value });
    return errors[key] ?? '';
  }
}

export class LoginModel extends FormModel {
  readonly fields: FieldConfig[] = [
    { key: 'username', label: 'Username', type: 'text',     placeholder: 'Es: Flavio',   autoComplete: 'username'         },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Es: #Flavio4', autoComplete: 'current-password' },
  ];

  validate(values: Record<string, string>): Record<string, string> {
    const fieldErrors = super.validate(values);

    if (!fieldErrors.username && !USERNAME_REGEX.test(values.username)) {
      fieldErrors.username = 'Username deve essere tra 4 e 24 caratteri';
    }
    if (!fieldErrors.password && !PASSWORD_REGEX.test(values.password)) {
      fieldErrors.password = 'Ricorda che la password deve essere tra 8 e 24 caratteri e contenere maiuscola, minuscola, numero e simbolo'; //NOSONAR
    }

    return fieldErrors;
  }

  async submit(values: Record<string, string>): Promise<SubmitResult> {
    const dto: LoginDto = {
      username: values.username,
      password: values.password,
    };
    return login(dto);
  }
}

export class RegisterModel extends FormModel {
  readonly fields: FieldConfig[] = [
    { key: 'username',   label: 'Username',         type: 'text',     placeholder: 'Es: Flavio',       autoComplete: 'username'     },
    { key: 'email',      label: 'Email',             type: 'email',    placeholder: 'Es: flavio@gmail.com', autoComplete: 'email'    },
    { key: 'password',   label: 'Password',          type: 'password', placeholder: 'Es: #Flavio4',    autoComplete: 'new-password' },
    { key: 'confirmPwd', label: 'Conferma Password', type: 'password', placeholder: '',                autoComplete: 'new-password' },
  ];

  validate(values: Record<string, string>): Record<string, string> {
    const fieldErrors = super.validate(values);

    if (!fieldErrors.username && !USERNAME_REGEX.test(values.username)) {
      fieldErrors.username = 'Username deve essere tra 4 e 24 caratteri';
    }
    if (!fieldErrors.email && !EMAIL_REGEX.test(values.email)) {
      fieldErrors.email = 'Email non valida';
    }
    if (!fieldErrors.password && !PASSWORD_REGEX.test(values.password)) {
      fieldErrors.password = 'La password deve essere tra 8 e 24 caratteri e deve contenere almeno 1 lettera maiuscola, 1 lettera minuscola, 1 numero e 1 carattere speciale'; //NOSONAR
    }
    if (!fieldErrors.confirmPwd && values.password !== values.confirmPwd) {
      fieldErrors.confirmPwd = 'Le password non coincidono'; //NOSONAR
    }

    return fieldErrors;
  }

  async submit(values: Record<string, string>): Promise<SubmitResult> {
    const dto: RegisterDto = {
      username:   values.username,
      email:      values.email,
      password:   values.password,
      confirmPwd: values.confirmPwd,
    };
    return register(dto);
  }
}