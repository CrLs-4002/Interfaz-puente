/**
 * INTERFAZ PUENTE — MÓDULO DE SÍNTESIS DE VOZ (TTS)
 * Cumple con accesibilidad COGA y Web Speech API.
 * Voz optimizada para español de Chile y Latinoamérica con cadencia pausada.
 */

class PuenteSpeech {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voice = null;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.onStatusChange = null;

    if (this.synth) {
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices() || [];
    // Prioridad: español de Chile, neutro latinoamericano o variantes hispanas
    const preferredLangs = ['es-CL', 'es-419', 'es-MX', 'es-US', 'es-AR', 'es-ES'];

    for (const pref of preferredLangs) {
      const match = voices.find(v => v.lang && v.lang.replace('_', '-').toLowerCase() === pref.toLowerCase());
      if (match) {
        this.voice = match;
        return;
      }
    }

    // Fallback: cualquier voz en español
    const anyEs = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('es'));
    if (anyEs) {
      this.voice = anyEs;
    }
  }

  prepareTextForSpeech(text) {
    if (!text) return '';
    let clean = text.replace(/[*_#]/g, '').trim();

    // 1. Quitar prefijos técnicos de moneda (CLP, CLP$)
    clean = clean.replace(/\bCLP\s*\$?/gi, '');

    // 2. Reemplazar $ seguido de cifras por su valor numérico acompañado exclusivamente de la palabra "pesos" (o "peso" si es 1)
    // Ejemplo: $50.000 -> 50.000 pesos; $ 350.000 -> 350.000 pesos; $1 -> 1 peso
    clean = clean.replace(/\$\s*(\d{1,3}(?:\.\d{3})+|\d+)/g, (match, numStr) => {
      const cleanNum = numStr.trim();
      return cleanNum === '1' ? '1 peso' : `${cleanNum} pesos`;
    });

    // 3. Reemplazar cualquier mención de dólares o pesos chilenos para que la voz solo diga "pesos"
    clean = clean.replace(/\b(d[oó]lares\s+americanos?|d[oó]lares|d[oó]lar)\b/gi, 'pesos');
    clean = clean.replace(/\bpesos\s+chilenos?\b/gi, 'pesos');

    // 4. Si queda algún símbolo $ residual
    clean = clean.replace(/\$/g, 'pesos');

    // 5. Evitar redundancias como "pesos pesos"
    clean = clean.replace(/\bpesos\s+pesos\b/gi, 'pesos');

    // 6. Normalizar espacios
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
  }

  speak(text, onEnd) {
    if (!this.synth) {
      console.warn('Síntesis de voz no soportada en este navegador.');
      if (onEnd) onEnd();
      return;
    }

    // Si ya está hablando, detener para evitar solapamientos
    this.stop();

    const cleanText = this.prepareTextForSpeech(text);
    if (!cleanText) return;

    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance.lang = this.voice ? this.voice.lang : 'es-CL';
    if (this.voice) {
      this.currentUtterance.voice = this.voice;
    }
    // Velocidad pausada (0.88 - 0.90) para que Elena y personas mayores comprendan sin apuro
    this.currentUtterance.rate = 0.88;
    this.currentUtterance.pitch = 1.0;

    this.isSpeaking = true;
    if (this.onStatusChange) this.onStatusChange(true);

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onStatusChange) this.onStatusChange(false);
      if (onEnd) onEnd();
    };

    this.currentUtterance.onerror = (e) => {
      console.warn('Error en SpeechSynthesis:', e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onStatusChange) this.onStatusChange(false);
      if (onEnd) onEnd();
    };

    try {
      this.synth.speak(this.currentUtterance);
    } catch (err) {
      console.error('Error al ejecutar speak():', err);
      this.isSpeaking = false;
      if (this.onStatusChange) this.onStatusChange(false);
      if (onEnd) onEnd();
    }
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    if (this.onStatusChange) this.onStatusChange(false);
  }
}

// Instancia global
window.puenteSpeech = new PuenteSpeech();
