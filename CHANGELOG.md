# Changelog

## 0.10.0
- Editor fragt nur noch drei Angaben ab: Versorgername, Einspeise-Zähler, optional Einspeisepreis
- Abschläge, Abrechnung und (intern) Vergütungssatz werden automatisch in Statistiken mit fester, beim Anlegen vergebener Kennung (`instanz`) gespeichert
- Einspeisepreis wahlweise im Reiter „Eingabe“ (mit Gültig-ab-Datum) oder über eine externe Entität (Verlauf aus deren Langzeitstatistik)
- Jahresauswahl beginnt im ersten Jahr der Zählerdaten
- Reiter „Eingabe“ wird für Nicht-Administratoren automatisch ausgeblendet
- Bestehende Karten mit den bisherigen `stat_*`-Feldern funktionieren unverändert weiter

## 0.9.0 – erste öffentliche Beta
- Eine Karte `custom:einspeiseverguetung-card` mit den Reitern **Auswertung** und **Eingabe**
- Monatstabelle, Saldo, Prognose Jahresende, Abweichung zur Abrechnung
- Eingabe von Abschlägen, Jahresabrechnung und Vergütungssatz (mit Gültig-ab-Datum) in die Langzeitstatistik
- Karteneditor mit Versorgername und „➕ Neu anlegen…“ für die Statistiken
- Interne Jahresauswahl (◀ ▶), keine Hilfsentität nötig
- Hell/Dunkel-Theme
