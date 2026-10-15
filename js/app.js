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
    const tabNew = document.getElementById('tabRecipientNew');
    const paneSaved = document.getElementById('paneRecipientSaved');
    const paneNew = document.getElementById('paneRecipientNew');
    const btnContinue = document.getElementById('btnContinueRecipient');

    if (tabSaved && tabNew) {
      tabSaved.addEventListener('click', () => {
        tabSaved.classList.add('active');
        tabNew.classList.remove('active');
        paneSaved.classList.remove('hidden');
        paneNew.classList.add('hidden');
        this.transferState.isNewRecipient = false;
      });

      tabNew.addEventListener('click', () => {
        tabNew.classList.add('active');
        tabSaved.classList.remove('active');
        paneNew.classList.remove('hidden');
        paneSaved.classList.add('hidden');
        this.transferState.isNewRecipient = true;
      });
    }

    // Selección de Rosa Pérez en frecuentes
    const contactRosa = document.getElementById('frequentContactRosa');
    if (contactRosa) {
      contactRosa.addEventListener('click', () => {
        document.querySelectorAll('.contact-item').forEach(c => c.classList.remove('selected'));
        contactRosa.classList.add('selected');
        this.transferState.recipient = {
          id: 'rosa_perez',
          name: 'Rosa Pérez Sepúlveda',
          rut: '12.876.543-2',
          bank: 'Banco de Chile',
          accountType: 'Cuenta Corriente',
          accountNum: '00-128-45920-01'
        };
      });
    }

    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        if (this.transferState.isNewRecipient) {
          const nameInput = document.getElementById('newRecipientName');
          const rutInput = document.getElementById('newRecipientRut');
          const bankSelect = document.getElementById('newRecipientBank');
          const typeSelect = document.getElementById('newRecipientType');
          const numInput = document.getElementById('newRecipientNum');

          if (!nameInput.value.trim() || !rutInput.value.trim() || !numInput.value.trim()) {
            alert('Por favor completa el nombre, RUT y número de cuenta para continuar.');
            if (window.facilitatorPanel) window.facilitatorPanel.recordMetric('error');
            return;
          }

          this.transferState.recipient = {
            id: 'nuevo_' + Date.now(),
            name: nameInput.value.trim(),
            rut: rutInput.value.trim(),
            bank: bankSelect.value,
            accountType: typeSelect.value,
            accountNum: numInput.value.trim()
          };
        }

        this.goTo('amount');
      });
    }
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
    const btnListen = document.getElementById('btnListenSummary');

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

    if (btnListen) {
      btnListen.addEventListener('click', () => {
        const textEl = document.getElementById('safeSummaryText');
        if (textEl && window.puenteSpeech) {
          window.puenteSpeech.speak(textEl.textContent + ' Si estás de acuerdo, presiona el botón verde Sí, enviar.');
        }
      });
    }
  }

  renderSummary() {
    const titleEl = document.getElementById('safeSummaryTitle');
    const textEl = document.getElementById('safeSummaryText');
    const warnBox = document.getElementById('summaryBalanceWarning');

    // Título según variante A/B
    if (titleEl) {
      titleEl.textContent = this.summaryTitleVariant === 'resumen_seguro' ? 'Resumen Seguro' : 'Revisa antes de enviar';
    }

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

  /* Paso 4: Clave Dinámica Simulada */
  setupAuthStep() {
    const modal = document.getElementById('securityModalOverlay');
    const btnAuthorize = document.getElementById('btnAuthorizeTransfer');
    const btnCancel = document.getElementById('btnCancelAuth');
    const digits = document.querySelectorAll('.security-digit');

    if (digits.length > 0) {
      digits.forEach((d, idx) => {
        d.addEventListener('input', (e) => {
          if (e.target.value.length === 1 && idx < digits.length - 1) {
            digits[idx + 1].focus();
          }
        });
        d.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !e.target.value && idx > 0) {
            digits[idx - 1].focus();
          }
        });
      });
    }

    if (btnAuthorize) {
      btnAuthorize.addEventListener('click', () => {
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
      // Pre-cargar código ficticio 123456 como ayuda pedagógica
      const digits = document.querySelectorAll('.security-digit');
      const fakeCode = ['1', '2', '3', '4', '5', '6'];
      digits.forEach((d, i) => {
        d.value = fakeCode[i] || '';
      });
      if (window.puenteSpeech) {
        window.puenteSpeech.speak('Para tu tranquilidad, ingresa el código simulado 123456 para confirmar la transferencia.');
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

    // Lectura en voz del comprobante
    if (window.puenteSpeech) {
      window.puenteSpeech.speak(`¡Listo! Se envió ${this.formatCLP(this.transferState.amount)} a ${this.transferState.recipient.name}. Tu transferencia fue exitosa.`);
    }
  }

  readCurrentScreenAloud() {
    if (!window.puenteSpeech) return;
    if (this.currentView === 'home') {
      window.puenteSpeech.speak(`Estás en el inicio de tu CuentaRUT. Tienes un saldo disponible de ${this.formatCLP(this.user.balance)}. Para transferir dinero, presiona el botón Transferir.`);
    } else if (this.currentView === 'recipient') {
      window.puenteSpeech.speak('¿A quién le quieres enviar el dinero? Puedes elegir a Rosa Pérez de tu lista de contactos o anotar los datos de una persona nueva.');
    } else if (this.currentView === 'amount') {
      window.puenteSpeech.speak(`¿Cuánto dinero quieres transferir? Tu saldo disponible es de ${this.formatCLP(this.user.balance)}.`);
    } else if (this.currentView === 'summary') {
      const text = document.getElementById('safeSummaryText');
      if (text) window.puenteSpeech.speak(text.textContent);
    } else if (this.currentView === 'receipt') {
      this.renderReceipt();
    }
  }
}

// Inicializar router al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
  window.appRouter = new AppRouter();
});
