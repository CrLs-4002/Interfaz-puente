# Interfaz Puente — BancoEstado (Simulación Académica INACAP)

> **Proyecto de Título:** Diseño Digital Profesional  
> **Estudiantes:** Carlos Valdés & Sebastián Mardones  
> **Sede:** INACAP Santiago Centro  
> **Período de Pruebas de Usabilidad:** 26 de octubre – 24 de noviembre de 2026  
> **Persona Clave:** Elena Retamales (68 años, Los Andes, CuentaRUT)  
> **Frase Central:** *"El usuario no falla por falta de visión, falla por sobrecarga semántica."*  
> **Concepto Creativo:** *"Entender sin miedo para actuar con independencia."*  
> **Metáfora:** El **pasamanos digital** (acompaña, no hace el trámite por la persona).

---

## 1. Cómo Ejecutar el Prototipo

El prototipo no requiere backend ni configuraciones complejas en la nube (100% local, cumpliendo con la **Ley 21.719** de protección de datos personales).

### Opción A (La más rápida y recomendada):
Abre una terminal en esta carpeta y ejecuta:
```bash
./iniciar.sh
```
O directamente con Python:
```bash
python3 -m http.server 5173
```
Luego abre tu navegador en:
* **En el computador:** `http://localhost:5173`
* **En un celular real:** Abre el navegador del celular e ingresa la dirección IP que muestra la terminal (ejemplo: `http://192.168.1.15:5173`), asegurándote de que ambos dispositivos estén en la misma red Wi-Fi.

---

## 2. Funciones Implementadas de Interfaz Puente

1. **Botón Flotante "¿Te ayudo?" (Arrastrable):**
   * Siempre visible, táctil (mínimo 60px) con animación sutil.
   * Se puede arrastrar a cualquier parte de la pantalla para no tapar los campos del formulario.
2. **Traducción Semántica (12 Términos Bancarios):**
   * Sustituye o acompaña la jerga bancaria tradicional por preguntas y explicaciones cotidianas.
   * Se alimenta directamente del archivo `data/glossary.json` (fácilmente editable).
   * Al tocar el botón "¿Qué es?" en cualquier término, se despliega una tarjeta explicativa con síntesis de voz.
3. **Foco Dinámico (Spotlight al 85%):**
   * Oscurece el resto de la pantalla al **85%** e ilumina únicamente el campo que hay que completar.
   * Se activa manualmente desde el menú "¿Te ayudo?".
   * **Watchdog de 15 segundos:** Si Elena permanece 15 segundos inactiva, aparece una burbuja no impositiva: *"¿Quieres que te muestre dónde seguir?"*.
4. **Resumen Seguro (Diseño Determinista):**
   * Antes de autorizar la transferencia, muestra una tarjeta de alto contraste con el microcopy:
     > *"Vas a enviar $50.000 a Rosa Pérez Sepúlveda, a su cuenta en Banco de Chile. Una vez enviado, no se puede deshacer."*
   * Incluye dos botones grandes: **"Sí, enviar"** y **"No, quiero revisar"**.
   * El nombre de la pantalla se puede alternar entre *"Resumen Seguro"* y *"Revisa antes de enviar"*.
5. **Lectura por Voz (Web Speech API):**
   * Botón para escuchar en voz alta cualquier explicación, campo del foco dinámico o el Resumen Seguro con cadencia pausada en español chileno/latinoamericano.
6. **Bienvenida Breve (Onboarding 5s):**
   * Se presenta únicamente en la primera visita explicando qué es el pasamanos digital y para qué sirve.
7. **Modo Práctica:**
   * Al activarlo, despliega un banner visible: *"Estás practicando: no se envía dinero"*.
8. **Autoocultamiento:**
   * Si la persona completa 3 transferencias con soltura sin pedir auxilio, el widget se contrae sutilmente a un botón pequeño para fomentar la autonomía.

---

## 3. Panel Oculto del Facilitador (Para las Pruebas)

El panel del facilitador está oculto para no confundir a los participantes.

### ¿Cómo abrirlo?
* **Toca 5 veces seguidas** el banner superior que dice:
  `"Simulación académica INACAP — no es la app oficial de BancoEstado"`

### Opciones disponibles en el panel:
1. **Selector de Participante:** Asigna el código anónimo (P01 a P08).
2. **Activar / Desactivar Interfaz Puente:** Permite comparar el grupo experimental (con ayuda) contra el grupo de control (banca estándar sin ayuda).
3. **Nombre de la Pantalla Final (Test A/B):** Conmuta entre *"Resumen Seguro"* y *"Revisa antes de enviar"*.
4. **Inyectar Error de Monto ($500.000):** Precarga la transferencia con un cero extra ($500.000 en vez de $50.000) para medir si el participante detecta la discrepancia antes de confirmar.
5. **Métricas en Tiempo Real:**
   * Cronómetro de tiempo total del trámite.
   * Contador de solicitudes de ayuda.
   * Contador de errores cometidos.
   * Detección de corrección en el resumen final.
   * Estado de compleción.
6. **Exportar a CSV:** Descarga un archivo `.csv` compatible con Excel y Google Sheets con todos los datos registrados durante la jornada de testeo.
7. **Reiniciar Sesión:** Restaura el saldo ($350.000), borra los campos y reactiva la bienvenida para el siguiente participante.

---

## 4. Archivos Editables

Los datos están modularizados para que puedan modificarlos sin tocar el código central:
* `data/glossary.json`: Contiene las 12 palabras técnicas bancarias y sus traducciones semánticas cotidianas.
* `data/contacts.json`: Contiene los datos de Elena Retamales, Rosa Pérez y la lista de bancos de Chile.
* `css/main.css`: Estilos visuales accesibles (WCAG 2.2 AA y pautas cognitivas COGA, fuentes >= 18px, botones >= 48px).
* `css/interfaz-puente.css`: Estilos del pasamanos digital y foco dinámico.
* `css/facilitator.css`: Estilos del panel de pruebas.
