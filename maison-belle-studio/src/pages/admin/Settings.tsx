import { useState } from 'react'
import { RefreshCw, ShieldAlert } from 'lucide-react'
import { PageHeader, Panel } from '../../components/admin/Common'
import { HoursList } from '../../components/site/Contact'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/Field'
import { ConfirmDialog } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { formatAddress, SALON } from '../../config/salon'
import { useStore } from '../../store/StoreContext'
import type { Settings as S } from '../../types'

const LIMITS = [
  'Os dados ficam apenas no localStorage deste navegador; não há banco de dados nem sincronização entre dispositivos.',
  'Não há autenticação: esta rota /admin é aberta e não deve ser usada em produção.',
  'A disponibilidade é calculada localmente e não impede reservas simultâneas em outros aparelhos.',
  'WhatsApp abre links com mensagens prontas; nenhum envio automático de mensagens ou e-mails.',
  'Pagamentos são apenas ilustrativos; nenhum valor é cobrado nem dado de cartão é solicitado.',
  'Relatórios e indicadores usam dados fictícios gerados para demonstração.',
]

export function SettingsAdmin() {
  const { data, updateSettings, resetDemo } = useStore()
  const toast = useToast()
  const [f, setF] = useState<S>(data.settings)
  const [reset, setReset] = useState(false)
  const dirty = JSON.stringify(f) !== JSON.stringify(data.settings)
  const size = (() => {
    try {
      return Math.round((JSON.stringify(data).length / 1024) * 10) / 10
    } catch {
      return 0
    }
  })()

  return (
    <div>
      <PageHeader title="Configurações" description="Regras de agendamento e dados da demonstração." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Regras de agendamento">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Intervalo entre horários" value={f.slotStep} onChange={(e) => setF({ ...f, slotStep: Number(e.target.value) })} hint="De quanto em quanto tempo os horários são oferecidos.">
              {[15, 30, 60].map((v) => <option key={v} value={v}>{v} minutos</option>)}
            </SelectField>
            <SelectField label="Preparação entre clientes" value={f.bufferMinutes} onChange={(e) => setF({ ...f, bufferMinutes: Number(e.target.value) })} hint="Tempo livre após cada atendimento.">
              {[0, 5, 10, 15, 20, 30].map((v) => <option key={v} value={v}>{v ? `${v} minutos` : 'Sem intervalo'}</option>)}
            </SelectField>
            <SelectField label="Agendamento com até" value={f.bookingWindowDays} onChange={(e) => setF({ ...f, bookingWindowDays: Number(e.target.value) })}>
              {[14, 30, 60, 90].map((v) => <option key={v} value={v}>{v} dias de antecedência</option>)}
            </SelectField>
            <SelectField label="Antecedência mínima (hoje)" value={f.minNoticeMinutes} onChange={(e) => setF({ ...f, minNoticeMinutes: Number(e.target.value) })}>
              {[0, 30, 60, 120, 240].map((v) => <option key={v} value={v}>{v ? `${v / 60 >= 1 ? `${v / 60}h` : `${v} min`}` : 'Nenhuma'}</option>)}
            </SelectField>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" disabled={!dirty} onClick={() => setF(data.settings)}>Descartar</Button>
            <Button disabled={!dirty} onClick={() => { updateSettings(f); toast.success('Regras salvas', 'A disponibilidade do site já foi recalculada.') }}>Salvar regras</Button>
          </div>
        </Panel>

        <Panel title="Dados do salão">
          <dl className="space-y-2.5 text-sm">
            {[
              ['Nome', SALON.name],
              ['Endereço', formatAddress()],
              ['Telefone', SALON.phoneDisplay],
              ['WhatsApp', `${SALON.whatsappDemoNumber} (demonstrativo)`],
              ['Instagram', SALON.instagramHandle],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <dt className="w-24 shrink-0 text-taupe">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-xl bg-sand/50 p-4">
            <p className="mb-2 text-[0.72rem] font-semibold tracking-wide text-stone uppercase">Funcionamento</p>
            <HoursList compact />
          </div>
          <p className="mt-3 text-[0.75rem] text-stone">Edite em <code className="rounded bg-sand px-1">src/config/salon.ts</code> — todas as telas usam essa configuração.</p>
        </Panel>

        <Panel title="Dados de demonstração">
          <p className="text-sm text-cocoa">
            {data.appointments.length} agendamentos · {data.clients.length} clientes · {data.services.length} serviços · ~{size} KB no navegador.
          </p>
          <p className="mt-2 text-[0.8rem] text-taupe">Restaurar apaga as alterações feitas (reservas, cadastros, preços) e recria os dados fictícios a partir da data de hoje.</p>
          <Button variant="secondary" className="mt-4" icon={<RefreshCw size={15} />} onClick={() => setReset(true)}>
            Restaurar dados
          </Button>
        </Panel>

        <Panel title={<span className="flex items-center gap-2"><ShieldAlert size={15} className="text-rose" /> Limitações deste frontend</span>}>
          <ul className="space-y-2 text-[0.82rem] text-cocoa">
            {LIMITS.map((l) => (
              <li key={l} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-rose" /> {l}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <ConfirmDialog
        open={reset}
        onClose={() => setReset(false)}
        title="Restaurar dados?"
        message="Todas as alterações feitas nesta demonstração serão perdidas."
        confirmLabel="Restaurar"
        onConfirm={() => {
          resetDemo()
          setF(data.settings)
          toast.success('Dados de demonstração restaurados')
        }}
      />
    </div>
  )
}
