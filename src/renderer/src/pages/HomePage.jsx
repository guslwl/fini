import { useTranslation } from 'react-i18next'

function HomePage() {
  const { t } = useTranslation()

  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-semibold">{t('home.title')}</h2>
      <p className="text-sm text-muted-foreground">{t('home.welcome')}</p>
    </section>
  )
}

export default HomePage
