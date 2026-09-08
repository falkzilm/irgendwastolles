import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it } from 'vitest'
import { FormulasPage } from './FormulasPage'
import { useAppStore } from '../store'
import { ToastProvider } from '../ui/Toast'

const initialState = useAppStore.getState()

describe('FormulasPage', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('gruppiert Formeln nach Kategorie', () => {
    render(<FormulasPage />)

    expect(
      screen.getByRole('heading', { name: 'Geometrie' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Algebra' })).toBeInTheDocument()
    expect(screen.getByText('Kreisfläche')).toBeInTheDocument()
  })

  it('filtert per Textsuche nach Titel', () => {
    render(<FormulasPage />)

    fireEvent.change(screen.getByPlaceholderText(/titel oder beschreibung/i), {
      target: { value: 'Kreisfläche' },
    })

    expect(screen.getByText('Kreisfläche')).toBeInTheDocument()
    expect(screen.queryByText('Kreisumfang')).not.toBeInTheDocument()
  })

  it('filtert per Textsuche nach Beschreibung', () => {
    render(<FormulasPage />)

    fireEvent.change(screen.getByPlaceholderText(/titel oder beschreibung/i), {
      target: { value: 'rechtwinkligen Dreieck' },
    })

    expect(screen.getByText('Satz des Pythagoras')).toBeInTheDocument()
    expect(screen.queryByText('Kreisfläche')).not.toBeInTheDocument()
  })

  it('zeigt einen Leerzustand ohne Suchtreffer', () => {
    render(<FormulasPage />)

    fireEvent.change(screen.getByPlaceholderText(/titel oder beschreibung/i), {
      target: { value: 'gibt es garantiert nicht' },
    })

    expect(screen.getByText(/keine formeln gefunden/i)).toBeInTheDocument()
  })

  it('markiert eine Formel als Favorit und entfernt sie wieder', () => {
    render(<FormulasPage />)

    const toggle = screen.getByRole('button', {
      name: 'Kreisfläche als Favorit markieren',
    })
    fireEvent.click(toggle)

    expect(useAppStore.getState().favoritenIds).toEqual(['kreisflaeche'])
    expect(
      screen.getByRole('button', { name: 'Kreisfläche als Favorit entfernen' }),
    ).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(
      screen.getByRole('button', { name: 'Kreisfläche als Favorit entfernen' }),
    )

    expect(useAppStore.getState().favoritenIds).toEqual([])
  })

  it('zeigt über den Favoriten-Filter nur markierte Formeln, auch nach Neurendern', () => {
    useAppStore.getState().toggleFavorit('kreisflaeche')

    render(<FormulasPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Nur Favoriten' }))

    expect(screen.getByText('Kreisfläche')).toBeInTheDocument()
    expect(screen.queryByText('Kreisumfang')).not.toBeInTheDocument()
  })

  it('zeigt einen Leerzustand, wenn der Favoriten-Filter aktiv ist und keine Favoriten existieren', () => {
    render(<FormulasPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Nur Favoriten' }))

    expect(screen.getByText(/keine favoriten vorhanden/i)).toBeInTheDocument()
  })

  it('öffnet die Detailansicht einer Formel und schließt sie wieder', () => {
    render(
      <ToastProvider>
        <FormulasPage />
      </ToastProvider>,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Details zu Kreisfläche anzeigen',
      }),
    )

    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('heading', { name: 'Kreisfläche' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('hat keine kritischen axe-Verstöße', async () => {
    const { container } = render(<FormulasPage />)

    const results = await axe(container)

    expect(results).toHaveNoViolations()
  })
})
