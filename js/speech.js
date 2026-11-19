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

    // 1. Quitar prefijos técnicos de moneda (CLP, CLP$) y puntos suspensivos iniciales
    clean = clean.replace(/^\s*\.{2,}\s*/, '');
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

  getEstimatedDurationMs(text) {
    const clean = this.prepareTextForSpeech(text);
    if (!clean) return 0;
    const words = clean.split(/\s+/).filter(Boolean).length;
    // A velocidad 0.88 en español, cada palabra toma entre 440ms y 500ms
    return Math.max(3000, Math.round((words * 460) / 0.88));
  }

  speak(text, onEnd) {
    const cleanText = this.prepareTextForSpeech(text);
    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const sessionId = (this.speechSessionId || 0) + 1;
    this.speechSessionId = sessionId;

    const estDuration = this.getEstimatedDurationMs(cleanText);
    const minExpectedDuration = Math.round(estDuration * 0.75);
    const startTime = Date.now();
    let hasEnded = false;

    const triggerEnd = () => {
      if (hasEnded || this.speechSessionId !== sessionId) return;
      hasEnded = true;
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onStatusChange) this.onStatusChange(false);
      if (onEnd) onEnd();
    };

    if (!this.synth) {
      console.warn('Síntesis de voz no soportada en este navegador.');
      setTimeout(triggerEnd, estDuration);
      return;
    }

    // Si ya está hablando, detener para evitar solapamientos
    if (this.synth.speaking || this.synth.pending) {
      try { this.synth.cancel(); } catch (e) {}
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    if (this.onStatusChange) this.onStatusChange(false);

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = this.voice ? this.voice.lang : 'es-CL';
    if (this.voice) {
      utter.voice = this.voice;
    }
    // Velocidad pausada (0.88) para que Elena y personas mayores comprendan sin apuro
    utter.rate = 0.88;
    utter.pitch = 1.0;

    this.currentUtterance = utter;
    this.isSpeaking = true;
    if (this.onStatusChange) this.onStatusChange(true);

    utter.onend = () => {
      if (this.speechSessionId !== sessionId) return;
      const elapsed = Date.now() - startTime;
      // Si onend dispara antes del tiempo físico mínimo de locución (bug de cancelación en Chromium/WebKit),
      // esperamos el remanente real para que jamás se corte la voz
      if (elapsed < minExpectedDuration) {
        const remaining = Math.max(0, estDuration - elapsed);
        setTimeout(triggerEnd, remaining);
      } else {
        triggerEnd();
      }
    };

    utter.onerror = (e) => {
      if (this.speechSessionId !== sessionId) return;
      console.warn('Error en SpeechSynthesis:', e);
      if (e && (e.error === 'canceled' || e.error === 'interrupted')) {
        return;
      }
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, estDuration - elapsed);
      setTimeout(triggerEnd, remaining);
    };

    // Temporizador de resguardo máximo para asegurar finalización aunque el navegador no emita eventos
    setTimeout(() => {
      if (this.speechSessionId === sessionId && !hasEnded) {
        triggerEnd();
      }
    }, estDuration + 3500);

    // Timeout de resguardo para WebKit/Blink tras cancel()
    setTimeout(() => {
      if (this.speechSessionId === sessionId) {
        try {
          if (this.synth.paused) {
            this.synth.resume();
          }
          this.synth.speak(utter);
        } catch (err) {
          console.error('Error al ejecutar speak():', err);
          triggerEnd();
        }
      }
    }, 60);
  }

  stop() {
    this.speechSessionId = (this.speechSessionId || 0) + 1;
    if (this.synth) {
      try {
        if (this.synth.speaking || this.synth.pending) {
          this.synth.cancel();
        }
      } catch (e) {}
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    if (this.onStatusChange) this.onStatusChange(false);
  }
}

// Instancia global
window.puenteSpeech = new PuenteSpeech();
