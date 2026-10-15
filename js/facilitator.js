/**
 * INTERFAZ PUENTE — PANEL DEL FACILITADOR
 * Pruebas de Usabilidad con Personas Mayores (P01 a P08)
 * Autores: Carlos Valdés & Sebastián Mardones (INACAP)
 */

class FacilitatorPanel {
  constructor() {
    this.tapCount = 0;
    this.tapTimer = null;
    this.sessionTimer = null;
    this.sessionSeconds = 0;
    this.isSessionActive = false;

    // Estado de la prueba
    this.participant = 'P01';
    this.bridgeEnabled = true;
    this.summaryTitleVariant = 'resumen_seguro'; // 'resumen_seguro' o 'revisa_antes'
    this.errorInjectionActive = false; // Monto de $500.000 con cero extra
    this.practiceMode = false;

    // Métricas de la sesión en curso
    this.currentMetrics = {
      helpRequests: 0,
      spotlightActivations: 0,
      errorsCount: 0,
      correctedInSummary: false,
      completed: false
    };

    // Historial acumulado en LocalStorage
    this.sessionLogs = this.loadLogs();

    this.init();
  }

  init() {
    this.cacheElements();
    this.setupSecretTrigger();
    this.setupTabs();
    this.setupControls();
    this.renderLogsTable();
    this.startSessionTimer();
  }

  cacheElements() {
    this.overlay = document.getElementById('facilitatorOverlay');
    this.banner = document.getElementById('inacapBanner');
    this.participantSelect = document.getElementById('facParticipantSelect');
    this.switchBridge = document.getElementById('facSwitchBridge');
    this.switchError = document.getElementById('facSwitchError');
    this.switchPractice = document.getElementById('facSwitchPractice');
    this.tableBody = document.getElementById('facTableBody');
    this.metricTimer = document.getElementById('facMetricTimer');
    this.metricHelp = document.getElementById('facMetricHelp');
    this.metricErrors = document.getElementById('facMetricErrors');
    this.metricCorrected = document.getElementById('facMetricCorrected');
  }

  /* ================= 5 TOQUES SECRETOS EN EL BANNER ================= */
  setupSecretTrigger() {
    if (!this.banner) return;

    this.banner.addEventListener('click', () => {
      this.tapCount++;
      clearTimeout(this.tapTimer);

      if (this.tapCount >= 5) {
        this.open();
        this.tapCount = 0;
      } else {
        this.tapTimer = setTimeout(() => {
          this.tapCount = 0;
        }, 3000);
      }
    });
  }

  open() {
    if (this.overlay) {
      this.overlay.classList.add('active');
      this.updateMetricsUI();
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
  }

  /* ================= CONTROL DE PESTAÑAS ================= */
  setupTabs() {
    const tabs = document.querySelectorAll('.fac-tab-btn');
    const panes = document.querySelectorAll('.fac-tab-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const target = document.getElementById(tab.getAttribute('data-target'));
        if (target) target.classList.add('active');
      });
    });

    const btnClose = document.getElementById('btnCloseFacilitator');
    if (btnClose) btnClose.addEventListener('click', () => this.close());
  }

  /* ================= CONTROLES Y CONFIGURACIÓN ================= */
  setupControls() {
    // Selector de participante P01 - P08
    if (this.participantSelect) {
      this.participantSelect.addEventListener('change', (e) => {
        this.participant = e.target.value;
      });
    }

    // Toggle de Interfaz Puente (ON/OFF para medir Grupo Experimental vs Control)
    if (this.switchBridge) {
      this.switchBridge.addEventListener('change', (e) => {
        this.bridgeEnabled = e.target.checked;
        if (window.interfazPuente) {
          window.interfazPuente.setBridgeEnabled(this.bridgeEnabled);
        }
      });
    }

    // Conmutador A/B del título de confirmación
    const segmentBtns = document.querySelectorAll('.fac-summary-variant');
    segmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        segmentBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.summaryTitleVariant = btn.getAttribute('data-variant');
        if (window.appRouter) {
          window.appRouter.updateSummaryTitle(this.summaryTitleVariant);
        }
      });
    });

    // Inyección de error ($500.000 con cero de más)
    if (this.switchError) {
      this.switchError.addEventListener('change', (e) => {
        this.errorInjectionActive = e.target.checked;
        if (window.appRouter) {
          window.appRouter.setErrorInjection(this.errorInjectionActive);
        }
      });
    }

    // Modo Práctica
    if (this.switchPractice) {
      this.switchPractice.addEventListener('change', (e) => {
        this.practiceMode = e.target.checked;
        if (window.interfazPuente) {
          window.interfazPuente.setPracticeMode(this.practiceMode);
        }
      });
    }

    // Botón reiniciar sesión
    const btnReset = document.getElementById('btnFacResetSession');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetSession());
    }

    // Botón exportar CSV
    const btnExport = document.getElementById('btnFacExportCsv');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportToCSV());
    }

    // Botón limpiar historial
    const btnClearLogs = document.getElementById('btnFacClearLogs');
    if (btnClearLogs) {
      btnClearLogs.addEventListener('click', () => {
        if (confirm('¿Deseas borrar todo el registro acumulado de pruebas?')) {
          localStorage.removeItem('puente_facilitator_logs');
          this.sessionLogs = [];
          this.renderLogsTable();
        }
      });
    }
  }

  /* ================= REGISTRO DE MÉTRICAS ================= */
  startSessionTimer() {
    this.sessionSeconds = 0;
    this.isSessionActive = true;
    clearInterval(this.sessionTimer);

    this.sessionTimer = setInterval(() => {
      if (this.isSessionActive) {
        this.sessionSeconds++;
        if (this.metricTimer) {
          this.metricTimer.textContent = `${this.sessionSeconds}s`;
        }
      }
    }, 1000);
  }

  recordMetric(type) {
    if (type === 'help') {
      this.currentMetrics.helpRequests++;
    } else if (type === 'spotlight') {
      this.currentMetrics.spotlightActivations++;
    } else if (type === 'error') {
      this.currentMetrics.errorsCount++;
    } else if (type === 'correction') {
      this.currentMetrics.correctedInSummary = true;
    }
    this.updateMetricsUI();
  }

  finishSession(isCompleted) {
    this.isSessionActive = false;
    this.currentMetrics.completed = isCompleted;

    const record = {
      id: Date.now(),
      fecha: new Date().toLocaleString('es-CL'),
      participante: this.participant,
      interfazPuente: this.bridgeEnabled ? 'CON AYUDA' : 'SIN AYUDA (Control)',
      varianteTitulo: this.summaryTitleVariant === 'resumen_seguro' ? 'Resumen Seguro' : 'Revisa antes de enviar',
      errorInyectado: this.errorInjectionActive ? 'SÍ ($500.000)' : 'NO ($50.000)',
      tiempoSegundos: this.sessionSeconds,
      ayudasPedidas: this.currentMetrics.helpRequests,
      focosUsados: this.currentMetrics.spotlightActivations,
      erroresCometidos: this.currentMetrics.errorsCount,
      corrigioEnResumen: this.currentMetrics.correctedInSummary ? 'SÍ' : 'NO',
      completada: isCompleted ? 'EXITOSA' : 'INCOMPLETA'
    };

    this.sessionLogs.push(record);
    this.saveLogs();
    this.renderLogsTable();
  }

  updateMetricsUI() {
    if (this.metricHelp) this.metricHelp.textContent = this.currentMetrics.helpRequests;
    if (this.metricErrors) this.metricErrors.textContent = this.currentMetrics.errorsCount;
    if (this.metricCorrected) this.metricCorrected.textContent = this.currentMetrics.correctedInSummary ? 'SÍ' : 'NO';
  }

  resetSession() {
    this.sessionSeconds = 0;
    this.currentMetrics = {
      helpRequests: 0,
      spotlightActivations: 0,
      errorsCount: 0,
      correctedInSummary: false,
      completed: false
    };
    localStorage.removeItem('puente_onboarding_shown');

    if (window.appRouter) {
      window.appRouter.resetToHome();
    }

    this.updateMetricsUI();
    this.startSessionTimer();
    this.close();
    alert(`Sesión reiniciada para ${this.participant}.`);
  }

  /* ================= PERSISTENCIA Y CSV ================= */
  loadLogs() {
    try {
      const data = localStorage.getItem('puente_facilitator_logs');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveLogs() {
    try {
      localStorage.setItem('puente_facilitator_logs', JSON.stringify(this.sessionLogs));
    } catch (e) {}
  }

  renderLogsTable() {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = '';

    if (this.sessionLogs.length === 0) {
      this.tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748B;padding:12px">Aún no hay pruebas registradas.</td></tr>';
      return;
    }

    // Mostrar de más reciente a más antiguo
    [...this.sessionLogs].reverse().forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>${log.participante}</b></td>
        <td>${log.interfazPuente}</td>
        <td>${log.tiempoSegundos}s</td>
        <td>${log.ayudasPedidas}</td>
        <td>${log.corrigioEnResumen}</td>
        <td>${log.errorInyectado}</td>
        <td><b style="color:${log.completada === 'EXITOSA' ? 'var(--teal)' : 'var(--red)'}">${log.completada}</b></td>
      `;
      this.tableBody.appendChild(tr);
    });
  }

  exportToCSV() {
    if (this.sessionLogs.length === 0) {
      alert('No hay datos registrados aún para exportar.');
      return;
    }

    const headers = [
      'ID_Prueba',
      'Fecha_Hora',
      'Participante',
      'Condicion_Interfaz_Puente',
      'Variante_Titulo_Resumen',
      'Error_Inyectado_Monto',
      'Tiempo_Total_Segundos',
      'Veces_Ayuda_Solicitada',
      'Veces_Foco_Dinamico',
      'Errores_Cometidos',
      'Corrigio_En_Resumen_Seguro',
      'Tarea_Completada'
    ];

    const rows = this.sessionLogs.map(log => [
      log.id,
      `"${log.fecha}"`,
      log.participante,
      `"${log.interfazPuente}"`,
      `"${log.varianteTitulo}"`,
      `"${log.errorInyectado}"`,
      log.tiempoSegundos,
      log.ayudasPedidas,
      log.focosUsados,
      log.erroresCometidos,
      log.corrigioEnResumen,
      log.completada
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registro_pruebas_interfaz_puente_P01_P08_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Instancia global
window.facilitatorPanel = new FacilitatorPanel();
