import { FormModel, type FieldConfig, type SubmitResult } from './FormModel'
import { login, type LoginDto } from './api';

export class LoginModel extends FormModel {
  readonly fields: FieldConfig[] = [
    { key: 'username', label: 'Username', type: 'text',     placeholder: 'Es: Flavio',   autoComplete: 'username'         },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Es: #Flavio4', autoComplete: 'current-password' },
  ];

  validate(values: Record<string, string>): Record<string, string> {
    const fieldErrors = super.validate(values);

    if (!fieldErrors.username && !LoginModel.USERNAME_REGEX.test(values.username)) {
      fieldErrors.username = 'Username deve essere tra 4 e 24 caratteri';
    }
    if (!fieldErrors.password && !LoginModel.PASSWORD_REGEX.test(values.password)) {
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