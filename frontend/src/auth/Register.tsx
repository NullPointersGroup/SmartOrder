import { useMemo } from 'react';
import { RegisterModel } from './FormModel';
import { useFormViewModel } from './FormViewModel';
import Form from './Form';

interface RegisterProps { readonly onRegister: () => void; }

export default function Register({ onRegister }: RegisterProps) {
  /**
 * @brief Ritorna il form di registrazione
 * @param onRegister () => void Callback invocata dopo registrazione avvenuta con successo
 */
  const model = useMemo(() => new RegisterModel(), []);
  const vm    = useFormViewModel(model, onRegister);

  return <Form title="Crea account" submitLabel="Registrati" fields={model.fields} vm={vm} />;
}