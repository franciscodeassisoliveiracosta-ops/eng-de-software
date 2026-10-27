import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Pencil, Plus, Trash } from 'lucide-react'
import { PageHeader } from '../../components/admin/Common'
import { Button, IconButton } from '../../components/ui/Button'
import { TextArea, TextField, Toggle } from '../../components/ui/Field'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { Avatar, Badge, EmptyState } from '../../components/ui/Misc'
import { useToast } from '../../components/ui/Toast'
import { formatWorkDays } from '../../components/site/Team'
import { SALON, WEEKDAY_SHORT } from '../../config/salon'
import { CATEGORIES } from '../../data/catalog'
import { occupancy } from '../../lib/availability'
import { todayISO, toMinutes } from '../../lib/date'
import { uid } from '../../lib/id'
import { hasErrors, validateRequired, type Errors } from '../../lib/validation'
import { useStore } from '../../store/StoreContext'
import type { Professional } from '../../types'

// Cores da agenda: variações terrosas da paleta sunset, distinguíveis entre si
const COLORS = ['#b9614a', '#d08a5e', '#b96f78', '#8c8459', '#7e5f70', '#5f7f7a', '#a87745', '#6f5a8a']

export function ProfessionalsAdmin() {
  const { data, deleteProfessional, upsertProfessional } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Professional | null>(null)
  const [removing, setRemoving] = useState<Professional | null>(null)
  const today = todayISO()

  const blank: Professional = { id: '', name: '', role: '', specialties: [], bio: '', photo: '', serviceIds: [], workDays: [2, 3, 4, 5, 6], start: '09:00', end: '18:00', active: true, color: COLORS[data.professionals.length % COLORS.length] }

  return (
    <div>
      <PageHeader title="Profissionais" description="Serviços e horários definidos aqui controlam a disponibilidade no agendamento." actions={<Button icon={<Plus size={16} />} onClick={() => setEditing(blank)}>Cadastrar profissional</Button>} />
      {data.professionals.length === 0 ? (
        <div className="rounded-xl border border-linen bg-cream">
          <EmptyState title="Nenhum profissional cadastrado" action={<Button onClick={() => setEditing(blank)}>Cadastrar</Button>} />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.professionals.map((p) => {
            const todayCount = data.appointments.filter((a) => a.professionalId === p.id && a.date === today && a.status !== 'cancelado').length
            const occ = occupancy(data, p, today)
            return (
              <li key={p.id} className={`flex flex-col rounded-xl border border-linen bg-cream p-5 ${p.active ? '' : 'opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <Avatar name={p.name} src={p.photo} size={52} color={p.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{p.name}</p>
                    <p className="truncate text-[0.78rem] text-taupe">{p.role}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.active ? <Badge tone="sage">Ativo</Badge> : <Badge>Inativo</Badge>}
                      <span className="inline-flex items-center gap-1 text-[0.7rem] text-stone">
                        <span className="h-2 w-2 rounded-full" style={{ background: p.color }} /> cor na agenda
                      </span>
                    </div>
                  </div>
                  <div className="flex">
                    <IconButton label={`Editar ${p.name}`} onClick={() => setEditing(p)}>
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton label={`Excluir ${p.name}`} onClick={() => setRemoving(p)} className="hover:bg-danger-soft hover:text-danger">
                      <Trash size={15} />
                    </IconButton>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-[0.8rem]">
                  <div>
                    <dt className="text-stone">Atende</dt>
                    <dd className="text-ink">{formatWorkDays(p.workDays)}</dd>
                  </div>
                  <div>
                    <dt className="text-stone">Horário</dt>
                    <dd className="text-ink">{p.start} – {p.end}</dd>
                  </div>
                  <div>
                    <dt className="text-stone">Serviços</dt>
                    <dd className="text-ink">{p.serviceIds.length}</dd>
                  </div>
                  <div>
                    <dt className="text-stone">Hoje</dt>
                    <dd className="text-ink">{todayCount} atend. · {Math.round(occ * 100)}% ocupado</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-linen pt-4">
                  <Button size="sm" variant="secondary" icon={<CalendarDays size={14} />} onClick={() => navigate(`/admin/agenda?pro=${p.id}`)}>
                    Ver agenda
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { upsertProfessional({ ...p, active: !p.active }); toast.success(p.active ? 'Profissional desativado' : 'Profissional ativado') }}>
                    {p.active ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {editing && <ProForm initial={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Excluir profissional?"
        message={removing ? `${removing.name} será removido(a) do site e do agendamento. O histórico de atendimentos é mantido.` : ''}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (!removing) return
          const r = deleteProfessional(removing.id)
          if (r.ok) toast.success('Profissional excluído')
          else toast.error('Não foi possível excluir', r.error)
        }}
      />
    </div>
  )
}

function ProForm({ initial, onClose }: { initial: Professional; onClose: () => void }) {
  const { data, upsertProfessional } = useStore()
  const toast = useToast()
  const [f, setF] = useState<Professional>(initial)
  const [specText, setSpecText] = useState(initial.specialties.join(', '))
  const [e, setE] = useState<Errors<'name' | 'role' | 'hours' | 'days' | 'services' | 'photo'>>({})
  const isNew = !initial.id

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  const save = () => {
    const errs = {
      name: validateRequired(f.name, 'O nome'),
      role: validateRequired(f.role, 'A especialidade principal'),
      hours: toMinutes(f.end) <= toMinutes(f.start) ? 'O fim do expediente deve ser depois do início.' : undefined,
      days: f.workDays.length ? undefined : 'Selecione ao menos um dia.',
      services: f.serviceIds.length ? undefined : 'Associe ao menos um serviço.',
      photo: f.photo && !/^https?:/.test(f.photo) ? 'Use uma URL começando com http(s)://' : undefined,
    }
    setE(errs)
    if (hasErrors(errs)) return
    upsertProfessional({ ...f, id: f.id || uid('pro'), name: f.name.trim(), role: f.role.trim(), specialties: specText.split(',').map((s) => s.trim()).filter(Boolean) })
    toast.success(isNew ? 'Profissional cadastrado' : 'Dados atualizados', 'As opções de agendamento já foram atualizadas.')
    onClose()
  }

  const closedDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !SALON.hours[d])

  return (
    <Modal open onClose={onClose} variant="drawer" title={isNew ? 'Cadastrar profissional' : 'Editar profissional'} footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}>{isNew ? 'Cadastrar' : 'Salvar'}</Button></>}>
      <div className="space-y-4">
        <TextField label="Nome completo" value={f.name} error={e.name} onChange={(ev) => setF({ ...f, name: ev.target.value })} />
        <TextField label="Especialidade principal" value={f.role} error={e.role} placeholder="Ex.: Hair stylist" onChange={(ev) => setF({ ...f, role: ev.target.value })} />
        <TextField label="Especialidades" optional value={specText} onChange={(ev) => setSpecText(ev.target.value)} hint="Separe por vírgulas" />
        <TextArea label="Apresentação" optional rows={3} maxLength={220} value={f.bio} onChange={(ev) => setF({ ...f, bio: ev.target.value })} />
        <TextField label="Foto (URL)" optional value={f.photo} error={e.photo} onChange={(ev) => setF({ ...f, photo: ev.target.value })} hint="Sem foto, exibimos as iniciais." />
        <div>
          <p className="mb-2 text-[0.8rem] font-semibold text-cocoa">Cor na agenda</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" aria-label={`Cor ${c}`} aria-pressed={f.color === c} onClick={() => setF({ ...f, color: c })} className={`h-8 w-8 rounded-full ring-offset-2 ${f.color === c ? 'ring-2 ring-ink' : ''}`} style={{ background: c }} />
            ))}
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-[0.8rem] font-semibold text-cocoa">Dias de atendimento</legend>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={f.workDays.includes(d)}
                onClick={() => setF({ ...f, workDays: toggle(f.workDays, d) })}
                className={`h-9 w-12 rounded-lg border text-[0.78rem] font-semibold transition ${f.workDays.includes(d) ? 'border-ink bg-ink text-ivory' : 'border-linen bg-cream text-cocoa'}`}
              >
                {WEEKDAY_SHORT[d]}
              </button>
            ))}
          </div>
          {e.days && <p className="mt-1.5 text-[0.78rem] font-medium text-danger">{e.days}</p>}
          {f.workDays.some((d) => closedDays.includes(d)) && <p className="mt-1.5 text-[0.75rem] text-stone">O salão fecha em {closedDays.map((d) => WEEKDAY_SHORT[d]).join(' e ')}; esses dias não terão horários.</p>}
        </fieldset>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Início" type="time" step={1800} value={f.start} onChange={(ev) => setF({ ...f, start: ev.target.value })} error={e.hours} />
          <TextField label="Fim" type="time" step={1800} value={f.end} onChange={(ev) => setF({ ...f, end: ev.target.value })} />
        </div>
        <fieldset>
          <legend className="mb-2 text-[0.8rem] font-semibold text-cocoa">Serviços que realiza</legend>
          <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-linen bg-cream p-4">
            {CATEGORIES.map((c) => {
              const services = data.services.filter((s) => s.category === c.id)
              if (!services.length) return null
              return (
                <div key={c.id}>
                  <p className="mb-1.5 text-[0.7rem] font-semibold tracking-wider text-stone uppercase">{c.label}</p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {services.map((s) => (
                      <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-ink hover:bg-sand/50">
                        <input type="checkbox" checked={f.serviceIds.includes(s.id)} onChange={() => setF({ ...f, serviceIds: toggle(f.serviceIds, s.id) })} className="h-4 w-4 accent-[#b9614a]" />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          {e.services && <p className="mt-1.5 text-[0.78rem] font-medium text-danger">{e.services}</p>}
        </fieldset>
        <div className="rounded-xl border border-linen bg-cream p-4">
          <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Ativo" description="Inativo, não aparece no site nem recebe agendamentos." />
        </div>
      </div>
    </Modal>
  )
}
