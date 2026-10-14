# WR AI — prototipo sito per assistente da casco

Prima versione del progetto: interfaccia mobile-first, chat, input vocale via Web Speech API quando supportato, risposta letta ad alta voce dal browser e backend che protegge la chiave API.

## Versione pubblica
La demo pubblica è disponibile su [GitHub Pages](https://cristiancampolo74-droid.github.io/WR-AI/). La chat risponde in modalità demo: GitHub Pages serve file statici e non esegue il backend Node.js né le risposte AI reali.

## Requisiti
- Node.js 20 o successivo
- Connessione Internet per usare l'API AI
- Una chiave API OpenAI per le risposte reali (opzionale per la modalità demo)

## Avvio su Windows
1. Estrai la cartella `wr-ai-site`.
2. Installa Node.js 20+ se non è già presente.
3. Fai doppio clic su `Avvia-WR-AI.bat`: installa le dipendenze al primo avvio, avvia il server e apre il sito nel browser.
4. Per fermare il sito, chiudi la finestra del server che si apre.
5. In alternativa, apri il terminale nella cartella del progetto ed esegui `npm install`.
6. Copia `.env.example` in un nuovo file chiamato `.env`.
7. Per le risposte AI reali, apri `.env` e inserisci la chiave dopo `OPENAI_API_KEY=`. Puoi cambiare `OPENAI_MODEL` se necessario.
8. Avvia con `npm start` e apri `http://localhost:3000` sul computer.

Non aprire `public/index.html` direttamente: il sito deve essere servito da Node.js perché la chat usa il backend locale.

Per testarlo su iPhone, computer e iPhone devono essere sulla stessa rete Wi-Fi e devi aprire l'indirizzo IP locale del computer sulla porta 3000. L'accesso a microfono e alcune API del browser può richiedere HTTPS; `localhost` è trattato in modo speciale, ma un IP locale spesso no. Per un test su iPhone conviene poi pubblicare il sito su un hosting HTTPS.

## Come funziona la voce
- Il pulsante microfono usa `SpeechRecognition`/`webkitSpeechRecognition` se il browser lo supporta.
- Le risposte vocali usano `speechSynthesis` e seguono l'uscita audio selezionata dal telefono; collega l'interfono Bluetooth prima del test.
- Il supporto varia tra browser e versioni iOS. Il sito non può garantire ascolto continuo a schermo spento o la parola di attivazione "Ehi WR".
- Se il riconoscimento vocale non è supportato, puoi digitare la domanda.

## Sicurezza
- Non inserire la chiave API in `public/` o in `app.js`.
- Il server restituisce risposte demo se `OPENAI_API_KEY` è vuota.
- Il prototipo non è progettato per essere usato interagendo con lo schermo durante la guida. Prova tutto da fermo.

## Struttura
- `public/index.html`: interfaccia
- `public/styles.css`: grafica responsive
- `public/app.js`: chat, microfono e voce
- `server.js`: API backend e collegamento AI
