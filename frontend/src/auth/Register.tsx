import { useMemo } from 'react';
import { RegisterModel } from './RegisterModel';
import { useFormViewModel } from './FormViewModel';
import Form from './FormView';

interface RegisterProps { readonly onRegister: (token?: string) => void; }

export default function Register({ onRegister }: RegisterProps) {
  const model = useMemo(() => new RegisterModel(), []);
  const vm    = useFormViewModel(model, onRegister);
  return <Form title="Crea account" submitLabel="Registrati" fields={model.fields} vm={vm} />;
}