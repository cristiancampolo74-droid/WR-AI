import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: '30kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const instructions = `Sei WR AI, un assistente vocale in italiano pensato per un motociclista. Rispondi in modo naturale, chiaro e breve, adatto all'ascolto in cuffia. Il profilo iniziale della moto è Husqvarna WR 125 2T; il proprietario ha indicato un carburatore da 38 mm e una miscela abituale al 2,2%, ma verifica sempre i dettagli se importanti. Per domande meccaniche non fingere certezze: spiega quando servono controlli dal meccanico. Non incoraggiare mai a guardare o toccare il telefono mentre si guida. Se l'utente è in movimento, suggerisci di fermarsi in sicurezza prima di fare operazioni che richiedono attenzione visiva.`;

function demoAnswer(message) {
  const text = message.toLowerCase();
  if (text.includes('miscela') || text.includes('olio')) {
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*litri?/);
    const liters = match ? Number(match[1].replace(',', '.')) : 5;
    const percent = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
    const pct = percent ? Number(percent[1].replace(',', '.')) : 2.2;
    const ml = Math.round(liters * 1000 * pct / 100);
    return `Per ${liters} litri di benzina, al ${String(pct).replace('.', ',')} per cento, servono circa ${ml} millilitri di olio. Verifica sempre la percentuale consigliata per la tua configurazione.`;
  }
  if (text.includes('ciao') || text.includes('mi senti')) return 'Ti sento! WR AI è avviato in modalità demo. Quando configureremo la chiave API, potrò rispondere con l’intelligenza artificiale.';
  return 'Ho ricevuto la domanda. Questa è la modalità demo: configura una chiave API nel file .env per attivare le risposte AI reali. Intanto possiamo testare microfono, interfaccia e audio.';
}

app.get('/api/status', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_MODEL || 'gpt-4.1-mini' });
});

app.post('/api/chat', async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'Scrivi o pronuncia una domanda.' });
  if (message.length > 4000) return res.status(413).json({ error: 'La domanda è troppo lunga.' });

  if (!process.env.OPENAI_API_KEY) {
    return res.json({ reply: demoAnswer(message), demo: true });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        instructions,
        input: message,
        max_output_tokens: 220
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI API error:', data?.error?.message || response.statusText);
      return res.status(502).json({ error: 'Il servizio AI non ha risposto. Controlla la chiave API e la configurazione del progetto.' });
    }
    const reply = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(part => part.type === 'output_text')
      .map(part => part.text)
      .join('\n').trim();
    if (!reply) return res.status(502).json({ error: 'Non è arrivata una risposta testuale. Riprova.' });
    return res.json({ reply, demo: false });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Errore di connessione al server. Riprova.' });
  }
});

app.listen(port, () => console.log(`WR AI disponibile su http://localhost:${port}`));
