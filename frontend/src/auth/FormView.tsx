import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { FieldConfig } from './FormModel';
import type { FormViewModel } from './FormViewModel';
import FormErrors from './FormErrors';

interface FormProps {
  readonly title:       string;
  readonly submitLabel: string;
  readonly fields:      FieldConfig[];
  readonly vm:          FormViewModel;
}

export default function Form({ title, submitLabel, fields, vm }: FormProps) {
  /**
  @brief restituisce il form (login e registrazione)
   */
  const { values, fieldErrors, errors, loading, handleChange, handleBlur, handleSubmit } = vm;
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const toggleVisibility = (key: string) => {
    setVisibleFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <h2 className="font-serif text-[28px] font-normal text-center mb-7" style={{ color: 'var(--text-1)' }}>{title}</h2>
      <form onSubmit={handleSubmit} noValidate>

        {fields.map(({ key, label, type, placeholder, autoComplete }) => {
          const isPassword = type === 'password';
          const inputType = isPassword && visibleFields[key] ? 'text' : type;

          return (
            <div key={key} className="mb-4">
              <label
                htmlFor={key}
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-1)' }}
              >
                {label}
              </label>
              <div className="relative">
                <input
                  id={key}
                  type={inputType}
                  value={values[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  onBlur={() => handleBlur(key)}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  required
                  className="w-full rounded-lg px-4 text-base outline-none transition-colors h-12 pr-11"
                  style={{
                    backgroundColor: 'var(--bg-3)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-1)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-2)')}
                  onBlurCapture={e => (e.target.style.borderColor = 'var(--border)')}
                />
                {isPassword && (
                  <button
                    type="button"
                    onClick={() => toggleVisibility(key)}
                    aria-label={visibleFields[key] ? 'Nascondi password' : 'Mostra password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-4)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)')}
                    tabIndex={-1}
                  >
                    {visibleFields[key]
                      ? <EyeOff size={18} />
                      : <Eye size={18} />
                    }
                  </button>
                )}
              </div>
              {fieldErrors[key] && (
                <p className="text-sm mt-1" style={{ color: 'var(--error)' }}>{fieldErrors[key]}</p>
              )}
            </div>
          );
        })}

        <FormErrors errors={errors} />

        <button
          type="submit"
          data-testid="submit-btn"
          disabled={loading}
          className="w-full font-semibold text-base rounded-lg transition-all duration-150 disabled:opacity-50 mt-2 h-12"
          style={{
            backgroundColor: 'var(--color-2)',
            color: 'var(--bg-3)',
            border: '1px solid transparent',
          }}
          onMouseEnter={e => {
            const btn = e.currentTarget;
            btn.style.backgroundColor = 'var(--color-1)';
            btn.style.color = 'var(--text-1)';
            btn.style.borderColor = 'var(--color-3)';
          }}
          onMouseLeave={e => {
            const btn = e.currentTarget;
            btn.style.backgroundColor = 'var(--color-2)';
            btn.style.color = 'var(--bg-3)';
            btn.style.borderColor = 'transparent';
          }}
        >
          {loading ? 'Caricamento...' : submitLabel}
        </button>
      </form>
    </>
  );
}