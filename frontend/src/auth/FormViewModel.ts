import { useState, useCallback } from 'react';
import type { FormModel } from './FormModel';

export interface FormViewModel {
  values:       Record<string, string>;
  fieldErrors:  Record<string, string>;
  errors:       string[];
  loading:      boolean;
  handleChange: (key: string, value: string) => void;
  handleBlur:   (key: string) => void;
  handleSubmit: (e: React.SyntheticEvent) => Promise<void>;
}

export function useFormViewModel(
  model: FormModel,
  onSuccess: () => void,
): FormViewModel {
  /**
 * @brief Hook che gestisce lo stato e la logica del form.
 * @param model FormModel Modello che definisce i campi, la validazione e il submit
 * @param onSuccess () => void Callback invocata dopo submit avvenuto con successo
 * @return FormViewModel Oggetto contenente stato e handler per la View
 */
  const initialValues = Object.fromEntries(model.fields.map(f => [f.key, '']));

  const [values,      setValues]      = useState<Record<string, string>>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errors,      setErrors]      = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);

  const handleChange = useCallback((key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [key]: '' }));
  }, []);

  const handleBlur = useCallback((key: string) => {
    const error = model.validateField(key, values[key]);
    setFieldErrors(prev => ({ ...prev, [key]: error }));
  }, [model, values]);

  const handleSubmit = useCallback(async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const newFieldErrors = model.validate(values);
    setFieldErrors(newFieldErrors);
    if (Object.keys(newFieldErrors).length > 0) return;

    setLoading(true);
    setErrors([]);
    try {
      const res = await model.submit(values);
      if (res.ok) onSuccess();
      else setErrors(res.errors);
    } catch {
      setErrors(['Errore di connessione']);
    }
    setLoading(false);
  }, [model, values, onSuccess]);

  return { values, fieldErrors, errors, loading, handleChange, handleBlur, handleSubmit };
}