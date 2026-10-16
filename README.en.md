<h1 align="center">☀️ Feed-in Tariff Card</h1>

<p align="center">
  <a href="README.md">🇩🇪 Deutsch</a> &nbsp;|&nbsp; 🇬🇧 English
</p>

<p align="center">
  <b>Track what your utility owes you for your solar feed-in – advance payments, remuneration and balance in one dashboard card.</b>
</p>

<p align="center">
  <a href="https://github.com/hacs/integration"><img alt="HACS Custom" src="https://img.shields.io/badge/HACS-Custom-41BDF5.svg"></a>
  <img alt="Status Beta" src="https://img.shields.io/badge/Status-Beta-orange.svg">
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-green.svg">
</p>

<p align="center">
  <img alt="Evaluation" src="https://raw.githubusercontent.com/Hoffis-Welt/hacs-einspeiseverguetung/main/docs/auswertung.png" width="720">
</p>

In Germany, feed-in remuneration (EEG) is usually paid as monthly **advance payments** and settled once a year.
This card compares the actual remuneration (kWh per day × the rate valid on that day) with your advance payments and shows
the **balance** and a **year-end forecast**. No helpers, template sensors or YAML needed – everything is stored in
Home Assistant's **long-term statistics**.

> The card UI is currently **German only**. Translations are welcome.

## Screenshots

| Evaluation | Input | Dark theme |
|:---:|:---:|:---:|
| <img alt="Evaluation" src="https://raw.githubusercontent.com/Hoffis-Welt/hacs-einspeiseverguetung/main/docs/auswertung.png" width="300"> | <img alt="Input" src="https://raw.githubusercontent.com/Hoffis-Welt/hacs-einspeiseverguetung/main/docs/eingabe.png" width="300"> | <img alt="Dark theme" src="https://raw.githubusercontent.com/Hoffis-Welt/hacs-einspeiseverguetung/main/docs/auswertung-dark.png" width="300"> |

*Screenshots show sample data.*

## Features
- **One card** (`custom:einspeiseverguetung-card`) with the tabs **Auswertung** (evaluation) and **Eingabe** (input). The input tab can be hidden for a read-only card.
- Monthly table: kWh, remuneration, advance payment, difference; totals, **balance**, **year-end forecast**, deviation from the final settlement
- Enter advance payments, the annual settlement and **rates with a valid-from date** via a form
- **Only three inputs:** utility name, export counter and optionally a feed-in price. The card creates everything else internally
- Follows your theme (light/dark)

> **Beta (version 0.x):** Used daily, but not yet tested on many installations. Please report problems as an [issue](https://github.com/Hoffis-Welt/hacs-einspeiseverguetung/issues).

## Requirements
- Home Assistant 2024.x or newer with the recorder
- An increasing energy counter for exported energy (kWh) **with long-term statistics** (`state_class: total_increasing`)
- Writing to the statistics requires an **administrator** user

## Installation via HACS

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Hoffis-Welt&repository=hacs-einspeiseverguetung&category=plugin)

1. Click the button (or: HACS → ⋮ → **Custom repositories** → this repository's URL, category **Dashboard**)
2. Download "Einspeisevergütung Karte"
3. Hard-reload the browser (Ctrl+F5). HACS registers the resource automatically.
4. In your dashboard: **Add card** → "Einspeisevergütung"

## Configuration
Add the card "Einspeisevergütung" to your dashboard. Only three inputs are needed in the editor:

<p align="center">
  <img alt="Card editor" src="https://raw.githubusercontent.com/Hoffis-Welt/hacs-einspeiseverguetung/main/docs/editor.png" width="420">
</p>

| Field | Meaning | Required |
|---|---|---|
| Name of the utility | Used in titles/texts (`versorger`) | yes |
| Export energy counter | Counter of exported energy in kWh (`quelle`). All months are calculated retroactively from its long-term statistics, as far back as the counter goes | yes |
| Feed-in price | Optional entity in ct/kWh or €/kWh (`preis`). Empty = maintain the rate in the input tab with a valid-from date. With an entity, its long-term statistics history is used (without history: the current value for all days) | no |

Everything else is handled internally: advance payments, the annual settlement and (without a price entity) the rate are stored automatically in their own statistics. Their names are assigned when the card is created (`instanz`, e.g. `einspeisung_x1y2z`) and never change, even if you rename the utility later. The input tab is shown to administrators only.

```yaml
type: custom:einspeiseverguetung-card
versorger: My Utility
quelle: sensor.pv_export_total
preis: sensor.feed_in_price   # optional
```

Optional, YAML only: `titel` (card title), `eingabe_anzeigen: false` (hide the input tab), `abschlag_vorgabe` (pre-filled advance payment in €). A copied card with the same `instanz` shares the same data.

### First steps
1. In the **Eingabe** tab, enter the **rate** (ct/kWh, valid from date, e.g. commissioning date)
2. Enter the monthly **advance payments**
3. After the annual settlement, enter the **settlement amount** (positive = the utility pays you)

## Notes
- The card calculates from your meter values and the entered rate. The statement from your utility is always authoritative.
- Missing advance payments are forecast with the last known amount.
- A settlement amount of 0 counts as "not entered".
- The internal statistics are created with the first entry. The card shows every year the counter has data for.

## License
MIT
