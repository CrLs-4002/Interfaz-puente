#!/bin/bash
# ==============================================================================
# Script de Inicio: Prototipo Interfaz Puente (INACAP)
# Autores: Carlos Valdés & Sebastián Mardones
# ==============================================================================

PORT=5173
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo "=========================================================="
echo "  🚀 INICIANDO PROTOTIPO INTERFAZ PUENTE — BANCOESTADO"
echo "  Simulación Académica INACAP para Pruebas con Personas Mayores"
echo "=========================================================="
echo ""
echo "💻 En tu computadora: http://localhost:$PORT"
echo "📱 En tu teléfono celular (en la misma red WiFi):"
echo "   👉 http://$LOCAL_IP:$PORT"
echo ""
echo "ℹ️  Panel del Facilitador: Toca 5 veces el banner superior INACAP"
echo "=========================================================="
echo "Presiona Ctrl + C para detener el servidor."
echo ""

# Abrir automáticamente en el navegador predeterminado
if which open >/dev/null 2>&1; then
  (sleep 1 && open "http://localhost:$PORT") &
fi

# Iniciar servidor HTTP ultraligero local con Python 3
python3 -m http.server $PORT
