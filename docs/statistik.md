# Statistik-Dashboard

Dieses Dokument beschreibt das Statistik-Dashboard unter `src/pages/ProgressPage.tsx`
und die reinen Auswertungsfunktionen unter `src/pages/progress/`. Es setzt die
Anforderungen aus IRGENDWAST-49 um (Nutzungs- und Lernfortschritt einschätzen).

## Datenquellen

Alle angezeigten Werte werden ausschließlich aus dem bereits vorhandenen
lokalen Store abgeleitet (siehe [state.md](./state.md)) - es findet keine
Netzwerkabfrage statt:

- `verlauf` (`verlaufSlice`) für die Berechnungen der letzten 7 Tage.
- `quizErgebnisse` (`quizSlice`) und `gamification.anzahlQuizRunden`
  (`gamificationSlice`) für Quiz-Trefferquote und Rundenanzahl.
- `formelNutzung` (`formelNutzungSlice`) zusammen mit `FORMULA_CATALOG` für
  die meistgenutzten Formeln.

Die eigentliche Berechnung liegt als reine, ungetestete Store-Zugriffe
vermeidende Funktionen in `src/pages/progress/statistik.ts`
(`statistik.test.ts`), damit sie unabhängig von React und dem Store
unit-getestet werden können.

## Berechnungen der letzten 7 Tage

`berechnungenProTag(verlauf, tage = 7, jetzt = new Date())` liefert für jeden
der letzten `tage` Kalendertage (inklusive heute, älteste zuerst) `{ datum,
wochentag, anzahl }`. Kalendertage werden über lokale `Date`-Komponenten
bestimmt (nicht über UTC/Millisekunden-Subtraktion), analog zum Streak in
`gamificationSlice.ts` - ein Zeitzonen- oder Sommer-/Winterzeitwechsel
verschiebt einen Eintrag dadurch nicht auf den falschen Tag.

`src/pages/progress/BerechnungenChart.tsx` stellt das Ergebnis als
Balkendiagramm dar (ein Balken je Tag, Höhe relativ zum Tag mit den meisten
Berechnungen, Wert und Wochentag als Beschriftung). Sind alle 7 Tage leer,
zeigt die Kachel in `ProgressPage.tsx` stattdessen einen erklärenden
Hinweistext statt eines Diagramms ohne erkennbare Balken.

## Quiz-Trefferquote und Rundenanzahl

`berechneQuizStatistik(quizErgebnisse, anzahlRunden)` liefert `{ anzahlRunden,
trefferquote }`:

- `anzahlRunden` kommt unverändert aus dem Aufrufparameter - in
  `ProgressPage.tsx` ist das `gamification.anzahlQuizRunden`, der einzige
  Zähler, der nicht auf `MAX_QUIZ_ERGEBNISSE` gekappt ist.
- `trefferquote` ist der Anteil richtiger Antworten (`0..1`) über die
  gespeicherten Einträge aus `quizErgebnisse` (Summe `anzahlRichtig` durch
  Summe `anzahlAufgaben`), da einzelne Trefferzahlen älterer Runden nicht
  darüber hinaus gespeichert werden. Ohne gespeicherte Rundenergebnisse ist
  `trefferquote` `null` - `ProgressPage.tsx` zeigt in diesem Fall einen
  Leerzustand statt einer Trefferquote von 0 %.

## Meistgenutzte Formeln

`topFormeln(formelNutzung, katalog, anzahl = 3)` sortiert die Einträge aus
`formelNutzung` (siehe [state.md](./state.md), IRGENDWAST-49) absteigend nach
Nutzungsanzahl, löst die id über den übergebenen Katalog zur `Formula` auf und
liefert die ersten `anzahl` Treffer als `{ formula, anzahl }`. Ids ohne
passende Formel im Katalog (z. B. nach dessen Änderung) werden übersprungen
statt einen Fehler zu werfen. Ohne jede Nutzung liefert die Funktion eine
leere Liste, `ProgressPage.tsx` zeigt dann einen erklärenden Hinweistext.

## Aufbau

```
src/pages/
  ProgressPage.tsx              – Dashboard: drei Kacheln, je mit Leerzustand
  ProgressPage.css
  progress/
    statistik.ts                – berechnungenProTag(), berechneQuizStatistik(), topFormeln()
    statistik.test.ts
    BerechnungenChart.tsx        – Balkendiagramm für berechnungenProTag()
    BerechnungenChart.css
```
