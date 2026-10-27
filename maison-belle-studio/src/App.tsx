import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { BookingProvider } from './components/booking/BookingProvider'
import { ToastProvider } from './components/ui/Toast'
import { PublicLayout } from './layouts/PublicLayout'
import { ClientArea } from './pages/ClientArea'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { StoreProvider } from './store/StoreContext'

// Painel carregado sob demanda (o site público fica mais leve)
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const SettingsAdmin = lazy(() => import('./pages/admin/Settings').then((m) => ({ default: m.SettingsAdmin })))
const ServicesAdmin = lazy(() => import('./pages/admin/Services').then((m) => ({ default: m.ServicesAdmin })))
const Reports = lazy(() => import('./pages/admin/Reports').then((m) => ({ default: m.Reports })))
const PromotionsAdmin = lazy(() => import('./pages/admin/Promotions').then((m) => ({ default: m.PromotionsAdmin })))
const ProfessionalsAdmin = lazy(() => import('./pages/admin/Professionals').then((m) => ({ default: m.ProfessionalsAdmin })))
const Dashboard = lazy(() => import('./pages/admin/Dashboard').then((m) => ({ default: m.Dashboard })))
const ClientsAdmin = lazy(() => import('./pages/admin/Clients').then((m) => ({ default: m.ClientsAdmin })))
const Appointments = lazy(() => import('./pages/admin/Appointments').then((m) => ({ default: m.Appointments })))
const Agenda = lazy(() => import('./pages/admin/Agenda').then((m) => ({ default: m.Agenda })))

/**
 * HashRouter foi escolhido para que o build funcione em qualquer hospedagem
 * estática (sem configurar redirecionamentos) — ex.: /#/admin.
 */
export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <BookingProvider>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="minha-conta" element={<ClientArea />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route
                path="admin"
                element={
                  <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-shell text-sm text-taupe">Carregando painel…</div>}>
                    <AdminLayout />
                  </Suspense>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="agendamentos" element={<Appointments />} />
                <Route path="servicos" element={<ServicesAdmin />} />
                <Route path="profissionais" element={<ProfessionalsAdmin />} />
                <Route path="clientes" element={<ClientsAdmin />} />
                <Route path="promocoes" element={<PromotionsAdmin />} />
                <Route path="relatorios" element={<Reports />} />
                <Route path="configuracoes" element={<SettingsAdmin />} />
              </Route>
            </Routes>
          </BookingProvider>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  )
}
