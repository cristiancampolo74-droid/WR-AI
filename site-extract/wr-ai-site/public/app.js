const $ = (id) => document.getElementById(id);
const messages = $('messages');
const form = $('chatForm');
const input = $('messageInput');
const micButton = $('micButton');
const assistantCard = document.querySelector('.assistant-card');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isGitHubPages = window.location.hostname.endsWith('.github.io');
let recognition = null;
let listening = false;
let toastTimer;

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
  if (text.includes('ciao') || text.includes('mi senti')) {
    return 'Ti sento! WR AI è avviato in modalità demo. Le risposte AI reali richiedono il server.';
  }
  return 'Ho ricevuto la domanda. Questa versione pubblica è in modalità demo: possiamo testare interfaccia, microfono e audio.';
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}
function setState(state, hint) {
  assistantCard.classList.toggle('listening', state === 'listening');
  $('assistantTitle').textContent = state === 'listening' ? 'Ti sto ascoltando.' : state === 'thinking' ? 'Ci sto pensando…' : state === 'speaking' ? 'Sto rispondendo.' : 'Pronto quando vuoi.';
  $('assistantHint').textContent = hint || 'Premi il microfono e fai una domanda.';
  $('micButtonText').textContent = state === 'listening' ? 'Interrompi ascolto' : 'Premi per parlare';
  micButton.disabled = state === 'thinking';
  micButton.style.opacity = state === 'thinking' ? '.65' : '1';
}
function addMessage(text, role, label = '') {
  const row = document.createElement('div');
  row.className = `message ${role === 'user' ? 'user-message' : 'assistant-message'}`;
  const avatar = document.createElement('span');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? 'TU' : 'WR';
  const content = document.createElement('div');
  const author = document.createElement('span');
  author.className = 'message-author';
  author.textContent = role === 'user' ? 'TU' : 'WR AI';
  const small = document.createElement('small');
  small.textContent = label || 'ORA';
  author.append(' ', small);
  const p = document.createElement('p');
  p.textContent = text;
  content.append(author, p);
  row.append(avatar, content);
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
  return row;
}
function speak(text) {
  if (!('speechSynthesis' in window)) {
    $('audioStatus').textContent = 'VOCE NON DISPONIBILE';
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'it-IT';
  utterance.rate = 1.02;
  utterance.pitch = 1;
  utterance.onstart = () => setState('speaking', 'Risposta in riproduzione. L’audio segue l’uscita scelta dal telefono.');
  utterance.onend = () => setState('idle', 'Premi il microfono e fai un’altra domanda.');
  utterance.onerror = () => setState('idle', 'Risposta pronta. Se non senti l’audio, controlla il volume e l’uscita Bluetooth.');
  window.speechSynthesis.speak(utterance);
}
async function sendMessage(message) {
  const cleaned = message.trim();
  if (!cleaned) return;
  addMessage(cleaned, 'user');
  input.value = '';
  setState('thinking', 'Sto preparando una risposta…');
  try {
    if (isGitHubPages) {
      const reply = demoAnswer(cleaned);
      addMessage(reply, 'assistant', 'DEMO');
      speak(reply);
      return;
    }
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: cleaned })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Errore durante la richiesta.');
    addMessage(data.reply, 'assistant', data.demo ? 'DEMO' : 'AI');
    if (data.demo) toast('Modalità demo: aggiungi una chiave API per attivare l’AI.');
    speak(data.reply);
  } catch (error) {
    addMessage(error.message || 'Non riesco a raggiungere il server.', 'assistant', 'ERRORE');
    setState('idle', 'Controlla che il server WR AI sia avviato e riprova.');
    toast('Connessione non riuscita.');
  }
}
function startRecognition() {
  if (!SpeechRecognition) {
    toast('Il riconoscimento vocale non è supportato da questo browser. Puoi scrivere nel campo qui sotto.');
    $('speechSupport').textContent = 'Questo browser non espone il riconoscimento vocale. Prova un browser compatibile o usa la tastiera.';
    return;
  }
  if (listening && recognition) { recognition.stop(); return; }
  recognition = new SpeechRecognition();
  recognition.lang = 'it-IT';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => { listening = true; setState('listening', 'Parla ora, poi attendi la risposta.'); };
  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || '';
    if (transcript) sendMessage(transcript);
  };
  recognition.onerror = (event) => {
    const errors = { 'not-allowed': 'Permetti al browser di usare il microfono nelle impostazioni.', 'no-speech': 'Non ho sentito nulla. Riprova parlando vicino al microfono.', 'audio-capture': 'Non trovo un microfono disponibile.' };
    toast(errors[event.error] || `Problema con il microfono: ${event.error}`);
  };
  recognition.onend = () => { listening = false; if (!assistantCard.classList.contains('speaking')) setState('idle', 'Premi il microfono e fai una domanda.'); };
  try { recognition.start(); } catch { toast('Il microfono è già attivo. Attendi un momento e riprova.'); }
}
micButton.addEventListener('click', startRecognition);
form.addEventListener('submit', (event) => { event.preventDefault(); sendMessage(input.value); });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => sendMessage(button.dataset.prompt)));
$('clearChat').addEventListener('click', () => {
  messages.replaceChildren();
  addMessage('Conversazione pulita. Dimmi pure, sono qui.', 'assistant');
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  setState('idle');
});

async function checkStatus() {
  if (isGitHubPages) {
    $('serverDot').classList.add('online');
    $('serverStatus').textContent = 'GitHub Pages · modalità demo';
    $('audioStatus').textContent = 'PRONTO AL TEST';
    $('speechSupport').textContent = 'Versione pubblica demo: chat, interfaccia e voce sono testabili; le risposte AI reali richiedono il backend.';
    return;
  }
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    $('serverDot').classList.add('online');
    $('serverStatus').textContent = data.aiConfigured ? 'AI collegata' : 'Server online · modalità demo';
    $('audioStatus').textContent = 'PRONTO AL TEST';
    if (!data.aiConfigured) $('speechSupport').textContent = 'Modalità demo attiva: interfaccia e voce sono testabili; configura l’API per le risposte AI reali.';
  } catch {
    $('serverStatus').textContent = 'Server non raggiungibile';
    $('serverDot').classList.remove('online');
    $('audioStatus').textContent = 'SERVER OFFLINE';
  }
}
checkStatus();
