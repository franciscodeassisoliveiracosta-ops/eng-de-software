import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { About } from '../components/site/About'
import { Contact } from '../components/site/Contact'
import { Gallery } from '../components/site/Gallery'
import { Hero } from '../components/site/Hero'
import { CATEGORY_EVENT } from '../components/site/Header'
import { Director, News, Signature } from '../components/site/Highlights'
import { Promotions, Services } from '../components/site/Services'
import { Team } from '../components/site/Team'

export function Home() {
  const location = useLocation()
  const navigate = useNavigate()

  // Rolagem para a seção solicitada a partir de outra página
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo
    if (!target) return
    const t = setTimeout(() => {
      const category = (location.state as { category?: string } | null)?.category
      if (category) window.dispatchEvent(new CustomEvent(CATEGORY_EVENT, { detail: category }))
      if (target === 'inicio') window.scrollTo({ top: 0 })
      else document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
      navigate('.', { replace: true, state: null })
    }, 80)
    return () => clearTimeout(t)
  }, [location.state, navigate])

  return (
    <>
      <Hero />
      <Signature />
      <Services />
      <Promotions />
      <About />
      <Director />
      <Team />
      <News />
      <Gallery />
      <Contact />
    </>
  )
}
