#!/usr/bin/env python3
"""
Script de Empaquetado Automático: Prototipo Interfaz Puente (BancoEstado - INACAP)
Agrupa CSS, JS y datos en un único archivo standalone autónomo (index.html).
"""

import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def read_file(relative_path):
    with open(os.path.join(BASE_DIR, relative_path), 'r', encoding='utf-8') as f:
        return f.read()

def bundle():
    print("Empaquetando prototipo en un único archivo HTML...")

    # 1. Leer CSS
    css_main = read_file('css/main.css')
    css_puente = read_file('css/interfaz-puente.css')
    css_fac = read_file('css/facilitator.css')

    # 2. Leer Glosario
    glossary_raw = read_file('data/glossary.json')
    glossary_data = json.loads(glossary_raw)
    glossary_json_str = json.dumps(glossary_data, ensure_ascii=False, indent=2)

    # 3. Leer JS
    js_speech = read_file('js/speech.js')
    js_puente = read_file('js/interfaz-puente.js')
    js_fac = read_file('js/facilitator.js')
    js_app = read_file('js/app.js')

    # 4. Leer index.html base (extraer el cuerpo y cabecera)
    html_content = read_file('index.html')

    # Bloque de reemplazo de estilos
    css_replacement = f'''  <!-- Estilos del Proyecto (Empaquetados Standalone) -->
  <style>
/* ==========================================
   1. MAIN.CSS
   ========================================== */
{css_main}

/* ==========================================
   2. INTERFAZ-PUENTE.CSS
   ========================================== */
{css_puente}

/* ==========================================
   3. FACILITATOR.CSS
   ========================================== */
{css_fac}
  </style>'''

    # Bloque de reemplazo de scripts
    js_replacement = f'''  <!-- Scripts del Prototipo (Empaquetados Standalone) -->
  <script>
/* ==========================================
   GLOSARIO DE TÉRMINOS BANCARIOS (Datos Embebidos)
   ========================================== */
window.PUENTE_GLOSSARY_DATA = {glossary_json_str};

/* ==========================================
   0. CONFIGURACIÓN DE LA PRUEBA Y AVISOS EN PANTALLA
   ========================================== */
window.PUENTE_TEST = {{
  SALDO_INICIAL: 350000,
  MONTO_TAREA: 15000,      // Tarea que entrega el facilitador: "envía $15.000 a Rosa Pérez"
  MONTO_CON_ERROR: 150000, // Mismo monto con un cero de más (dentro del saldo, para que llegue al resumen)
  CLAVE_PRUEBA: '123456'
}};

window.puenteToast = function (msg, ms) {{
  const el = document.getElementById('puenteToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window.__puenteToastTimer);
  window.__puenteToastTimer = setTimeout(() => el.classList.remove('show'), ms || 3500);
}};

window.puenteShowError = function (id, msg) {{
  const el = document.getElementById(id);
  if (!el) return;
  if (msg) {{
    el.textContent = msg;
    el.classList.add('show');
  }} else {{
    el.textContent = '';
    el.classList.remove('show');
  }}
}};

window.puenteHelp = function (detail) {{
  if (window.facilitatorPanel) window.facilitatorPanel.recordMetric('help', detail);
}};

/* ==========================================
   1. SPEECH.JS - Síntesis de Voz (TTS)
   ========================================== */
{js_speech}

/* ==========================================
   2. INTERFAZ-PUENTE.JS - Pasamanos Digital
   ========================================== */
{js_puente}

/* ==========================================
   3. FACILITATOR.JS - Panel del Facilitador
   ========================================== */
{js_fac}

/* ==========================================
   4. APP.JS - Controlador Principal
   ========================================== */
{js_app}

/* ==========================================
   5. UTILIDADES (Pantalla Completa)
   ========================================== */
document.getElementById('btnToggleFullScreen').addEventListener('click', function() {{
  const frame = document.getElementById('appMainContainer');
  if (!document.fullscreenElement) {{
    if (frame.requestFullscreen) {{
      frame.requestFullscreen();
    }} else if (frame.webkitRequestFullscreen) {{
      frame.webkitRequestFullscreen();
    }}
  }} else {{
    if (document.exitFullscreen) {{
      document.exitFullscreen();
    }}
  }}
}});
  </script>'''

    # Reemplazo de links CSS si existen o actualización de style
    import re
    if '<!-- Estilos del Proyecto (Empaquetados Standalone) -->' in html_content:
        html_content = re.sub(
            r'  <!-- Estilos del Proyecto \(Empaquetados Standalone\) -->\s*<style>[\s\S]*?</style>',
            lambda m: css_replacement,
            html_content
        )
    else:
        link_block = '''  <!-- Estilos del Proyecto -->
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/interfaz-puente.css">
  <link rel="stylesheet" href="css/facilitator.css">'''
        html_content = html_content.replace(link_block, css_replacement)

    # Reemplazo de scripts si existen o actualización de script
    if '<!-- Scripts del Prototipo (Empaquetados Standalone) -->' in html_content:
        html_content = re.sub(
            r'  <!-- Scripts del Prototipo \(Empaquetados Standalone\) -->\s*<script>[\s\S]*?</script>',
            lambda m: js_replacement,
            html_content
        )
    else:
        script_block = '''  <!-- Scripts del Prototipo -->
  <script src="js/speech.js"></script>
  <script src="js/interfaz-puente.js"></script>
  <script src="js/facilitator.js"></script>
  <script src="js/app.js"></script>

  <script>
    // Alternancia de pantalla completa en escritorio
    document.getElementById('btnToggleFullScreen').addEventListener('click', function() {
      const frame = document.getElementById('appMainContainer');
      if (!document.fullscreenElement) {
        if (frame.requestFullscreen) {
          frame.requestFullscreen();
        } else if (frame.webkitRequestFullscreen) {
          frame.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
  </script>'''
        html_content = html_content.replace(script_block, js_replacement)

    # Reemplazo de logo por Data URI standalone
    logo_path = os.path.join(BASE_DIR, 'assets', 'logo-bancoestado.png')
    if os.path.exists(logo_path):
        import base64
        with open(logo_path, 'rb') as f_img:
            logo_b64 = base64.b64encode(f_img.read()).decode('ascii')
            logo_data_uri = f'data:image/png;base64,{logo_b64}'
            html_content = re.sub(
                r'<span class="be-logo-symbol">B</span>',
                f'<img src="{logo_data_uri}" alt="Logo BancoEstado" class="be-logo-symbol">',
                html_content
            )
            html_content = re.sub(
                r'<img\s+src=["\'][^"\']+["\']\s+alt="Logo BancoEstado"\s+class="be-logo-symbol">',
                f'<img src="{logo_data_uri}" alt="Logo BancoEstado" class="be-logo-symbol">',
                html_content
            )

    target_path = os.path.join(BASE_DIR, 'index.html')
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"✅ Prototipo empaquetado exitosamente en: {target_path} ({len(html_content):,} bytes)")

if __name__ == '__main__':
    bundle()
