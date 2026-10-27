import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface WrapProps {
  label: string
  error?: string
  hint?: ReactNode
  optional?: boolean
  children: (id: string, describedBy?: string) => ReactNode
  className?: string
}

export function FieldWrap({ label, error, hint, optional, children, className = '' }: WrapProps) {
  const id = useId()
  const descId = error || hint ? `${id}-desc` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-[0.8rem] font-semibold text-cocoa">
        {label}
        {optional && <span className="text-[0.7rem] font-medium text-stone">opcional</span>}
      </label>
      {children(id, descId)}
      {error ? (
        <p id={descId} className="mt-1.5 text-[0.78rem] font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={descId} className="mt-1.5 text-[0.75rem] text-stone">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: ReactNode; optional?: boolean; wrapClass?: string }

export function TextField({ label, error, hint, optional, wrapClass, className = '', ...rest }: InputProps) {
  return (
    <FieldWrap label={label} error={error} hint={hint} optional={optional} className={wrapClass}>
      {(id, desc) => (
        <input id={id} aria-invalid={!!error} aria-describedby={desc} className={`field ${error ? 'field-error' : ''} ${className}`} {...rest} />
      )}
    </FieldWrap>
  )
}

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: ReactNode; optional?: boolean; wrapClass?: string }

export function TextArea({ label, error, hint, optional, wrapClass, className = '', ...rest }: AreaProps) {
  return (
    <FieldWrap label={label} error={error} hint={hint} optional={optional} className={wrapClass}>
      {(id, desc) => (
        <textarea id={id} aria-invalid={!!error} aria-describedby={desc} className={`field min-h-24 resize-y ${error ? 'field-error' : ''} ${className}`} {...rest} />
      )}
    </FieldWrap>
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: ReactNode; wrapClass?: string }

export function SelectField({ label, error, hint, wrapClass, className = '', children, ...rest }: SelectProps) {
  return (
    <FieldWrap label={label} error={error} hint={hint} className={wrapClass}>
      {(id, desc) => (
        <select id={id} aria-invalid={!!error} aria-describedby={desc} className={`field appearance-auto ${error ? 'field-error' : ''} ${className}`} {...rest}>
          {children}
        </select>
      )}
    </FieldWrap>
  )
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {description && <p className="text-[0.78rem] text-stone">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-sage' : 'bg-linen'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-cream shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

export function Chip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: ReactNode; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[0.82rem] font-semibold transition ${
        active ? 'border-ink bg-ink text-ivory' : 'border-linen bg-cream text-cocoa hover:border-taupe'
      }`}
    >
      {children}
      {count !== undefined && <span className={`text-[0.7rem] ${active ? 'text-ivory/70' : 'text-stone'}`}>{count}</span>}
    </button>
  )
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-linen bg-cream p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 rounded-full px-3.5 text-[0.78rem] font-semibold transition ${value === o.value ? 'bg-ink text-ivory' : 'text-taupe hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
