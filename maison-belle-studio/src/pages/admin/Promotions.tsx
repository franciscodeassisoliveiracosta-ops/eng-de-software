import { useState } from 'react'
import { Pencil, Plus, Trash } from 'lucide-react'
import { PageHeader } from '../../components/admin/Common'
import { Button, ExternalButton, IconButton } from '../../components/ui/Button'
import { WhatsAppIcon } from '../../components/ui/BrandIcons'
import { Segmented, SelectField, TextArea, TextField, Toggle } from '../../components/ui/Field'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { Badge, EmptyState, SmartImage } from '../../components/ui/Misc'
import { useToast } from '../../components/ui/Toast'
import { IMAGE_PRESETS } from '../../data/images'
import { isPromotionLive, promotionOriginalPrice } from '../../lib/coupons'
import { addDays, brDate, todayISO } from '../../lib/date'
import { formatPrice } from '../../lib/format'
import { uid } from '../../lib/id'
import { hasErrors, validatePositive, validateRequired, type Errors } from '../../lib/validation'
import { promoMessage, waLink } from '../../lib/whatsapp'
import { useStore } from '../../store/StoreContext'
import type { Coupon, Promotion } from '../../types'

export function PromotionsAdmin() {
  const [tab, setTab] = useState<'promocoes' | 'cupons'>('promocoes')
  return (
    <div>
      <PageHeader title="Promoções e cupons" description="Promoções ativas e dentro da validade aparecem automaticamente no site." actions={<Segmented label="Seção" value={tab} onChange={setTab} options={[{ value: 'promocoes', label: 'Promoções' }, { value: 'cupons', label: 'Cupons' }]} />} />
      {tab === 'promocoes' ? <PromoList /> : <CouponList />}
    </div>
  )
}

function promoState(p: Promotion): { label: string; tone: 'sage' | 'neutral' | 'gold' | 'danger' } {
  const t = todayISO()
  if (!p.active) return { label: 'Inativa', tone: 'neutral' }
  if (t < p.validFrom) return { label: 'Agendada', tone: 'gold' }
  if (t > p.validUntil) return { label: 'Expirada', tone: 'danger' }
  return { label: 'No site', tone: 'sage' }
}

function PromoList() {
  const { data, deletePromotion, upsertPromotion } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [removing, setRemoving] = useState<Promotion | null>(null)
  const blank: Promotion = { id: '', name: '', description: '', serviceIds: [], promoPrice: 0, validFrom: todayISO(), validUntil: addDays(todayISO(), 30), couponCode: '', active: true, image: IMAGE_PRESETS[0].url }
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button icon={<Plus size={16} />} onClick={() => setEditing(blank)}>
          Nova promoção
        </Button>
      </div>
      {data.promotions.length === 0 ? (
        <div className="rounded-xl border border-linen bg-cream">
          <EmptyState title="Nenhuma promoção" description="Crie pacotes e combos para exibir no site." />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.promotions.map((p) => {
            const st = promoState(p)
            const original = promotionOriginalPrice(data, p)
            const wa = waLink(promoMessage(p))
            return (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-linen bg-cream">
                <SmartImage src={p.image} alt="" className="aspect-[16/7]" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-2xl leading-tight text-ink">{p.name}</p>
                      <Badge tone={st.tone} className="mt-1">{st.label}</Badge>
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
                  <p className="mt-2 flex-1 text-[0.82rem] text-taupe">{p.description}</p>
                  <p className="mt-3 text-sm">
                    {original > p.promoPrice && <span className="mr-2 text-stone line-through">{formatPrice(original)}</span>}
                    <span className="font-semibold text-ink">{formatPrice(p.promoPrice)}</span>
                  </p>
                  <p className="mt-1 text-[0.75rem] text-stone">
                    {brDate(p.validFrom)} a {brDate(p.validUntil)} {p.couponCode && <>· cupom <span className="font-mono">{p.couponCode}</span></>}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-linen pt-3">
                    <button type="button" className="text-[0.78rem] font-semibold text-rose hover:underline" onClick={() => { upsertPromotion({ ...p, active: !p.active }); toast.success(p.active ? 'Promoção desativada' : 'Promoção ativada') }}>
                      {p.active ? 'Desativar' : 'Ativar'}
                    </button>
                    {wa && isPromotionLive(p) && (
                      <ExternalButton href={wa} size="sm" variant="ghost" icon={<WhatsAppIcon size={14} />}>
                        Divulgar
                      </ExternalButton>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {editing && <PromoForm initial={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} title="Excluir promoção?" message={removing ? `“${removing.name}” deixará de aparecer no site e o cupom ${removing.couponCode || ''} deixará de funcionar.` : ''} confirmLabel="Excluir" onConfirm={() => { if (removing) { deletePromotion(removing.id); toast.success('Promoção excluída') } }} />
    </>
  )
}

function PromoForm({ initial, onClose }: { initial: Promotion; onClose: () => void }) {
  const { data, upsertPromotion } = useStore()
  const toast = useToast()
  const [f, setF] = useState(initial)
  const [price, setPrice] = useState(initial.promoPrice ? String(initial.promoPrice).replace('.', ',') : '')
  const [e, setE] = useState<Errors<'name' | 'services' | 'price' | 'dates' | 'coupon'>>({})
  const original = promotionOriginalPrice(data, f)
  const isNew = !initial.id

  const save = () => {
    const value = Number(price.replace(/\./g, '').replace(',', '.'))
    const code = (f.couponCode ?? '').trim().toUpperCase()
    const taken = code && (data.coupons.some((c) => c.code.toUpperCase() === code) || data.promotions.some((p) => p.id !== f.id && p.couponCode?.toUpperCase() === code))
    const errs = {
      name: validateRequired(f.name, 'O nome'),
      services: f.serviceIds.length ? undefined : 'Inclua ao menos um serviço.',
      price: validatePositive(value, 'O preço promocional') ?? (original && value >= original ? 'O preço promocional deve ser menor que a soma dos serviços.' : undefined),
      dates: f.validUntil < f.validFrom ? 'A data final deve ser depois da inicial.' : undefined,
      coupon: taken ? 'Este código já está em uso.' : code && !/^[A-Z0-9-]{4,20}$/.test(code) ? 'Use 4 a 20 letras, números ou hífen.' : undefined,
    }
    setE(errs)
    if (hasErrors(errs)) return
    upsertPromotion({ ...f, id: f.id || uid('promo'), promoPrice: value, couponCode: code || undefined, name: f.name.trim() })
    toast.success(isNew ? 'Promoção criada' : 'Promoção atualizada', isPromotionLive({ ...f, couponCode: code }) ? 'Já está visível no site.' : 'Não aparece no site até estar ativa e dentro da validade.')
    onClose()
  }

  return (
    <Modal open onClose={onClose} variant="drawer" title={isNew ? 'Nova promoção' : 'Editar promoção'} footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}>Salvar</Button></>}>
      <div className="space-y-4">
        <TextField label="Nome" value={f.name} error={e.name} onChange={(ev) => setF({ ...f, name: ev.target.value })} />
        <TextArea label="Descrição" rows={2} value={f.description} maxLength={160} onChange={(ev) => setF({ ...f, description: ev.target.value })} />
        <fieldset>
          <legend className="mb-2 text-[0.8rem] font-semibold text-cocoa">Serviços incluídos</legend>
          <div className="grid max-h-56 gap-1 overflow-y-auto rounded-xl border border-linen bg-cream p-3 sm:grid-cols-2">
            {data.services.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-sand/50">
                <input type="checkbox" className="h-4 w-4 accent-[#b9614a]" checked={f.serviceIds.includes(s.id)} onChange={() => setF({ ...f, serviceIds: f.serviceIds.includes(s.id) ? f.serviceIds.filter((x) => x !== s.id) : [...f.serviceIds, s.id] })} />
                <span className="truncate">{s.name}</span>
              </label>
            ))}
          </div>
          {e.services && <p className="mt-1.5 text-[0.78rem] font-medium text-danger">{e.services}</p>}
        </fieldset>
        <TextField label="Preço promocional (R$)" inputMode="decimal" value={price} error={e.price} onChange={(ev) => setPrice(ev.target.value.replace(/[^\d,.]/g, ''))} hint={original ? `Soma dos serviços: ${formatPrice(original)}` : undefined} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Início" type="date" value={f.validFrom} onChange={(ev) => setF({ ...f, validFrom: ev.target.value })} error={e.dates} />
          <TextField label="Fim" type="date" value={f.validUntil} onChange={(ev) => setF({ ...f, validUntil: ev.target.value })} />
        </div>
        <TextField label="Cupom" optional value={f.couponCode ?? ''} error={e.coupon} className="font-mono uppercase" onChange={(ev) => setF({ ...f, couponCode: ev.target.value.toUpperCase() })} hint="Aplica o desconto proporcional do pacote no agendamento." />
        <div>
          <p className="mb-2 text-[0.8rem] font-semibold text-cocoa">Imagem</p>
          <div className="grid grid-cols-6 gap-2">
            {IMAGE_PRESETS.map((p) => (
              <button key={p.url} type="button" aria-label={`Usar foto: ${p.label}`} aria-pressed={f.image === p.url} onClick={() => setF({ ...f, image: p.url })} className={`overflow-hidden rounded-lg ring-offset-2 ${f.image === p.url ? 'ring-2 ring-rose' : ''}`}>
                <SmartImage src={p.url} alt="" className="aspect-square" />
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-linen bg-cream p-4">
          <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Ativa" description="Ativa e dentro da validade, aparece no site." />
        </div>
      </div>
    </Modal>
  )
}

function CouponList() {
  const { data, deleteCoupon } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [removing, setRemoving] = useState<Coupon | null>(null)
  const today = todayISO()
  const blank: Coupon = { code: '', description: '', type: 'percent', value: 10, validFrom: today, validUntil: addDays(today, 30), active: true }
  const list = data.coupons.filter((c) => !c.clientId)
  const personal = data.coupons.filter((c) => c.clientId).length
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[0.8rem] text-taupe">{personal} cupom(ns) pessoal(is) de fidelidade gerado(s) pelos clientes.</p>
        <Button icon={<Plus size={16} />} onClick={() => setEditing(blank)}>
          Novo cupom
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-linen bg-cream">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-linen bg-sand/40 text-[0.72rem] tracking-wide text-taupe uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Regra</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">Validade</th>
              <th className="px-4 py-3 font-semibold">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-linen">
            {list.map((c) => {
              const expired = c.validUntil < today
              return (
                <tr key={c.code}>
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold tracking-wider text-ink">{c.code}</p>
                    <p className="text-[0.75rem] text-taupe md:hidden">{c.type === 'percent' ? `${c.value}%` : formatPrice(c.value)}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-cocoa md:table-cell">
                    {c.type === 'percent' ? `${c.value}% off` : `${formatPrice(c.value)} off`}
                    {c.minValue ? ` · mín. ${formatPrice(c.minValue)}` : ''}
                    {c.serviceIds?.length ? ` · ${c.serviceIds.length} serviço(s)` : ''}
                  </td>
                  <td className="hidden px-4 py-3 text-cocoa tabular-nums sm:table-cell">
                    {brDate(c.validFrom)} – {brDate(c.validUntil)}
                  </td>
                  <td className="px-4 py-3">{!c.active ? <Badge>Inativo</Badge> : expired ? <Badge tone="danger">Expirado</Badge> : <Badge tone="sage">Válido</Badge>}</td>
                  <td className="px-2 py-3 text-right whitespace-nowrap">
                    <IconButton label={`Editar ${c.code}`} onClick={() => setEditing(c)}>
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton label={`Excluir ${c.code}`} onClick={() => setRemoving(c)} className="hover:bg-danger-soft hover:text-danger">
                      <Trash size={15} />
                    </IconButton>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!list.length && <EmptyState title="Nenhum cupom" />}
      </div>
      {editing && <CouponForm initial={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} title="Excluir cupom?" message={removing ? `O código ${removing.code} deixará de ser aceito.` : ''} confirmLabel="Excluir" onConfirm={() => { if (removing) { deleteCoupon(removing.code); toast.success('Cupom excluído') } }} />
    </>
  )
}

function CouponForm({ initial, onClose }: { initial: Coupon; onClose: () => void }) {
  const { data, upsertCoupon } = useStore()
  const toast = useToast()
  const [f, setF] = useState(initial)
  const [value, setValue] = useState(String(initial.value))
  const [min, setMin] = useState(initial.minValue ? String(initial.minValue) : '')
  const [e, setE] = useState<Errors<'code' | 'value' | 'dates' | 'description'>>({})
  const isNew = !initial.code
  const save = () => {
    const code = f.code.trim().toUpperCase()
    const v = Number(value.replace(',', '.'))
    const taken = code !== initial.code.toUpperCase() && (data.coupons.some((c) => c.code.toUpperCase() === code) || data.promotions.some((p) => p.couponCode?.toUpperCase() === code))
    const errs = {
      code: !/^[A-Z0-9-]{4,20}$/.test(code) ? 'Use 4 a 20 letras, números ou hífen.' : taken ? 'Código já existe.' : undefined,
      description: validateRequired(f.description, 'A descrição'),
      value: validatePositive(v, 'O valor') ?? (f.type === 'percent' && v > 100 ? 'Máximo de 100%.' : undefined),
      dates: f.validUntil < f.validFrom ? 'A data final deve ser depois da inicial.' : undefined,
    }
    setE(errs)
    if (hasErrors(errs)) return
    upsertCoupon({ ...f, code, value: v, minValue: min ? Number(min.replace(',', '.')) : undefined }, isNew ? undefined : initial.code)
    toast.success(isNew ? 'Cupom criado' : 'Cupom atualizado', code)
    onClose()
  }
  return (
    <Modal open onClose={onClose} size="sm" title={isNew ? 'Novo cupom' : 'Editar cupom'} footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}>Salvar</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Código" value={f.code} error={e.code} className="font-mono uppercase" onChange={(ev) => setF({ ...f, code: ev.target.value.toUpperCase() })} wrapClass="col-span-2" />
        <TextField label="Descrição" value={f.description} error={e.description} onChange={(ev) => setF({ ...f, description: ev.target.value })} wrapClass="col-span-2" />
        <SelectField label="Tipo" value={f.type} onChange={(ev) => setF({ ...f, type: ev.target.value as Coupon['type'] })}>
          <option value="percent">Percentual (%)</option>
          <option value="fixed">Valor fixo (R$)</option>
        </SelectField>
        <TextField label="Valor" inputMode="decimal" value={value} error={e.value} onChange={(ev) => setValue(ev.target.value.replace(/[^\d,.]/g, ''))} />
        <TextField label="Início" type="date" value={f.validFrom} error={e.dates} onChange={(ev) => setF({ ...f, validFrom: ev.target.value })} />
        <TextField label="Fim" type="date" value={f.validUntil} onChange={(ev) => setF({ ...f, validUntil: ev.target.value })} />
        <TextField label="Valor mínimo do serviço (R$)" optional inputMode="decimal" value={min} onChange={(ev) => setMin(ev.target.value.replace(/[^\d,.]/g, ''))} wrapClass="col-span-2" />
        <div className="col-span-2 rounded-xl border border-linen bg-cream p-4">
          <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Ativo" />
        </div>
      </div>
    </Modal>
  )
}
