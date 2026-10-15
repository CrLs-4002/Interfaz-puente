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
  }

  dismissInactivityOffer() {
    if (this.inactivityBubble) {
      this.inactivityBubble.classList.remove('show');
    }
    this.inactivitySeconds = 0;
  }

  /* ================= FOCO DINÁMICO (SPOTLIGHT AL 85% PASO A PASO) ================= */
  activateSpotlight(targetSelector, title, message) {
    if (!this.enabled) return;
    this.dismissInactivityOffer();
    this.closeSheet();

    const targetEl = document.querySelector(targetSelector);
    if (!targetEl) return;

    if (window.facilitatorPanel) {
      window.facilitatorPanel.recordMetric('spotlight');
    }

    this.clearSpotlight();
    this.activeSpotlightElement = targetEl;
    targetEl.classList.add('spotlight-active');
    document.body.classList.add('dynamic-focus-active');

    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (this.dynamicFocusOverlay) {
      this.dynamicFocusOverlay.classList.add('active');
    }

    if (this.spotlightCard) {
      const titleEl = document.getElementById('spotlightGuideTitle');
      const textEl = document.getElementById('spotlightGuideText');
      if (titleEl) titleEl.textContent = title || 'Paso actual';
      if (textEl) textEl.textContent = message || 'Completa este campo para continuar con tranquilidad.';
      this.spotlightCard.classList.add('show');
    }
  }

  clearSpotlight() {
    document.body.classList.remove('dynamic-focus-active');
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

  /* Flujo interactivo paso a paso para completar la transferencia */
  startStepByStepGuide() {
    this.currentStepIndex = 0;
    this.executeCurrentStep();
  }

  getGuideSteps() {
    const currentView = window.appRouter ? window.appRouter.currentView : 'home';
    const isNewRecipientTab = document.getElementById('tabRecipientNew') && document.getElementById('tabRecipientNew').classList.contains('active');

    if (currentView === 'home') {
      return [
        {
          target: '#cardCuentaRut',
          title: 'Revisar tu dinero disponible',
          message: 'Aquí puedes ver el saldo de tu CuentaRUT. Tienes $350.000 listos para usar.',
          speech: 'Paso 1: Revisa tu dinero disponible. Tienes 350 mil pesos en tu CuentaRUT.'
        },
        {
          target: '#btnQuickTransfer',
          title: 'Comenzar a transferir',
          message: 'Toca este botón naranja para iniciar el envío de dinero a otra persona.',
          speech: 'Paso 2: Toca el botón naranja Transferir dinero para comenzar.'
        }
      ];
    } else if (currentView === 'recipient') {
      if (isNewRecipientTab) {
        // Paso a paso para inscribir a alguien nuevo
        return [
          {
            target: '#groupRecipientName',
            title: 'Paso 1: Nombre de la persona',
            message: 'Escribe aquí el nombre y apellido de la persona a quien le enviarás el dinero.',
            speech: 'Paso 1: Nombre completo. Escribe el nombre de la persona que recibirá el dinero.'
          },
          {
            target: '#groupRecipientRut',
            title: 'Paso 2: RUT de la persona',
            message: 'Ingresa el RUT de tu destinatario, por ejemplo 15.678.910-K.',
            speech: 'Paso 2: RUT. Ingresa el número de carnet o RUT de la persona.'
          },
          {
            target: '#groupRecipientBank',
            title: 'Paso 3: Banco de destino',
            message: 'Selecciona en la lista el banco donde la persona tiene su cuenta guardada.',
            speech: 'Paso 3: Banco de destino. Selecciona en la lista el banco de la persona.'
          },
          {
            target: '#groupRecipientType',
            title: 'Paso 4: Tipo de cuenta',
            message: 'Elige si su cuenta es Cuenta Corriente, CuentaRUT o Cuenta Vista.',
            speech: 'Paso 4: Tipo de cuenta. Elige si es Cuenta Corriente, CuentaRUT o Cuenta Vista.'
          },
          {
            target: '#groupRecipientNum',
            title: 'Paso 5: Número de cuenta',
            message: 'Escribe el número de cuenta bancaria que te entregó la persona.',
            speech: 'Paso 5: Número de cuenta. Escribe el número exacto de su cuenta bancaria.'
          },
          {
            target: '#btnContinueRecipient',
            title: 'Paso 6: Continuar al monto',
            message: 'Toca el botón Continuar para avanzar a indicar cuánto dinero vas a enviar.',
            speech: 'Paso 6: Toca el botón verde Continuar para ingresar el monto.'
          }
        ];
      } else {
        // Paso a paso con contacto frecuente ya registrado
        return [
          {
            target: '#frequentContactRosa',
            title: 'Paso 1: Elegir a Rosa Pérez',
            message: 'Toca la tarjeta de Rosa Pérez Sepúlveda para seleccionarla como destinataria.',
            speech: 'Paso 1: Toca a Rosa Pérez para seleccionarla como la persona que recibirá el dinero.'
          },
          {
            target: '#tabRecipientNew',
            title: '¿O prefieres una persona nueva?',
            message: 'Si necesitas transferirle a alguien nuevo, toca esta pestaña para anotar sus datos.',
            speech: 'Si deseas transferirle a alguien que no está en la lista, toca Inscribir nuevo.'
          },
          {
            target: '#btnContinueRecipient',
            title: 'Paso 2: Continuar',
            message: 'Toca Continuar para indicar cuánto dinero deseas transferirle a Rosa.',
            speech: 'Paso 2: Toca el botón verde Continuar para ingresar el monto a enviar.'
          }
        ];
      }
    } else if (currentView === 'amount') {
      return [
        {
          target: '#amountBox',
          title: 'Paso 1: Ingresar el monto',
          message: 'Escribe la cantidad exacta de dinero a enviar, o toca uno de los montos sugeridos ($50.000).',
          speech: 'Paso 1: Ingresa el monto. Escribe cuánto dinero quieres transferir, por ejemplo 50 mil pesos.'
        },
        {
          target: '#groupGlosa',
          title: 'Paso 2: Mensaje opcional',
          message: 'Si quieres, deja un mensaje o recordatorio como "Pago almuerzo" o "Regalo".',
          speech: 'Paso 2: Mensaje voluntario. Puedes escribir un recordatorio para la otra persona.'
        },
        {
          target: '#btnContinueAmount',
          title: 'Paso 3: Revisar antes de enviar',
          message: 'Toca este botón para ver el resumen detallado antes de confirmar.',
          speech: 'Paso 3: Toca Revisar antes de enviar para verificar los datos antes de autorizar.'
        }
      ];
    } else if (currentView === 'summary') {
      return [
        {
          target: '#safeSummaryCard',
          title: 'Revisión final de seguridad',
          message: 'Lee atentamente el monto y el nombre de la persona. Si todo está correcto, presiona Sí, enviar.',
          speech: 'Revisa atentamente el monto y el nombre. Recuerda que una vez enviado no se puede deshacer.'
        }
      ];
    }
    return [];
  }

  executeCurrentStep() {
    const steps = this.getGuideSteps();
    if (!steps.length) return;

    if (this.currentStepIndex >= steps.length) {
      this.clearSpotlight();
      return;
    }
    if (this.currentStepIndex < 0) {
      this.currentStepIndex = 0;
    }

    const step = steps[this.currentStepIndex];
    const targetEl = document.querySelector(step.target);
    if (!targetEl) {
      this.currentStepIndex++;
      this.executeCurrentStep();
      return;
    }

    this.clearSpotlight();
    this.activeSpotlightElement = targetEl;
    targetEl.classList.add('spotlight-active');
    document.body.classList.add('dynamic-focus-active');
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (this.dynamicFocusOverlay) {
      this.dynamicFocusOverlay.classList.add('active');
    }

    if (this.spotlightCard) {
      const badgeEl = document.getElementById('spotlightStepBadge');
      const titleEl = document.getElementById('spotlightGuideTitle');
      const textEl = document.getElementById('spotlightGuideText');
      const prevBtn = document.getElementById('btnSpotlightPrev');
      const nextBtn = document.getElementById('btnSpotlightNext');
      const voiceBtn = document.getElementById('btnSpotlightVoice');

      if (badgeEl) badgeEl.textContent = `PASO ${this.currentStepIndex + 1} DE ${steps.length}`;
      if (titleEl) titleEl.textContent = step.title;
      if (textEl) textEl.textContent = step.message;
      if (voiceBtn) voiceBtn.setAttribute('data-speech', step.speech || step.message);

      if (prevBtn) {
        prevBtn.style.display = this.currentStepIndex > 0 ? 'inline-flex' : 'none';
      }
      if (nextBtn) {
        nextBtn.textContent = (this.currentStepIndex === steps.length - 1) ? 'Finalizar guía' : 'Siguiente paso';
      }

      this.spotlightCard.classList.add('show');
    }

    // Nota: La voz NO se activa automáticamente, solo si el usuario toca el botón de escuchar
  }

  nextGuideStep() {
    const steps = this.getGuideSteps();
    if (this.currentStepIndex < steps.length - 1) {
      this.currentStepIndex++;
      this.executeCurrentStep();
    } else {
      this.clearSpotlight();
    }
  }

  prevGuideStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.executeCurrentStep();
    }
  }

  /* Activa la guía paso a paso al tocar el botón */
  spotlightCurrentStep() {
    this.startStepByStepGuide();
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

    // Tarjeta del Spotlight paso a paso: botones siguiente, anterior, cerrar y escuchar
    const btnSpotlightNext = document.getElementById('btnSpotlightNext');
    if (btnSpotlightNext) {
      btnSpotlightNext.addEventListener('click', () => this.nextGuideStep());
    }

    const btnSpotlightPrev = document.getElementById('btnSpotlightPrev');
    if (btnSpotlightPrev) {
      btnSpotlightPrev.addEventListener('click', () => this.prevGuideStep());
    }

    const btnSpotlightDone = document.getElementById('btnSpotlightDone');
    if (btnSpotlightDone) {
      btnSpotlightDone.addEventListener('click', () => this.clearSpotlight());
    }

    const btnSpotlightVoice = document.getElementById('btnSpotlightVoice');
    if (btnSpotlightVoice) {
      btnSpotlightVoice.addEventListener('click', () => {
        const speechText = btnSpotlightVoice.getAttribute('data-speech') || document.getElementById('spotlightGuideText').textContent;
        if (speechText && window.puenteSpeech) {
          window.puenteSpeech.speak(speechText);
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

    // Botones individuales de lectura por voz para cada sección/campo
    document.addEventListener('click', (e) => {
      const speakBtn = e.target.closest('.btn-speak-section');
      if (speakBtn) {
        e.stopPropagation();
        const textToRead = speakBtn.getAttribute('data-speak') || '';
        if (textToRead && window.puenteSpeech) {
          window.puenteSpeech.speak(textToRead);
        }
      }
    });

    // Oscurecimiento y destaque automático (Foco Dinámico) al interactuar con campos del formulario
    const focusableSelectors = 'input, select, textarea, .contact-item';
    document.addEventListener('focusin', (e) => {
      if (!this.enabled) return;
      const target = e.target;
      if (!target.matches(focusableSelectors)) return;
      // No activar foco en la clave o controles del facilitador/puente
      if (target.closest('.security-modal-overlay') || target.closest('.facilitator-overlay') || target.closest('.puente-sheet')) return;

      const group = target.closest('.form-group') || target.closest('.amount-display-box') || target.closest('.contact-item') || target;
      const label = group.querySelector('.form-label') || group.querySelector('label');
      const labelText = label ? label.textContent.trim() : 'Campo a completar';
      
      this.activateSectionFocus(group, labelText);
    });

    // Cerrar foco al hacer click en el overlay oscuro
    if (this.dynamicFocusOverlay) {
      this.dynamicFocusOverlay.addEventListener('click', () => {
        this.clearSpotlight();
      });
    }

    // Escucha de estado de voz para animar botones de audio
    if (window.puenteSpeech) {
      window.puenteSpeech.onStatusChange = (speaking) => {
        const triggers = document.querySelectorAll('.btn-speech-trigger, .btn-speak-section');
        triggers.forEach(t => t.classList.toggle('speaking', speaking));
      };
    }
  }

  /* Foco dinámico en sección específica con oscurecimiento del fondo al 85% */
  activateSectionFocus(targetElement, labelText) {
    if (!this.enabled || !targetElement) return;
    this.clearSpotlight();

    this.activeSpotlightElement = targetElement;
    targetElement.classList.add('spotlight-active');

    if (this.dynamicFocusOverlay) {
      this.dynamicFocusOverlay.classList.add('active');
    }

    // Registrar en métricas
    if (window.facilitatorPanel) {
      window.facilitatorPanel.recordMetric('spotlight');
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
