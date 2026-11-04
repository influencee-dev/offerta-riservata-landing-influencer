# Socialee · Landing + 1 influencer

Landing statica dell'offerta riservata Black Friday + Natale (€600, landing + 1 micro-influencer). Referente: Carlo Baldassini.

- HTML/CSS/JS senza build, nessun cookie di tracciamento, font self-hosted.
- La pagina è `noindex`: offerta riservata, non pubblica.

## Deploy su Vercel

Importa il repository, framework **Other**, nessun build command, output directory `.` (radice).

## Raccolta contatti su Brevo

I pulsanti WhatsApp ed email aprono prima un piccolo modulo (nome, email, telefono facoltativo, consensi). I dati vanno alla funzione `api/lead.js`, che crea/aggiorna il contatto su Brevo.

Nel progetto Vercel (Settings → Environment Variables) imposta, per Production:

| Variabile | Valore |
|---|---|
| `BREVO_API_KEY` | la chiave API Brevo (mai nel codice) |
| `BREVO_LIST_ID` | `57` |

Poi fai un nuovo deploy. Attributi Brevo usati: `FIRSTNAME`, `TELEFONO`, `SOURCE`, `NOTE`, `OPT_IN`, `OPTIN_TIME`.
