import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash } from 'lucide-react'
import { PageHeader } from '../../components/admin/Common'
import { Button, IconButton } from '../../components/ui/Button'
import { SelectField, TextArea, TextField, Toggle } from '../../components/ui/Field'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { Badge, EmptyState, SmartImage } from '../../components/ui/Misc'
import { useToast } from '../../components/ui/Toast'
import { CATEGORIES } from '../../data/catalog'
import { IMAGE_PRESETS } from '../../data/images'
import { todayISO } from '../../lib/date'
import { formatDuration, formatPrice, normalizeText } from '../../lib/format'
import { uid } from '../../lib/id'
import { hasErrors, validatePositive, validateRequired, type Errors } from '../../lib/validation'
import { useStore } from '../../store/StoreContext'
import type { CategoryId, Service } from '../../types'

const DURATIONS = [15, 30, 45, 50, 60, 75, 90, 105, 120, 150, 180, 210, 240]

export function ServicesAdmin() {
  const { data, upsertService, deleteService } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<CategoryId | 'all'>('all')
  const [editing, setEditing] = useState<Service | null>(null)
  const [removing, setRemoving] = useState<Service | null>(null)

  const list = useMemo(() => {
    const n = normalizeText(q)
    return data.services.filter((s) => (cat === 'all' || s.category === cat) && (!n || normalizeText(s.name).includes(n)))
  }, [data.services, q, cat])

  const blank: Service = { id: '', name: '', category: 'cortes', description: '', price: 0, duration: 60, image: IMAGE_PRESETS[0].url, active: true }
  const futureCount = (id: string) => data.appointments.filter((a) => a.serviceId === id && a.date >= todayISO() && (a.status === 'agendado' || a.status === 'confirmado')).length

  return (
    <div>
      <PageHeader
        title="Serviços"
        description="Alterações aparecem imediatamente no site e no agendamento."
        actions={<Button icon={<Plus size={16} />} onClick={() => setEditing(blank)}>Novo serviço</Button>}
      />
      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-linen bg-cream p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar serviço" aria-label="Buscar serviço" className="field h-10 pl-10" />
        </div>
        <select aria-label="Categoria" value={cat} onChange={(e) => setCat(e.target.value as CategoryId | 'all')} className="field h-10 w-auto py-1.5 text-sm">
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-linen bg-cream">
          <EmptyState title="Nenhum serviço encontrado" action={<Button onClick={() => setEditing(blank)}>Criar serviço</Button>} />
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((s) => (
            <li key={s.id} className={`flex min-w-0 gap-4 rounded-xl border border-linen bg-cream p-3 ${s.active ? '' : 'opacity-60'}`}>
              <SmartImage src={s.image} alt="" className="h-24 w-24 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{s.name}</p>
                    <p className="text-[0.75rem] text-taupe">{CATEGORIES.find((c) => c.id === s.category)?.label}</p>
                  </div>
                  <div className="flex shrink-0">
                    <IconButton label={`Editar ${s.name}`} onClick={() => setEditing(s)}>
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton label={`Excluir ${s.name}`} onClick={() => setRemoving(s)} className="hover:bg-danger-soft hover:text-danger">
                      <Trash size={15} />
                    </IconButton>
                  </div>
                </div>
                <p className="mt-1.5 text-sm">
                  <span className="font-semibold text-ink">{formatPrice(s.price)}</span> <span className="text-taupe">· {formatDuration(s.duration)}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {s.active ? <Badge tone="sage">Disponível</Badge> : <Badge>Indisponível</Badge>}
                  {s.featured && <Badge tone="rose">Destaque</Badge>}
                  <button
                    type="button"
                    onClick={() => { upsertService({ ...s, active: !s.active }); toast.success(s.active ? 'Serviço ocultado do site' : 'Serviço disponível no site') }}
                    className="text-[0.72rem] font-semibold text-rose hover:underline"
                  >
                    {s.active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && <ServiceForm initial={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Excluir serviço?"
        message={
          removing && (
            <>
              <strong>{removing.name}</strong> será removido do catálogo, dos profissionais e das promoções.
              {futureCount(removing.id) > 0 && ` ${futureCount(removing.id)} agendamento(s) futuro(s) continuam registrados com o nome atual.`} Para apenas ocultar do site, use “Desativar”.
            </>
          )
        }
        confirmLabel="Excluir"
        onConfirm={() => {
          if (removing) {
            deleteService(removing.id)
            toast.success('Serviço excluído', removing.name)
          }
        }}
      />
    </div>
  )
}

function ServiceForm({ initial, onClose }: { initial: Service; onClose: () => void }) {
  const { upsertService } = useStore()
  const toast = useToast()
  const [f, setF] = useState<Service>(initial)
  const [priceText, setPriceText] = useState(initial.price ? String(initial.price).replace('.', ',') : '')
  const [e, setE] = useState<Errors<'name' | 'price' | 'description' | 'image'>>({})
  const isNew = !initial.id

  const save = () => {
    const price = Number(priceText.replace(/\./g, '').replace(',', '.'))
    const errs = {
      name: validateRequired(f.name, 'O nome'),
      description: validateRequired(f.description, 'A descrição'),
      price: validatePositive(price, 'O preço') ?? (price > 10000 ? 'Valor muito alto para um serviço.' : undefined),
      image: f.image && !/^(https?:|data:image\/)/.test(f.image) ? 'Use uma URL começando com http(s)://' : undefined,
    }
    setE(errs)
    if (hasErrors(errs)) return
    upsertService({ ...f, id: f.id || uid('srv'), name: f.name.trim(), description: f.description.trim(), price: Math.round(price * 100) / 100 })
    toast.success(isNew ? 'Serviço criado' : 'Serviço atualizado', f.name)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      variant="drawer"
      title={isNew ? 'Novo serviço' : 'Editar serviço'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>{isNew ? 'Criar serviço' : 'Salvar alterações'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField label="Nome" value={f.name} error={e.name} onChange={(ev) => setF({ ...f, name: ev.target.value })} maxLength={60} />
        <SelectField label="Categoria" value={f.category} onChange={(ev) => setF({ ...f, category: ev.target.value as CategoryId })}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Preço (R$)" inputMode="decimal" value={priceText} error={e.price} onChange={(ev) => setPriceText(ev.target.value.replace(/[^\d,.]/g, ''))} placeholder="120,00" />
          <SelectField label="Duração" value={f.duration} onChange={(ev) => setF({ ...f, duration: Number(ev.target.value) })}>
            {[...new Set([...DURATIONS, f.duration])].sort((a, b) => a - b).map((d) => (
              <option key={d} value={d}>
                {formatDuration(d)}
              </option>
            ))}
          </SelectField>
        </div>
        <TextArea label="Descrição" rows={3} value={f.description} error={e.description} maxLength={180} onChange={(ev) => setF({ ...f, description: ev.target.value })} hint={`${f.description.length}/180`} />
        <div>
          <TextField label="Imagem (URL)" value={f.image} error={e.image} onChange={(ev) => setF({ ...f, image: ev.target.value })} placeholder="https://…" />
          <p className="mt-3 mb-2 text-[0.75rem] font-semibold text-cocoa">Ou escolha uma foto de referência</p>
          <div className="grid grid-cols-6 gap-2">
            {IMAGE_PRESETS.map((p) => (
              <button key={p.url} type="button" onClick={() => setF({ ...f, image: p.url })} aria-label={`Usar foto: ${p.label}`} aria-pressed={f.image === p.url} className={`overflow-hidden rounded-lg ring-offset-2 transition ${f.image === p.url ? 'ring-2 ring-rose' : 'hover:opacity-80'}`}>
                <SmartImage src={p.url} alt="" className="aspect-square" />
              </button>
            ))}
          </div>
          {f.image && <SmartImage src={f.image} alt="Pré-visualização da imagem do serviço" className="mt-3 aspect-[16/9] rounded-xl" />}
        </div>
        <div className="space-y-4 rounded-xl border border-linen bg-cream p-4">
          <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Disponível para agendamento" description="Desativado, o serviço some do site e do fluxo de agendamento." />
          <Toggle checked={!!f.featured} onChange={(v) => setF({ ...f, featured: v })} label="Destaque" description="Aparece primeiro na lista e no rodapé." />
        </div>
      </div>
    </Modal>
  )
}
