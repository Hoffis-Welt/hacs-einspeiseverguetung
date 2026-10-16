<h1 align="center">☀️ Einspeisevergütung Karte</h1>

<p align="center">
  <b>Behalte im Blick, was dir dein Versorger für den PV-Strom schuldet – Abschläge, Vergütung und Saldo in einer Dashboard-Karte.</b>
</p>

<p align="center">
  🇩🇪 Deutsch &nbsp;|&nbsp; <a href="README.en.md">🇬🇧 English</a>
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
- **Nur drei Angaben nötig:** Versorgername, Einspeise-Zähler und optional ein Einspeisepreis. Alles andere legt die Karte intern selbst an
- Passt sich dem Theme an (hell/dunkel)

> **Beta (Version 0.x):** Die Karte ist im Alltag im Einsatz, wurde aber noch nicht von vielen Installationen getestet. Rückmeldungen und Fehler gerne als [Issue](https://github.com/Hoffis-Welt/hacs-einspeiseverguetung/issues) melden.

## Voraussetzungen
- Home Assistant 2024.x oder neuer mit Recorder
- Ein aufsteigender Zähler der eingespeisten Energie (kWh) **mit Langzeitstatistik** (state_class `total_increasing`)
- Schreiben in die Statistik braucht einen **Administrator-Benutzer**

## Installation über HACS

[![Repository in HACS öffnen](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Hoffis-Welt&repository=hacs-einspeiseverguetung&category=plugin)

1. Auf den Button klicken (oder: HACS → ⋮ → **Benutzerdefinierte Repositories** → URL dieses Repositories, Kategorie **Dashboard**)
2. „Einspeisevergütung Karte“ herunterladen
3. Browser hart neu laden (Strg+F5). HACS trägt die Ressource automatisch ein.
4. Im Dashboard **Karte hinzufügen** → „Einspeisevergütung“

## Einrichtung
Karte „Einspeisevergütung“ im Dashboard hinzufügen. Im Editor sind nur drei Angaben nötig:

<p align="center">
  <img alt="Konfiguration im Karteneditor" src="https://raw.githubusercontent.com/Hoffis-Welt/hacs-einspeiseverguetung/main/docs/editor.png" width="420">
</p>

| Feld | Bedeutung | Pflicht |
|---|---|---|
| Name des Einspeiseversorgers | Wird in Titeln und Texten angezeigt (`versorger`) | ja |
| Einspeise-Zähler | Zähler der eingespeisten Energie in kWh (`quelle`). Alle Monate werden rückwirkend aus seiner Langzeitstatistik berechnet, soweit der Zähler zurückreicht | ja |
| Einspeisepreis | Optionale Entität in ct/kWh oder €/kWh (`preis`). Leer = Preis im Reiter „Eingabe“ mit Gültig-ab-Datum pflegen. Mit Entität wird deren Verlauf aus der Langzeitstatistik verwendet (ohne Verlauf der aktuelle Wert für alle Tage) | nein |

Alles andere läuft intern: Abschläge, Abrechnung und (ohne Preis-Entität) der Vergütungssatz werden automatisch in eigenen Statistiken gespeichert. Ihre Namen werden beim Anlegen der Karte vergeben (`instanz`, z. B. `einspeisung_x1y2z`) und ändern sich nicht, auch wenn du den Versorgernamen später änderst. Der Reiter „Eingabe“ erscheint nur für Administratoren.

Beispiel (YAML):
```yaml
type: custom:einspeiseverguetung-card
versorger: Stadtwerke
quelle: sensor.pv_einspeisung_gesamt
preis: sensor.einspeisepreis   # optional
```

Optional, nur per YAML: `titel` (Kartentitel), `eingabe_anzeigen: false` (Reiter „Eingabe“ ausblenden), `abschlag_vorgabe` (vorbelegter Abschlag in €). Eine kopierte Karte mit derselben `instanz` nutzt dieselben Daten.

### Erste Schritte
1. Im Reiter **Eingabe** den **Vergütungssatz** eintragen (ct/kWh, ab Datum, z. B. Inbetriebnahme)
2. **Abschläge** je Monat eintragen
3. Nach der Jahresabrechnung den **Ausgleich** eintragen (positiv = Versorger zahlt dir)

## Häufige Fragen
**Welchen Zähler nehme ich als Einspeise-Zähler?** Einen Sensor, der die ins Netz eingespeiste Energie in kWh hochzählt (z. B. vom Wechselrichter, Smart Meter oder Tibber/Pulse). Er muss `state_class: total_increasing` haben, damit Home Assistant eine Langzeitstatistik führt.

**Wo liegen meine Eingaben?** In der Langzeitstatistik von Home Assistant (Recorder), nicht in Helfern oder Dateien. Sie bleiben bei einem Backup der Datenbank erhalten.

**Warum sehe ich den Reiter „Eingabe“ nicht?** Eingaben sind nur für Administratoren möglich. Für andere Benutzer zeigt die Karte eine Meldung oder lässt sich über `eingabe_anzeigen: false` als reine Anzeige betreiben.

**Ist das meine Abrechnung?** Nein. Die Karte rechnet aus deinen Zählerwerten und dem eingetragenen Satz. Maßgeblich ist immer die Abrechnung deines Versorgers; die Karte hilft, Abweichungen früh zu erkennen.

## Hinweise
- Der Satz gilt ab seinem Datum, frühere Zeiträume rechnen mit dem damals gültigen Satz.
- Fehlende Abschläge werden in der Prognose mit dem zuletzt bekannten Abschlag angesetzt.
- Ein Abrechnungs-Ausgleich von 0 gilt als „nicht eingetragen“.
- Die internen Statistiken entstehen mit dem ersten Eintrag. Die Karte zeigt jedes Jahr, für das der Zähler Daten hat.

## Lizenz
MIT
