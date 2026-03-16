import { useMemo } from 'react';
import { LoginModel } from './FormModel';
import { useFormViewModel } from './FormViewModel';
import Form from './Form';

interface LoginProps { readonly onLogin: () => void; }

export default function Login({ onLogin }: LoginProps) {
  /**
 * @brief Ritorna il form di login
 * @param onLogin () => void Callback invocata dopo login avvenuta con successo
 */
  const model = useMemo(() => new LoginModel(), []);
  const vm    = useFormViewModel(model, onLogin);

  return <Form title="Accedi" submitLabel="Accedi" fields={model.fields} vm={vm} />;
}