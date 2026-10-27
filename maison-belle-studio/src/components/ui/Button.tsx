import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'rose' | 'danger' | 'light'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[0.01em] transition-all duration-300 ease-[var(--ease-soft)] disabled:opacity-45 disabled:cursor-not-allowed select-none whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-cream hover:bg-rose-dark active:scale-[0.98]',
  rose: 'bg-rose text-cream hover:bg-rose-dark active:scale-[0.98]',
  secondary: 'border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-cream',
  ghost: 'text-ink hover:bg-sand/70',
  danger: 'bg-danger text-white hover:brightness-95 active:scale-[0.98]',
  light: 'border border-cream/50 text-cream hover:bg-cream hover:text-ink',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.8rem]',
  md: 'h-11 px-6 text-[0.86rem]',
  lg: 'h-13 px-8 text-[0.92rem]',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', icon, className = '', children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  )
})

export function ButtonLink({
  to, variant = 'primary', size = 'md', className = '', children, icon,
}: { to: string; variant?: Variant; size?: Size; className?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {icon}
      {children}
    </Link>
  )
}

export function ExternalButton({
  href, variant = 'primary', size = 'md', className = '', children, icon, ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </a>
  )
}

export function IconButton({
  label, className = '', children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-taupe transition hover:bg-sand hover:text-ink disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
