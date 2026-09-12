import './BerechnungenChart.css'
import type { TagesWert } from './statistik'

interface BerechnungenChartProps {
  tage: TagesWert[]
}

/**
 * Balkendiagramm der Berechnungen der letzten 7 Tage (IRGENDWAST-49). Jeder
 * Balken zeigt Wochentag und Anzahl, die Höhe ist relativ zum Tag mit den
 * meisten Berechnungen skaliert.
 */
export function BerechnungenChart({ tage }: BerechnungenChartProps) {
  const maxAnzahl = Math.max(1, ...tage.map((tag) => tag.anzahl))

  return (
    <ul className="berechnungen-chart">
      {tage.map((tag) => (
        <li key={tag.datum} className="berechnungen-chart__spalte">
          <span className="berechnungen-chart__wert">{tag.anzahl}</span>
          <span
            className="berechnungen-chart__balken"
            style={{ height: `${(tag.anzahl / maxAnzahl) * 100}%` }}
          />
          <span className="berechnungen-chart__beschriftung">
            {tag.wochentag}
          </span>
        </li>
      ))}
    </ul>
  )
}
