# Einspeisevergütung Karten für Home Assistant

Zwei Dashboard-Karten, um die **Einspeisevergütung** und die **Abschläge** des Netzbetreibers/Versorgers
zu erfassen und auszuwerten – ohne Helfer, Template-Sensoren oder YAML. Alle Werte liegen in der
**Langzeitstatistik** von Home Assistant.

## Funktionen
- **Eingabekarte** (`custom:einspeiseverguetung-eingabe-card`)
  - monatliche Abschläge, Jahresabrechnung (Ausgleich) und Vergütungssätze **mit Gültig-ab-Datum** per Formular
  - Zeile antippen = ins Formular übernehmen; gleicher Monat/Jahr/Datum überschreibt
- **Auswertungskarte** (`custom:einspeiseverguetung-auswertung-card`)
  - Monatstabelle: kWh, Vergütung (kWh je Tag × am Tag gültiger Satz), Abschlag, Differenz
  - Summe, **Saldo** und **Prognose Jahresende**, Abweichung zur Abrechnung
- Jahr umschalten mit ◀ ▶ (beide Karten synchron)
- Konfiguration komplett im Karteneditor, inkl. **Name des Einspeiseversorgers**

## Voraussetzungen
- Home Assistant 2024.x oder neuer mit Recorder
- Ein aufsteigender Zähler der eingespeisten Energie (kWh) **mit Langzeitstatistik** (state_class `total_increasing`)
- Schreiben in die Statistik braucht einen **Administrator-Benutzer**

## Installation über HACS
1. HACS → ⋮ → **Benutzerdefinierte Repositories** → URL dieses Repositories, Kategorie **Dashboard**
2. „Einspeisevergütung Karten“ herunterladen
3. Browser hart neu laden (Strg+F5). HACS trägt die Ressource automatisch ein.

## Einrichtung
Karte im Dashboard hinzufügen (Suche: „Einspeisevergütung“) und im Editor einstellen:

| Feld | Bedeutung | Standard |
|---|---|---|
| `versorger` | Name des Einspeiseversorgers (Titel/Texte) | `Versorger` |
| `titel` | Kartentitel (leer = automatisch) | – |
| `jahr_entity` | optional: `input_select` mit den Jahren als Optionen. Leer = interne Jahresauswahl. Mit Entität schalten beide Karten gemeinsam und merken sich das Jahr | leer |
| `quelle` | **Auswertung:** Einspeise-Zähler (kWh) | – (Pflicht) |
| `stat_abschlag` | Statistik-ID Abschlag je Monat | `einspeisung:abschlag_monat` |
| `stat_abschlag_gesamt` | **Eingabe:** Statistik-ID Gesamtsumme | `einspeisung:abschlag_gesamt` |
| `stat_abrechnung` | Statistik-ID Abrechnung | `einspeisung:abrechnung` |
| `stat_satz` | Statistik-ID Vergütungssatz (ct/kWh) | `einspeisung:verguetung_satz` |
| `abschlag_vorgabe` | **Eingabe:** vorbelegter Abschlag in € für leere Monate | leer |

Beide Karten müssen **dieselben** Statistik-IDs verwenden. Die Statistik-IDs haben das Format
`quelle:name`; sie werden beim ersten Eintragen automatisch angelegt.

**Statistik neu anlegen:** Im Karteneditor listet jedes Statistik-Feld die vorhandenen Statistiken. Mit
„➕ Neu anlegen…“ gibst du eine neue ID ein (Vorschlag und Formatprüfung inklusive, Duplikate werden
abgelehnt). Die Statistik entsteht mit dem ersten Eintrag in der Eingabekarte; bis dahin zeigt die Karte
„noch keine Daten“. Der Einspeise-Zähler (kWh) ist ein vorhandener Sensor und nur auswählbar.

Beispiel (YAML):
```yaml
type: custom:einspeiseverguetung-auswertung-card
versorger: Stadtwerke
quelle: sensor.pv_einspeisung_gesamt
jahr_entity: input_select.pv_auswertungsjahr
```

### Erste Schritte
1. In der Eingabekarte **Vergütungssatz** eintragen (ct/kWh, ab Datum, z. B. Inbetriebnahme)
2. **Abschläge** je Monat eintragen
3. Nach der Jahresabrechnung den **Ausgleich** eintragen (positiv = Versorger zahlt dir)

## Hinweise
- Der Satz gilt ab seinem Datum, frühere Zeiträume rechnen mit dem damals gültigen Satz.
- Fehlende Abschläge werden in der Prognose mit dem zuletzt bekannten Abschlag angesetzt.
- Ein Abrechnungs-Ausgleich von 0 gilt als „nicht eingetragen“.
- Statistik-IDs nachträglich ändern übernimmt keine alten Daten.
- Die alten Kartennamen `custom:ewa-eingabe-card` und `custom:ewa-auswertung-card` funktionieren weiter.

## Umstieg von der lokalen Version (`/local/ewa-*.js`)
1. Über HACS installieren
2. Die beiden alten Ressourcen unter *Einstellungen → Dashboards → Ressourcen* entfernen
3. Bestehende Karten und Statistik-IDs (`ewa:…`) bleiben unverändert nutzbar

## Lizenz
MIT
