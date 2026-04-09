import { FormModel, type FieldConfig, type SubmitResult, login, type LoginDto  } from './FormModel'

export class LoginModel extends FormModel {
  readonly fields: FieldConfig[] = [
    { key: 'username', label: 'Username', type: 'text',     placeholder: 'Es: Flavio',   autoComplete: 'username'         },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Es: #Flavio4', autoComplete: 'current-password' },
  ];

  async submit(values: Record<string, string>): Promise<SubmitResult> {
    /**
     * @brief invia il form di login
     * @return il risultato dell'invio
     */
    const dto: LoginDto = {
      username: values.username,
      password: values.password,
    };
    return login(dto);
  }
}