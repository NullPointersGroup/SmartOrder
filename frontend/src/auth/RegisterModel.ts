import { FormModel, type FieldConfig, type SubmitResult, register, type RegisterDto } from './FormModel'

const USERNAME_REGEX: RegExp = /^\w{4,24}$/;
const PASSWORD_REGEX: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~])[A-Za-z\d!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export class RegisterModel extends FormModel {
  readonly fields: FieldConfig[] = [
    { key: 'username',   label: 'Username',         type: 'text',     placeholder: 'Es: Flavio',       autoComplete: 'username'     },
    { key: 'email',      label: 'Email',             type: 'email',    placeholder: 'Es: flavio@gmail.com', autoComplete: 'email'    },
    { key: 'password',   label: 'Password',          type: 'password', placeholder: 'Es: #Flavio4',    autoComplete: 'new-password' },
    { key: 'confirmPwd', label: 'Conferma Password', type: 'password', placeholder: '',                autoComplete: 'new-password' },
  ];

  validate(values: Record<string, string>): Record<string, string> {
    /**
     * @brief valida i campi
     * @param values i campi da validare
     * @return i campi validati errati
     */
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
    /**
     * @brief invia il form
     * @return promette il risultato dell'invio
     */
    const dto: RegisterDto = {
      username:   values.username,
      email:      values.email,
      password:   values.password,
      confirmPwd: values.confirmPwd,
    };
    return register(dto);
  }
}