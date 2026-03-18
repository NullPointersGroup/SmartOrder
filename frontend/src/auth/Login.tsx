import { useMemo } from 'react';
import { LoginModel } from './LoginModel';
import { useFormViewModel } from './FormViewModel';
import Form from './FormView';

interface LoginProps { readonly onLogin: (token?: string) => void; }

export default function Login({ onLogin }: LoginProps) {
  const model = useMemo(() => new LoginModel(), []);
  const vm    = useFormViewModel(model, onLogin);
  return <Form title="Accedi" submitLabel="Accedi" fields={model.fields} vm={vm} />;
}