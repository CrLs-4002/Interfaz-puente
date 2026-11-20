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
    this.isTutorialActive = false; // Solo se cierra con la 'x' o con 'Listo' al final
    this.stepWasDismissed = false; // Indica si el usuario cerró el paso actual con la 'x'
    this.currentStepIndex = 0;
    this.stepExecutionToken = 0; // Previene condiciones de carrera y avance fantasma entre vistas

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
    this.setupDraggable();
    this.setupEventListeners();
    this.setupInactivityWatchdog();
    this.checkOnboarding();
    this.toggleSemanticMode(this.semanticMode, false);
    this.updateLanguageWidgetBadge();
    this.setupScrollGuards();
    this.updateFabVisibility('home');
    await this.loadGlossary();
  }

  updateFabVisibility(viewName) {
    if (!this.fabContainer) return;
    const activeScreen = document.querySelector('.screen-view.is-active');
    const activeView = viewName || (activeScreen ? activeScreen.id.replace('view-', '') : (window.appRouter ? window.appRouter.currentView : 'home'));

    if (activeView === 'home' || !this.enabled) {
      if (this.fabContainer.style.setProperty) {
        this.fabContainer.style.setProperty('display', 'none', 'important');
      }
      this.fabContainer.style.display = 'none';
      return;
    }

    // El botón "Ayuda" que flota debe desaparecer mientras el modo tutorial está activo.
    // Debe estar presente cuando no está el modo tutorial activado.
    if (this.isTutorialActive) {
      if (this.fabContainer.style.setProperty) {
        this.fabContainer.style.setProperty('display', 'none', 'important');
      }
      this.fabContainer.style.display = 'none';
    } else {
      if (this.fabContainer.style.setProperty) {
        this.fabContainer.style.setProperty('display', 'flex', 'important');
        this.fabContainer.style.setProperty('opacity', '1', 'important');
        this.fabContainer.style.setProperty('visibility', 'visible', 'important');
        this.fabContainer.style.setProperty('pointer-events', 'auto', 'important');
      }
      this.fabContainer.style.display = 'flex';
      this.fabContainer.style.opacity = '1';
      this.fabContainer.style.visibility = 'visible';
      this.fabContainer.style.pointerEvents = 'auto';
    }
  }

  cacheElements() {
    this.fabContainer = document.getElementById('puenteFabContainer');
    this.fabBtn = document.getElementById('puenteFabBtn');
    this.widgetMenu = document.getElementById('puenteWidgetMenu');
    this.widgetBackdrop = document.getElementById('puenteWidgetBackdrop');
    this.btnWidgetSpeech = document.getElementById('btnWidgetSpeech');
    this.btnWidgetTutorial = document.getElementById('btnWidgetTutorial');
    this.btnWidgetLanguage = document.getElementById('btnWidgetLanguage');
    this.badgeWidgetLanguage = document.getElementById('badgeWidgetLanguage');
    this.isWidgetMenuOpen = false;

    this.sheetBackdrop = document.getElementById('puenteSheetBackdrop');
    this.sheet = document.getElementById('puenteSheet');
    this.inactivityBubble = document.getElementById('inactivityOfferBubble');
    this.dynamicFocusOverlay = document.getElementById('dynamicFocusOverlay');
    this.curtainTop = document.getElementById('spotlightCurtainTop');
    this.curtainBottom = document.getElementById('spotlightCurtainBottom');
    this.curtainLeft = document.getElementById('spotlightCurtainLeft');
    this.curtainRight = document.getElementById('spotlightCurtainRight');
    this.frameHighlight = document.getElementById('spotlightFrameHighlight');
    this.spotlightCard = document.getElementById('spotlightGuideCard');
    this.practiceBanner = document.getElementById('practiceBanner');
    this.onboardingOverlay = document.getElementById('puenteOnboardingOverlay');
    this.termModalOverlay = document.getElementById('termModalOverlay');
    this.homeHelpModal = document.getElementById('homeHelpModalOverlay');
    this.btnHomeHelpTransfer = document.getElementById('btnHomeHelpTransfer');
    this.btnVoiceDictateHome = document.getElementById('btnVoiceDictateHome');
    this.homeHelpVoiceFeedback = document.getElementById('homeHelpVoiceFeedback');
    this.btnCloseHomeHelp = document.getElementById('btnCloseHomeHelp');
  }

  async loadGlossary() {
    if (window.PUENTE_GLOSSARY_DATA && window.PUENTE_GLOSSARY_DATA.terminos) {
      this.glossary = window.PUENTE_GLOSSARY_DATA.terminos;
      return;
    }
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
        { id: "glosa", termino_bancario: "Mensaje", traduccion_simple: "Mensaje para la otra persona (opcional)", explicacion: "Es un texto voluntario para explicar el motivo del pago." },
        { id: "saldo_disponible", termino_bancario: "Saldo disponible", traduccion_simple: "Dinero que tienes listo para usar", explicacion: "Es el dinero real que puedes gastar o transferir hoy." },
        { id: "autorizar_clave_dinamica", termino_bancario: "Autorizar con clave dinámica", traduccion_simple: "Confirmar con código de seguridad", explicacion: "Es un código de 6 números para confirmar que eres tú." },
        { id: "comprobante", termino_bancario: "Comprobante", traduccion_simple: "Recibo que demuestra que el dinero fue enviado", explicacion: "Es el documento que respalda la transferencia." }
      ];
    }
  }

  /* ================= ARRASTRAR EL BOTÓN (DRAGGABLE) ================= */
  setupDraggable() {
    if (!this.fabContainer || !this.fabBtn) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;
    let hasMoved = false;

    const onPointerDown = (e) => {
      // Ignora clic secundario o clics dentro del menú emergente
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('.puente-widget-menu') || e.target.closest('.inactivity-offer-bubble')) return;

      isDragging = true;
      hasMoved = false;

      const rect = this.fabContainer.getBoundingClientRect();
      const parentRect = this.fabContainer.parentElement.getBoundingClientRect();

      startX = e.clientX || (e.touches && e.touches[0].clientX);
      startY = e.clientY || (e.touches && e.touches[0].clientY);

      initialLeft = rect.left - parentRect.left;
      initialTop = rect.top - parentRect.top;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const currentX = e.clientX || (e.touches && e.touches[0].clientX);
      const currentY = e.clientY || (e.touches && e.touches[0].clientY);

      const dx = currentX - startX;
      const dy = currentY - startY;

      // Solo iniciar cambio de coordenadas si realmente hubo arrastre (más de 6px)
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        if (!hasMoved) {
          hasMoved = true;
          this.fabContainer.style.transition = 'none';
          this.fabContainer.style.bottom = 'auto';
          this.fabContainer.style.right = 'auto';
        }

        const parentRect = this.fabContainer.parentElement.getBoundingClientRect();
        const btnRect = this.fabBtn.getBoundingClientRect();

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        // Límites para que nunca salga del marco
        const maxLeft = parentRect.width - btnRect.width - 10;
        const maxTop = parentRect.height - btnRect.height - 70;

        newLeft = Math.max(10, Math.min(newLeft, maxLeft));
        newTop = Math.max(50, Math.min(newTop, maxTop));

        this.fabContainer.style.left = `${newLeft}px`;
        this.fabContainer.style.top = `${newTop}px`;
      }
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      if (hasMoved) {
        this.fabContainer.style.transition = 'transform 0.15s ease, opacity 0.25s ease';
      }
    };

    this.fabBtn.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.fabBtn.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Si no hubo arrastre significativo, se cuenta como clic
    this.fabBtn.addEventListener('click', (e) => {
      if (hasMoved) {
        e.stopPropagation();
        return;
      }

      const activeScreen = document.querySelector('.screen-view.is-active');
      const isHome = (activeScreen && activeScreen.id === 'view-home') ||
                     (window.appRouter && window.appRouter.currentView === 'home');

      if (isHome) {
        this.openHomeHelpModal();
      } else {
        this.reopenTutorialStep();
      }
    });
  }

  /* ================= WATCHDOG DE INACTIVIDAD (15 SEGUNDOS) ================= */
  setupInactivityWatchdog() {
    const resetTimer = (e) => {
      // Si el evento ocurrió dentro de la burbuja, dejamos que su propio handler lo procese
      if (e && e.target && e.target.closest && e.target.closest('#inactivityOfferBubble')) {
        return;
      }
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
      if (this.isWidgetMenuOpen) return;

      this.inactivitySeconds++;
      if (this.inactivitySeconds === this.INACTIVITY_THRESHOLD) {
        this.triggerInactivityOffer();
      }
    }, 1000);
  }

  triggerInactivityOffer() {
    if (!this.inactivityBubble) return;
    if (this.isTutorialActive && !this.stepWasDismissed) return;
    this.inactivityBubble.classList.add('show');
  }

  dismissInactivityOffer() {
    if (this.inactivityBubble) {
      this.inactivityBubble.classList.remove('show');
    }
    this.inactivitySeconds = 0;
  }

  /* ================= SEGURIDAD DE ENCUADRE Y SCROLL ================= */
  setupScrollGuards() {
    const frame = document.getElementById('appMainContainer');
    if (frame) {
      frame.addEventListener('scroll', () => {
        if (frame.scrollTop !== 0 || frame.scrollLeft !== 0) {
          frame.scrollTop = 0;
          frame.scrollLeft = 0;
        }
      }, { passive: true });
    }
    const screenContainer = document.querySelector('.screen-container');
    if (screenContainer) {
      screenContainer.addEventListener('scroll', () => {
        if (screenContainer.scrollTop !== 0 || screenContainer.scrollLeft !== 0) {
          screenContainer.scrollTop = 0;
          screenContainer.scrollLeft = 0;
        }
      }, { passive: true });
    }
  }

  resetFrameScroll() {
    const frame = document.getElementById('appMainContainer');
    if (frame) {
      if (frame.scrollTop !== 0) frame.scrollTop = 0;
      if (frame.scrollLeft !== 0) frame.scrollLeft = 0;
    }
    const screenContainer = document.querySelector('.screen-container');
    if (screenContainer) {
      if (screenContainer.scrollTop !== 0) screenContainer.scrollTop = 0;
      if (screenContainer.scrollLeft !== 0) screenContainer.scrollLeft = 0;
    }
    const appWrapper = document.querySelector('.app-wrapper');
    if (appWrapper) {
      if (appWrapper.scrollTop !== 0) appWrapper.scrollTop = 0;
      if (appWrapper.scrollLeft !== 0) appWrapper.scrollLeft = 0;
    }
  }

  clearPreviousHighlight() {
    if (this.activeSpotlightElement) {
      this.activeSpotlightElement.classList.remove('spotlight-active');
      this.activeSpotlightElement = null;
    }
  }

  /* ================= POSICIONAMIENTO AUTOMÁTICO DE LA TARJETA TUTORIAL ================= */
  positionSpotlightCard(targetEl) {
    if (!this.spotlightCard) return;

    const steps = this.getGuideSteps();
    const activeScreen = document.querySelector('.screen-view.is-active');
    const currentView = activeScreen ? activeScreen.id.replace('view-', '') : (window.appRouter ? window.appRouter.currentView : '');
    const isStepRutVisible = document.getElementById('newRecipientStepRut') && !document.getElementById('newRecipientStepRut').classList.contains('hidden');

    // En Etapa A de RUT, el botón Continuar se aloja dentro del card al pie
    if (currentView === 'new-recipient' && isStepRutVisible) {
      this.spotlightCard.style.transform = 'translateY(0)';
      this.spotlightCard.classList.remove('is-docked-top');
      this.updateSpotlightOverlay(null);
      return;
    }

    // En la pantalla recipient (elegir persona), la tarjeta debe mantenerse siempre abajo para no tapar el botón "Otra persona"
    if (currentView === 'recipient') {
      this.spotlightCard.style.transform = 'translateY(0)';
      this.spotlightCard.classList.remove('is-docked-top');
      this.updateSpotlightOverlay(targetEl);
      return;
    }

    if (!targetEl) {
      this.spotlightCard.style.transform = 'translateY(0)';
      this.spotlightCard.classList.remove('is-docked-top');
      this.updateSpotlightOverlay(null);
      return;
    }

    const frame = document.getElementById('appMainContainer') || document.querySelector('.device-frame') || document.body;
    const frameRect = frame.getBoundingClientRect();
    const cardHeight = this.spotlightCard.offsetHeight || 165;
    const targetRect = targetEl.getBoundingClientRect();

    // La tarjeta al pie descansa a 20px del fondo del teléfono (device-frame).
    // Su borde superior normal abajo está en: frameRect.bottom - 20 - cardHeight.
    // Damos un margen de resguardo de 35px:
    const bottomCardZoneTop = frameRect.bottom - cardHeight - 35;

    // ¿El botón o elemento objetivo queda tapado o roza la tarjeta cuando esta está al pie?
    const overlapsBottom = targetRect.bottom > bottomCardZoneTop;

    // Zona superior que ocuparía la tarjeta si se desliza al top (a 20px del borde superior):
    const topCardZoneBottom = frameRect.top + cardHeight + 35;
    const isNearTop = targetRect.top < topCardZoneBottom;

    if (overlapsBottom && !isNearTop) {
      // Si el card tapa el botón que se debe ver, se desliza automáticamente al top de la pantalla
      const distanceToTop = Math.max(80, frameRect.height - cardHeight - 40);
      this.spotlightCard.style.transform = `translateY(-${distanceToTop}px)`;
      this.spotlightCard.classList.add('is-docked-top');
    } else {
      // Si el elemento objetivo está arriba o al centro, el card se mantiene o regresa abajo
      this.spotlightCard.style.transform = 'translateY(0)';
      this.spotlightCard.classList.remove('is-docked-top');
    }

    this.updateSpotlightOverlay(targetEl);
  }

  updateSpotlightOverlay(targetEl) {
    if (!this.dynamicFocusOverlay) return;

    const curtainTop = this.curtainTop || document.getElementById('spotlightCurtainTop');
    const curtainBottom = this.curtainBottom || document.getElementById('spotlightCurtainBottom');
    const curtainLeft = this.curtainLeft || document.getElementById('spotlightCurtainLeft');
    const curtainRight = this.curtainRight || document.getElementById('spotlightCurtainRight');
    const frameHighlight = this.frameHighlight || document.getElementById('spotlightFrameHighlight');

    const steps = this.getGuideSteps();
    const currentStep = (steps && steps.length > this.currentStepIndex) ? steps[this.currentStepIndex] : null;
    const activeScreen = document.querySelector('.screen-view.is-active');
    const currentView = activeScreen ? activeScreen.id.replace('view-', '') : (window.appRouter ? window.appRouter.currentView : '');
    const isNoBlurView = (currentStep && currentStep.noBlur) || currentView === 'summary' || currentView === 'new-recipient' || currentView === 'success' || currentView === 'receipt';

    if (!targetEl || !this.isTutorialActive || isNoBlurView) {
      if (curtainTop) { curtainTop.style.height = '0px'; }
      if (curtainBottom) { curtainBottom.style.height = '0px'; }
      if (curtainLeft) { curtainLeft.style.width = '0px'; }
      if (curtainRight) { curtainRight.style.width = '0px'; }
      if (frameHighlight) { frameHighlight.style.display = 'none'; }
      if (this.dynamicFocusOverlay && isNoBlurView) {
        this.dynamicFocusOverlay.classList.remove('active');
        document.body.classList.remove('dynamic-focus-active');
      }
      return;
    }

    const frame = document.getElementById('appMainContainer') || document.querySelector('.device-frame') || document.body;
    const frameRect = frame.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const w = Math.round(frameRect.width);
    const h = Math.round(frameRect.height);

    const pad = 4;
    const rawX1 = targetRect.left - frameRect.left - pad;
    const rawY1 = targetRect.top - frameRect.top - pad;
    const rawX2 = targetRect.right - frameRect.left + pad;
    const rawY2 = targetRect.bottom - frameRect.top + pad;

    const x1 = Math.max(0, Math.min(w, Math.round(rawX1)));
    const y1 = Math.max(0, Math.min(h, Math.round(rawY1)));
    const x2 = Math.max(0, Math.min(w, Math.round(rawX2)));
    const y2 = Math.max(0, Math.min(h, Math.round(rawY2)));

    // Si el elemento no tiene dimensiones válidas o está totalmente fuera del marco visible
    if (x2 <= x1 || y2 <= y1) {
      if (curtainTop) { curtainTop.style.top = '0px'; curtainTop.style.left = '0px'; curtainTop.style.width = '100%'; curtainTop.style.height = h + 'px'; }
      if (curtainBottom) { curtainBottom.style.height = '0px'; }
      if (curtainLeft) { curtainLeft.style.width = '0px'; }
      if (curtainRight) { curtainRight.style.width = '0px'; }
      if (frameHighlight) { frameHighlight.style.display = 'none'; }
      return;
    }

    // 1. Cortina superior: cubre y difumina desde el tope hasta el borde superior de la casilla activa
    if (curtainTop) {
      curtainTop.style.top = '0px';
      curtainTop.style.left = '0px';
      curtainTop.style.width = '100%';
      curtainTop.style.height = y1 + 'px';
    }

    // 2. Cortina inferior: cubre y difumina desde el borde inferior de la casilla activa hasta el fondo
    if (curtainBottom) {
      curtainBottom.style.top = y2 + 'px';
      curtainBottom.style.left = '0px';
      curtainBottom.style.width = '100%';
      curtainBottom.style.height = Math.max(0, h - y2) + 'px';
    }

    // 3. Cortina lateral izquierda: cubre el espacio lateral izquierdo entre el tope y fondo de la casilla
    if (curtainLeft) {
      curtainLeft.style.top = y1 + 'px';
      curtainLeft.style.left = '0px';
      curtainLeft.style.width = x1 + 'px';
      curtainLeft.style.height = Math.max(0, y2 - y1) + 'px';
    }

    // 4. Cortina lateral derecha: cubre el espacio lateral derecho entre el tope y fondo de la casilla
    if (curtainRight) {
      curtainRight.style.top = y1 + 'px';
      curtainRight.style.left = x2 + 'px';
      curtainRight.style.width = Math.max(0, w - x2) + 'px';
      curtainRight.style.height = Math.max(0, y2 - y1) + 'px';
    }

    // 5. Marco resaltador del elemento activo (sin fondo ni filtro, solo contorno esmeralda y halo)
    // El elemento activo en el centro queda 100% libre, nítido e interactivo
    if (frameHighlight) {
      const computedStyle = window.getComputedStyle ? window.getComputedStyle(targetEl) : null;
      const rawRadius = computedStyle ? parseInt(computedStyle.borderRadius, 10) : 14;
      const radius = isNaN(rawRadius) || rawRadius <= 0 ? 14 : Math.min(26, rawRadius + 2);

      frameHighlight.style.display = 'block';
      frameHighlight.style.top = y1 + 'px';
      frameHighlight.style.left = x1 + 'px';
      frameHighlight.style.width = (x2 - x1) + 'px';
      frameHighlight.style.height = (y2 - y1) + 'px';
      frameHighlight.style.borderRadius = radius + 'px';
    }
  }

  scrollToElement(targetEl) {
    if (!targetEl) return;
    const steps = this.getGuideSteps();
    const currentStep = (steps && steps.length > this.currentStepIndex) ? steps[this.currentStepIndex] : null;
    const activeScreen = document.querySelector('.screen-view.is-active');
    const currentView = activeScreen ? activeScreen.id.replace('view-', '') : (window.appRouter ? window.appRouter.currentView : '');

    const isStepRutVisible = document.getElementById('newRecipientStepRut') && !document.getElementById('newRecipientStepRut').classList.contains('hidden');

    if ((currentStep && currentStep.noBlur && currentView !== 'new-recipient') || (currentView === 'new-recipient' && isStepRutVisible) || currentView === 'summary' || currentView === 'success' || currentView === 'receipt') {
      const scrollContainer = targetEl.closest('.scroll-area') || targetEl.closest('.screen-view');
      if (scrollContainer && scrollContainer.scrollTop !== 0) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      this.resetFrameScroll();
      return;
    }

    const scrollContainer = targetEl.closest('.scroll-area') || targetEl.closest('.screen-view');
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const cardHeight = this.spotlightCard ? (this.spotlightCard.offsetHeight || 165) : 165;
      const isDockedTop = this.spotlightCard && this.spotlightCard.classList.contains('is-docked-top');

      // Área visible libre según si la tarjeta está acoplada arriba o abajo
      const visibleTop = isDockedTop ? (containerRect.top + cardHeight + 20) : (containerRect.top + 10);
      const visibleBottom = isDockedTop ? (containerRect.bottom - 10) : (containerRect.bottom - cardHeight - 20);

      // Si el elemento ya está visible en pantalla sin ser tapado, no desplazar innecesariamente
      const isAlreadyVisible = (targetRect.top >= visibleTop && targetRect.bottom <= visibleBottom);

      if (!isAlreadyVisible) {
        const currentScroll = scrollContainer.scrollTop;
        const relativeTop = targetRect.top - containerRect.top + currentScroll;
        const availableHeight = Math.max(100, visibleBottom - visibleTop);
        const targetScroll = isDockedTop
          ? Math.max(0, relativeTop - (visibleTop - containerRect.top))
          : Math.max(0, relativeTop - (availableHeight / 2) + (targetRect.height / 2));

        scrollContainer.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
    this.resetFrameScroll();
  }

  /* ================= FOCO DINÁMICO (SPOTLIGHT AL 85% PASO A PASO) ================= */
  activateSpotlight(targetSelector, title, message) {
    if (!this.enabled) return;
    this.dismissInactivityOffer();
    this.closeSheet();
    this.closeWidgetMenu();

    const targetEl = document.querySelector(targetSelector);
    if (!targetEl) return;

    if (window.facilitatorPanel) {
      window.facilitatorPanel.recordMetric('spotlight');
    }

    this.clearPreviousHighlight();
    this.activeSpotlightElement = targetEl;
    targetEl.classList.add('spotlight-active');

    const activeScreen = document.querySelector('.screen-view.is-active');
    const currentView = activeScreen ? activeScreen.id.replace('view-', '') : (window.appRouter ? window.appRouter.currentView : '');
    const isNoBlurScreen = currentView === 'summary' || currentView === 'new-recipient' || currentView === 'success' || currentView === 'receipt';

    this.isTutorialActive = true;

    if (!isNoBlurScreen) {
      document.body.classList.add('dynamic-focus-active');
      if (this.dynamicFocusOverlay) {
        this.dynamicFocusOverlay.classList.add('active');
      }
    } else {
      document.body.classList.remove('dynamic-focus-active');
      if (this.dynamicFocusOverlay) {
        this.dynamicFocusOverlay.classList.remove('active');
      }
      this.updateSpotlightOverlay(null);
    }

    if (this.spotlightCard) {
      const titleEl = document.getElementById('spotlightGuideTitle');
      const textEl = document.getElementById('spotlightGuideText');
      if (titleEl) titleEl.textContent = title || 'Paso actual';
      if (textEl) textEl.textContent = message || 'Completa este campo para continuar con tranquilidad.';
      this.spotlightCard.classList.add('show');
      this.positionSpotlightCard(targetEl);
    }

    this.scrollToElement(targetEl);

    setTimeout(() => {
      this.positionSpotlightCard(targetEl);
    }, 320);

    // Lectura automática de voz al activar foco de ayuda
    const textToSpeak = message ? ((title ? (title + '. ') : '') + message) : title;
    if (window.puenteSpeech && textToSpeak) {
      setTimeout(() => {
        if (this.isTutorialActive) {
          window.puenteSpeech.speak(textToSpeak);
        }
      }, 350);
    }
  }

  /* Sincroniza la ubicación y texto del botón: dentro del card del Paso 1 (diciendo Continuar) solo si el modo tutorial está activo;
     y debajo en la página diciendo "Listo" cuando el modo tutorial está apagado */
  syncRutButtonLocation(isRutTutorialStep) {
    const btn = document.getElementById('btnConfirmRutNext');
    const slot = document.getElementById('spotlightCardActionSlot');
    const originalContainer = document.getElementById('rutBottomActionsContainer');
    const cancelBtn = document.getElementById('btnCancelAddRecipientRut');
    const newRecipientView = document.getElementById('view-new-recipient');

    if (!btn || !slot || !originalContainer) return;

    if (isRutTutorialStep) {
      if (btn.parentElement !== slot) {
        slot.appendChild(btn);
      }
      btn.innerHTML = `
        <span>Continuar</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      `;
      slot.style.display = 'block';
      if (newRecipientView) {
        newRecipientView.classList.add('tutorial-rut-card-action-active');
      }
    } else {
      if (btn.parentElement !== originalContainer) {
        if (cancelBtn && cancelBtn.parentElement === originalContainer) {
          originalContainer.insertBefore(btn, cancelBtn);
        } else {
          originalContainer.appendChild(btn);
        }
      }
      btn.innerHTML = `
        <span class="term-technical">Listo</span>
        <span class="term-simplified">Listo</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      `;
      slot.style.display = 'none';
      if (newRecipientView) {
        newRecipientView.classList.remove('tutorial-rut-card-action-active');
      }
    }
  }

  /* Inserta el botón "Correcto" en el Paso 1 de Resumen Seguro para que el usuario avance cuando esté listo */
  syncSummaryCorrectoButton(isSummaryStep1) {
    const slot = document.getElementById('spotlightCardActionSlot');
    if (!slot) return;

    // Si el botón de RUT está adentro, no tocar el slot
    const btnRut = document.getElementById('btnConfirmRutNext');
    if (btnRut && btnRut.parentElement === slot) return;

    if (isSummaryStep1) {
      slot.innerHTML = `
        <button type="button" class="btn-cta-big" id="btnSummaryCorrecto" style="min-height:52px;background:var(--teal)!important;color:#FFFFFF!important;border:none!important;border-radius:var(--radius-pill);font-size:18px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(13,143,114,0.3);width:100%;cursor:pointer;">
          <span>Correcto</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      `;
      slot.style.display = 'block';
      const btn = document.getElementById('btnSummaryCorrecto');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.nextGuideStep();
        });
      }
    } else {
      const existingBtn = document.getElementById('btnSummaryCorrecto');
      if (existingBtn) {
        slot.innerHTML = '';
        slot.style.display = 'none';
      }
    }
  }

  /* Sincroniza el banner superior compacto de la pantalla de destinatario (Paso 2) */
  syncRecipientTutorialBanner(isStep2) {
    const banner = document.getElementById('recipientTutorialBanner');
    if (!banner) return;
    if (isStep2) {
      banner.style.display = 'block';
      if (this.spotlightCard) {
        this.spotlightCard.classList.remove('show');
      }
    } else {
      banner.style.display = 'none';
    }
  }

  clearSpotlight(viewName) {
    this.stepExecutionToken = (this.stepExecutionToken || 0) + 1;
    this.isTutorialActive = false;
    this.stepWasDismissed = false;
    this.currentStepIndex = 0;
    this.syncRutButtonLocation(false);
    this.syncSummaryCorrectoButton(false);
    this.syncRecipientTutorialBanner(false);
    document.body.classList.remove('dynamic-focus-active');
    this.clearPreviousHighlight();
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.fallbackAdvanceTimer) {
      clearTimeout(this.fallbackAdvanceTimer);
      this.fallbackAdvanceTimer = null;
    }
    if (this.dynamicFocusOverlay) {
      this.dynamicFocusOverlay.classList.remove('active');
    }
    this.updateSpotlightOverlay(null);
    if (this.spotlightCard) {
      this.spotlightCard.classList.remove('show');
      this.spotlightCard.classList.remove('is-docked-top');
      this.spotlightCard.style.transform = 'translateY(0)';
    }
    if (window.puenteSpeech) {
      window.puenteSpeech.stop();
    }

    // Regresar el área de scroll al inicio suavemente al cerrar el tutorial si estaba desplazada
    const activeViewEl = document.querySelector('.screen-view.is-active');
    if (activeViewEl) {
      const scrollArea = activeViewEl.querySelector('.scroll-area');
      if (scrollArea && scrollArea.scrollTop !== 0) {
        scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    // Asegurar que el marco y el viewport no queden desplazados
    this.resetFrameScroll();
    this.updateFabVisibility(viewName);
  }

  /* Cierra el paso actual del tutorial a petición del usuario y muestra el botón flotante "Ayuda" */
  dismissCurrentTutorialStep() {
    this.stepExecutionToken = (this.stepExecutionToken || 0) + 1;
    this.stepWasDismissed = true;
    this.isTutorialActive = false;
    this.syncRutButtonLocation(false);
    this.syncSummaryCorrectoButton(false);
    this.syncRecipientTutorialBanner(false);
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.fallbackAdvanceTimer) {
      clearTimeout(this.fallbackAdvanceTimer);
      this.fallbackAdvanceTimer = null;
    }
    if (window.puenteSpeech) {
      window.puenteSpeech.stop();
    }
    if (this.spotlightCard) {
      this.spotlightCard.classList.remove('show');
    }
    const banner = document.getElementById('recipientTutorialBanner');
    if (banner) {
      banner.style.display = 'none';
    }
    this.clearPreviousHighlight();
    document.body.classList.remove('dynamic-focus-active');
    if (this.dynamicFocusOverlay) {
      this.dynamicFocusOverlay.classList.remove('active');
    }
    this.updateSpotlightOverlay(null);
    this.updateFabVisibility();
  }

  /* Reabre el paso del tutorial que fue cerrado */
  reopenTutorialStep() {
    this.stepWasDismissed = false;
    this.isTutorialActive = true;
    this.updateFabVisibility();
    this.executeCurrentStep();
  }

  /* Flujo interactivo paso a paso para completar la transferencia */
  startStepByStepGuide() {
    this.stepExecutionToken = (this.stepExecutionToken || 0) + 1;
    this.stepWasDismissed = false;
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.fallbackAdvanceTimer) {
      clearTimeout(this.fallbackAdvanceTimer);
      this.fallbackAdvanceTimer = null;
    }
    if (window.puenteSpeech) {
      window.puenteSpeech.stop();
    }
    this.isTutorialActive = true;
    this.currentStepIndex = 0;
    this.updateFabVisibility();
    this.executeCurrentStep();
  }

  handleViewChange(viewName) {
    this.stepExecutionToken = (this.stepExecutionToken || 0) + 1;
    this.stepWasDismissed = false;
    this.updateFabVisibility(viewName);
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.fallbackAdvanceTimer) {
      clearTimeout(this.fallbackAdvanceTimer);
      this.fallbackAdvanceTimer = null;
    }
    if (window.puenteSpeech) {
      window.puenteSpeech.stop();
    }
    if (viewName !== 'new-recipient') {
      this.syncRutButtonLocation(false);
    } else {
      const isStepRutVisible = document.getElementById('newRecipientStepRut') && !document.getElementById('newRecipientStepRut').classList.contains('hidden');
      this.syncRutButtonLocation(this.isTutorialActive && isStepRutVisible);
    }
    if (viewName !== 'recipient') {
      this.syncRecipientTutorialBanner(false);
    }
    if (!this.isTutorialActive) return;
    if (viewName === 'home') {
      this.clearSpotlight();
      return;
    }
    this.currentStepIndex = 0;
    setTimeout(() => {
      if (this.isTutorialActive) {
        this.executeCurrentStep();
      }
    }, 120);
  }

  getGuideSteps() {
    const activeScreen = document.querySelector('.screen-view.is-active');
    const currentView = activeScreen ? activeScreen.id.replace('view-', '') : (window.appRouter ? window.appRouter.currentView : 'home');

    if (currentView === 'home') {
      return [
        {
          target: '#btnQuickTransfer',
          title: 'Quiero transferir dinero',
          message: 'Toca este botón verde para comenzar a transferir dinero.',
          speech: 'Toca el botón verde Quiero transferir dinero para comenzar.',
          autoAdvanceOnSpeechEnd: false
        }
      ];
    } else if (currentView === 'recipient') {
      // Paso a paso en pantalla de contactos guardados / favoritos
      return [
        {
          target: '#btnGoToNewRecipientScreen',
          title: '¿Quieres transferirle a otra persona?',
          message: 'Toca este botón si deseas transferirle a una persona que no esté en tu lista.',
          speech: 'Si deseas transferirle a otra persona, toca el botón Otra persona arriba.',
          noBlur: true,
          autoAdvanceOnSpeechEnd: true,
          delayAfterSpeech: 2000
        },
        {
          target: '#paneRecipientSaved',
          title: 'O elige una persona guardada',
          message: 'Toca a alguna persona que ya tengas guardada aquí, o usa el buscador para encontrarla.',
          speech: '... o toca a alguna persona que ya tengas guardada aquí.',
          noBlur: true,
          autoAdvanceOnSpeechEnd: false
        }
      ];
    } else if (currentView === 'new-recipient') {
      const isStepRutVisible = document.getElementById('newRecipientStepRut') && !document.getElementById('newRecipientStepRut').classList.contains('hidden');
      if (isStepRutVisible) {
        // Etapa A: Ingreso de RUT en la nueva pantalla
        return [
          {
            target: '#groupRecipientRut',
            title: 'Paso 1: RUT de la persona',
            message: 'Escribe el RUT de la persona o toca el botón de al lado para dictar. Revisa que esté correcto y toca el botón Continuar.',
            speech: 'Escribe el RUT de la persona o toca el botón de al lado para dictar. Revisa que esté correcto y toca el botón Continuar.',
            noBlur: true,
            autoAdvanceOnSpeechEnd: false
          }
        ];
      } else {
        // Etapa B: Formulario con nombre, banco, píldoras y cuenta
        return [
          {
            target: '#groupRecipientName',
            title: 'Paso 1: Nombre y Apellido',
            message: 'Anota el nombre y apellido de la persona a quien le enviarás dinero.',
            speech: 'Paso 1: Escribe el nombre y apellido de la persona.',
            noBlur: true,
            autoAdvanceOnSpeechEnd: false
          },
          {
            target: '#groupRecipientBank',
            title: 'Paso 2: Banco',
            message: 'Toca el banco de la persona: BancoEstado, Banco de Chile, Santander, Bci u Otro banco.',
            speech: 'Paso 2: Banco. Elige el banco de la persona.',
            noBlur: true,
            autoAdvanceOnSpeechEnd: false
          },
          {
            target: '#groupRecipientType',
            title: 'Paso 3: Tipo de cuenta',
            message: 'Elige el tipo de cuenta: CuentaRut, Corriente, Vista o Ahorro.',
            speech: 'Paso 3: Tipo de cuenta. Elige el tipo de cuenta.',
            noBlur: true,
            autoAdvanceOnSpeechEnd: false
          },
          {
            target: '#groupRecipientNum',
            title: 'Paso 4: Número de cuenta',
            message: 'Anota o dicta el número de cuenta de la persona.',
            speech: 'Paso 4: Anota o dicta el número de cuenta.',
            noBlur: true,
            autoAdvanceOnSpeechEnd: false
          },
          {
            target: '#btnContinueRecipient',
            title: 'Toca el botón Listo',
            message: 'Toca el botón Listo para continuar al monto.',
            speech: 'Toca el botón Listo para avanzar.',
            noBlur: true,
            autoAdvanceOnSpeechEnd: false
          }
        ];
      }
    } else if (currentView === 'amount') {
      return [
        {
          target: '#amountBox',
          title: 'Paso 1: Ingresar el monto',
          message: 'Escribe la cantidad exacta de dinero a enviar tocando la casilla enmarcada (máximo 200.000 pesos), o elige uno de los montos sugeridos abajo (10.000 pesos, 30.000 pesos, 50.000 pesos o 100.000 pesos).',
          speech: 'Paso 1: Ingresa el monto. Toca la casilla enmarcada para escribir cuánto dinero quieres transferir, hasta un máximo de 200 mil pesos, o elige una de las opciones sugeridas.',
          autoAdvanceOnSpeechEnd: false
        },
        {
          target: '#groupGlosaAndContinue',
          title: 'Paso 2: Nota opcional y Revisar datos',
          message: '¿Quieres dejar una nota? (No es obligatorio, puedes dejarlo en blanco). Cuando estés listo, toca Revisar datos.',
          speech: '¿Quieres dejar una nota? No es obligatorio, puedes dejarlo en blanco. Cuando estés listo, toca el botón verde Revisar datos para continuar.',
          noBlur: true,
          autoAdvanceOnSpeechEnd: false
        }
      ];
    } else if (currentView === 'summary') {
      return [
        {
          target: '#safeSummaryCard',
          title: 'Revisión tranquila de datos',
          message: 'Revisa tranquilo los datos antes de continuar. Tienes todo el tiempo que necesites. Cuando hayas verificado todo, toca el botón Correcto.',
          speech: 'Revisa con calma el monto y el nombre de quien recibe. Tienes todo el tiempo que necesites. Cuando hayas verificado todo, toca el botón Correcto.',
          noBlur: true,
          autoAdvanceOnSpeechEnd: false
        },
        {
          target: '#btnConfirmSummary',
          title: 'Autorizar transferencia',
          message: 'Si todos los datos están correctos, toca este botón verde para escribir tu clave de 6 números.',
          speech: 'Si está todo bien haz click en el botón verde para escribir tu clave de 6 números.',
          noBlur: true,
          autoAdvanceOnSpeechEnd: false
        }
      ];
    } else if (currentView === 'success') {
      return [
        {
          target: '#btnContinueFromSuccess',
          title: '¡Transferencia Exitosa!',
          message: 'Tu dinero ya fue enviado. Toca este botón para ver el comprobante detallado.',
          speech: 'Tu dinero ya fue enviado. Toca Continuar para ver tu comprobante.',
          noBlur: true,
          autoAdvanceOnSpeechEnd: false
        }
      ];
    } else if (currentView === 'receipt') {
      return [
        {
          target: '#btnShareReceipt',
          title: 'Compartir comprobante',
          message: 'Para compartir el comprobante por WhatsApp, toca este botón.',
          speech: '¡Transferencia Exitosa! Tu dinero fue enviado. Para compartir el comprobante por WhatsApp, haz click en el botón Compartir comprobante.',
          noBlur: true,
          autoAdvanceOnSpeechEnd: true,
          delayAfterSpeech: 2000
        },
        {
          target: '#btnExitToHome',
          title: 'Volver al inicio',
          message: 'Toca este botón verde cuando hayas terminado para regresar a la pantalla principal de tu CuentaRUT.',
          speech: 'Cuando hayas terminado, toca Volver al inicio para regresar a tu CuentaRUT.',
          noBlur: true,
          autoAdvanceOnSpeechEnd: false
        }
      ];
    }
    return [];
  }

  executeCurrentStep() {
    const steps = this.getGuideSteps();
    if (!steps || !steps.length) return;

    if (typeof this.currentStepIndex !== 'number' || isNaN(this.currentStepIndex) || this.currentStepIndex < 0 || this.currentStepIndex >= steps.length) {
      this.currentStepIndex = 0;
    }

    const step = steps[this.currentStepIndex];
    if (!step || !step.target) {
      this.clearSpotlight();
      return;
    }
    const targetEl = document.querySelector(step.target);
    if (!targetEl) {
      this.currentStepIndex++;
      this.executeCurrentStep();
      return;
    }

    this.clearPreviousHighlight();

    const activeScreen = document.querySelector('.screen-view.is-active');
    const currentView = activeScreen ? activeScreen.id.replace('view-', '') : (window.appRouter ? window.appRouter.currentView : '');
    const isStepRutVisible = document.getElementById('newRecipientStepRut') && !document.getElementById('newRecipientStepRut').classList.contains('hidden');
    const isRutTutorialStep = (this.isTutorialActive && currentView === 'new-recipient' && isStepRutVisible && step && step.target === '#groupRecipientRut');
    this.syncRutButtonLocation(isRutTutorialStep);

    const isSummaryStep1 = (this.isTutorialActive && currentView === 'summary' && this.currentStepIndex === 0);
    this.syncSummaryCorrectoButton(isSummaryStep1);

    const isRecipientStep2 = (this.isTutorialActive && currentView === 'recipient' && this.currentStepIndex === 1);
    this.syncRecipientTutorialBanner(isRecipientStep2);

    this.stepWasDismissed = false;
    this.updateFabVisibility(currentView);

    const isNoBlur = step.noBlur || currentView === 'summary' || currentView === 'new-recipient' || currentView === 'success' || currentView === 'receipt';

    if (isNoBlur) {
      this.activeSpotlightElement = targetEl;
      targetEl.classList.add('spotlight-active');
      document.body.classList.remove('dynamic-focus-active');
      if (this.dynamicFocusOverlay) {
        this.dynamicFocusOverlay.classList.remove('active');
      }
      this.updateSpotlightOverlay(null);
    } else {
      this.activeSpotlightElement = targetEl;
      targetEl.classList.add('spotlight-active');
      document.body.classList.add('dynamic-focus-active');

      if (this.dynamicFocusOverlay) {
        this.dynamicFocusOverlay.classList.add('active');
      }
    }

    if (this.spotlightCard) {
      const badgeEl = document.getElementById('spotlightStepBadge');
      const titleEl = document.getElementById('spotlightGuideTitle');
      const textEl = document.getElementById('spotlightGuideText');
      const voiceBtn = document.getElementById('btnSpotlightVoice');

      if (badgeEl) badgeEl.textContent = `PASO ${this.currentStepIndex + 1} DE ${steps.length}`;
      if (titleEl) titleEl.textContent = step.title;
      if (textEl) textEl.textContent = step.message;
      if (voiceBtn) voiceBtn.setAttribute('data-speech', step.speech || step.message);

      if (!isRecipientStep2) {
        this.spotlightCard.classList.add('show');
        this.positionSpotlightCard(targetEl);
      } else {
        this.spotlightCard.classList.remove('show');
      }
    }

    this.scrollToElement(targetEl);

    if (!isRecipientStep2) {
      setTimeout(() => {
        this.positionSpotlightCard(targetEl);
      }, 320);
    }

    // Cancelar cualquier temporizador de avance anterior
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.fallbackAdvanceTimer) {
      clearTimeout(this.fallbackAdvanceTimer);
      this.fallbackAdvanceTimer = null;
    }

    const currentToken = ++this.stepExecutionToken;
    const expectedView = currentView;
    const expectedStepIndex = this.currentStepIndex;

    // La voz lee el paso automáticamente
    const textToSpeak = step.speech || (step.title ? (step.title + '. ' + step.message) : step.message);

    if (window.puenteSpeech && textToSpeak) {
      setTimeout(() => {
        const screenNow = document.querySelector('.screen-view.is-active');
        const viewNow = screenNow ? screenNow.id.replace('view-', '') : '';
        if (this.isTutorialActive && this.stepExecutionToken === currentToken && this.currentStepIndex === expectedStepIndex && viewNow === expectedView) {
          window.puenteSpeech.speak(textToSpeak, () => {
            if (this.fallbackAdvanceTimer && this.stepExecutionToken === currentToken) {
              clearTimeout(this.fallbackAdvanceTimer);
              this.fallbackAdvanceTimer = null;
            }
            const screenEnd = document.querySelector('.screen-view.is-active');
            const viewEnd = screenEnd ? screenEnd.id.replace('view-', '') : '';
            // Si el paso actual es meramente informativo, avanza al paso de acción
            if (step.autoAdvanceOnSpeechEnd && this.isTutorialActive && this.stepExecutionToken === currentToken && this.currentStepIndex === expectedStepIndex && viewEnd === expectedView) {
              // Esperar hasta 2 segundos como máximo tras terminar de hablar para que el abuelito termine de asimilar la información
              const delay = (step.delayAfterSpeech !== undefined) ? step.delayAfterSpeech : 2000;
              this.autoAdvanceTimer = setTimeout(() => {
                const screenDelay = document.querySelector('.screen-view.is-active');
                const viewDelay = screenDelay ? screenDelay.id.replace('view-', '') : '';
                if (this.isTutorialActive && this.stepExecutionToken === currentToken && this.currentStepIndex === expectedStepIndex && viewDelay === expectedView) {
                  this.nextGuideStep();
                }
              }, delay);
            }
          });
        }
      }, 350);
    }

    // Temporizador de resguardo largo (14 segundos) por si el audio no está disponible o no emite eventos
    if (step.autoAdvanceOnSpeechEnd) {
      this.fallbackAdvanceTimer = setTimeout(() => {
        const screenFb = document.querySelector('.screen-view.is-active');
        const viewFb = screenFb ? screenFb.id.replace('view-', '') : '';
        if (this.isTutorialActive && this.stepExecutionToken === currentToken && this.currentStepIndex === expectedStepIndex && viewFb === expectedView) {
          this.nextGuideStep();
        }
      }, 14000);
    }
  }

  nextGuideStep() {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.fallbackAdvanceTimer) {
      clearTimeout(this.fallbackAdvanceTimer);
      this.fallbackAdvanceTimer = null;
    }
    const steps = this.getGuideSteps();
    if (this.currentStepIndex < steps.length - 1) {
      this.currentStepIndex++;
      this.executeCurrentStep();
    } else {
      this.clearSpotlight();
    }
  }

  prevGuideStep() {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.fallbackAdvanceTimer) {
      clearTimeout(this.fallbackAdvanceTimer);
      this.fallbackAdvanceTimer = null;
    }
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.executeCurrentStep();
    }
  }

  goToStepByTarget(targetSelector) {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.fallbackAdvanceTimer) {
      clearTimeout(this.fallbackAdvanceTimer);
      this.fallbackAdvanceTimer = null;
    }
    const steps = this.getGuideSteps();
    if (!steps || !steps.length) return;
    const targetIdx = steps.findIndex(s => s.target === targetSelector);
    if (targetIdx !== -1) {
      this.currentStepIndex = targetIdx;
      this.executeCurrentStep();
    }
  }

  onFieldCompleted(targetSelector) {
    if (!this.isTutorialActive) return;
    const steps = this.getGuideSteps();
    if (!steps || !steps.length) return;
    const currentStep = steps[this.currentStepIndex];
    if (currentStep && (currentStep.target === targetSelector || (targetSelector && targetSelector.includes(currentStep.target)))) {
      this.nextGuideStep();
    }
  }

  isCurrentTarget(selector) {
    if (!this.isTutorialActive) return false;
    const steps = this.getGuideSteps();
    if (!steps || !steps.length) return false;
    const current = steps[this.currentStepIndex];
    return current && current.target === selector;
  }

  /* Activa la guía paso a paso al tocar el botón */
  spotlightCurrentStep() {
    this.startStepByStepGuide();
  }

  /* ================= TRADUCCIÓN SEMÁNTICA (GLOSARIO) ================= */
  toggleSemanticMode(enabled, announce = true) {
    this.semanticMode = enabled !== undefined ? enabled : !this.semanticMode;
    const appEl = document.getElementById('appMainContainer');
    if (appEl) {
      appEl.classList.toggle('app-semantic-active', this.semanticMode);
    }
    const switchEl = document.getElementById('switchSemanticMode');
    if (switchEl) {
      switchEl.checked = this.semanticMode;
    }
    this.updateLanguageWidgetBadge();
    if (announce && window.puenteSpeech) {
      window.puenteSpeech.speak(this.semanticMode ? 'Modo lenguaje simple activado.' : 'Modo lenguaje simple desactivado.');
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

  /* ================= WIDGET SPEED DIAL (3 BOTONES DESLIZANTES) ================= */
  toggleWidgetMenu() {
    if (this.isWidgetMenuOpen) {
      this.closeWidgetMenu();
    } else {
      this.openWidgetMenu();
    }
  }

  openWidgetMenu() {
    if (!this.enabled) return;
    this.dismissInactivityOffer();
    this.closeSheet();
    this.isWidgetMenuOpen = true;
    if (this.widgetMenu) {
      this.widgetMenu.classList.add('open');
    }
    if (this.fabBtn) {
      this.fabBtn.classList.add('is-active');
    }
    if (this.widgetBackdrop) {
      this.widgetBackdrop.classList.add('active');
    }
    this.updateLanguageWidgetBadge();
  }

  closeWidgetMenu() {
    this.isWidgetMenuOpen = false;
    if (this.widgetMenu) {
      this.widgetMenu.classList.remove('open');
    }
    if (this.fabBtn) {
      this.fabBtn.classList.remove('is-active');
    }
    if (this.widgetBackdrop) {
      this.widgetBackdrop.classList.remove('active');
    }
  }

  updateLanguageWidgetBadge() {
    const badge = document.getElementById('badgeWidgetLanguage');
    const btnLang = document.getElementById('btnWidgetLanguage');
    if (badge && btnLang) {
      if (this.semanticMode) {
        badge.textContent = 'Activo';
        badge.style.background = 'var(--teal-light)';
        badge.style.color = 'var(--teal)';
        btnLang.classList.remove('inactive');
        btnLang.classList.add('active');
      } else {
        badge.textContent = 'Inactivo';
        badge.style.background = '#F1F5F9';
        badge.style.color = 'var(--muted)';
        btnLang.classList.remove('active');
        btnLang.classList.add('inactive');
      }
    }
  }

  /* ================= PANEL / BOTTOM SHEET (DESACTIVADO) ================= */
  openSheet() {
    // Desactivado: el display inferior ha sido eliminado a favor del menú Widget
    return;
  }

  closeSheet() {
    return;
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

  /* ================= DIÁLOGO DE INICIO: ¿QUÉ QUIERES HACER? ================= */
  openHomeHelpModal() {
    if (!this.enabled || !this.homeHelpModal) return;
    this.dismissInactivityOffer();
    this.closeWidgetMenu();
    this.homeHelpModal.classList.add('active');
    if (this.homeHelpVoiceFeedback) {
      this.homeHelpVoiceFeedback.style.display = 'none';
      this.homeHelpVoiceFeedback.textContent = '';
      this.homeHelpVoiceFeedback.classList.remove('error');
    }
    if (window.facilitatorPanel) {
      window.facilitatorPanel.recordMetric('help', 'inicio_que_quieres_hacer');
    }
  }

  closeHomeHelpModal() {
    if (!this.homeHelpModal) return;
    this.homeHelpModal.classList.remove('active');
    if (this.btnVoiceDictateHome) {
      this.btnVoiceDictateHome.classList.remove('listening');
    }
    if (this.homeRecognition) {
      try { this.homeRecognition.stop(); } catch(e) {}
    }
  }

  handleHomeHelpTransfer() {
    this.closeHomeHelpModal();
    // Iniciar modo tutorial para realizar el proceso completo
    this.startStepByStepGuide();
  }

  setupHomeVoiceDictation() {
    const btnVoice = this.btnVoiceDictateHome;
    const feedback = this.homeHelpVoiceFeedback;
    if (!btnVoice) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

    const showVoiceFeedback = (text, isError = false) => {
      if (!feedback) return;
      feedback.textContent = text;
      feedback.style.display = 'block';
      if (isError) feedback.classList.add('error');
      else feedback.classList.remove('error');
    };

    const processTranscript = (rawText) => {
      const text = (rawText || '').toLowerCase().trim();
      const isTransfer = text.includes('transfer') || 
                         text.includes('transfere') || 
                         text.includes('enviar') || 
                         text.includes('mandar') || 
                         text.includes('pasar') || 
                         (text.includes('plata') && !text.includes('saldo')) || 
                         text.includes('dinero');

      if (isTransfer) {
        showVoiceFeedback(`✓ Entendido: "${rawText}". Iniciando tutorial...`);
        if (window.puenteSpeech) {
          window.puenteSpeech.speak('Entendido. Te guiaremos paso a paso para hacer tu transferencia.', () => {
            setTimeout(() => {
              this.handleHomeHelpTransfer();
            }, 300);
          });
        } else {
          setTimeout(() => {
            this.handleHomeHelpTransfer();
          }, 850);
        }
      } else {
        showVoiceFeedback(`Detectamos: "${rawText}". Puedes decir "Quiero transferir" o tocar el botón arriba.`, true);
        if (window.puenteSpeech) {
          window.puenteSpeech.speak('Para transferir, di Quiero transferir o toca el botón de transferir dinero.');
        }
      }
    };

    const runSimulatedVoice = () => {
      btnVoice.classList.add('listening');
      showVoiceFeedback('🎙️ Escuchando... Di lo que quieres hacer');
      setTimeout(() => {
        btnVoice.classList.remove('listening');
        processTranscript('Quiero hacer una transferencia');
      }, 1100);
    };

    btnVoice.addEventListener('click', (e) => {
      e.stopPropagation();

      if (btnVoice.classList.contains('listening')) {
        if (this.homeRecognition) {
          try { this.homeRecognition.stop(); } catch(err) {}
        }
        btnVoice.classList.remove('listening');
        return;
      }

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'es-CL';
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;
          this.homeRecognition = recognition;

          btnVoice.classList.add('listening');
          showVoiceFeedback('🎙️ Escuchando... Di lo que quieres hacer');

          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            processTranscript(transcript);
          };

          recognition.onerror = (err) => {
            console.warn('SpeechRecognition error:', err);
            showVoiceFeedback('No pudimos escuchar con claridad. Toca el botón "Transferir dinero" o intenta de nuevo.', true);
          };

          recognition.onend = () => {
            btnVoice.classList.remove('listening');
          };

          recognition.start();
        } catch (err) {
          console.warn('Recognition start failed:', err);
          btnVoice.classList.remove('listening');
          runSimulatedVoice();
        }
      } else {
        runSimulatedVoice();
      }
    });
  }

  /* ================= CONEXIONES DE EVENTOS ================= */
  setupEventListeners() {
    // Diálogo de inicio "¿Qué quieres hacer?"
    if (this.btnHomeHelpTransfer) {
      this.btnHomeHelpTransfer.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleHomeHelpTransfer();
      });
    }

    if (this.btnCloseHomeHelp) {
      this.btnCloseHomeHelp.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeHomeHelpModal();
      });
    }

    if (this.homeHelpModal) {
      this.homeHelpModal.addEventListener('click', (e) => {
        if (e.target === this.homeHelpModal) {
          this.closeHomeHelpModal();
        }
      });
    }

    if (this.btnVoiceDictateHome) {
      this.setupHomeVoiceDictation();
    }

    // Backdrop del widget para cerrar al tocar afuera
    if (this.widgetBackdrop) {
      this.widgetBackdrop.addEventListener('click', () => this.closeWidgetMenu());
    }

    // Botón 1: Escuchar Pantalla
    if (this.btnWidgetSpeech) {
      this.btnWidgetSpeech.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeWidgetMenu();
        if (window.appRouter) {
          window.appRouter.readCurrentScreenAloud();
        }
      });
    }

    // Botón 2: Modo tutorial
    if (this.btnWidgetTutorial) {
      this.btnWidgetTutorial.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeWidgetMenu();
        this.startStepByStepGuide();
      });
    }

    // Botón 3: Lenguaje Simple
    if (this.btnWidgetLanguage) {
      this.btnWidgetLanguage.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSemanticMode();
      });
    }

    // Cerrar panel de ayuda
    const btnClose = document.getElementById('btnClosePuente');
    if (btnClose) btnClose.addEventListener('click', () => this.closeSheet());
    if (this.sheetBackdrop) this.sheetBackdrop.addEventListener('click', () => this.closeSheet());

    // Oferta de inactividad: al tocar "¿Te ayudo?", se despliega el menú de ayuda
    if (this.inactivityBubble) {
      this.inactivityBubble.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismissInactivityOffer();
        this.openWidgetMenu();
        if (window.facilitatorPanel) {
          window.facilitatorPanel.recordMetric('help', 'oferta15s');
        }
      });
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
    if (this.spotlightCard) {
      this.spotlightCard.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Avance automático en el tutorial al completar campos y acciones
    this.setupTutorialFieldListeners();

    const btnSpotlightCloseX = document.getElementById('btnSpotlightCloseX');
    if (btnSpotlightCloseX) {
      btnSpotlightCloseX.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismissCurrentTutorialStep();
      });
    }

    const btnSpotlightVoice = document.getElementById('btnSpotlightVoice');
    if (btnSpotlightVoice) {
      btnSpotlightVoice.addEventListener('click', (e) => {
        e.stopPropagation();
        const speechText = btnSpotlightVoice.getAttribute('data-speech') || document.getElementById('spotlightGuideText').textContent;
        if (speechText && window.puenteSpeech) {
          if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
          }
          if (this.fallbackAdvanceTimer) {
            clearTimeout(this.fallbackAdvanceTimer);
            this.fallbackAdvanceTimer = null;
          }
          const steps = this.getGuideSteps();
          const step = steps[this.currentStepIndex];
          const stepIndexAtStart = this.currentStepIndex;
          window.puenteSpeech.speak(speechText, () => {
            if (this.fallbackAdvanceTimer) {
              clearTimeout(this.fallbackAdvanceTimer);
              this.fallbackAdvanceTimer = null;
            }
            if (step && step.autoAdvanceOnSpeechEnd && this.isTutorialActive && this.currentStepIndex === stepIndexAtStart) {
              const delay = (step.delayAfterSpeech !== undefined) ? step.delayAfterSpeech : 2000;
              this.autoAdvanceTimer = setTimeout(() => {
                if (this.isTutorialActive && this.currentStepIndex === stepIndexAtStart) {
                  this.nextGuideStep();
                }
              }, delay);
            }
          });
        }
      });
    }

    // Botones del banner superior compacto de destinatario (Paso 2)
    const btnRecipientBannerVoice = document.getElementById('btnRecipientBannerVoice');
    if (btnRecipientBannerVoice) {
      btnRecipientBannerVoice.addEventListener('click', (e) => {
        e.stopPropagation();
        const steps = this.getGuideSteps();
        const step = (steps && steps.length > 1) ? steps[1] : null;
        const speechText = (step && step.speech) ? step.speech : '... o toca a alguna persona que ya tengas guardada aquí.';
        if (speechText && window.puenteSpeech) {
          window.puenteSpeech.speak(speechText);
        }
      });
    }

    const btnRecipientBannerClose = document.getElementById('btnRecipientBannerClose');
    if (btnRecipientBannerClose) {
      btnRecipientBannerClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismissCurrentTutorialStep();
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
      if (!this.enabled || this.isTutorialActive) return;
      const target = e.target;
      if (!target.matches(focusableSelectors)) return;
      // No activar foco en la clave o controles del facilitador/puente
      if (target.closest('.security-modal-overlay') || target.closest('.facilitator-overlay') || target.closest('.puente-sheet')) return;

      const group = target.closest('.form-group') || target.closest('.amount-display-box') || target.closest('.contact-item') || target;
      const label = group.querySelector('.form-label') || group.querySelector('label');
      const labelText = label ? label.textContent.trim() : 'Campo a completar';
      
      this.activateSectionFocus(group, labelText);
    });

    // El overlay oscuro o clics afuera NO deben cerrar el card del tutorial
    // La única manera de cerrar el card es tocando la 'x' o el 'Listo' al final del tutorial
    if (this.dynamicFocusOverlay) {
      this.dynamicFocusOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
      });
    }

    // Escucha de estado de voz para animar botones de audio
    if (window.puenteSpeech) {
      window.puenteSpeech.onStatusChange = (speaking) => {
        const triggers = document.querySelectorAll('.btn-speech-trigger, .btn-speak-section, .btn-speak-pill');
        triggers.forEach(t => t.classList.toggle('speaking', speaking));
      };
    }

    // Reubicar dinámicamente la tarjeta del tutorial y el recorte de difuminado al cambiar tamaño o hacer scroll
    window.addEventListener('resize', () => {
      if (this.activeSpotlightElement && this.isTutorialActive) {
        this.positionSpotlightCard(this.activeSpotlightElement);
        this.updateSpotlightOverlay(this.activeSpotlightElement);
      }
    });

    let scrollRelocateTimer = null;
    let scrollOverlayRaf = null;
    document.addEventListener('scroll', (e) => {
      if (!this.activeSpotlightElement || !this.isTutorialActive) return;
      if (e.target && e.target.classList && (e.target.classList.contains('scroll-area') || e.target.classList.contains('screen-view'))) {
        if (scrollOverlayRaf) cancelAnimationFrame(scrollOverlayRaf);
        scrollOverlayRaf = requestAnimationFrame(() => {
          this.updateSpotlightOverlay(this.activeSpotlightElement);
        });
        if (scrollRelocateTimer) clearTimeout(scrollRelocateTimer);
        scrollRelocateTimer = setTimeout(() => {
          this.positionSpotlightCard(this.activeSpotlightElement);
        }, 80);
      }
    }, { passive: true, capture: true });
  }

  /* Listeners para avanzar paso a paso exclusivamente al completar la acción o campo indicado */
  setupTutorialFieldListeners() {
    // 1. Tarjeta de saldo en Inicio: clic directo opcional para avanzar con pausa tranquila
    const cardRut = document.getElementById('cardCuentaRut');
    if (cardRut) {
      cardRut.addEventListener('click', () => {
        if (this.isTutorialActive && this.isCurrentTarget('#cardCuentaRut')) {
          if (this.autoAdvanceTimer) return;
          this.autoAdvanceTimer = setTimeout(() => {
            if (this.isTutorialActive && this.isCurrentTarget('#cardCuentaRut')) {
              this.nextGuideStep();
            }
          }, 1800);
        }
      });
    }

    // 2. RUT en Nuevo Destinatario: el paso 1 indica ingresar el RUT y luego presionar el botón Continuar
    // El avance a los siguientes datos (Etapa B) se realiza directamente al tocar Continuar (#btnConfirmRutNext)
    const rutInput = document.getElementById('newRecipientRut');
    if (rutInput) {
      // El estado del botón Continuar se habilita según la longitud del RUT en app.js
    }

    // 3. Nombre y Apellido en Nuevo Destinatario
    const nameInput = document.getElementById('newRecipientName');
    if (nameInput) {
      let nameTimer = null;
      const checkName = (delayMs = 1800) => {
        if (!this.isTutorialActive || !this.isCurrentTarget('#groupRecipientName')) return;
        const val = nameInput.value.trim();
        if (val.length >= 3) {
          if (nameTimer) clearTimeout(nameTimer);
          nameTimer = setTimeout(() => {
            if (this.isTutorialActive && this.isCurrentTarget('#groupRecipientName') && nameInput.value.trim().length >= 3) {
              this.nextGuideStep();
            }
          }, delayMs);
        }
      };
      nameInput.addEventListener('input', () => checkName(1800));
      nameInput.addEventListener('change', () => checkName(1800));
      nameInput.addEventListener('blur', () => checkName(1800));
    }

    // 4. Banco en Nuevo Destinatario (Selector y Píldoras de Banco)
    const bankSelect = document.getElementById('newRecipientBank');
    if (bankSelect) {
      bankSelect.addEventListener('change', () => {
        if (this.isTutorialActive && this.isCurrentTarget('#groupRecipientBank')) {
          if (bankSelect.value) {
            setTimeout(() => {
              if (this.isTutorialActive && this.isCurrentTarget('#groupRecipientBank')) {
                this.nextGuideStep();
              }
            }, 600);
          }
        }
      });
    }

    const bankPillGrid = document.getElementById('bankPillGrid');
    if (bankPillGrid) {
      bankPillGrid.addEventListener('click', (e) => {
        const pill = e.target.closest('.btn-bank-option');
        if (pill && this.isTutorialActive && this.isCurrentTarget('#groupRecipientBank')) {
          const bVal = pill.getAttribute('data-bank');
          if (bVal === 'otro') return; // Espera a que elija en el select
          setTimeout(() => {
            if (this.isTutorialActive && this.isCurrentTarget('#groupRecipientBank')) {
              this.nextGuideStep();
            }
          }, 600);
        }
      });
    }

    // 5. Tipo de cuenta (Píldoras interactivas CuentaRut, Corriente, Vista, Ahorro)
    const typeGrid = document.getElementById('accountTypePillGrid');
    if (typeGrid) {
      typeGrid.addEventListener('click', (e) => {
        const pill = e.target.closest('.btn-account-type-option');
        if (!pill || !this.isTutorialActive) return;
        const selectedType = pill.getAttribute('data-type');

        if (this.isCurrentTarget('#groupRecipientType')) {
          if (selectedType === 'CuentaRUT') {
            if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
            if (this.fallbackAdvanceTimer) clearTimeout(this.fallbackAdvanceTimer);

            // Resaltar visualmente el campo de número de cuenta completado
            const numGroup = document.getElementById('groupRecipientNum');
            if (numGroup) {
              this.positionSpotlightCard(numGroup);
            }
            if (this.spotlightTitle) this.spotlightTitle.textContent = 'Número de cuenta completado';
            if (this.spotlightText) this.spotlightText.textContent = 'El número de cuenta ya se rellenó automáticamente con el RUT.';

            const advanceToListo = () => {
              setTimeout(() => {
                if (this.isTutorialActive) {
                  this.goToStepByTarget('#btnContinueRecipient');
                }
              }, 1000);
            };

            if (window.puenteSpeech) {
              window.puenteSpeech.speak('El número de cuenta ya se rellenó automáticamente con el RUT.', () => {
                advanceToListo();
              });
            } else {
              advanceToListo();
            }
          } else {
            // Si elige otro tipo de cuenta, avanza al paso de ingresar el número de cuenta
            setTimeout(() => {
              if (this.isTutorialActive && this.isCurrentTarget('#groupRecipientType')) {
                this.goToStepByTarget('#groupRecipientNum');
              }
            }, 600);
          }
        }
      });
    }

    // 6. Número de cuenta en Nuevo Destinatario
    const numInput = document.getElementById('newRecipientNum');
    if (numInput) {
      let numTimer = null;
      const checkNum = (delayMs = 1800) => {
        if (!this.isTutorialActive || !this.isCurrentTarget('#groupRecipientNum')) return;
        const val = numInput.value.trim();
        if (val.length >= 4) {
          if (numTimer) clearTimeout(numTimer);
          numTimer = setTimeout(() => {
            if (this.isTutorialActive && this.isCurrentTarget('#groupRecipientNum') && numInput.value.trim().length >= 4) {
              this.nextGuideStep();
            }
          }, delayMs);
        }
      };
      numInput.addEventListener('input', () => checkNum(1800));
      numInput.addEventListener('change', () => checkNum(1800));
      numInput.addEventListener('blur', () => checkNum(1800));
    }

    // 7. Monto a transferir (input manual, dictado y montos sugeridos)
    const inputAmount = document.getElementById('inputAmount');
    if (inputAmount) {
      let amountTimer = null;
      const checkAmount = (delayMs = 1800) => {
        if (!this.isTutorialActive || !this.isCurrentTarget('#amountBox')) return;
        const raw = inputAmount.value.replace(/[^0-9]/g, '');
        const val = parseInt(raw, 10);
        if (!isNaN(val) && val > 0) {
          if (amountTimer) clearTimeout(amountTimer);
          amountTimer = setTimeout(() => {
            const r = inputAmount.value.replace(/[^0-9]/g, '');
            if (this.isTutorialActive && this.isCurrentTarget('#amountBox') && parseInt(r, 10) > 0) {
              this.nextGuideStep();
            }
          }, delayMs);
        }
      };
      inputAmount.addEventListener('input', () => checkAmount(1800));
      inputAmount.addEventListener('change', () => checkAmount(1800));
      inputAmount.addEventListener('blur', () => checkAmount(1800));
    }

    const quickAmountContainer = document.querySelector('.quick-amounts');
    if (quickAmountContainer) {
      quickAmountContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-quick-amount');
        if (btn && this.isTutorialActive && this.isCurrentTarget('#amountBox')) {
          setTimeout(() => {
            if (this.isTutorialActive && this.isCurrentTarget('#amountBox')) {
              this.nextGuideStep();
            }
          }, 1800);
        }
      });
    }

    // 8. Mensaje / Glosa opcional y Botón Revisar datos están juntos en el Paso 2
    // El usuario puede escribir la nota opcionalmente y presionar Revisar datos a su propio ritmo.

    // 10. Clic en botón compartir comprobante o en tarjeta de comprobante
    const btnShareReceipt = document.getElementById('btnShareReceipt');
    if (btnShareReceipt) {
      btnShareReceipt.addEventListener('click', () => {
        if (this.isTutorialActive && this.isCurrentTarget('#btnShareReceipt')) {
          if (this.autoAdvanceTimer) return;
          this.autoAdvanceTimer = setTimeout(() => {
            if (this.isTutorialActive && this.isCurrentTarget('#btnShareReceipt')) {
              this.nextGuideStep();
            }
          }, 1800);
        }
      });
    }

    const receiptCard = document.querySelector('.receipt-card');
    if (receiptCard) {
      receiptCard.addEventListener('click', () => {
        if (this.isTutorialActive && (this.isCurrentTarget('.receipt-card') || this.isCurrentTarget('#btnShareReceipt'))) {
          if (this.autoAdvanceTimer) return;
          this.autoAdvanceTimer = setTimeout(() => {
            if (this.isTutorialActive) {
              this.nextGuideStep();
            }
          }, 1800);
        }
      });
    }

    // 11. Finalizar tutorial al tocar Volver al inicio en el comprobante
    const btnExit = document.getElementById('btnExitToHome');
    if (btnExit) {
      btnExit.addEventListener('click', () => {
        if (this.isTutorialActive) {
          this.clearSpotlight();
        }
      });
    }
  }

  /* Resaltado suave de casilla activa al interactuar normalmente (sin difuminar la pantalla entera) */
  activateSectionFocus(targetElement, labelText) {
    if (!this.enabled || !targetElement || this.isTutorialActive) return;
    this.clearSpotlight();

    this.activeSpotlightElement = targetElement;
    targetElement.classList.add('spotlight-active');

    // Registrar en métricas
    if (window.facilitatorPanel) {
      window.facilitatorPanel.recordMetric('spotlight');
    }
  }

  setBridgeEnabled(enabled) {
    this.enabled = enabled;
    this.updateFabVisibility();
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
