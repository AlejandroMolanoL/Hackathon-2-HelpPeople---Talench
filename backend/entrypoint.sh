#!/bin/sh
set -e

echo "=========================================================="
echo "Iniciando contenedor HelpPeople Backend & ML Service"
echo "=========================================================="

# Intentar inicializar SQL Server (crea BD, tablas y puebla si está vacío)
if [ -f "/app/database/init_db.py" ]; then
    echo "[*] Ejecutando sincronización de Base de Datos..."
    python /app/database/init_db.py || echo "[!] Advertencia: init_db reportó un aviso. Continuando con el arranque..."
fi

echo "[*] Levantando servidor FastAPI..."
exec uvicorn main:app --host 0.0.0.0 --port 8000

