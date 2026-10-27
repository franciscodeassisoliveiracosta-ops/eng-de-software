import { ButtonLink } from '../components/ui/Button'

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-28 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="display mt-4 text-6xl text-ink">Página não encontrada</h1>
      <p className="mt-4 text-taupe">O endereço acessado não existe neste site.</p>
      <ButtonLink to="/" className="mt-8">
        Voltar ao início
      </ButtonLink>
    </div>
  )
}
