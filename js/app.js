/**
 * INTERFAZ PUENTE — CONTROLADOR CENTRAL DE LA APLICACIÓN BANCARIA
 * BancoEstado Simulación Académica INACAP
 * Autores: Carlos Valdés & Sebastián Mardones
 */

class AppRouter {
  constructor() {
    this.currentView = 'home';
    this.summaryTitleVariant = 'resumen_seguro';
    this.errorInjection = false;

    // Estado del usuario (Elena Retamales)
    this.user = {
      name: 'Elena Retamales Morales',
      accountType: 'CuentaRUT',
      accountNum: '0007845129',
      rut: '7.845.129-3',
      balance: 350000
    };

    // Estado del formulario de transferencia
    this.transferState = {
      recipient: {
        id: 'rosa_perez',
        name: 'Rosa Pérez Sepúlveda',
        rut: '12.876.543-2',
        bank: 'Banco de Chile',
        accountType: 'Cuenta Corriente',
        accountNum: '00-128-45920-01'
      },
      amount: 50000,
      glosa: '',
      isNewRecipient: false
    };

    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupRecipientStep();
    this.setupAmountStep();
    this.setupSummaryStep();
    this.setupAuthStep();
    this.setupReceiptStep();
    this.updateBalanceUI();
  }

  /* ================= NAVEGACIÓN ENTRE VISTAS ================= */
  goTo(viewName) {
    const views = document.querySelectorAll('.screen-view');
    views.forEach(v => {
      v.classList.remove('is-active', 'is-before');
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('is-active');
      this.currentView = viewName;
      const scroll = target.querySelector('.scroll-area');
      if (scroll) scroll.scrollTop = 0;
    }

    // Limpiar foco spotlight al cambiar de vista
    if (window.interfazPuente) {
      window.interfazPuente.clearSpotlight();
    }

    // Configurar contenidos específicos según la vista
    if (viewName === 'summary') {
      this.renderSummary();
    } else if (viewName === 'receipt') {
      this.renderReceipt();
    }
  }

  resetToHome() {
    this.transferState.amount = this.errorInjection ? 500000 : 50000;
    this.transferState.glosa = '';
    const amountInput = document.getElementById('inputAmount');
    if (amountInput) {
      amountInput.value = this.formatCLP(this.transferState.amount);
    }
    this.goTo('home');
  }

  /* ================= FORMATEADORES ================= */
  formatCLP(num) {
    return '$' + Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  formatCLPForSpeech(num) {
    const val = Math.round(Number(num) || 0);
    const formatted = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return val === 1 ? '1 peso' : `${formatted} pesos`;
  }

  parseCLP(str) {
    const clean = str.replace(/[^\d]/g, '');
    return parseInt(clean, 10) || 0;
  }

  updateBalanceUI() {
    const balanceEls = document.querySelectorAll('[data-bind="user-balance"]');
    balanceEls.forEach(el => {
      el.textContent = this.formatCLP(this.user.balance);
    });
  }

  /* ================= CONFIGURACIÓN DE CADA PASO ================= */
  setupNavigation() {
    // Botón iniciar transferencia en Home
    const btnStart = document.getElementById('btnStartTransfer');
    const btnQuick = document.getElementById('btnQuickTransfer');
    const navTransfer = document.getElementById('navBtnTransfer');

    const startTransferFlow = () => {
      // Inyección de error si está activada
      this.transferState.amount = this.errorInjection ? 500000 : 50000;
      const amountInput = document.getElementById('inputAmount');
      if (amountInput) amountInput.value = this.formatCLP(this.transferState.amount);
      this.goTo('recipient');
    };

    if (btnStart) btnStart.addEventListener('click', startTransferFlow);
    if (btnQuick) btnQuick.addEventListener('click', startTransferFlow);
    if (navTransfer) navTransfer.addEventListener('click', startTransferFlow);

    // Botones Volver
    const backToHome = document.getElementById('btnBackFromRecipient');
    if (backToHome) backToHome.addEventListener('click', () => this.goTo('home'));

    const backToRecipient = document.getElementById('btnBackFromAmount');
    if (backToRecipient) backToRecipient.addEventListener('click', () => this.goTo('recipient'));

    const navHome = document.getElementById('navBtnHome');
    if (navHome) navHome.addEventListener('click', () => this.goTo('home'));
  }

  /* Paso 1: Destinatario */
  setupRecipientStep() {
    const tabSaved = document.getElementById('tabRecipientSaved');
    const tabFavorites = document.getElementById('tabRecipientFavorites');
    const btnGoToNewRecipientScreen = document.getElementById('btnGoToNewRecipientScreen');
    const btnBackFromNewRecipient = document.getElementById('btnBackFromNewRecipient');

    const paneSaved = document.getElementById('paneRecipientSaved');
    const paneFavorites = document.getElementById('paneRecipientFavorites');
    const savedActions = document.getElementById('recipientSavedBottomActions');

    const stepRut = document.getElementById('newRecipientStepRut');
    const stepDetails = document.getElementById('newRecipientStepDetails');

    const showSavedTab = () => {
      [tabSaved, tabFavorites].forEach(t => t && t.classList.remove('active'));
      if (tabSaved) tabSaved.classList.add('active');
      if (paneSaved) paneSaved.classList.remove('hidden');
      if (paneFavorites) paneFavorites.classList.add('hidden');
      if (savedActions) savedActions.classList.remove('hidden');
      this.transferState.isNewRecipient = false;
    };

    const showFavoritesTab = () => {
      [tabSaved, tabFavorites].forEach(t => t && t.classList.remove('active'));
      if (tabFavorites) tabFavorites.classList.add('active');
      if (paneSaved) paneSaved.classList.add('hidden');
      if (paneFavorites) paneFavorites.classList.remove('hidden');
      if (savedActions) savedActions.classList.remove('hidden');
      this.transferState.isNewRecipient = false;
    };

    if (tabSaved) tabSaved.addEventListener('click', showSavedTab);
    if (tabFavorites) tabFavorites.addEventListener('click', showFavoritesTab);

    // Botón Agregar Nuevo: Abre una nueva pantalla independiente (view-new-recipient)
    const openNewRecipientScreen = () => {
      this.transferState.isNewRecipient = true;
      if (stepRut) stepRut.classList.remove('hidden');
      if (stepDetails) stepDetails.classList.add('hidden');
      this.goTo('new-recipient');
    };

    if (btnGoToNewRecipientScreen) {
      btnGoToNewRecipientScreen.addEventListener('click', openNewRecipientScreen);
    }

    if (btnBackFromNewRecipient) {
      btnBackFromNewRecipient.addEventListener('click', () => {
        this.transferState.isNewRecipient = false;
        this.goTo('recipient');
      });
    }

    // Buscador superior "¿A quién quieres transferir?"
    const searchInput = document.getElementById('recipientSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const contactCards = document.querySelectorAll('#paneRecipientSaved .contact-item, #paneRecipientFavorites .contact-item');
        contactCards.forEach(card => {
          const text = card.textContent.toLowerCase();
          card.style.display = text.includes(query) ? '' : 'none';
        });
      });
    }

    // Formateo automático de RUT mientras la persona escribe o presiona teclas
    const newRecipientRutInput = document.getElementById('newRecipientRut');
    const formatRutValue = (raw) => {
      let val = raw.replace(/[^0-9kK]/g, '').toUpperCase();
      if (val.length > 9) val = val.slice(0, 9);
      if (val.length === 0) return '';
      if (val.length === 1) return val;
      const dv = val.slice(-1);
      const cuerpo = val.slice(0, -1);
      let formatted = '';
      let count = 0;
      for (let i = cuerpo.length - 1; i >= 0; i--) {
        formatted = cuerpo[i] + formatted;
        count++;
        if (count === 3 && i > 0) {
          formatted = '.' + formatted;
          count = 0;
        }
      }
      return formatted + '-' + dv;
    };

    if (newRecipientRutInput) {
      newRecipientRutInput.addEventListener('input', (e) => {
        e.target.value = formatRutValue(e.target.value);
      });
    }

    // Teclado Numérico en Pantalla
    const keypadButtons = document.querySelectorAll('#rutVirtualKeypad .btn-keypad-digit');
    keypadButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!newRecipientRutInput) return;
        const key = btn.getAttribute('data-key');
        let currentClean = newRecipientRutInput.value.replace(/[^0-9kK]/g, '');

        if (key === 'BACK') {
          currentClean = currentClean.slice(0, -1);
        } else if (currentClean.length < 9) {
          currentClean += key;
        }

        newRecipientRutInput.value = formatRutValue(currentClean);
        newRecipientRutInput.dispatchEvent(new Event('input'));
      });
    });

    // Dictado por voz de RUT
    const btnVoiceDictate = document.getElementById('btnVoiceDictateRut');
    const rutVoiceFeedback = document.getElementById('rutVoiceFeedback');
    if (btnVoiceDictate && newRecipientRutInput) {
      btnVoiceDictate.addEventListener('click', () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang = 'es-CL';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          if (rutVoiceFeedback) {
            rutVoiceFeedback.style.display = 'block';
            rutVoiceFeedback.textContent = '🎙️ Escuchando... Di los números de tu RUT (ej: doce ocho siete seis...)';
          }
          btnVoiceDictate.style.background = '#FEE2E2';
          btnVoiceDictate.style.borderColor = '#EF4444';

          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            // Convertir palabras habladas a dígitos comunes
            let digits = transcript
              .replace(/\buno\b/gi, '1')
              .replace(/\bdos\b/gi, '2')
              .replace(/\btres\b/gi, '3')
              .replace(/\bcuatro\b/gi, '4')
              .replace(/\bcinco\b/gi, '5')
              .replace(/\bseis\b/gi, '6')
              .replace(/\bsiete\b/gi, '7')
              .replace(/\bocho\b/gi, '8')
              .replace(/\bnueve\b/gi, '9')
              .replace(/\bcero\b/gi, '0')
              .replace(/\bka\b/gi, 'K')
              .replace(/[^0-9kK]/g, '');

            if (digits) {
              newRecipientRutInput.value = formatRutValue(digits);
              if (rutVoiceFeedback) {
                rutVoiceFeedback.textContent = `✓ Entendido: ${newRecipientRutInput.value}`;
              }
            } else {
              if (rutVoiceFeedback) {
                rutVoiceFeedback.textContent = `No se detectaron números. Intenta dictar de nuevo o usa el teclado.`;
              }
            }
          };

          recognition.onerror = () => {
            if (rutVoiceFeedback) {
              rutVoiceFeedback.textContent = 'No pudimos escuchar con claridad. Puedes tocar los números del teclado abajo.';
            }
          };

          recognition.onend = () => {
            btnVoiceDictate.style.background = '';
            btnVoiceDictate.style.borderColor = '';
            setTimeout(() => {
              if (rutVoiceFeedback) rutVoiceFeedback.style.display = 'none';
            }, 3500);
          };

          recognition.start();
        } else {
          // Fallback amigable si el navegador no soporta Web Speech API
          const demoRut = '15.678.910-K';
          newRecipientRutInput.value = demoRut;
          if (rutVoiceFeedback) {
            rutVoiceFeedback.style.display = 'block';
            rutVoiceFeedback.textContent = `✓ RUT dictado (simulado): ${demoRut}`;
            setTimeout(() => { rutVoiceFeedback.style.display = 'none'; }, 3000);
          }
        }
      });
    }

    // Botón Continuar de la Etapa RUT (Avanza a los datos del destinatario)
    const btnConfirmRutNext = document.getElementById('btnConfirmRutNext');
    if (btnConfirmRutNext) {
      btnConfirmRutNext.addEventListener('click', () => {
        const rutVal = newRecipientRutInput ? newRecipientRutInput.value.trim() : '';
        if (rutVal.length < 3) {
          alert('Por favor ingresa un RUT válido con los números o el micrófono.');
          return;
        }
        // Ocultar etapa RUT y mostrar formulario de datos
        if (stepRut) stepRut.classList.add('hidden');
        if (stepDetails) {
          stepDetails.classList.remove('hidden');
          const nameInput = document.getElementById('newRecipientName');
          if (nameInput) nameInput.focus();
        }
      });
    }

    // Selección de Tipo de Cuenta con 4 Botones (Pills)
    const accountTypePills = document.querySelectorAll('#accountTypePillGrid .btn-account-type-option');
    const hiddenAccountTypeInput = document.getElementById('newRecipientType');
    const bankSelect = document.getElementById('newRecipientBank');
    const numInput = document.getElementById('newRecipientNum');

    accountTypePills.forEach(pill => {
      pill.addEventListener('click', () => {
        accountTypePills.forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        const selectedType = pill.getAttribute('data-type');
        if (hiddenAccountTypeInput) hiddenAccountTypeInput.value = selectedType;

        // Si elige CuentaRUT: rellenar automáticamente el número de cuenta con el RUT menos el dígito verificador
        if (selectedType === 'CuentaRUT') {
          if (bankSelect) bankSelect.value = 'BancoEstado';
          if (newRecipientRutInput && numInput) {
            const rawRut = newRecipientRutInput.value.replace(/[^0-9kK]/g, '');
            if (rawRut.length > 1) {
              const rutSinDv = rawRut.slice(0, -1);
              numInput.value = rutSinDv;
            }
          }
        }
      });
    });

    // Selección de Rosa Pérez en Guardados y Favoritos
    const contactRosa = document.getElementById('frequentContactRosa');
    const favRosa = document.getElementById('favContactRosa');
    const selectRosa = () => {
      document.querySelectorAll('.contact-item').forEach(c => c.classList.remove('selected'));
      if (contactRosa) contactRosa.classList.add('selected');
      if (favRosa) favRosa.classList.add('selected');
      this.transferState.recipient = {
        id: 'rosa_perez',
        name: 'Rosa Pérez Sepúlveda',
        rut: '12.876.543-2',
        bank: 'Banco de Chile',
        accountType: 'Cuenta Corriente',
        accountNum: '00-128-45920-01'
      };
    };

    if (contactRosa) contactRosa.addEventListener('click', selectRosa);
    if (favRosa) favRosa.addEventListener('click', selectRosa);

    // Botones de Continuar (Tanto en Guardados como en Formulario Nuevo)
    const btnContinueSaved = document.getElementById('btnContinueRecipientSaved');
    const btnContinueNew = document.getElementById('btnContinueRecipient');

    const handleContinueAction = () => {
      if (this.transferState.isNewRecipient) {
        const nameInput = document.getElementById('newRecipientName');
        const rutInput = document.getElementById('newRecipientRut');
        const bankSelect = document.getElementById('newRecipientBank');
        const typeSelect = document.getElementById('newRecipientType');
        const numInput = document.getElementById('newRecipientNum');
        const emailInput = document.getElementById('newRecipientEmail');

        if (!nameInput || !nameInput.value.trim() || !rutInput.value.trim() || !numInput.value.trim()) {
          alert('Por favor completa el nombre, RUT y número de cuenta para continuar.');
          if (window.facilitatorPanel) window.facilitatorPanel.recordMetric('error');
          return;
        }

        this.transferState.recipient = {
          id: 'nuevo_' + Date.now(),
          name: nameInput.value.trim(),
          rut: rutInput.value.trim(),
          bank: bankSelect ? bankSelect.value : 'BancoEstado',
          accountType: typeSelect ? typeSelect.value : 'Cuenta Corriente',
          accountNum: numInput.value.trim(),
          email: emailInput ? emailInput.value.trim() : ''
        };
      }

      this.goTo('amount');
    };

    if (btnContinueSaved) btnContinueSaved.addEventListener('click', handleContinueAction);
    if (btnContinueNew) btnContinueNew.addEventListener('click', handleContinueAction);

    // Botones Cancelar (vuelven a la lista de guardados o al home)
    const btnCancelSaved = document.getElementById('btnCancelRecipientSaved');
    const btnCancelRut = document.getElementById('btnCancelAddRecipientRut');
    const btnCancelForm = document.getElementById('btnCancelAddRecipientForm');

    if (btnCancelSaved) btnCancelSaved.addEventListener('click', () => this.goTo('home'));
    if (btnCancelRut) btnCancelRut.addEventListener('click', () => {
      this.transferState.isNewRecipient = false;
      this.goTo('recipient');
    });
    if (btnCancelForm) btnCancelForm.addEventListener('click', () => {
      this.transferState.isNewRecipient = false;
      this.goTo('recipient');
    });
  }

  /* Paso 2: Monto y Glosa */
  setupAmountStep() {
    const inputAmount = document.getElementById('inputAmount');
    const inputGlosa = document.getElementById('inputGlosa');
    const btnContinue = document.getElementById('btnContinueAmount');
    const amountErrorBox = document.getElementById('amountErrorBox');

    if (inputAmount) {
      inputAmount.addEventListener('input', (e) => {
        const val = this.parseCLP(e.target.value);
        this.transferState.amount = val;
        e.target.value = val > 0 ? this.formatCLP(val) : '';

        // Validación inmediata de saldo
        if (val > this.user.balance) {
          amountErrorBox.classList.remove('hidden');
          amountErrorBox.textContent = `No cuentas con ese dinero. Tu saldo disponible es ${this.formatCLP(this.user.balance)}.`;
        } else {
          amountErrorBox.classList.add('hidden');
        }
      });
    }

    // Botones de monto rápido ($10.000, $30.000, $50.000, $100.000)
    const quickBtns = document.querySelectorAll('.btn-quick-amount');
    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = parseInt(btn.getAttribute('data-amount'), 10);
        this.transferState.amount = amt;
        if (inputAmount) {
          inputAmount.value = this.formatCLP(amt);
        }
        amountErrorBox.classList.add('hidden');
      });
    });

    // Botón Cancelar en monto (vuelve a la pantalla de destinatarios)
    const btnCancelAmount = document.getElementById('btnCancelAmount');
    if (btnCancelAmount) {
      btnCancelAmount.addEventListener('click', () => {
        this.goTo('recipient');
      });
    }

    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        const val = this.transferState.amount;
        if (!val || val <= 0) {
          alert('Por favor ingresa una cantidad de dinero a transferir.');
          if (window.facilitatorPanel) window.facilitatorPanel.recordMetric('error');
          return;
        }

        if (inputGlosa) {
          this.transferState.glosa = inputGlosa.value.trim();
        }

        this.goTo('summary');
      });
    }
  }

  /* Paso 3: Resumen Seguro */
  setupSummaryStep() {
    const btnConfirm = document.getElementById('btnConfirmSummary');
    const btnReview = document.getElementById('btnReviewSummary');
    const btnSpeakCard = document.getElementById('btnSpeakSummaryCard');

    const speakSummaryContent = () => {
      const amtStr = this.formatCLPForSpeech(this.transferState.amount);
      const destName = this.transferState.recipient.name;
      const destBank = this.transferState.recipient.bank;
      
      const speechText = `Vas a enviar ${amtStr} a ${destName}, a su cuenta en ${destBank}. Una vez enviado, no se puede deshacer. Si está todo bien haz click en el botón verde para escribir tu clave de 6 números.`;
      
      if (window.puenteSpeech) {
        window.puenteSpeech.speak(speechText);
      }
    };

    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => {
        this.openSecurityAuth();
      });
    }

    if (btnReview) {
      btnReview.addEventListener('click', () => {
        // El usuario detectó un posible error o desea cambiar el monto
        if (window.facilitatorPanel) {
          window.facilitatorPanel.recordMetric('correction');
        }
        this.goTo('amount');
      });
    }

    if (btnSpeakCard) btnSpeakCard.addEventListener('click', speakSummaryContent);
  }

  renderSummary() {
    const titleEl = document.getElementById('safeSummaryTitle');
    const textEl = document.getElementById('safeSummaryText');
    const warnBox = document.getElementById('summaryBalanceWarning');

    // Microcopy determinista requerido por el enunciado:
    // "Vas a enviar $50.000 a Rosa Pérez, a su cuenta en Banco de Chile. Una vez enviado, no se puede deshacer."
    const amtStr = this.formatCLP(this.transferState.amount);
    const destName = this.transferState.recipient.name;
    const destBank = this.transferState.recipient.bank;

    if (textEl) {
      textEl.innerHTML = `Vas a enviar <strong>${amtStr}</strong> a <strong>${destName}</strong>, a su cuenta en <strong>${destBank}</strong>.<br><br>Una vez enviado, <strong>no se puede deshacer</strong>.`;
    }

    // Si el monto excede el saldo (por ejemplo en la inyección de $500.000)
    if (warnBox) {
      if (this.transferState.amount > this.user.balance) {
        warnBox.classList.remove('hidden');
        warnBox.innerHTML = `⚠️ <strong>Atención:</strong> El monto (${amtStr}) supera tu saldo disponible (${this.formatCLP(this.user.balance)}).`;
      } else {
        warnBox.classList.add('hidden');
      }
    }
  }

  updateSummaryTitle(variant) {
    this.summaryTitleVariant = variant;
    if (this.currentView === 'summary') {
      this.renderSummary();
    }
  }

  setErrorInjection(active) {
    this.errorInjection = active;
    this.transferState.amount = active ? 500000 : 50000;
    const amountInput = document.getElementById('inputAmount');
    if (amountInput) {
      amountInput.value = this.formatCLP(this.transferState.amount);
    }
  }

  /* Paso 4: Clave Dinámica Simulada con Teclado Numérico Funcional */
  setupAuthStep() {
    const modal = document.getElementById('securityModalOverlay');
    const btnAuthorize = document.getElementById('btnAuthorizeTransfer');
    const btnCancel = document.getElementById('btnCancelAuth');
    const digits = document.querySelectorAll('.security-digit');
    const keypadButtons = document.querySelectorAll('#authVirtualKeypad .btn-keypad-digit');

    this.enteredPin = '';

    this.updatePinDisplay = () => {
      digits.forEach((d, i) => {
        if (i < this.enteredPin.length) {
          d.value = this.enteredPin[i];
          d.classList.add('filled');
          d.classList.remove('active-cell');
        } else if (i === this.enteredPin.length) {
          d.value = '';
          d.classList.remove('filled');
          d.classList.add('active-cell');
        } else {
          d.value = '';
          d.classList.remove('filled');
          d.classList.remove('active-cell');
        }
      });
    };

    // Tablero numérico en pantalla (solo dígitos 0-9 y borrar)
    keypadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const key = btn.getAttribute('data-key');
        if (key === 'BACK') {
          if (this.enteredPin.length > 0) {
            this.enteredPin = this.enteredPin.slice(0, -1);
          }
        } else if (/^[0-9]$/.test(key)) {
          if (this.enteredPin.length < 6) {
            this.enteredPin += key;
          }
        }
        this.updatePinDisplay();
      });
    });

    if (btnAuthorize) {
      btnAuthorize.addEventListener('click', () => {
        if (this.enteredPin.length < 6) {
          alert('Por favor completa los 6 números de tu clave tocando el teclado.');
          return;
        }
        this.executeTransfer();
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        if (modal) modal.classList.remove('active');
      });
    }
  }

  openSecurityAuth() {
    const modal = document.getElementById('securityModalOverlay');
    if (modal) {
      modal.classList.add('active');
      // Iniciar con las casillas listas para escribir tocando el teclado
      this.enteredPin = '';
      if (this.updatePinDisplay) {
        this.updatePinDisplay();
      }
    }
  }

  executeTransfer() {
    const modal = document.getElementById('securityModalOverlay');
    if (modal) modal.classList.remove('active');

    // Descontar saldo si está dentro del límite
    if (this.transferState.amount <= this.user.balance) {
      this.user.balance -= this.transferState.amount;
    }
    this.updateBalanceUI();

    // Registrar éxito en facilitador
    if (window.facilitatorPanel) {
      window.facilitatorPanel.finishSession(true);
    }

    // Registrar en Interfaz Puente para autoocultamiento
    if (window.interfazPuente) {
      window.interfazPuente.recordSuccessfulTransfer(window.facilitatorPanel.currentMetrics.helpRequests > 0);
    }

    this.goTo('receipt');
  }

  /* Paso 5: Comprobante */
  setupReceiptStep() {
    const btnExit = document.getElementById('btnExitToHome');
    const btnShare = document.getElementById('btnShareReceipt');

    if (btnExit) {
      btnExit.addEventListener('click', () => {
        this.resetToHome();
      });
    }

    if (btnShare) {
      btnShare.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: 'Comprobante de Transferencia BancoEstado',
            text: `Transferencia realizada por ${this.formatCLP(this.transferState.amount)} a ${this.transferState.recipient.name}.`
          }).catch(() => {});
        } else {
          alert('Comprobante listo: puedes guardarlo o compartirlo con la otra persona.');
        }
      });
    }
  }

  renderReceipt() {
    const amtEl = document.getElementById('receiptAmount');
    const nameEl = document.getElementById('receiptRecipientName');
    const detailsEl = document.getElementById('receiptRecipientDetails');
    const dateEl = document.getElementById('receiptDate');
    const opEl = document.getElementById('receiptOpNumber');

    if (amtEl) amtEl.textContent = this.formatCLP(this.transferState.amount);
    if (nameEl) nameEl.textContent = this.transferState.recipient.name;
    if (detailsEl) {
      detailsEl.textContent = `${this.transferState.recipient.bank} · ${this.transferState.recipient.accountType} ${this.transferState.recipient.accountNum}`;
    }

    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    if (dateEl) {
      dateEl.textContent = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} a las ${pad(now.getHours())}:${pad(now.getMinutes())} hrs`;
    }
    if (opEl) {
      opEl.textContent = Math.floor(10000000 + Math.random() * 90000000).toString();
    }
  }

  readCurrentScreenAloud() {
    if (!window.puenteSpeech) return;
    if (this.currentView === 'home') {
      window.puenteSpeech.speak(`Estás en el inicio de tu CuentaRUT. Tienes un saldo disponible de ${this.formatCLPForSpeech(this.user.balance)}. Para transferir dinero, presiona el botón Transferir.`);
    } else if (this.currentView === 'recipient') {
      window.puenteSpeech.speak('¿A quién quieres transferir? Puedes buscar por nombre o RUT, elegir a Rosa Pérez en tu lista de contactos, o tocar el botón Agregar nuevo arriba.');
    } else if (this.currentView === 'new-recipient') {
      const isStepRut = document.getElementById('newRecipientStepRut') && !document.getElementById('newRecipientStepRut').classList.contains('hidden');
      if (isStepRut) {
        window.puenteSpeech.speak('Nuevo destinatario. Ingresa el RUT de quien recibe usando el teclado numérico en pantalla o tocando el micrófono para dictarlo.');
      } else {
        window.puenteSpeech.speak('Completa los datos de la persona: nombre y apellido, banco, tipo de cuenta y número de cuenta.');
      }
    } else if (this.currentView === 'amount') {
      window.puenteSpeech.speak(`Ingresar monto. Escribe la cantidad de dinero que deseas enviar o elige uno de los montos sugeridos. Tu saldo disponible es de ${this.formatCLPForSpeech(this.user.balance)}.`);
    } else if (this.currentView === 'summary') {
      const amtStr = this.formatCLPForSpeech(this.transferState.amount);
      const destName = this.transferState.recipient.name;
      const destBank = this.transferState.recipient.bank;
      window.puenteSpeech.speak(`Vas a enviar ${amtStr} a ${destName}, a su cuenta en ${destBank}. Una vez enviado, no se puede deshacer. Si está todo bien haz click en el botón verde para escribir tu clave de 6 números.`);
    } else if (this.currentView === 'receipt') {
      window.puenteSpeech.speak(`¡Transferencia Exitosa! Tu dinero fue enviado correctamente a ${this.transferState.recipient.name}.`);
    }
  }
}

// Inicializar router al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
  window.appRouter = new AppRouter();
});
