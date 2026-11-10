"""
Módulo de conexión a Base de Datos - HelpPeople.
Soporta Microsoft SQL Server con fallback transparente a SQLite/CSV para desarrollo y demostración continua.
"""
import os
import urllib.parse
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DB_SERVER = os.getenv("DB_SERVER", "localhost")
DB_NAME = os.getenv("DB_NAME", "HelpPeopleDB")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_DRIVER = os.getenv("DB_DRIVER", "SQL Server")
DB_TRUSTED = os.getenv("DB_TRUSTED_CONNECTION", "yes")

possible_csv_paths = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "dataset_solicitudes.csv")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "database", "dataset_solicitudes.csv")),
    "/app/database/dataset_solicitudes.csv"
]
CSV_PATH = next((p for p in possible_csv_paths if os.path.exists(p)), possible_csv_paths[0])
SQLITE_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "helppeople_local.db"))

Base = declarative_base()

def build_sqlserver_connection_string():
    driver_encoded = urllib.parse.quote_plus(DB_DRIVER)
    extra_params = "&TrustServerCertificate=yes&Connection Timeout=1"
    if DB_USER and DB_PASSWORD:
        return f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/{DB_NAME}?driver={driver_encoded}{extra_params}"
    else:
        return f"mssql+pyodbc://@{DB_SERVER}/{DB_NAME}?driver={driver_encoded}&trusted_connection={DB_TRUSTED}{extra_params}"

engine = None
is_sql_server_active = False
db_error_message = None

# Intento de conexión con SQL Server
try:
    sqlserver_url = build_sqlserver_connection_string()
    test_engine = create_engine(sqlserver_url, pool_pre_ping=True, connect_args={"timeout": 2})
    with test_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    engine = test_engine
    is_sql_server_active = True
    print(f"[OK] Conectado exitosamente a SQL Server: {DB_SERVER}/{DB_NAME}")
except Exception as e:
    db_error_message = str(e)
    print(f"[Aviso] No se pudo conectar a SQL Server ({e}). Activando fallback local SQLite/CSV.")
    sqlite_url = f"sqlite:///{SQLITE_DB_PATH}"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    
    # Cargar datos desde dataset_solicitudes.csv a SQLite si está vacío o no existe
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        has_table = inspector.has_table("Solicitudes")
        row_count = 0
        if has_table:
            with engine.connect() as test_conn:
                row_count = test_conn.execute(text("SELECT COUNT(*) FROM Solicitudes")).scalar() or 0

        if not has_table or row_count == 0:
            if os.path.exists(CSV_PATH):
                df_csv = pd.read_csv(CSV_PATH)
                df_csv["fecha_solicitud"] = pd.to_datetime(df_csv["fecha_solicitud"])
                df_csv["fecha_cierre"] = pd.to_datetime(df_csv["fecha_cierre"])
                df_csv["fecha_limite_sla"] = pd.to_datetime(df_csv["fecha_limite_sla"])
                df_csv.to_sql("Solicitudes", engine, if_exists="replace", index=False)
                print(f"[OK] Fallback SQLite inicializado con {len(df_csv)} registros de solicitudes.")
        else:
            print(f"[OK] Fallback SQLite conservado con {row_count} registros de solicitudes.")
    except Exception as err:
        print(f"[Error] No se pudo inicializar la base de datos local: {err}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_database_status():
    return {
        "is_sql_server": is_sql_server_active,
        "engine_url": str(engine.url) if engine else None,
        "server": DB_SERVER if is_sql_server_active else "SQLite Local Fallback",
        "database": DB_NAME if is_sql_server_active else "helppeople_local.db",
        "driver": DB_DRIVER if is_sql_server_active else "sqlite3",
        "error": db_error_message if not is_sql_server_active else None
    }

def load_solicitudes_df():
    """Carga todas las solicitudes en un DataFrame de pandas optimizado para ML y analítica."""
    try:
        df = pd.read_sql("SELECT * FROM Solicitudes", engine)
        df["fecha_solicitud"] = pd.to_datetime(df["fecha_solicitud"])
        df["fecha_cierre"] = pd.to_datetime(df["fecha_cierre"])
        df["fecha_limite_sla"] = pd.to_datetime(df["fecha_limite_sla"])
        return df
    except Exception:
        # Respaldo directo desde CSV
        if os.path.exists(CSV_PATH):
            df = pd.read_csv(CSV_PATH)
            df["fecha_solicitud"] = pd.to_datetime(df["fecha_solicitud"])
            df["fecha_cierre"] = pd.to_datetime(df["fecha_cierre"])
            df["fecha_limite_sla"] = pd.to_datetime(df["fecha_limite_sla"])
            return df
        raise RuntimeError("No se pudo cargar el conjunto de datos de solicitudes.")

def get_next_ticket_code():
    """Genera el siguiente código correlativo de ticket en formato TK-YYYY-XXXXX compatible con SQL Server y SQLite."""
    from datetime import datetime
    current_year = datetime.now().year
    try:
        query = (
            "SELECT TOP 100 codigo_ticket FROM Solicitudes ORDER BY codigo_ticket DESC"
            if is_sql_server_active
            else "SELECT codigo_ticket FROM Solicitudes ORDER BY codigo_ticket DESC LIMIT 100"
        )
        with engine.connect() as conn:
            try:
                rows = conn.execute(text(query)).fetchall()
            except Exception:
                # Fallback si el dialecto varía
                rows = conn.execute(text("SELECT codigo_ticket FROM Solicitudes")).fetchall()
                if len(rows) > 100:
                    rows = rows[-100:]

            max_num = 0
            for (code,) in rows:
                if code and str(code).startswith("TK-"):
                    parts = str(code).split("-")
                    if len(parts) >= 3 and parts[2].isdigit():
                        num = int(parts[2])
                        if num > max_num:
                            max_num = num

            next_num = max_num + 1 if max_num > 0 else 4001
            return f"TK-{current_year}-{next_num:05d}"
    except Exception as e:
        print(f"[Aviso] Error en get_next_ticket_code: {e}")
        from datetime import datetime
        return f"TK-{datetime.now().year}-04001"

def get_ticket(codigo_ticket: str):
    """Busca un ticket específico por su código."""
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM Solicitudes WHERE codigo_ticket = :code"),
            {"code": str(codigo_ticket).strip()}
        ).mappings().first()
        if result:
            row = dict(result)
            # Normalizar tipos para JSON
            for k, v in row.items():
                if pd.notnull(v):
                    if hasattr(v, "isoformat"):
                        row[k] = v.isoformat()
                    elif hasattr(v, "item"):
                        row[k] = v.item()
                else:
                    row[k] = None
            return row
        return None

def create_ticket(data: dict):
    """Inserta una nueva solicitud en la base de datos."""
    with engine.begin() as conn:
        columns = list(data.keys())
        placeholders = [f":{col}" for col in columns]
        query = f"INSERT INTO Solicitudes ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
        conn.execute(text(query), data)
    
    # Sincronizar en respaldo CSV si existe
    try:
        if os.path.exists(CSV_PATH):
            df_new = pd.DataFrame([data])
            df_new.to_csv(CSV_PATH, mode='a', header=False, index=False)
    except Exception as e:
        print(f"[Aviso] No se pudo anexar a CSV: {e}")

    return get_ticket(data["codigo_ticket"])

def update_ticket(codigo_ticket: str, data: dict):
    """Actualiza una solicitud existente."""
    clean_code = str(codigo_ticket).strip()
    if not data:
        return get_ticket(clean_code)
    
    with engine.begin() as conn:
        set_clauses = [f"{col} = :{col}" for col in data.keys()]
        query = f"UPDATE Solicitudes SET {', '.join(set_clauses)} WHERE codigo_ticket = :orig_code"
        params = {**data, "orig_code": clean_code}
        conn.execute(text(query), params)
    
    return get_ticket(clean_code)

def delete_ticket(codigo_ticket: str):
    """Elimina una solicitud por su código de ticket."""
    clean_code = str(codigo_ticket).strip()
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM Solicitudes WHERE codigo_ticket = :code"),
            {"code": clean_code}
        )
        return result.rowcount > 0


# ============================================================================
# MÓDULO DE PLANIFICACIÓN SLA (CALENDARIO, GUARDIA Y EVENTOS)
# ============================================================================

def init_sla_planning_table():
    """Crea la tabla PlanificacionSLA si no existe e inserta datos iniciales de demostración."""
    if engine is None:
        return
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        has_table = inspector.has_table("PlanificacionSLA")
        if not has_table:
            with engine.begin() as conn:
                if is_sql_server_active:
                    conn.execute(text("""
                        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PlanificacionSLA' and xtype='U')
                        BEGIN
                            CREATE TABLE PlanificacionSLA (
                                id INT IDENTITY(1,1) PRIMARY KEY,
                                titulo NVARCHAR(255) NOT NULL,
                                tipo NVARCHAR(100) NOT NULL,
                                fecha_inicio NVARCHAR(50) NOT NULL,
                                fecha_fin NVARCHAR(50) NOT NULL,
                                prioridad NVARCHAR(50) DEFAULT 'Media',
                                responsable NVARCHAR(150),
                                estado NVARCHAR(50) DEFAULT 'Programado',
                                meta_sla NVARCHAR(100),
                                descripcion NVARCHAR(MAX),
                                created_at DATETIME DEFAULT GETDATE()
                            );
                        END
                    """))
                else:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS PlanificacionSLA (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            titulo TEXT NOT NULL,
                            tipo TEXT NOT NULL,
                            fecha_inicio TEXT NOT NULL,
                            fecha_fin TEXT NOT NULL,
                            prioridad TEXT DEFAULT 'Media',
                            responsable TEXT,
                            estado TEXT DEFAULT 'Programado',
                            meta_sla TEXT,
                            descripcion TEXT,
                            created_at TEXT DEFAULT CURRENT_TIMESTAMP
                        );
                    """))

        # Verificar si hay registros
        count = 0
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM PlanificacionSLA")).scalar() or 0

        if count == 0:
            from datetime import datetime
            now = datetime.now()
            year = now.year
            month = now.month
            
            # Generar eventos realistas para el mes actual y adyacentes
            seed_events = [
                {
                    "titulo": "Ventana Mantenimiento Preventivo Core DB",
                    "tipo": "Ventana de Mantenimiento",
                    "fecha_inicio": f"{year}-{month:02d}-04 22:00",
                    "fecha_fin": f"{year}-{month:02d}-05 03:00",
                    "prioridad": "Alta",
                    "responsable": "Carlos Ruiz (DBA)",
                    "estado": "Completado",
                    "meta_sla": "99.9% Disponibilidad",
                    "descripcion": "Optimización de índices y depuración de registros temporales para mantener SLA de respuesta."
                },
                {
                    "titulo": "Turno de Guardia N1 - Soporte Crítico",
                    "tipo": "Turno de Soporte",
                    "fecha_inicio": f"{year}-{month:02d}-07 08:00",
                    "fecha_fin": f"{year}-{month:02d}-07 20:00",
                    "prioridad": "Crítica",
                    "responsable": "Diana Morales",
                    "estado": "En Curso",
                    "meta_sla": "< 15 min Primer Contacto",
                    "descripcion": "Cobertura de incidentes críticos y monitoreo de colas de alta prioridad."
                },
                {
                    "titulo": "Revisión Semanal de Cumplimiento de SLAs",
                    "tipo": "Revisión SLA",
                    "fecha_inicio": f"{year}-{month:02d}-10 10:00",
                    "fecha_fin": f"{year}-{month:02d}-10 11:30",
                    "prioridad": "Media",
                    "responsable": "Comité de Operaciones TI",
                    "estado": "Programado",
                    "meta_sla": "> 95% Cumplimiento Global",
                    "descripcion": "Análisis de solicitudes vencidas de la semana anterior y ajustes de asignación de agentes."
                },
                {
                    "titulo": "Despliegue Hotfix Sistema de Facturación",
                    "tipo": "Despliegue",
                    "fecha_inicio": f"{year}-{month:02d}-12 21:00",
                    "fecha_fin": f"{year}-{month:02d}-12 23:00",
                    "prioridad": "Crítica",
                    "responsable": "Equipo DevOps",
                    "estado": "Programado",
                    "meta_sla": "0 Downtime no planificado",
                    "descripcion": "Actualización de microservicio de pagos con ventana de contingencia de 2 horas."
                },
                {
                    "titulo": "Guardia Fin de Semana - Soporte de Infraestructura",
                    "tipo": "Turno de Soporte",
                    "fecha_inicio": f"{year}-{month:02d}-14 09:00",
                    "fecha_fin": f"{year}-{month:02d}-15 21:00",
                    "prioridad": "Alta",
                    "responsable": "Andrés Pineda",
                    "estado": "Programado",
                    "meta_sla": "< 30 min Respuesta",
                    "descripcion": "Atención prioritaria para incidentes de servidores cloud y conectividad VPN."
                },
                {
                    "titulo": "Auditoría Mensual de Calidad y Tiempos de Respuesta",
                    "tipo": "Auditoría",
                    "fecha_inicio": f"{year}-{month:02d}-15 14:00",
                    "fecha_fin": f"{year}-{month:02d}-15 17:00",
                    "prioridad": "Alta",
                    "responsable": "Laura Gómez (Auditora QA)",
                    "estado": "Programado",
                    "meta_sla": "98% Precisión en Diagnóstico",
                    "descripcion": "Revisión aleatoria de solicitudes cerradas para verificación de cumplimiento de tiempos contractuales."
                },
                {
                    "titulo": "Capacitación Técnicos: Reducción de Tiempos SLA",
                    "tipo": "Capacitación",
                    "fecha_inicio": f"{year}-{month:02d}-18 09:00",
                    "fecha_fin": f"{year}-{month:02d}-18 12:00",
                    "prioridad": "Baja",
                    "responsable": "Javier Castro",
                    "estado": "Programado",
                    "meta_sla": "Capacitación 100% Personal",
                    "descripcion": "Taller práctico sobre uso del asistente IA para triage y resolución acelerada de solicitudes."
                },
                {
                    "titulo": "Ventana de Mantenimiento Red Troncal y Firewall",
                    "tipo": "Ventana de Mantenimiento",
                    "fecha_inicio": f"{year}-{month:02d}-21 23:00",
                    "fecha_fin": f"{year}-{month:02d}-22 04:00",
                    "prioridad": "Crítica",
                    "responsable": "Equipo de Redes y Seguridad",
                    "estado": "Programado",
                    "meta_sla": "99.9% Disponibilidad Red",
                    "descripcion": "Actualización de firmware de cortafuegos y switches core del centro de datos."
                },
                {
                    "titulo": "Simulacro de Contingencia y Recuperación SLA",
                    "tipo": "Revisión SLA",
                    "fecha_inicio": f"{year}-{month:02d}-25 15:00",
                    "fecha_fin": f"{year}-{month:02d}-25 18:00",
                    "prioridad": "Alta",
                    "responsable": "Soporte N2 & Infraestructura",
                    "estado": "Programado",
                    "meta_sla": "RTO < 30 min",
                    "descripcion": "Simulación de corte de servicio y validación de tiempos de respuesta bajo SLA de emergencia."
                },
                {
                    "titulo": "Cierre Mensual y Reporte Ejecutivo SLA",
                    "tipo": "Revisión SLA",
                    "fecha_inicio": f"{year}-{month:02d}-28 15:00",
                    "fecha_fin": f"{year}-{month:02d}-28 17:00",
                    "prioridad": "Media",
                    "responsable": "Gerencia de Operaciones TI",
                    "estado": "Programado",
                    "meta_sla": "100% Reportes Entregados",
                    "descripcion": "Consolidación de indicadores de cumplimiento SLA y presentación de resultados a stakeholders."
                }
            ]

            with engine.begin() as conn:
                for ev in seed_events:
                    conn.execute(text("""
                        INSERT INTO PlanificacionSLA (titulo, tipo, fecha_inicio, fecha_fin, prioridad, responsable, estado, meta_sla, descripcion)
                        VALUES (:titulo, :tipo, :fecha_inicio, :fecha_fin, :prioridad, :responsable, :estado, :meta_sla, :descripcion)
                    """), ev)
            print(f"[OK] Tabla PlanificacionSLA inicializada con {len(seed_events)} eventos de demostración.")
    except Exception as e:
        print(f"[Aviso] No se pudo inicializar la tabla PlanificacionSLA: {e}")

def get_sla_events(start_date=None, end_date=None, prioridad=None, tipo=None, estado=None):
    """Consulta la lista de planificaciones de SLA con filtros opcionales."""
    with engine.connect() as conn:
        conditions = []
        params = {}
        if start_date:
            conditions.append("fecha_fin >= :start_date")
            params["start_date"] = str(start_date).strip()
        if end_date:
            conditions.append("fecha_inicio <= :end_date")
            params["end_date"] = str(end_date).strip()
        if prioridad and prioridad != "Todas":
            conditions.append("prioridad = :prioridad")
            params["prioridad"] = str(prioridad).strip()
        if tipo and tipo != "Todos":
            conditions.append("tipo = :tipo")
            params["tipo"] = str(tipo).strip()
        if estado and estado != "Todos":
            conditions.append("estado = :estado")
            params["estado"] = str(estado).strip()

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = f"SELECT * FROM PlanificacionSLA {where_clause} ORDER BY fecha_inicio ASC"
        rows = conn.execute(text(query), params).mappings().all()

        events = []
        for r in rows:
            ev = dict(r)
            for k, v in ev.items():
                if pd.notnull(v):
                    if hasattr(v, "isoformat"):
                        ev[k] = v.isoformat()
                    elif hasattr(v, "item"):
                        ev[k] = v.item()
                else:
                    ev[k] = None
            events.append(ev)
        return events

def get_sla_event(event_id: int):
    """Obtiene una planificación de SLA por su ID."""
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM PlanificacionSLA WHERE id = :id"),
            {"id": int(event_id)}
        ).mappings().first()
        if row:
            ev = dict(row)
            for k, v in ev.items():
                if pd.notnull(v):
                    if hasattr(v, "isoformat"):
                        ev[k] = v.isoformat()
                    elif hasattr(v, "item"):
                        ev[k] = v.item()
                else:
                    ev[k] = None
            return ev
        return None

def create_sla_event(data: dict):
    """Crea una nueva planificación de SLA."""
    with engine.begin() as conn:
        columns = list(data.keys())
        placeholders = [f":{c}" for c in columns]
        query = f"INSERT INTO PlanificacionSLA ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
        conn.execute(text(query), data)
        if is_sql_server_active:
            new_id = conn.execute(text("SELECT SCOPE_IDENTITY()")).scalar()
        else:
            new_id = conn.execute(text("SELECT last_insert_rowid()")).scalar()

    if new_id:
        return get_sla_event(int(new_id))
    with engine.connect() as conn:
        last_id = conn.execute(text("SELECT MAX(id) FROM PlanificacionSLA")).scalar()
        return get_sla_event(int(last_id)) if last_id else data

def update_sla_event(event_id: int, data: dict):
    """Actualiza una planificación de SLA existente."""
    if not data:
        return get_sla_event(event_id)
    with engine.begin() as conn:
        set_clauses = [f"{col} = :{col}" for col in data.keys()]
        query = f"UPDATE PlanificacionSLA SET {', '.join(set_clauses)} WHERE id = :event_id"
        conn.execute(text(query), {**data, "event_id": int(event_id)})
    return get_sla_event(event_id)

def delete_sla_event(event_id: int):
    """Elimina una planificación de SLA por su ID."""
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM PlanificacionSLA WHERE id = :id"),
            {"id": int(event_id)}
        )
        return result.rowcount > 0

# Inicialización automática de la tabla de planificación SLA
try:
    init_sla_planning_table()
except Exception as err:
    print(f"[Aviso] No se pudo inicializar la tabla PlanificacionSLA al cargar database: {err}")




