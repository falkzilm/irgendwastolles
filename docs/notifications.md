# Gamification-Benachrichtigungen

Dieses Dokument beschreibt die gemeinsam genutzte Benachrichtigungs-/
Event-Anbindung für Gamification-Ereignisse (IRGENDWAST-46) und ist die
Grundlage aller weiteren UI-Items dieses Features (z. B. eine künftige
XP-Gewinn-Animation im Rechner).

## Baustein: `ui/Toast.tsx`

Die generische Toast-Infrastruktur aus [state.md](./state.md) (`ToastProvider`,
`useToast`) ist die Basis: `showToast(message, variant?, title?)` zeigt eine
Benachrichtigung, die

- nach `AUTO_DISMISS_MS` (5 s) automatisch verschwindet,
- über einen Schließen-Button manuell entfernt werden kann,
- bei mehreren gleichzeitigen Aufrufen im `ui-toast-viewport` untereinander
  gestapelt statt überlagert erscheint,
- keine Eingaben blockiert: der Viewport selbst hat `pointer-events: none`,
  nur die einzelnen Benachrichtigungen (inkl. Schließen-Button) sind
  interaktiv, sodass z. B. der Rechner darunter weiterhin bedienbar bleibt.

Der optionale dritte Parameter `title` rendert einen fett hervorgehobenen
Titel über der eigentlichen Nachricht (`message` dient dabei als
Beschreibung) - genau das Schema, das Level-Up- und
Achievement-Unlock-Benachrichtigungen benötigen.

## Baustein: `app/GamificationNotifications.tsx`

Eine unsichtbare Komponente, die einmal in `App.tsx` innerhalb des
`ToastProvider` gerendert wird. Sie abonniert `gamification.level` und
`gamification.freigeschalteteAchievements` aus dem Store (siehe
[state.md](./state.md)) und vergleicht sie bei jeder Änderung mit dem
zuletzt gesehenen Stand:

- ein gestiegenes `level` löst eine Benachrichtigung mit Titel
  `"Level {n} erreicht!"` aus,
- jede neu in `freigeschalteteAchievements` aufgetauchte id löst eine
  Benachrichtigung mit Titel `"{icon} {title}"` und der
  Achievement-`description` als Nachricht aus (siehe
  [achievements.md](./achievements.md)).

Der erste Effekt-Durchlauf nach dem Mount merkt sich nur den Ausgangsstand
ohne eine Benachrichtigung zu zeigen - sonst würde das bereits vor dem ersten
Render hydrierte Profil (siehe [persistence.md](./persistence.md)) beim
App-Start fälschlich als Level-Up bzw. frisch freigeschaltete Achievements
erscheinen.

Da die Komponente direkt auf Store-Änderungen reagiert, muss kein Aufrufer
von `recordEvent` (z. B. `QuizPage`) selbst Benachrichtigungen auslösen -
neue Events lösen automatisch die passende Benachrichtigung aus, sobald sie
zu einem Level-Up oder Achievement-Unlock führen.

## Einstellung: Benachrichtigungen deaktivieren

`settingsSlice.ts` (siehe [state.md](./state.md)) enthält dafür
`notificationsEnabled: boolean` (Default `true`) sowie
`setNotificationsEnabled(enabled)`. `GamificationNotifications` prüft diesen
Wert vor jeder Benachrichtigung; ist er `false`, wird zwar weiterhin der
zuletzt gesehene Stand fortgeschrieben (damit ein späteres Wiedereinschalten
keine während der Deaktivierung aufgelaufenen Ereignisse nachträgt), aber
keine Benachrichtigung angezeigt. `src/pages/SettingsPage.tsx` bietet dafür
einen Schalter auf der neuen "Einstellungen"-Ansicht. `notificationsEnabled`
wird wie `theme`/`angleMode`/`calculatorMode` über `src/store/persistence.ts`
persistiert, siehe [persistence.md](./persistence.md).
