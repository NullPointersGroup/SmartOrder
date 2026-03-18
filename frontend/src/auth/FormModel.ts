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
  token?: string;
}

export abstract class FormModel {
  abstract readonly fields: FieldConfig[];
  abstract submit(values: Record<string, string>): Promise<SubmitResult>;

  protected static readonly USERNAME_REGEX: RegExp = /^\w{4,24}$/;
  protected static readonly PASSWORD_REGEX: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~])[A-Za-z\d!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]{8,24}$/;

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