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
      amount: 0,
      glosa: '',
      isNewRecipient: false
    };

    this.isBalanceHidden = false;

    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupRecipientStep();
    this.setupAmountStep();
    this.setupSummaryStep();
    this.setupAuthStep();
    this.setupSuccessStep();
    this.setupReceiptStep();
    this.setupBalanceToggle();
    this.updateBalanceUI();
    this.setupVoiceDictation();
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

    // Si el modo tutorial está activo, continuar en la nueva pantalla; de lo contrario limpiar spotlight
    if (window.interfazPuente) {
      if (window.interfazPuente.isTutorialActive) {
        window.interfazPuente.handleViewChange(viewName);
      } else {
        window.interfazPuente.clearSpotlight();
      }
    }

    // Configurar contenidos específicos según la vista
    if (viewName === 'summary') {
      this.renderSummary();
    } else if (viewName === 'success') {
      this.renderSuccess();
    } else if (viewName === 'receipt') {
      this.renderReceipt();
    }
  }

  resetToHome() {
    this.transferState.amount = this.errorInjection ? 500000 : 0;
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

  setupBalanceToggle() {
    const btnEye = document.getElementById('btnToggleBalance');
    if (btnEye) {
      btnEye.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isBalanceHidden = !this.isBalanceHidden;
        this.updateBalanceUI();
      });
    }
  }

  updateBalanceUI() {
    const balanceEls = document.querySelectorAll('[data-bind="user-balance"]');
    balanceEls.forEach(el => {
      el.textContent = this.isBalanceHidden ? '$ ••••••' : this.formatCLP(this.user.balance);
    });
    const btnEye = document.getElementById('btnToggleBalance');
    if (btnEye) {
      if (this.isBalanceHidden) {
        btnEye.setAttribute('aria-label', 'Mostrar saldo');
        btnEye.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
      } else {
        btnEye.setAttribute('aria-label', 'Ocultar saldo');
        btnEye.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      }
    }
  }

  /* ================= CONFIGURACIÓN DE CADA PASO ================= */
  setupNavigation() {
    // Botón iniciar transferencia en Home
    const btnStart = document.getElementById('btnStartTransfer');
    const btnQuick = document.getElementById('btnQuickTransfer');
    const navTransfer = document.getElementById('navBtnTransfer');

    const startTransferFlow = () => {
      // Inyección de error si está activada
      this.transferState.amount = this.errorInjection ? 500000 : 0;
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

    // Botón Continuar de la Etapa RUT (Avanza a los datos del destinatario)
    const btnConfirmRutNext = document.getElementById('btnConfirmRutNext');
    const btnCancelAddRecipientRut = document.getElementById('btnCancelAddRecipientRut');
    const newRecipientRutInput = document.getElementById('newRecipientRut');

    const updateRutNextButtonState = () => {
      if (!btnConfirmRutNext) return;
      const clean = newRecipientRutInput ? newRecipientRutInput.value.replace(/[^0-9kK]/g, '') : '';
      if (clean.length >= 7) {
        btnConfirmRutNext.removeAttribute('disabled');
      } else {
        btnConfirmRutNext.setAttribute('disabled', 'disabled');
      }
    };

    // Botón Agregar Nuevo: Abre una nueva pantalla independiente (view-new-recipient)
    const openNewRecipientScreen = () => {
      this.transferState.isNewRecipient = true;
      if (newRecipientRutInput) newRecipientRutInput.value = '';
      updateRutNextButtonState();
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

    if (btnCancelAddRecipientRut) {
      btnCancelAddRecipientRut.addEventListener('click', () => {
        this.transferState.isNewRecipient = false;
        this.goTo('recipient');
      });
    }

    // Buscador superior "¿A quién le quieres transferir?"
    const searchInput = document.getElementById('recipientSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const personBlocks = document.querySelectorAll('.contact-person-block');
        personBlocks.forEach(personBlock => {
          const personName = (personBlock.getAttribute('data-person') || '').toLowerCase();
          const accountItems = personBlock.querySelectorAll('.contact-account-item');
          let hasMatchingAccount = false;

          accountItems.forEach(item => {
            const alias = (item.getAttribute('data-account-alias') || '').toLowerCase();
            const bank = (item.getAttribute('data-bank') || '').toLowerCase();
            const num = (item.getAttribute('data-account-num') || '').toLowerCase();
            const rut = (item.getAttribute('data-rut') || '').toLowerCase();
            const match = !query || personName.includes(query) || alias.includes(query) || bank.includes(query) || num.includes(query) || rut.includes(query);
            item.style.display = match ? '' : 'none';
            if (match) hasMatchingAccount = true;
          });

          personBlock.style.display = hasMatchingAccount ? '' : 'none';
        });

        // Ocultar divisores de letras si no tienen contactos visibles
        const alphaGroups = document.querySelectorAll('.contact-alpha-group');
        alphaGroups.forEach(group => {
          const visiblePersons = group.querySelectorAll('.contact-person-block:not([style*="display: none"])');
          group.style.display = visiblePersons.length > 0 ? '' : 'none';
        });
      });
    }

    // Formateo automático de RUT mientras la persona escribe o presiona teclas
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
        updateRutNextButtonState();
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


    // Botón Continuar de la Etapa RUT (Avanza a los datos del destinatario)
    if (btnConfirmRutNext) {
      btnConfirmRutNext.addEventListener('click', () => {
        if (btnConfirmRutNext.hasAttribute('disabled')) return;
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
        if (window.interfazPuente && window.interfazPuente.isTutorialActive) {
          window.interfazPuente.handleViewChange('new-recipient');
        }
      });
    }
    updateRutNextButtonState();

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

    // ================= BOTTOM SHEET: ¿QUÉ DESEAS HACER? =================
    const bsOverlay = document.getElementById('accountBottomSheetOverlay');
    const bsCard = document.getElementById('accountBottomSheetCard');
    const btnEdit = document.getElementById('btnBottomSheetEdit');
    const btnDelete = document.getElementById('btnBottomSheetDelete');

    const openBottomSheet = (accountData) => {
      if (bsOverlay && bsCard) {
        bsOverlay.classList.add('active');
        bsCard.classList.add('active');
      }
    };

    const closeBottomSheet = () => {
      if (bsOverlay && bsCard) {
        bsOverlay.classList.remove('active');
        bsCard.classList.remove('active');
      }
    };

    if (bsOverlay) {
      bsOverlay.addEventListener('click', closeBottomSheet);
    }
    if (btnEdit) {
      btnEdit.addEventListener('click', () => {
        closeBottomSheet();
        window.puenteToast('Seccion no disponible');
      });
    }
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        closeBottomSheet();
        window.puenteToast('Seccion no disponible');
      });
    }

    // Botones de 3 puntos en cada cuenta (abren el bottom sheet)
    const dotButtons = document.querySelectorAll('.btn-account-dots');
    dotButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const accountItem = btn.closest('.contact-account-item');
        const accountData = {
          alias: accountItem ? accountItem.getAttribute('data-account-alias') : '',
          person: accountItem ? accountItem.getAttribute('data-person-name') : '',
          bank: accountItem ? accountItem.getAttribute('data-bank') : '',
          num: accountItem ? accountItem.getAttribute('data-account-num') : ''
        };
        openBottomSheet(accountData);
      });
    });

    // Clic en cualquier cuenta para seleccionarla e ir a ingresar monto
    const accountItems = document.querySelectorAll('.contact-account-item');
    accountItems.forEach(item => {
      item.addEventListener('click', () => {
        accountItems.forEach(it => it.classList.remove('selected'));
        item.classList.add('selected');

        const contactType = item.getAttribute('data-contact');
        const personName = item.getAttribute('data-person-name') || 'Destinatario';
        const alias = item.getAttribute('data-account-alias') || personName;
        const bank = item.getAttribute('data-bank') || 'BancoEstado';
        const accountType = item.getAttribute('data-account-type') || 'Cuenta Corriente';
        const accountNum = item.getAttribute('data-account-num') || '12345678';
        const rut = item.getAttribute('data-rut') || '12.876.543-3';

        if (contactType === 'rosa' || item.id === 'frequentContactRosa') {
          this.transferState.recipient = {
            id: 'rosa_perez',
            name: 'Rosa Pérez Sepúlveda',
            rut: '12.876.543-3',
            bank: 'Banco de Chile',
            accountType: 'Cuenta Corriente',
            accountNum: '001284592001'
          };
        } else if (contactType === 'pedro' || item.id === 'frequentContactPedro') {
          this.transferState.recipient = {
            id: 'pedro_retamales',
            name: 'Pedro Retamales (Hijo)',
            rut: '18.345.678-4',
            bank: 'BancoEstado',
            accountType: 'CuentaRUT',
            accountNum: '18345678'
          };
        } else {
          this.transferState.recipient = {
            id: 'contact_' + Date.now(),
            name: personName,
            alias: alias,
            rut: rut,
            bank: bank,
            accountType: accountType,
            accountNum: accountNum
          };
        }

        this.transferState.isNewRecipient = false;
        this.goTo('amount');
      });
    });

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

    const MAX_AMOUNT = 200000;

    if (inputAmount) {
      inputAmount.addEventListener('focus', () => {
        if (inputAmount.value === '$0' || inputAmount.value === '$ 0' || !this.transferState.amount) {
          inputAmount.select();
        }
      });

      inputAmount.addEventListener('input', (e) => {
        let val = this.parseCLP(e.target.value);

        if (val > MAX_AMOUNT) {
          val = MAX_AMOUNT;
          inputAmount.classList.add('has-error');
          amountErrorBox.classList.remove('hidden');
          amountErrorBox.classList.add('show');
          amountErrorBox.textContent = `Solo puedes transferir un máximo de ${this.formatCLP(MAX_AMOUNT)}`;
        } else if (val > this.user.balance) {
          inputAmount.classList.add('has-error');
          amountErrorBox.classList.remove('hidden');
          amountErrorBox.classList.add('show');
          amountErrorBox.textContent = `El monto es mayor a tu saldo disponible (Tienes ${this.formatCLP(this.user.balance)} en tu cuenta). Intenta con una cantidad menor.`;
        } else {
          inputAmount.classList.remove('has-error');
          amountErrorBox.classList.add('hidden');
          amountErrorBox.classList.remove('show');
          amountErrorBox.textContent = '';
        }

        this.transferState.amount = val;
        e.target.value = val > 0 ? this.formatCLP(val) : '$0';
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
          inputAmount.classList.remove('has-error');
        }
        if (amt > this.user.balance) {
          inputAmount && inputAmount.classList.add('has-error');
          amountErrorBox.classList.remove('hidden');
          amountErrorBox.classList.add('show');
          amountErrorBox.textContent = `El monto es mayor a tu saldo disponible (Tienes ${this.formatCLP(this.user.balance)} en tu cuenta). Intenta con una cantidad menor.`;
        } else {
          amountErrorBox.classList.add('hidden');
          amountErrorBox.classList.remove('show');
          amountErrorBox.textContent = '';
        }
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
          inputAmount.classList.add('has-error');
          amountErrorBox.classList.remove('hidden');
          amountErrorBox.classList.add('show');
          amountErrorBox.textContent = 'Por favor ingresa una cantidad de dinero a transferir.';
          if (window.facilitatorPanel) window.facilitatorPanel.recordMetric('error');
          return;
        }

        if (val > this.user.balance) {
          inputAmount.classList.add('has-error');
          amountErrorBox.classList.remove('hidden');
          amountErrorBox.classList.add('show');
          const msg = `El monto es mayor a tu saldo disponible (Tienes ${this.formatCLP(this.user.balance)} en tu cuenta). Intenta con una cantidad menor.`;
          amountErrorBox.textContent = msg;
          if (window.puenteSpeech) {
            window.puenteSpeech.speak(msg);
          }
          if (window.facilitatorPanel) window.facilitatorPanel.recordMetric('error');
          return;
        }

        if (val > MAX_AMOUNT) {
          inputAmount.classList.add('has-error');
          amountErrorBox.classList.remove('hidden');
          amountErrorBox.classList.add('show');
          const msg = `Solo puedes transferir un máximo de ${this.formatCLP(MAX_AMOUNT)}`;
          amountErrorBox.textContent = msg;
          if (window.puenteSpeech) {
            window.puenteSpeech.speak(msg);
          }
          if (window.facilitatorPanel) window.facilitatorPanel.recordMetric('error');
          return;
        }

        inputAmount.classList.remove('has-error');
        amountErrorBox.classList.add('hidden');
        amountErrorBox.classList.remove('show');
        amountErrorBox.textContent = '';

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

    // Si el monto excede el saldo o el límite máximo de $200.000
    if (warnBox) {
      if (this.transferState.amount > this.user.balance || this.transferState.amount > 200000) {
        warnBox.classList.remove('hidden');
        if (this.transferState.amount > this.user.balance) {
          warnBox.innerHTML = `⚠️ <strong>Atención:</strong> El monto es mayor a tu saldo disponible (Tienes ${this.formatCLP(this.user.balance)} en tu cuenta). Intenta con una cantidad menor.`;
        } else {
          warnBox.innerHTML = `⚠️ <strong>Atención:</strong> Solo puedes transferir un máximo de $200.000.`;
        }
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
    this.transferState.amount = active ? 500000 : 0;
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

    // Soporte para teclado físico (0-9, Backspace, Enter)
    window.addEventListener('keydown', (e) => {
      if (!modal || !modal.classList.contains('active')) return;
      if (e.key === 'Backspace') {
        if (this.enteredPin.length > 0) {
          this.enteredPin = this.enteredPin.slice(0, -1);
          this.updatePinDisplay();
        }
      } else if (/^[0-9]$/.test(e.key)) {
        if (this.enteredPin.length < 6) {
          this.enteredPin += e.key;
          this.updatePinDisplay();
        }
      } else if (e.key === 'Enter') {
        if (this.enteredPin.length === 6) {
          this.executeTransfer();
        }
      }
    });

    if (btnAuthorize) {
      btnAuthorize.addEventListener('click', () => {
        if (this.enteredPin.length < 6) {
          if (window.puenteToast) {
            window.puenteToast('Por favor ingresa los 6 números de tu clave.');
          } else {
            alert('Por favor completa los 6 números de tu clave.');
          }
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
    if (window.interfazPuente && !window.interfazPuente.isTutorialActive) {
      window.interfazPuente.clearSpotlight();
    }
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

    this.goTo('success');
  }

  /* Paso 4.5: Pantalla de Éxito en la Transferencia */
  setupSuccessStep() {
    const btnContinue = document.getElementById('btnContinueFromSuccess');
    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        if (window.puenteSpeech) window.puenteSpeech.stop();
        this.goTo('receipt');
      });
    }

    const btnSpeak = document.getElementById('btnSpeakSuccessMessage');
    if (btnSpeak) {
      btnSpeak.addEventListener('click', () => {
        if (window.puenteSpeech) {
          const amtSpeech = this.formatCLPForSpeech(this.transferState.amount);
          const destName = (this.transferState.recipient && this.transferState.recipient.name)
            ? this.transferState.recipient.name
            : 'Rosa Pérez Sepúlveda';
          window.puenteSpeech.speak(`Listo, has enviado ${amtSpeech} a ${destName}.`);
        }
      });
    }
  }

  renderSuccess() {
    const msgEl = document.getElementById('transferSuccessMessage');
    const amtStr = this.formatCLP(this.transferState.amount);
    const destName = (this.transferState.recipient && this.transferState.recipient.name)
      ? this.transferState.recipient.name
      : 'Rosa Pérez Sepúlveda';

    if (msgEl) {
      msgEl.innerHTML = `Listo haz enviado <strong>${amtStr}</strong> a <strong>${destName}</strong>`;
    }
    // La pantalla NO se lee automáticamente; la lectura es opcional mediante el botón "Escuchar".
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

  /* ================= DICTADO POR VOZ EN TODAS LAS CASILLAS ================= */
  setupVoiceDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Helper: Normalizar texto para reconocimiento
    const normalizeText = (str) => {
      return (str || '')
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    };

    // Helper: Extraer dígitos de texto hablado (soporta números hablados y "K")
    const parseSpokenDigits = (transcript, allowK = false) => {
      let t = normalizeText(transcript)
        .replace(/\buno\b/g, '1')
        .replace(/\bun\b/g, '1')
        .replace(/\bdos\b/g, '2')
        .replace(/\btres\b/g, '3')
        .replace(/\bcuatro\b/g, '4')
        .replace(/\bcinco\b/g, '5')
        .replace(/\bseis\b/g, '6')
        .replace(/\bsiete\b/g, '7')
        .replace(/\bocho\b/g, '8')
        .replace(/\bnueve\b/g, '9')
        .replace(/\bcero\b/g, '0')
        .replace(/\bdiez\b/g, '10')
        .replace(/\bonce\b/g, '11')
        .replace(/\bdoce\b/g, '12')
        .replace(/\btrece\b/g, '13')
        .replace(/\bcatorce\b/g, '14')
        .replace(/\bquince\b/g, '15')
        .replace(/\bveinte\b/g, '20');

      if (allowK) {
        t = t.replace(/\bka\b/g, 'K').replace(/\bk\b/g, 'K');
        return t.replace(/[^0-9kK]/g, '');
      }
      return t.replace(/[^0-9]/g, '');
    };

    // Helper: Extraer nombre propio capitalizado
    const parseSpokenName = (transcript) => {
      return (transcript || '')
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        .trim()
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    // Helper: Extraer correo electrónico
    const parseSpokenEmail = (transcript) => {
      let em = normalizeText(transcript)
        .replace(/\s*arroba\s*/g, '@')
        .replace(/\s*punto\s*/g, '.')
        .replace(/\s*guion\s*bajo\s*/g, '_')
        .replace(/\s*guion\s*/g, '-')
        .replace(/\s+/g, '');
      return em;
    };

    // Helper: Extraer monto numérico en CLP desde texto hablado en español
    const parseSpokenAmount = (transcript) => {
      const clean = normalizeText(transcript);
      if (!clean) return 0;

      // Si dice "15 mil" o "15k"
      const directMil = clean.match(/(\d+)\s*(mil|k)\b/);
      if (directMil) {
        return (parseInt(directMil[1], 10) || 0) * 1000;
      }

      // Si contiene dígitos directos (ej: "$15.000", "15000", "50000")
      const digitsOnly = clean.replace(/[^\d]/g, '');
      if (digitsOnly.length >= 3 && !clean.includes('mil') && !clean.includes('pesos')) {
        return parseInt(digitsOnly, 10);
      }

      const words = clean.split(/\s+/);
      let total = 0;
      let current = 0;

      const units = {
        'un': 1, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
        'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
        'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
        'veinte': 20, 'veintiuno': 21, 'veintidos': 22, 'veintitres': 23, 'veinticuatro': 24,
        'veinticinco': 25, 'veintiseis': 26, 'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29,
        'treinta': 30, 'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60,
        'setenta': 70, 'ochenta': 80, 'noventa': 90
      };

      const hundreds = {
        'cien': 100, 'ciento': 100, 'doscientos': 200, 'trescientos': 300,
        'cuatrocientos': 400, 'quinientos': 500, 'seiscientos': 600,
        'setecientos': 700, 'ochocientos': 800, 'novecientos': 900
      };

      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (w === 'y' || w === 'pesos' || w === 'peso' || w === 'de' || w === 'a' || w === 'en') continue;

        if (units[w] !== undefined) {
          current += units[w];
        } else if (hundreds[w] !== undefined) {
          current += hundreds[w];
        } else if (w === 'mil') {
          if (current === 0) current = 1;
          total += current * 1000;
          current = 0;
        } else if (w === 'millon' || w === 'millones') {
          if (current === 0) current = 1;
          total += current * 1000000;
          current = 0;
        } else if (/^\d+$/.test(w)) {
          current += parseInt(w, 10);
        }
      }
      total += current;

      if (total === 0 && digitsOnly) {
        return parseInt(digitsOnly, 10) || 0;
      }
      return total;
    };

    // Helper: Mostrar retroalimentación
    const showFeedback = (el, msg, isError = false) => {
      if (!el) return;
      el.style.display = 'block';
      el.textContent = msg;
      if (isError) el.classList.add('error');
      else el.classList.remove('error');
    };

    const hideFeedback = (el, delay = 4000) => {
      if (!el) return;
      clearTimeout(el.__feedbackTimer);
      el.__feedbackTimer = setTimeout(() => {
        el.style.display = 'none';
        el.classList.remove('error');
      }, delay);
    };

    // Helper para formato RUT
    const formatRut = (raw) => {
      let val = raw.replace(/[^0-9kK]/g, '').toUpperCase();
      if (!val) return '';
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

    // Asociar a todos los botones de dictado por voz de campos de texto (.btn-voice-dictate)
    const voiceButtons = document.querySelectorAll('.btn-voice-dictate');
    voiceButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const targetId = btn.getAttribute('data-target');
        const fieldType = btn.getAttribute('data-field-type') || 'text';
        const targetInput = document.getElementById(targetId);
        if (!targetInput) return;

        // Buscar feedback correspondiente
        let feedbackEl = btn.closest('.form-group, .recipient-search-box, .amount-display-box, #newRecipientStepRut')?.querySelector('.voice-dictate-feedback');
        if (!feedbackEl) {
          feedbackEl = document.getElementById(`feedbackVoice${targetId.charAt(0).toUpperCase() + targetId.slice(1)}`);
        }

        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CL';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            btn.classList.add('listening');
            showFeedback(feedbackEl, '🎙️ Escuchando... habla ahora');

            recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;

              if (fieldType === 'search') {
                const query = transcript.trim();
                targetInput.value = query;
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                showFeedback(feedbackEl, `✓ Buscando: "${query}"`);
              } else if (fieldType === 'rut') {
                const digits = parseSpokenDigits(transcript, true);
                if (digits) {
                  const formatted = formatRut(digits);
                  targetInput.value = formatted;
                  targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                  showFeedback(feedbackEl, `✓ RUT entendido: ${formatted}`);
                } else {
                  showFeedback(feedbackEl, 'No se detectaron números. Intenta de nuevo o usa el teclado.', true);
                }
              } else if (fieldType === 'name') {
                const name = parseSpokenName(transcript);
                if (name) {
                  targetInput.value = name;
                  targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                  showFeedback(feedbackEl, `✓ Nombre: ${name}`);
                }
              } else if (fieldType === 'number') {
                const digits = parseSpokenDigits(transcript, false);
                if (digits) {
                  targetInput.value = digits;
                  targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                  showFeedback(feedbackEl, `✓ Número: ${digits}`);
                }
              } else if (fieldType === 'email') {
                const email = parseSpokenEmail(transcript);
                if (email) {
                  targetInput.value = email;
                  targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                  showFeedback(feedbackEl, `✓ Correo: ${email}`);
                }
              } else if (fieldType === 'amount') {
                let amount = parseSpokenAmount(transcript);
                if (amount > 0) {
                  if (amount > 200000) amount = 200000;
                  this.transferState.amount = amount;
                  targetInput.value = this.formatCLP(amount);
                  targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                  showFeedback(feedbackEl, `✓ Monto entendido: ${this.formatCLP(amount)}`);
                } else {
                  showFeedback(feedbackEl, 'No detectamos una cantidad clara. Ej: "quince mil pesos".', true);
                }
              } else {
                // Texto general (Glosa / Mensaje)
                const text = transcript.charAt(0).toUpperCase() + transcript.slice(1);
                targetInput.value = text;
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                showFeedback(feedbackEl, `✓ Mensaje: "${text}"`);
              }
            };

            recognition.onerror = () => {
              showFeedback(feedbackEl, 'No pudimos escuchar con claridad. Puedes intentar de nuevo o usar el teclado.', true);
            };

            recognition.onend = () => {
              btn.classList.remove('listening');
              hideFeedback(feedbackEl, 4000);
            };

            recognition.start();
          } catch (err) {
            console.warn('SpeechRecognition error:', err);
            btn.classList.remove('listening');
          }
        } else {
          // Fallback pedagógico simulado
          const simulatedValues = {
            search: 'Rosa Pérez',
            rut: '15.678.910-K',
            name: 'Carmen Gloria Morales',
            number: '00-128-45920-01',
            email: 'carmen.morales@correo.cl',
            amount: '$15.000',
            text: 'Regalo de cumpleaños'
          };
          const simVal = simulatedValues[fieldType] || 'Texto dictado';
          if (fieldType === 'amount') {
            this.transferState.amount = 15000;
            targetInput.value = '$15.000';
          } else {
            targetInput.value = simVal;
          }
          targetInput.dispatchEvent(new Event('input', { bubbles: true }));
          showFeedback(feedbackEl, `✓ Dictado (simulado): ${targetInput.value}`);
          hideFeedback(feedbackEl, 3000);
        }
      });
    });

    // Botón de dictado por voz para la clave de 6 números (.btn-voice-dictate-pin)
    const btnVoicePin = document.getElementById('btnVoiceDictatePin');
    const feedbackPin = document.getElementById('feedbackVoicePin');

    if (btnVoicePin) {
      btnVoicePin.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CL';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            btnVoicePin.classList.add('listening');
            showFeedback(feedbackPin, '🎙️ Escuchando... Di los 6 números de tu clave');

            recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              const digits = parseSpokenDigits(transcript, false);

              if (digits.length >= 6) {
                this.enteredPin = digits.slice(0, 6);
                if (this.updatePinDisplay) this.updatePinDisplay();
                showFeedback(feedbackPin, `✓ Clave de 6 números ingresada: ${this.enteredPin}`);
                setTimeout(() => {
                  this.executeTransfer();
                }, 800);
              } else if (digits.length > 0) {
                this.enteredPin = digits;
                if (this.updatePinDisplay) this.updatePinDisplay();
                showFeedback(feedbackPin, `Detectamos ${digits.length} dígitos (${digits}). Faltan ${6 - digits.length}. Puedes completar con los botones abajo.`);
              } else {
                showFeedback(feedbackPin, 'No detectamos números. Puedes tocar los números abajo.', true);
              }
            };

            recognition.onerror = () => {
              showFeedback(feedbackPin, 'No pudimos escuchar los números. Toca los números del teclado abajo.', true);
            };

            recognition.onend = () => {
              btnVoicePin.classList.remove('listening');
              hideFeedback(feedbackPin, 4000);
            };

            recognition.start();
          } catch (err) {
            console.warn('SpeechRecognition PIN error:', err);
            btnVoicePin.classList.remove('listening');
          }
        } else {
          // Fallback simulado
          this.enteredPin = '123456';
          if (this.updatePinDisplay) this.updatePinDisplay();
          showFeedback(feedbackPin, '✓ Clave de 6 números ingresada (simulada): 123456');
          hideFeedback(feedbackPin, 3000);
          setTimeout(() => {
            this.executeTransfer();
          }, 800);
        }
      });
    }
  }
}

// Inicializar router al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
  window.appRouter = new AppRouter();
});
