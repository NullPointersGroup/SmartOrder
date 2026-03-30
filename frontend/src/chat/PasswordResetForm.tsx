import { useState } from "react";
import type { ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

// ─── Regex & rules ───────────────────────────────────────────────────────────

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,24}$/;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBorderClass(value: string, isValid: boolean, hasError: boolean): string {
  if (hasError)          return "border-(--error)";
  if (value && isValid)  return "border-(--color-2)";
  if (value && !isValid) return "border-(--error)";
  return "border-(--border)";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface PasswordFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly show: boolean;
  readonly onToggleShow: () => void;
  readonly borderClass: string;
  readonly error?: string;
  readonly autoComplete?: string;
  readonly children?: React.ReactNode;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  borderClass,
  error,
  autoComplete = "off",
  children,
}: PasswordFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-(--text-2)">
        {label}
      </label>

      <div className={`relative flex items-center rounded-lg border bg-(--bg-3) transition-all duration-200 focus-within:border-(--color-2) focus-within:ring-2 focus-within:ring-(--color-1) ${borderClass}`}>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full bg-transparent py-2.5 pl-3 pr-10 text-sm text-(--text-1) outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggleShow}
          className="absolute right-3 text-(--text-4) hover:text-(--color-2) transition-colors"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {children}

      {error && (
        <p className="flex items-center gap-1 text-xs text-(--error)">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main form ───────────────────────────────────────────────────────────────

interface PasswordResetFormProps {
  readonly handleReset: (oldPassword: string, newPassword: string) => Promise<string | null>;
}

const PASSWORD_ERROR_MESSAGE = "La password deve avere almeno 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero e 1 carattere speciale"; //NOSONAR

export default function PasswordResetForm({ handleReset }: Readonly<PasswordResetFormProps>) {
  const [oldPwd,     setOldPwd]     = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const newPwdDifferent = newPwd !== oldPwd;

  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitted,    setSubmitted]    = useState(false);
  const [serverError,  setServerError]  = useState<string | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────

  const newPwdValid     = PASSWORD_REGEX.test(newPwd);
  const confirmPwdValid = confirmPwd === newPwd && newPwdValid;

  const oldPwdError = submitted && !oldPwd
    ? "Inserisci la password attuale."
    : undefined;

  let newPwdError: string | undefined;
  if (submitted && !newPwdValid) {
    newPwdError = PASSWORD_ERROR_MESSAGE;
  } else if (submitted && !newPwdDifferent) {
    newPwdError = "La nuova password deve essere diversa da quella attuale."; //NOSONAR
  }

  let confirmPwdError: string | undefined;
  if (submitted && !confirmPwdValid) {
    confirmPwdError = confirmPwd === newPwd
      ? "La password non rispetta i requisiti." //NOSONAR
      : "Le password non coincidono."; //NOSONAR
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  type FormSubmitEvent = Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

  async function onSubmit(e: FormSubmitEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (oldPwd && newPwdValid && newPwdDifferent && confirmPwdValid) {
      const error = await handleReset(oldPwd, newPwd);
      if (error !== null) setServerError(error);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full max-w-sm flex-col gap-5">
      <h2 className="text-lg font-semibold text-(--text-1)">
        Reimposta password
      </h2>

      {/* Vecchia password */}
      <PasswordField
        id="old-password"
        label="Password attuale"
        value={oldPwd}
        onChange={(v) => { setOldPwd(v); setServerError(null); }}
        show={showOld}
        onToggleShow={() => setShowOld(s => !s)}
        borderClass={getBorderClass(oldPwd, !!oldPwd, !!oldPwdError)}
        error={oldPwdError}
        autoComplete="off"
      />

      {/* Nuova password */}
      <PasswordField
        id="new-password"
        label="Nuova password"
        value={newPwd}
        onChange={(v) => { setNewPwd(v); setServerError(null); }}
        show={showNew}
        onToggleShow={() => setShowNew(s => !s)}
        borderClass={getBorderClass(newPwd, newPwdValid && newPwdDifferent, !!newPwdError)}
        error={newPwdError}
        autoComplete="new-password"
      />

      {/* Conferma nuova password */}
      <PasswordField
        id="confirm-password"
        label="Conferma password"
        value={confirmPwd}
        onChange={(v) => { setConfirmPwd(v); setServerError(null); }}
        show={showConfirm}
        onToggleShow={() => setShowConfirm(s => !s)}
        borderClass={getBorderClass(confirmPwd, confirmPwdValid, !!confirmPwdError)}
        error={confirmPwd ? undefined : confirmPwdError}
        autoComplete="new-password"
      >
        {confirmPwd && (
          <p
            className={`flex items-center gap-1 text-xs transition-colors duration-200 ${
              confirmPwdValid ? "text-(--color-2)" : "text-(--error)"
            }`}
          >
            {confirmPwdValid
              ? "Le password coincidono"
              : "Le password non coincidono"}
          </p>
        )}
      </PasswordField>

      {serverError && (
        <p className="flex items-center gap-1 text-xs text-(--error)">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        className="mt-1 rounded-lg py-2.5 text-sm font-semibold bg-(--color-3) hover:bg-(--color-3) text-(--bg-3) transition-colors active:scale-[0.98]"
      >
        Reimposta password
      </button>
    </form>
  );
}