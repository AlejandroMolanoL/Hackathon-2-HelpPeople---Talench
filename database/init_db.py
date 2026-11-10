"""
Script de Inicialización de Base de Datos para HelpPeople (SQL Server).
Lee dataset_solicitudes.csv y puebla la base de datos SQL Server o genera la estructura necesaria.
"""
import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Cargar variables de entorno desde backend/.env si existe
env_path = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
load_dotenv(env_path)

DB_SERVER = os.getenv("DB_SERVER", "localhost")
DB_NAME = os.getenv("DB_NAME", "HelpPeopleDB")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
DB_TRUSTED = os.getenv("DB_TRUSTED_CONNECTION", "yes")

def get_connection_string(database="master"):
    driver_val = DB_DRIVER.replace(' ', '+')
    extra = "&TrustServerCertificate=yes"
    if DB_USER and DB_PASSWORD:
        return f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/{database}?driver={driver_val}{extra}"
    else:
        return f"mssql+pyodbc://@{DB_SERVER}/{database}?driver={driver_val}&trusted_connection={DB_TRUSTED}{extra}"

def init_database():
    print(f"[*] Intentando conectar a SQL Server en {DB_SERVER}...")
    try:
        master_conn_str = get_connection_string("master")
        engine_master = create_engine(master_conn_str, isolation_level="AUTOCOMMIT")
        with engine_master.connect() as conn:
            # Crear base de datos si no existe
            result = conn.execute(text(f"SELECT database_id FROM sys.databases WHERE name = '{DB_NAME}'"))
            if not result.fetchone():
                print(f"[+] Creando base de datos {DB_NAME}...")
                conn.execute(text(f"CREATE DATABASE [{DB_NAME}]"))
            else:
                print(f"[i] Base de datos {DB_NAME} ya existe.")
        
        # Conectar a HelpPeopleDB
        db_conn_str = get_connection_string(DB_NAME)
        engine_db = create_engine(db_conn_str)
        
        # Ejecutar schema.sql
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        if os.path.exists(schema_path):
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_sql = f.read()
                # Separar por GO
                statements = [s.strip() for s in schema_sql.split("GO") if s.strip()]
                with engine_db.connect() as conn:
                    for stmt in statements:
                        if stmt and not stmt.upper().startswith("USE ") and not stmt.upper().startswith("CREATE DATABASE"):
                            conn.execute(text(stmt))
                            conn.commit()
            print("[+] Esquema y tablas validados.")

        # Poblar desde CSV
        csv_path = os.path.join(os.path.dirname(__file__), "dataset_solicitudes.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            print(f"[*] Insertando {len(df)} registros desde CSV...")
            with engine_db.connect() as conn:
                count = conn.execute(text("SELECT COUNT(*) FROM dbo.Solicitudes")).scalar()
                if count == 0:
                    df.to_sql("Solicitudes", engine_db, if_exists="append", index=False)
                    print(f"[OK] {len(df)} registros insertados con éxito en dbo.Solicitudes.")
                else:
                    print(f"[i] La tabla dbo.Solicitudes ya contiene {count} registros.")

    except Exception as e:
        print(f"[!] Error al inicializar SQL Server: {e}")
        print("[i] Nota: Verifique que el servicio de SQL Server esté en ejecución y los parámetros en backend/.env sean correctos.")

if __name__ == "__main__":
    init_database()

