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
  const { values, fieldErrors, errors, loading, handleChange, handleSubmit } = vm;

  return (
    <>
      <h2 className="font-serif text-[28px] font-normal text-center mb-7">{title}</h2>
      <form onSubmit={handleSubmit} noValidate>

        {fields.map(({ key, label, type, placeholder, autoComplete }) => (
          <div key={key} className="mb-4">
            <label
              htmlFor={key}
              className="block text-xs font-semibold uppercase tracking-widest text-black/50 mb-2"
            >
              {label}
            </label>
            <input
              id={key}
              type={type}
              value={values[key]}
              onChange={e => handleChange(key, e.target.value)}
              placeholder={placeholder}
              autoComplete={autoComplete}
              required
              className="w-full bg-[#fdfdfd] border border-black/20 rounded-lg px-4 text-base text-black outline-none focus:border-black/40 transition-colors h-12"
            />
            {fieldErrors[key] && (
              <p className="text-sm text-[#972020] mt-1">{fieldErrors[key]}</p>
            )}
          </div>
        ))}

        <FormErrors errors={errors} />

        <button
          type="submit"
          disabled={loading}
          className="w-full font-semibold text-base rounded-lg bg-[#22477b] text-white hover:bg-[#8da3c3] hover:text-black hover:border hover:border-[#22477b] transition-all duration-150 disabled:opacity-50 mt-2 h-12"
        >
          {loading ? 'Caricamento...' : submitLabel}
        </button>

      </form>
    </>
  );
}