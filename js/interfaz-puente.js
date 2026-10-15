/**
 * INTERFAZ PUENTE — PASAMANOS DIGITAL
 * Autores: Carlos Valdés & Sebastián Mardones (INACAP Santiago Centro)
 * Funciones: Botón arrastrable, Foco Dinámico (85%), Traducción Semántica (12 términos),
 * Inactividad a los 15s, Resumen Seguro determinista, Modo Práctica y Autoocultamiento.
 */

class InterfazPuente {
  constructor() {
    this.enabled = true; // Controlado por el Facilitador
    this.semanticMode = true; // Traducción activa por defecto
    this.practiceMode = false;
    this.inactivitySeconds = 0;
    this.inactivityTimer = null;
    this.INACTIVITY_THRESHOLD = 15; // 15 segundos requeridos
    this.successiveIndependentRuns = 0; // Para autoocultamiento
    this.glossary = [];
    this.activeSpotlightElement = null;

    // Elementos DOM
    this.fabContainer = null;
    this.fabBtn = null;
    this.sheetBackdrop = null;
    this.sheet = null;
    this.inactivityBubble = null;
    this.dynamicFocusOverlay = null;
    this.spotlightCard = null;
    this.practiceBanner = null;
    this.onboardingOverlay = null;
    this.termModalOverlay = null;

    this.init();
  }

  async init() {
    this.cacheElements();
    await this.loadGlossary();
    this.setupDraggable();
    this.setupEventListeners();
    this.setupInactivityWatchdog();
    this.checkOnboarding();
  }

  cacheElements() {
    this.fabContainer = document.getElementById('puenteFabContainer');
    this.fabBtn = document.getElementById('puenteFabBtn');
    this.sheetBackdrop = document.getElementById('puenteSheetBackdrop');
    this.sheet = document.getElementById('puenteSheet');
    this.inactivityBubble = document.getElementById('inactivityOfferBubble');
    this.dynamicFocusOverlay = document.getElementById('dynamicFocusOverlay');
    this.spotlightCard = document.getElementById('spotlightGuideCard');
    this.practiceBanner = document.getElementById('practiceBanner');
    this.onboardingOverlay = document.getElementById('puenteOnboardingOverlay');
    this.termModalOverlay = document.getElementById('termModalOverlay');
  }

  async loadGlossary() {
    try {
      const res = await fetch('./data/glossary.json');
      const data = await res.json();
      this.glossary = data.terminos || [];
    } catch (e) {
      console.warn('Cargando glosario fallback integrado:', e);
      // Fallback integrado para garantizar funcionamiento 100% offline
      this.glossary = [
        { id: "transferencia_terceros", termino_bancario: "Transferencia a terceros", traduccion_simple: "Enviar dinero a otra persona", explicacion: "Significa pasarle dinero desde tu cuenta a la de otra persona." },
        { id: "destinatario", termino_bancario: "Destinatario", traduccion_simple: "¿A quién le quieres enviar el dinero?", explicacion: "Es la persona que recibirá tu dinero." },
        { id: "inscribir_destinatario", termino_bancario: "Inscribir destinatario", traduccion_simple: "Guardar los datos de una persona nueva", explicacion: "Es guardar el RUT y cuenta de alguien para no tener que escribirlos de nuevo." },
        { id: "cuenta_cargo", termino_bancario: "Cuenta de cargo", traduccion_simple: "¿De qué cuenta sale tu dinero?", explicacion: "Es tu propia CuentaRUT desde donde se descuenta el monto." },
        { id: "cuenta_destino", termino_bancario: "Cuenta de destino", traduccion_simple: "Cuenta donde llegará el dinero", explicacion: "Es la cuenta bancaria de la persona a quien le transfieres." },
        { id: "tipo_cuenta", termino_bancario: "Tipo de cuenta (CuentaRUT, Cuenta Vista, Cuenta Corriente)", traduccion_simple: "¿Qué clase de cuenta tiene esa persona?", explicacion: "Las cuentas pueden ser CuentaRUT, Cuenta Vista o Cuenta Corriente." },
        { id: "banco_destino", termino_bancario: "Banco de destino", traduccion_simple: "¿En qué banco está la cuenta de la otra persona?", explicacion: "Es la institución donde la otra persona tiene su dinero." },
        { id: "monto", termino_bancario: "Monto", traduccion_simple: "¿Cuánto dinero quieres enviar?", explicacion: "Es la cantidad en pesos que vas a transferir." },
        { id: "glosa", termino_bancario: "Glosa", traduccion_simple: "Mensaje para la otra persona (opcional)", explicacion: "Es un texto voluntario para explicar el motivo del pago." },
        { id: "saldo_disponible", termino_bancario: "Saldo disponible", traduccion_simple: "Dinero que tienes listo para usar", explicacion: "Es el dinero real que puedes gastar o transferir hoy." },
        { id: "autorizar_clave_dinamica", termino_bancario: "Autorizar con clave dinámica", traduccion_simple: "Confirmar con código de seguridad", explicacion: "Es un código de 6 números para confirmar que eres tú." },
        { id: "comprobante", termino_bancario: "Comprobante", traduccion_simple: "Recibo que demuestra que el dinero fue enviado", explicacion: "Es el documento que respalda la transferencia." }
      ];
    }
  }

  /* ================= ARRASTRAR EL BOTÓN (DRAGGABLE) ================= */
  setupDraggable() {
    if (!this.fabContainer) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;
    let hasMoved = false;

    const onPointerDown = (e) => {
      // Ignora clic secundario
      if (e.button !== undefined && e.button !== 0) return;
      isDragging = true;
      hasMoved = false;

      const rect = this.fabContainer.getBoundingClientRect();
      const parentRect = this.fabContainer.parentElement.getBoundingClientRect();

      startX = e.clientX || (e.touches && e.touches[0].clientX);
      startY = e.clientY || (e.touches && e.touches[0].clientY);

      initialLeft = rect.left - parentRect.left;
      initialTop = rect.top - parentRect.top;

      // Desactivar animaciones mientras se arrastra
      this.fabContainer.style.transition = 'none';
      this.fabContainer.style.bottom = 'auto';
      this.fabContainer.style.right = 'auto';
      this.fabContainer.style.left = `${initialLeft}px`;
      this.fabContainer.style.top = `${initialTop}px`;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const currentX = e.clientX || (e.touches && e.touches[0].clientX);
      const currentY = e.clientY || (e.touches && e.touches[0].clientY);

      const dx = currentX - startX;
      const dy = currentY - startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMoved = true;
      }

      const parentRect = this.fabContainer.parentElement.getBoundingClientRect();
      const btnRect = this.fabContainer.getBoundingClientRect();

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      // Límites para que nunca salga del marco
      const maxLeft = parentRect.width - btnRect.width - 10;
      const maxTop = parentRect.height - btnRect.height - 70;

      newLeft = Math.max(10, Math.min(newLeft, maxLeft));
      newTop = Math.max(50, Math.min(newTop, maxTop));

      this.fabContainer.style.left = `${newLeft}px`;
      this.fabContainer.style.top = `${newTop}px`;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      this.fabContainer.style.transition = 'transform 0.15s ease, opacity 0.25s ease';
    };

    this.fabContainer.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.fabContainer.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Si no hubo arrastre significativo, se cuenta como clic
    this.fabBtn.addEventListener('click', (e) => {
      if (hasMoved) {
        e.stopPropagation();
        return;
      }
      this.openSheet();
    });
  }

  /* ================= WATCHDOG DE INACTIVIDAD (15 SEGUNDOS) ================= */
  setupInactivityWatchdog() {
    const resetTimer = () => {
      this.inactivitySeconds = 0;
      if (this.inactivityBubble) {
        this.inactivityBubble.classList.remove('show');
      }
    };

    ['click', 'touchstart', 'keydown', 'input', 'scroll'].forEach(evt => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });

    this.inactivityTimer = setInterval(() => {
      if (!this.enabled) return;
      // No activar en comprobante o si la ayuda ya está abierta
      if (window.appRouter && window.appRouter.currentView === 'receipt') return;
      if (this.sheet && this.sheet.classList.contains('open')) return;
      if (this.dynamicFocusOverlay && this.dynamicFocusOverlay.classList.contains('active')) return;

      this.inactivitySeconds++;
      if (this.inactivitySeconds === this.INACTIVITY_THRESHOLD) {
        this.triggerInactivityOffer();
      }
    }, 1000);
  }

  triggerInactivityOffer() {
    if (!this.inactivityBubble) return;
    this.inactivityBubble.classList.add('show');
    // Pregunta no impositiva
    if (window.puenteSpeech) {
      window.puenteSpeech.speak('¿Quieres que te muestre dónde seguir?');
    }
  }

  dismissInactivityOffer() {
    if (this.inactivityBubble) {
      this.inactivityBubble.classList.remove('show');
    }
    this.inactivitySeconds = 0;
  }

  /* ================= FOCO DINÁMICO (SPOTLIGHT AL 85%) ================= */
  activateSpotlight(targetSelector, title, message) {
    if (!this.enabled) return;
    this.dismissInactivityOffer();
    this.closeSheet();

    const targetEl = document.querySelector(targetSelector);
    if (!targetEl) return;

    // Registrar métrica en facilitador
    if (window.facilitatorPanel) {
      window.facilitatorPanel.recordMetric('spotlight');
    }

    this.clearSpotlight();
    this.activeSpotlightElement = targetEl;
    targetEl.classList.add('spotlight-active');

    // Desplazar suavemente a la vista
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Activar fondo al 85%
    if (this.dynamicFocusOverlay) {
      this.dynamicFocusOverlay.classList.add('active');
    }

    // Configurar y mostrar tarjeta de guía
    if (this.spotlightCard) {
      const titleEl = document.getElementById('spotlightGuideTitle');
      const textEl = document.getElementById('spotlightGuideText');
      if (titleEl) titleEl.textContent = title || 'Paso actual';
      if (textEl) textEl.textContent = message || 'Completa este campo para continuar con tranquilidad.';
      this.spotlightCard.classList.add('show');
    }

    // Lectura de voz del foco
    if (window.puenteSpeech) {
      window.puenteSpeech.speak(`${title}. ${message}`);
    }
  }

  clearSpotlight() {
    if (this.activeSpotlightElement) {
      this.activeSpotlightElement.classList.remove('spotlight-active');
      this.activeSpotlightElement = null;
    }
    if (this.dynamicFocusOverlay) {
      this.dynamicFocusOverlay.classList.remove('active');
    }
    if (this.spotlightCard) {
      this.spotlightCard.classList.remove('show');
    }
    if (window.puenteSpeech) {
      window.puenteSpeech.stop();
    }
  }

  /* Determina automáticamente el campo relevante según la pantalla actual */
  spotlightCurrentStep() {
    const currentView = window.appRouter ? window.appRouter.currentView : 'home';
    if (currentView === 'home') {
      this.activateSpotlight('#btnQuickTransfer', 'Comenzar transferencia', 'Toca el botón naranja "Transferir dinero" para comenzar.');
    } else if (currentView === 'recipient') {
      this.activateSpotlight('#frequentContactRosa', 'Elige a quién transferir', 'Toca a Rosa Pérez para enviarle dinero, o la pestaña "Inscribir nuevo" si es otra persona.');
    } else if (currentView === 'amount') {
      this.activateSpotlight('#amountBox', 'Ingresa el monto', 'Indica cuánto dinero deseas enviar. Por ejemplo: $50.000.');
    } else if (currentView === 'summary') {
      this.activateSpotlight('#safeSummaryCard', 'Revisa antes de enviar', 'Lee con calma los datos. Si todo está correcto, toca "Sí, enviar". Recuerda que no se puede deshacer.');
    } else if (currentView === 'auth') {
      this.activateSpotlight('#securityCodeBox', 'Código de seguridad', 'Escribe el código de prueba 123456 para autorizar el envío.');
    }
  }

  /* ================= TRADUCCIÓN SEMÁNTICA (GLOSARIO) ================= */
  toggleSemanticMode(enabled) {
    this.semanticMode = enabled !== undefined ? enabled : !this.semanticMode;
    const appEl = document.getElementById('appMainContainer');
    if (appEl) {
      appEl.classList.toggle('app-semantic-active', this.semanticMode);
    }
    const switchEl = document.getElementById('switchSemanticMode');
    if (switchEl) {
      switchEl.checked = this.semanticMode;
    }
  }

  showTermExplanation(termId) {
    const item = this.glossary.find(g => g.id === termId);
    if (!item || !this.termModalOverlay) return;

    // Registrar uso de ayuda en facilitador
    if (window.facilitatorPanel) {
      window.facilitatorPanel.recordMetric('help');
    }

    const titleEl = document.getElementById('termModalTitle');
    const subtitleEl = document.getElementById('termModalSubtitle');
    const meaningEl = document.getElementById('termModalMeaning');
    const exampleEl = document.getElementById('termModalExample');

    if (titleEl) titleEl.textContent = item.termino_bancario;
    if (subtitleEl) subtitleEl.textContent = item.traduccion_simple;
    if (meaningEl) meaningEl.textContent = item.explicacion;
    if (exampleEl) exampleEl.textContent = item.ejemplo || '';

    this.termModalOverlay.classList.add('active');

    // Reproducir audio explicativo
    if (window.puenteSpeech) {
      window.puenteSpeech.speak(`${item.termino_bancario}. En palabras simples: ${item.traduccion_simple}. ${item.explicacion}`);
    }
  }

  closeTermExplanation() {
    if (this.termModalOverlay) {
      this.termModalOverlay.classList.remove('active');
    }
    if (window.puenteSpeech) {
      window.puenteSpeech.stop();
    }
  }

  /* ================= PANEL / BOTTOM SHEET ================= */
  openSheet() {
    if (!this.enabled || !this.sheet) return;
    this.dismissInactivityOffer();
    this.sheetBackdrop.classList.add('active');
    this.sheet.classList.add('open');

    // Registrar llamada a ayuda en facilitador
    if (window.facilitatorPanel) {
      window.facilitatorPanel.recordMetric('help');
    }

    // Si es primera vez o está en inicio, sugerir brevemente
    if (window.puenteSpeech) {
      window.puenteSpeech.speak('Aquí tienes tu pasamanos digital. Puedes activar el foco iluminado o escuchar la pantalla.');
    }
  }

  closeSheet() {
    if (!this.sheet) return;
    this.sheetBackdrop.classList.remove('active');
    this.sheet.classList.remove('open');
  }

  /* ================= BIENVENIDA (5 SEGUNDOS) ================= */
  checkOnboarding() {
    const hasSeen = localStorage.getItem('puente_onboarding_shown');
    if (!hasSeen && this.enabled && this.onboardingOverlay) {
      setTimeout(() => {
        this.onboardingOverlay.classList.add('active');
        if (window.puenteSpeech) {
          window.puenteSpeech.speak('Bienvenida Elena. Este botón verde es tu pasamanos digital. Tócalo en cualquier momento si necesitas que te guíe paso a paso o te aclare alguna palabra.');
        }
      }, 600);
    }
  }

  dismissOnboarding() {
    if (this.onboardingOverlay) {
      this.onboardingOverlay.classList.remove('active');
      localStorage.setItem('puente_onboarding_shown', 'true');
    }
    if (window.puenteSpeech) {
      window.puenteSpeech.stop();
    }
  }

  /* ================= AUTOOCULTAMIENTO ================= */
  recordSuccessfulTransfer(askedForHelp) {
    if (askedForHelp) {
      this.successiveIndependentRuns = 0;
      this.fabContainer.classList.remove('is-minimized');
    } else {
      this.successiveIndependentRuns++;
      // Si completa 3 trámites sin auxilio, se contrae amablemente
      if (this.successiveIndependentRuns >= 3) {
        this.fabContainer.classList.add('is-minimized');
      }
    }
  }

  /* ================= CONEXIONES DE EVENTOS ================= */
  setupEventListeners() {
    // Cerrar panel de ayuda
    const btnClose = document.getElementById('btnClosePuente');
    if (btnClose) btnClose.addEventListener('click', () => this.closeSheet());
    if (this.sheetBackdrop) this.sheetBackdrop.addEventListener('click', () => this.closeSheet());

    // Botones de oferta de inactividad
    const btnYes = document.getElementById('btnOfferYes');
    const btnNo = document.getElementById('btnOfferNo');
    if (btnYes) {
      btnYes.addEventListener('click', () => {
        this.dismissInactivityOffer();
        this.spotlightCurrentStep();
      });
    }
    if (btnNo) {
      btnNo.addEventListener('click', () => this.dismissInactivityOffer());
    }

    // Botón de Foco en el Sheet
    const btnTriggerFocus = document.getElementById('btnTriggerDynamicFocus');
    if (btnTriggerFocus) {
      btnTriggerFocus.addEventListener('click', () => this.spotlightCurrentStep());
    }

    // Botón de Escuchar pantalla en el Sheet
    const btnSpeechSheet = document.getElementById('btnTriggerSpeech');
    if (btnSpeechSheet) {
      btnSpeechSheet.addEventListener('click', () => {
        if (window.appRouter) {
          window.appRouter.readCurrentScreenAloud();
        }
      });
    }

    // Switch de Traducción Semántica en Sheet
    const switchSemantic = document.getElementById('switchSemanticMode');
    if (switchSemantic) {
      switchSemantic.addEventListener('change', (e) => this.toggleSemanticMode(e.target.checked));
    }

    // Tarjeta del Spotlight: botón continuar / voz
    const btnSpotlightDone = document.getElementById('btnSpotlightDone');
    if (btnSpotlightDone) {
      btnSpotlightDone.addEventListener('click', () => this.clearSpotlight());
    }
    const btnSpotlightVoice = document.getElementById('btnSpotlightVoice');
    if (btnSpotlightVoice) {
      btnSpotlightVoice.addEventListener('click', () => {
        const text = document.getElementById('spotlightGuideText');
        if (text && window.puenteSpeech) {
          window.puenteSpeech.speak(text.textContent);
        }
      });
    }

    // Cerrar modal de término
    const btnCloseTerm = document.getElementById('btnCloseTermModal');
    if (btnCloseTerm) btnCloseTerm.addEventListener('click', () => this.closeTermExplanation());
    if (this.termModalOverlay) this.termModalOverlay.addEventListener('click', (e) => {
      if (e.target === this.termModalOverlay) this.closeTermExplanation();
    });

    // Cerrar onboarding
    const btnDismissOnboarding = document.getElementById('btnDismissOnboarding');
    if (btnDismissOnboarding) {
      btnDismissOnboarding.addEventListener('click', () => this.dismissOnboarding());
    }

    // Escucha de estado de voz para animar botones de audio
    if (window.puenteSpeech) {
      window.puenteSpeech.onStatusChange = (speaking) => {
        const triggers = document.querySelectorAll('.btn-speech-trigger');
        triggers.forEach(t => t.classList.toggle('speaking', speaking));
      };
    }
  }

  /* Activar o Desactivar completamente Interfaz Puente (para Grupo Control vs Experimental) */
  setBridgeEnabled(enabled) {
    this.enabled = enabled;
    if (this.fabContainer) {
      this.fabContainer.style.display = enabled ? 'flex' : 'none';
    }
    if (!enabled) {
      this.clearSpotlight();
      this.closeSheet();
      this.dismissInactivityOffer();
      this.toggleSemanticMode(false);
    } else {
      this.toggleSemanticMode(true);
    }
  }

  setPracticeMode(enabled) {
    this.practiceMode = enabled;
    if (this.practiceBanner) {
      this.practiceBanner.classList.toggle('active', enabled);
    }
  }
}

// Instancia global
window.interfazPuente = new InterfazPuente();
