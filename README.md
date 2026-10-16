<h1 align="center">☀️ Einspeisevergütung Karte</h1>

<p align="center">
  <b>Behalte im Blick, was dir dein Versorger für den PV-Strom schuldet – Abschläge, Vergütung und Saldo in einer Dashboard-Karte.</b>
</p>

<p align="center">
  <a href="https://github.com/hacs/integration"><img alt="HACS Custom" src="https://img.shields.io/badge/HACS-Custom-41BDF5.svg"></a>
  <img alt="Home Assistant" src="https://img.shields.io/badge/Home%20Assistant-2024.x%2B-03a9f4.svg">
  <img alt="Lizenz MIT" src="https://img.shields.io/badge/Lizenz-MIT-green.svg">
  <img alt="Status Beta" src="https://img.shields.io/badge/Status-Beta-orange.svg">
</p>

<p align="center">
  <img alt="Auswertung" src="https://raw.githubusercontent.com/Hoffis-Welt/hacs-einspeiseverguetung/main/docs/auswertung.png" width="720">
</p>

Die Karte vergleicht die **Einspeisevergütung** (kWh je Tag × am Tag gültiger Satz) mit den **monatlichen
Abschlägen** des Netzbetreibers/Versorgers und zeigt den **Saldo** sowie eine **Prognose zum Jahresende**.
Alles ohne Helfer, Template-Sensoren oder YAML – alle Werte liegen in der **Langzeitstatistik** von Home Assistant.

## Screenshots

| Auswertung | Eingabe | Dunkles Theme |
|:---:|:---:|:---:|
| <img alt="Auswertung" src="https://raw.githubusercontent.com/Hoffis-Welt/hacs-einspeiseverguetung/main/docs/auswertung.png" width="300"> | <img alt="Eingabe" src="https://raw.githubusercontent.com/Hoffis-Welt/hacs-einspeiseverguetung/main/docs/eingabe.png" width="300"> | <img alt="Dunkles Theme" src="https://raw.githubusercontent.com/Hoffis-Welt/hacs-einspeiseverguetung/main/docs/auswertung-dark.png" width="300"> |

*Die Screenshots zeigen Beispieldaten.*

## Funktionen
- **Eine Karte für alles** (`custom:einspeiseverguetung-card`) mit den Reitern **Auswertung** und **Eingabe** – einmal konfigurieren, fertig. Der Eingabe-Reiter lässt sich ausblenden (reine Anzeige).
- **Auswertung**
  - Monatstabelle: kWh, Vergütung, Abschlag, Differenz
  - Summe, **Saldo** (wer schuldet wem wie viel), **Prognose Jahresende**, Abweichung zur Abrechnung
  - Jahr umschalten mit ◀ ▶ (ohne Hilfsentität)
- **Eingabe**
  - monatliche Abschläge, Jahresabrechnung (Ausgleich) und Vergütungssätze **mit Gültig-ab-Datum** per Formular
  - Zeile antippen = ins Formular übernehmen; gleicher Monat/Jahr/Datum überschreibt
- **Komplett im Karteneditor konfigurierbar**, inkl. Name des Einspeiseversorgers und „➕ Neu anlegen…“ für die Statistiken
- Passt sich dem Theme an (hell/dunkel)

> **Beta (Version 0.x):** Die Karte ist im Alltag im Einsatz, wurde aber noch nicht von vielen Installationen getestet. Rückmeldungen und Fehler gerne als [Issue](https://github.com/Hoffis-Welt/hacs-einspeiseverguetung/issues) melden.

## Voraussetzungen
- Home Assistant 2024.x oder neuer mit Recorder
- Ein aufsteigender Zähler der eingespeisten Energie (kWh) **mit Langzeitstatistik** (state_class `total_increasing`)
- Schreiben in die Statistik braucht einen **Administrator-Benutzer**

## Installation über HACS
1. HACS → ⋮ → **Benutzerdefinierte Repositories** → URL dieses Repositories, Kategorie **Dashboard**
2. „Einspeisevergütung Karte“ herunterladen
3. Browser hart neu laden (Strg+F5). HACS trägt die Ressource automatisch ein.

## Einrichtung
Karte „Einspeisevergütung“ im Dashboard hinzufügen und im Editor einstellen:

| Feld | Bedeutung | Standard |
|---|---|---|
| `versorger` | Name des Einspeiseversorgers (Titel/Texte) | `Versorger` |
| `titel` | Kartentitel (leer = automatisch) | – |
| `quelle` | Einspeise-Zähler (kWh), Pflicht für die Auswertung | – |
| `eingabe_anzeigen` | Reiter „Eingabe“ anzeigen (`false` = reine Anzeige) | `true` |
| `stat_abschlag` | Statistik-ID Abschlag je Monat | `einspeisung:abschlag_monat` |
| `stat_abschlag_gesamt` | Statistik-ID Gesamtsumme (Eingabe) | `einspeisung:abschlag_gesamt` |
| `stat_abrechnung` | Statistik-ID Abrechnung | `einspeisung:abrechnung` |
| `stat_satz` | Statistik-ID Vergütungssatz (ct/kWh) | `einspeisung:verguetung_satz` |
| `abschlag_vorgabe` | vorbelegter Abschlag in € für leere Monate (Eingabe) | leer |

Die Statistik-IDs haben das Format
`quelle:name`; sie werden beim ersten Eintragen automatisch angelegt.

**Statistik neu anlegen:** Im Karteneditor listet jedes Statistik-Feld die vorhandenen Statistiken. Mit
„➕ Neu anlegen…“ gibst du eine neue ID ein (Vorschlag und Formatprüfung inklusive, Duplikate werden
abgelehnt). Die Statistik entsteht mit dem ersten Eintrag im Reiter „Eingabe“; bis dahin zeigt die Karte
„noch keine Daten“. Der Einspeise-Zähler (kWh) ist ein vorhandener Sensor und nur auswählbar.

Beispiel (YAML):
```yaml
type: custom:einspeiseverguetung-card
versorger: Stadtwerke
quelle: sensor.pv_einspeisung_gesamt
```

### Erste Schritte
1. Im Reiter **Eingabe** den **Vergütungssatz** eintragen (ct/kWh, ab Datum, z. B. Inbetriebnahme)
2. **Abschläge** je Monat eintragen
3. Nach der Jahresabrechnung den **Ausgleich** eintragen (positiv = Versorger zahlt dir)

## Hinweise
- Der Satz gilt ab seinem Datum, frühere Zeiträume rechnen mit dem damals gültigen Satz.
- Fehlende Abschläge werden in der Prognose mit dem zuletzt bekannten Abschlag angesetzt.
- Ein Abrechnungs-Ausgleich von 0 gilt als „nicht eingetragen“.
- Statistik-IDs nachträglich ändern übernimmt keine alten Daten.

## Lizenz
MIT
