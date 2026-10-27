import { useMemo, useState } from 'react'
import { Download, Pencil, Plus, Search } from 'lucide-react'
import { AppointmentDrawer, PageHeader } from '../../components/admin/Common'
import { Button } from '../../components/ui/Button'
import { TextArea, TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { Avatar, ClientTagBadge, EmptyState, StatusBadge } from '../../components/ui/Misc'
import { useToast } from '../../components/ui/Toast'
import { downloadCSV } from '../../lib/csv'
import { brDate, todayISO } from '../../lib/date'
import { formatPhone, formatPrice, normalizeText, onlyDigits } from '../../lib/format'
import { uid } from '../../lib/id'
import { loyaltyFor } from '../../lib/loyalty'
import { clientStats, clientTag, TAG_LABEL } from '../../lib/stats'
import { hasErrors, validateEmail, validateName, validatePhone, type Errors } from '../../lib/validation'
import { useStore } from '../../store/StoreContext'
import type { Client, ClientTag } from '../../types'

type Sort = 'nome' | 'ultimo' | 'atendimentos'

export function ClientsAdmin() {
  const { data } = useStore()
  const [q, setQ] = useState('')
  const [tag, setTag] = useState<ClientTag | 'all'>('all')
  const [sort, setSort] = useState<Sort>('nome')
  const [detail, setDetail] = useState<string | null>(null)
  const [editing, setEditing] = useState<Client | null>(null)

  const rows = useMemo(() => {
    const n = normalizeText(q)
    const digits = onlyDigits(q)
    return data.clients
      .map((c) => ({ c, s: clientStats(data, c), tag: clientTag(data, c) }))
      .filter(({ c, tag: t }) => (tag === 'all' || t === tag) && (!n || normalizeText(c.name).includes(n) || (digits.length >= 3 && c.phone.includes(digits)) || normalizeText(c.email ?? '').includes(n)))
      .sort((a, b) =>
        sort === 'nome' ? a.c.name.localeCompare(b.c.name, 'pt-BR') : sort === 'ultimo' ? (b.s.last ?? '').localeCompare(a.s.last ?? '') : b.s.done - a.s.done,
      )
  }, [data, q, tag, sort])

  const exportCsv = () =>
    downloadCSV(`clientes-demo-${todayISO()}.csv`, [
      ['Nome', 'Telefone', 'E-mail', 'Atendimentos concluídos', 'Último atendimento', 'Situação', 'Total gasto (R$)'],
      ...rows.map(({ c, s, tag: t }) => [c.name, formatPhone(c.phone), c.email ?? '', s.done, s.last ? brDate(s.last) : '', TAG_LABEL[t], s.spent.toFixed(2).replace('.', ',')]),
    ])

  const blank: Client = { id: '', name: '', phone: '', email: '', createdAt: '', redeemedPoints: 0 }
  const sel = 'field h-10 w-auto py-1.5 text-sm'

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${rows.length} de ${data.clients.length} cadastros fictícios`}
        actions={
          <>
            <Button variant="secondary" icon={<Download size={15} />} onClick={exportCsv} disabled={!rows.length}>
              CSV
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => setEditing(blank)}>
              Novo cliente
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-linen bg-cream p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail" aria-label="Buscar clientes" className="field h-10 pl-10" />
        </div>
        <div className="flex gap-2">
          <select aria-label="Situação" value={tag} onChange={(e) => setTag(e.target.value as ClientTag | 'all')} className={sel}>
            <option value="all">Todas as situações</option>
            {(Object.keys(TAG_LABEL) as ClientTag[]).map((t) => (
              <option key={t} value={t}>
                {TAG_LABEL[t]}
              </option>
            ))}
          </select>
          <select aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={sel}>
            <option value="nome">Nome (A–Z)</option>
            <option value="ultimo">Visita mais recente</option>
            <option value="atendimentos">Mais atendimentos</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-linen bg-cream">
          <EmptyState icon={<Search size={22} />} title="Nenhum cliente encontrado" description={q ? `Nada corresponde a “${q}”.` : 'Ajuste os filtros.'} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-linen bg-cream">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-linen bg-sand/40 text-[0.72rem] tracking-wide text-taupe uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Telefone</th>
                <th className="hidden px-4 py-3 font-semibold xl:table-cell">E-mail</th>
                <th className="hidden px-4 py-3 text-center font-semibold sm:table-cell">Atend.</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Último</th>
                <th className="px-4 py-3 font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linen">
              {rows.map(({ c, s, tag: t }) => (
                <tr key={c.id} className="cursor-pointer transition hover:bg-sand/30" onClick={() => setDetail(c.id)}>
                  <td className="px-4 py-3">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDetail(c.id) }} className="flex items-center gap-3 text-left">
                      <Avatar name={c.name} size={32} />
                      <span>
                        <span className="block font-semibold text-ink">{c.name}</span>
                        <span className="block text-[0.75rem] text-taupe md:hidden">{formatPhone(c.phone)}</span>
                      </span>
                    </button>
                  </td>
                  <td className="hidden px-4 py-3 whitespace-nowrap text-cocoa tabular-nums md:table-cell">{formatPhone(c.phone)}</td>
                  <td className="hidden px-4 py-3 text-cocoa xl:table-cell">{c.email ?? '—'}</td>
                  <td className="hidden px-4 py-3 text-center text-ink tabular-nums sm:table-cell">{s.done}</td>
                  <td className="hidden px-4 py-3 text-cocoa tabular-nums lg:table-cell">{s.last ? brDate(s.last) : '—'}</td>
                  <td className="px-4 py-3"><ClientTagBadge tag={t} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-linen px-4 py-2.5 text-[0.72rem] text-stone">Situação calculada: VIP com 6+ atendimentos; ativa com visita nos últimos 60 dias; nova sem atendimentos concluídos.</p>
        </div>
      )}

      {detail && <ClientDetail id={detail} onClose={() => setDetail(null)} onEdit={(c) => setEditing(c)} />}
      {editing && <ClientForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ClientDetail({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: (c: Client) => void }) {
  const { data } = useStore()
  const [apt, setApt] = useState<string | null>(null)
  const c = data.clients.find((x) => x.id === id)
  if (!c) return null
  const s = clientStats(data, c)
  const l = loyaltyFor(data, c)
  const history = [...s.appointments].sort((a, b) => (a.date + a.start < b.date + b.start ? 1 : -1))
  return (
    <>
      <Modal open onClose={onClose} variant="drawer" title={c.name} subtitle={`${formatPhone(c.phone)}${c.email ? ' · ' + c.email : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <ClientTagBadge tag={clientTag(data, c)} />
          <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => onEdit(c)}>
            Editar dados
          </Button>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            ['Atendimentos', s.done],
            ['Total gasto', formatPrice(s.spent).replace(',00', '')],
            ['Pontos', l.balance],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-xl bg-cream p-3">
              <dt className="text-[0.7rem] text-stone">{k}</dt>
              <dd className="mt-1 font-display text-2xl text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        {c.notes && <p className="mt-4 rounded-xl bg-blush p-3 text-[0.82rem] text-rose-dark">{c.notes}</p>}
        <h3 className="mt-7 mb-2 text-[0.72rem] font-semibold tracking-wide text-stone uppercase">Histórico de agendamentos</h3>
        {history.length ? (
          <ul className="divide-y divide-linen rounded-xl border border-linen bg-cream">
            {history.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => setApt(a.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-sand/30">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{a.serviceName}</span>
                    <span className="block text-[0.75rem] text-taupe">
                      {brDate(a.date)} · {a.start} · {a.professionalName}
                    </span>
                  </span>
                  <StatusBadge status={a.status} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-taupe">Sem agendamentos.</p>
        )}
      </Modal>
      <AppointmentDrawer id={apt} onClose={() => setApt(null)} />
    </>
  )
}

function ClientForm({ initial, onClose }: { initial: Client; onClose: () => void }) {
  const { upsertClient } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ name: initial.name, phone: formatPhone(initial.phone), email: initial.email ?? '', notes: initial.notes ?? '' })
  const [e, setE] = useState<Errors<'name' | 'phone' | 'email'>>({})
  const isNew = !initial.id
  const save = () => {
    const errs = { name: validateName(f.name), phone: validatePhone(f.phone), email: validateEmail(f.email) }
    setE(errs)
    if (hasErrors(errs)) return
    const r = upsertClient({
      ...initial,
      id: initial.id || uid('cli'),
      createdAt: initial.createdAt || new Date().toISOString(),
      name: f.name.trim(),
      phone: onlyDigits(f.phone),
      email: f.email.trim() || undefined,
      notes: f.notes.trim() || undefined,
    })
    if (!r.ok) {
      setE({ ...errs, phone: r.error })
      return
    }
    toast.success(isNew ? 'Cliente cadastrado' : 'Cliente atualizado')
    onClose()
  }
  return (
    <Modal open onClose={onClose} size="sm" title={isNew ? 'Novo cliente' : 'Editar cliente'} footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}>Salvar</Button></>}>
      <div className="space-y-4">
        <TextField label="Nome completo" value={f.name} error={e.name} onChange={(ev) => setF({ ...f, name: ev.target.value })} />
        <TextField label="Telefone" type="tel" value={f.phone} error={e.phone} onChange={(ev) => setF({ ...f, phone: formatPhone(ev.target.value) })} />
        <TextField label="E-mail" optional type="email" value={f.email} error={e.email} onChange={(ev) => setF({ ...f, email: ev.target.value })} />
        <TextArea label="Observações internas" optional rows={3} value={f.notes} onChange={(ev) => setF({ ...f, notes: ev.target.value })} />
      </div>
    </Modal>
  )
}
