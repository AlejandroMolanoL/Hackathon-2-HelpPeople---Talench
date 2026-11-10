"""
API Principal de HelpPeople - Predicción y Gestión Inteligente de Solicitudes.
Construida con FastAPI, Scikit-learn y Microsoft SQL Server.
"""
import os
import sys
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from database import (
    get_database_status,
    load_solicitudes_df,
    get_ticket,
    create_ticket,
    update_ticket,
    delete_ticket,
    get_next_ticket_code,
    get_sla_events,
    get_sla_event,
    create_sla_event,
    update_sla_event,
    delete_sla_event
)
from models import (
    PredictRequest,
    PredictResponse,
    RecommendationsResponse,
    HistoricalDataResponse,
    AnalyticsStatisticsResponse,
    TicketCreate,
    TicketUpdate,
    TicketSample,
    AgentPerformance,
    SlaEvent,
    SlaEventCreate,
    SlaEventUpdate
)
from ml_service import ml_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Entrenar modelos de IA al iniciar la aplicación
    print("[*] Inicializando modelos de Machine Learning...")
    try:
        ml_service.train_models()
        print("[OK] Servicio de ML listo para servir predicciones.")
    except Exception as e:
        print(f"[!] Error al entrenar modelos en startup: {e}")
    yield

app = FastAPI(
    title="HelpPeople AI Analytics API",
    description="API de predicción, visualización histórica y recomendaciones estratégicas para HelpPeople",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración de CORS para permitir peticiones desde React / Vite (localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "sistema": "HelpPeople AI Predictive Platform",
        "version": "1.0.0",
        "status": "Activo",
        "database": get_database_status()["server"],
        "docs": "/docs"
    }

@app.get("/db-status")
def db_status():
    """Retorna el estado de la conexión a la base de datos (SQL Server o fallback)."""
    return get_database_status()

@app.get("/filter-options")
def get_filter_options():
    """Retorna las listas de prioridades, categorías y canales disponibles para los selectores del frontend."""
    df = load_solicitudes_df()
    return {
        "prioridades": ["Todas"] + sorted(df["prioridad"].dropna().unique().tolist()),
        "categorias": ["Todas"] + sorted(df["categoria"].dropna().unique().tolist()),
        "estados": sorted(df["estado"].dropna().unique().tolist()),
        "departamentos": sorted(df["departamento_solicitante"].dropna().unique().tolist()),
        "fecha_minima": str(df["fecha_solicitud"].min().strftime("%Y-%m-%d")),
        "fecha_maxima": str(df["fecha_solicitud"].max().strftime("%Y-%m-%d")),
        "total_registros": len(df),
        "siguiente_codigo_ticket": get_next_ticket_code()
    }

@app.get("/next-ticket-code")
def get_next_code():
    """Retorna el código de ticket correlativo sugerido para nuevas solicitudes."""
    return {"next_ticket_code": get_next_ticket_code()}

def _clean_param(v, default=None):
    if v is None:
        return default
    # Si fue invocado directamente en pruebas y es objeto Query
    if hasattr(v, "default"):
        v = v.default
    if v is None:
        return default
    s = str(v).strip()
    return s if s else default

def calcular_rendimiento_agentes(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Función analítica para medir el rendimiento de los agentes técnicos:
    - Cantidad de tickets resueltos y total de tickets asignados.
    - Tiempo de respuesta / resolución promedio en horas.
    - Cumplimiento de SLA y nivel de satisfacción del usuario.
    - Puntuación ponderada de desempeño y clasificación de nivel.
    """
    if df.empty or "agente_asignado" not in df.columns:
        return []

    agentes_metricas = []
    tiempos_globales = df["tiempo_resolucion_horas"].dropna()
    tiempo_prom_global = float(tiempos_globales.mean()) if len(tiempos_globales) > 0 else 35.0

    for agente, group in df.groupby("agente_asignado"):
        nombre_agente = str(agente).strip()
        if not nombre_agente or nombre_agente.lower() in ["", "sin asignar", "nan", "none"]:
            continue

        total = len(group)
        resueltos = int((group["estado"] == "Cerrada").sum())
        en_curso = int(group["estado"].isin(["Abierta", "En Proceso"]).sum())
        vencidos = int(((group["estado"] == "Vencida") | (group["sla_cumplido"] == 0)).sum())

        tasa_resolucion = float(round((resueltos / total) * 100, 2)) if total > 0 else 0.0

        tiempos_validos = group["tiempo_resolucion_horas"].dropna()
        tiempo_promedio = float(round(float(tiempos_validos.mean()), 2)) if len(tiempos_validos) > 0 else 0.0

        sla_pct = float(round(float((group["sla_cumplido"] == 1).mean() * 100), 2)) if total > 0 else 0.0
        
        sat_valid = group["satisfaccion_cliente"].dropna()
        sat_prom = float(round(float(sat_valid.mean()), 2)) if len(sat_valid) > 0 else 0.0

        # Puntuación de rendimiento global (0 a 100) ponderada:
        # - 35% tasa de resolución
        # - 35% cumplimiento SLA
        # - 20% eficiencia de tiempo de respuesta
        # - 10% satisfacción del cliente
        eficiencia_tiempo = max(0.0, min(100.0, (1.5 - (tiempo_promedio / (tiempo_prom_global * 1.5))) * 100)) if tiempo_prom_global > 0 else 75.0
        sat_score = (sat_prom / 5.0) * 100 if sat_prom > 0 else 70.0
        
        score = round((tasa_resolucion * 0.35) + (sla_pct * 0.35) + (eficiencia_tiempo * 0.20) + (sat_score * 0.10), 1)
        score = float(max(0.0, min(100.0, score)))

        if score >= 85:
            nivel = "Excelente"
        elif score >= 75:
            nivel = "Óptimo"
        elif score >= 60:
            nivel = "Aceptable"
        else:
            nivel = "Requiere Atención"

        agentes_metricas.append({
            "agente": nombre_agente,
            "total_asignados": total,
            "tickets_resueltos": resueltos,
            "tickets_en_curso": en_curso,
            "tickets_vencidos": vencidos,
            "tasa_resolucion_pct": tasa_resolucion,
            "tiempo_respuesta_promedio_horas": tiempo_promedio,
            "sla_cumplimiento_pct": sla_pct,
            "satisfaccion_promedio": sat_prom,
            "score_rendimiento": score,
            "nivel_rendimiento": nivel
        })

    # Ordenar por mayor cantidad de tickets resueltos y menor tiempo de respuesta
    agentes_metricas.sort(key=lambda x: (x["tickets_resueltos"], -x["tiempo_respuesta_promedio_horas"]), reverse=True)
    return agentes_metricas

def calcular_estadisticas_analytics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calcula el conjunto completo de estadísticas analíticas y descriptivas de las solicitudes:
    - Distribución diaria (Lunes a Domingo) con volúmenes reales, SLA y día pico.
    - Momentos estadísticos de tiempos de resolución (media, mediana, std, percentiles P25, P75, P90, P95).
    - Desglose por canal de origen con ratios de eficiencia y satisfacción CSAT.
    - Métricas por departamento solicitante con cuellos de botella identificados.
    - Resumen ejecutivo estadístico generado automáticamente.
    """
    if df.empty:
        return {
            "total_analizadas": 0,
            "solicitudes_cumplidas": 0,
            "solicitudes_vencidas": 0,
            "tasa_cumplimiento_pct": 0.0,
            "tasa_vencimiento_pct": 0.0,
            "resolucion_rapida_menor_4h_pct": 0.0,
            "dias_semana": [],
            "tiempos_resolucion": {
                "media_horas": 0.0,
                "mediana_horas": 0.0,
                "desviacion_estandar_horas": 0.0,
                "minimo_horas": 0.0,
                "maximo_horas": 0.0,
                "p25_horas": 0.0,
                "p75_horas": 0.0,
                "p90_horas": 0.0,
                "p95_horas": 0.0,
                "rango_intercuartil_iqr": 0.0
            },
            "canales": [],
            "departamentos": [],
            "resumen_ejecutivo": "No se encontraron registros para generar estadísticas con los filtros seleccionados."
        }

    total_solicitudes = len(df)
    vencidas_mask = (df["estado"] == "Vencida") | (df["sla_cumplido"] == 0)
    vencidas_count = int(vencidas_mask.sum())
    cumplidas_count = total_solicitudes - vencidas_count
    tasa_vencimiento = float(round((vencidas_count / total_solicitudes) * 100, 2))
    tasa_cumplimiento = float(round((cumplidas_count / total_solicitudes) * 100, 2))

    # 1. Distribución real por día de la semana (Lunes=0 a Domingo=6)
    dias_nombres_es = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    dias_abreviados = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    dias_single = ["L", "M", "X", "J", "V", "S", "D"]

    df_dias = df.copy()
    df_dias["dia_num"] = df_dias["fecha_solicitud"].dt.dayofweek

    max_dia_vol = 0
    for day_idx in range(7):
        sub_d = df_dias[df_dias["dia_num"] == day_idx]
        count_d = len(sub_d)
        if count_d > max_dia_vol:
            max_dia_vol = count_d

    dias_stats = []
    for day_idx in range(7):
        sub_d = df_dias[df_dias["dia_num"] == day_idx]
        count_d = len(sub_d)
        vencidas_d = int(((sub_d["estado"] == "Vencida") | (sub_d["sla_cumplido"] == 0)).sum())
        resueltas_d = int((sub_d["estado"] == "Cerrada").sum())
        sla_pct_d = float(round((1 - (vencidas_d / count_d)) * 100, 1)) if count_d > 0 else 0.0
        tiempos_d = sub_d["tiempo_resolucion_horas"].dropna()
        tiempo_prom_d = float(round(float(tiempos_d.mean()), 1)) if len(tiempos_d) > 0 else 0.0
        height_pct = int(round((count_d / max_dia_vol) * 100)) if max_dia_vol > 0 else 20

        dias_stats.append({
            "dia_idx": day_idx,
            "nombre": dias_nombres_es[day_idx],
            "abreviado": dias_abreviados[day_idx],
            "letra": dias_single[day_idx],
            "day": dias_abreviados[day_idx],
            "total": count_d,
            "resueltas": resueltas_d,
            "vencidas": vencidas_d,
            "sla_cumplimiento_pct": sla_pct_d,
            "tiempo_promedio_horas": tiempo_prom_d,
            "height": f"{max(height_pct, 15)}%",
            "highlighted": (count_d == max_dia_vol and count_d > 0),
            "es_dia_pico": (count_d == max_dia_vol and count_d > 0)
        })

    # 2. Estadísticas descriptivas de tiempos de resolución
    tiempos = df["tiempo_resolucion_horas"].dropna()
    if len(tiempos) > 0:
        media_t = float(round(float(tiempos.mean()), 2))
        mediana_t = float(round(float(tiempos.median()), 2))
        std_t = float(round(float(tiempos.std()), 2)) if len(tiempos) > 1 else 0.0
        min_t = float(round(float(tiempos.min()), 2))
        max_t = float(round(float(tiempos.max()), 2))
        p25_t = float(round(float(tiempos.quantile(0.25)), 2))
        p75_t = float(round(float(tiempos.quantile(0.75)), 2))
        p90_t = float(round(float(tiempos.quantile(0.90)), 2))
        p95_t = float(round(float(tiempos.quantile(0.95)), 2))
        iqr_t = float(round(p75_t - p25_t, 2))
    else:
        media_t = mediana_t = std_t = min_t = max_t = p25_t = p75_t = p90_t = p95_t = iqr_t = 0.0

    tiempos_stats = {
        "media_horas": media_t,
        "mediana_horas": mediana_t,
        "desviacion_estandar_horas": std_t,
        "minimo_horas": min_t,
        "maximo_horas": max_t,
        "p25_horas": p25_t,
        "p75_horas": p75_t,
        "p90_horas": p90_t,
        "p95_horas": p95_t,
        "rango_intercuartil_iqr": iqr_t
    }

    # 3. Canales de soporte y origen
    canales_stats = []
    if "canal_origen" in df.columns:
        for canal, grp in df.groupby("canal_origen"):
            tot_c = len(grp)
            venc_c = int(((grp["estado"] == "Vencida") | (grp["sla_cumplido"] == 0)).sum())
            sla_c = float(round((1 - (venc_c / tot_c)) * 100, 1)) if tot_c > 0 else 0.0
            t_c = grp["tiempo_resolucion_horas"].dropna()
            prom_tc = float(round(float(t_c.mean()), 1)) if len(t_c) > 0 else 0.0
            sat_c = grp["satisfaccion_cliente"].dropna()
            sat_prom = float(round(float(sat_c.mean()), 2)) if len(sat_c) > 0 else 0.0

            canales_stats.append({
                "canal": str(canal),
                "total": tot_c,
                "porcentaje_volumen": float(round((tot_c / total_solicitudes) * 100, 1)),
                "sla_cumplimiento_pct": sla_c,
                "tiempo_promedio_horas": prom_tc,
                "satisfaccion_promedio": sat_prom
            })
        canales_stats.sort(key=lambda x: x["total"], reverse=True)

    # 4. Departamentos solicitantes
    deptos_stats = []
    if "departamento_solicitante" in df.columns:
        for depto, grp in df.groupby("departamento_solicitante"):
            tot_d = len(grp)
            venc_d = int(((grp["estado"] == "Vencida") | (grp["sla_cumplido"] == 0)).sum())
            sla_d = float(round((1 - (venc_d / tot_d)) * 100, 1)) if tot_d > 0 else 0.0
            t_d = grp["tiempo_resolucion_horas"].dropna()
            prom_td = float(round(float(t_d.mean()), 1)) if len(t_d) > 0 else 0.0

            deptos_stats.append({
                "departamento": str(depto),
                "total": tot_d,
                "porcentaje_volumen": float(round((tot_d / total_solicitudes) * 100, 1)),
                "solicitudes_vencidas": venc_d,
                "sla_cumplimiento_pct": sla_d,
                "tiempo_promedio_horas": prom_td
            })
        deptos_stats.sort(key=lambda x: x["total"], reverse=True)

    # 5. Efectividad de resolución rápida (<4 horas)
    resolucion_rapida_count = int((df["tiempo_resolucion_horas"] <= 4.0).sum())
    resolucion_rapida_pct = float(round((resolucion_rapida_count / total_solicitudes) * 100, 1)) if total_solicitudes > 0 else 0.0

    dia_pico_nombre = next((d["nombre"] for d in dias_stats if d.get("es_dia_pico")), "Martes")
    canal_mas_eficiente = min(canales_stats, key=lambda x: x["tiempo_promedio_horas"])["canal"] if canales_stats else "Chatbot HelpPeople"

    resumen = (
        f"Se procesaron {total_solicitudes:,} solicitudes históricas. "
        f"El índice general de cumplimiento SLA alcanza el {tasa_cumplimiento}%, con una mediana de resolución de {mediana_t} hrs "
        f"(promedio: {media_t} hrs, P95 crítico: {p95_t} hrs). "
        f"El día con mayor carga de solicitudes es el {dia_pico_nombre}, y el canal con menor tiempo de respuesta es '{canal_mas_eficiente}'."
    )

    return {
        "total_analizadas": total_solicitudes,
        "solicitudes_cumplidas": cumplidas_count,
        "solicitudes_vencidas": vencidas_count,
        "tasa_cumplimiento_pct": tasa_cumplimiento,
        "tasa_vencimiento_pct": tasa_vencimiento,
        "resolucion_rapida_menor_4h_pct": resolucion_rapida_pct,
        "dias_semana": dias_stats,
        "tiempos_resolucion": tiempos_stats,
        "canales": canales_stats,
        "departamentos": deptos_stats,
        "resumen_ejecutivo": resumen
    }

@app.get("/historical-data", response_model=HistoricalDataResponse)
def get_historical_data(
    start_date: Optional[str] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    prioridad: Optional[str] = Query("Todas", description="Filtrar por prioridad"),
    categoria: Optional[str] = Query("Todas", description="Filtrar por categoría"),
    limit: int = Query(200, ge=1, le=1000, description="Cantidad máxima de tickets a retornar")
):
    """
    Retorna los datos históricos procesados, métricas analíticas agregadas
    y una muestra de tickets filtrada dinámicamente.
    """
    df = load_solicitudes_df()
    
    start_date = _clean_param(start_date)
    end_date = _clean_param(end_date)
    prioridad = _clean_param(prioridad, "Todas")
    categoria = _clean_param(categoria, "Todas")
    
    try:
        limit_val = int(_clean_param(limit, 200))
    except Exception:
        limit_val = 200

    # Aplicar filtros
    if start_date:
        try:
            dt_start = pd.to_datetime(start_date)
            df = df[df["fecha_solicitud"] >= dt_start]
        except Exception:
            pass
    if end_date:
        try:
            dt_end = pd.to_datetime(end_date)
            df = df[df["fecha_solicitud"] <= dt_end + pd.Timedelta(days=1)]
        except Exception:
            pass
    if prioridad and prioridad != "Todas":
        df = df[df["prioridad"] == prioridad]
    if categoria and categoria != "Todas":
        df = df[df["categoria"] == categoria]

    if len(df) == 0:
        empty_stats = calcular_estadisticas_analytics(df)
        return {
            "kpis_generales": {
                "total_solicitudes": 0,
                "solicitudes_vencidas": 0,
                "tasa_vencimiento_pct": 0.0,
                "tiempo_promedio_horas": 0.0,
                "sla_cumplimiento_pct": 0.0,
                "satisfaccion_promedio": 0.0
            },
            "tendencia_mensual": [],
            "distribucion_estado": {},
            "distribucion_prioridad": {},
            "distribucion_categoria": {},
            "tiempos_promedio_por_prioridad": {"Crítica": 0.0, "Alta": 0.0, "Media": 0.0, "Baja": 0.0},
            "tasa_vencimiento_por_prioridad": {"Crítica": 0.0, "Alta": 0.0, "Media": 0.0, "Baja": 0.0},
            "ultimas_solicitudes": [],
            "rendimiento_agentes": [],
            "estadisticas_detalladas": empty_stats,
            "distribucion_dia_semana": empty_stats["dias_semana"],
            "distribucion_canal": empty_stats["canales"],
            "distribucion_departamento": empty_stats["departamentos"],
            "estadisticas_tiempos": empty_stats["tiempos_resolucion"]
        }

    # KPIs Generales
    total_solicitudes = len(df)
    vencidas_count = int(((df["estado"] == "Vencida") | (df["sla_cumplido"] == 0)).sum())
    tasa_vencimiento = float(round((vencidas_count / total_solicitudes) * 100, 2))
    tiempo_promedio = float(round(df["tiempo_resolucion_horas"].dropna().mean(), 2))
    sla_pct = float(round((df["sla_cumplido"] == 1).mean() * 100, 2))
    satisfaccion_prom = float(round(df["satisfaccion_cliente"].dropna().mean(), 2))

    kpis = {
        "total_solicitudes": total_solicitudes,
        "solicitudes_vencidas": vencidas_count,
        "tasa_vencimiento_pct": tasa_vencimiento,
        "tiempo_promedio_horas": tiempo_promedio,
        "sla_cumplimiento_pct": sla_pct,
        "satisfaccion_promedio": satisfaccion_prom
    }

    # Agrupación por mes para el gráfico de tendencia temporal
    df_copy = df.copy()
    df_copy["periodo"] = df_copy["fecha_solicitud"].dt.to_period("M").astype(str)
    
    monthly_group = df_copy.groupby("periodo").agg(
        total=("codigo_ticket", "count"),
        cerradas=("estado", lambda x: int((x == "Cerrada").sum())),
        vencidas=("estado", lambda x: int((x == "Vencida").sum())),
        abiertas=("estado", lambda x: int((x.isin(["Abierta", "En Proceso"])).sum())),
        tiempo_prom=("tiempo_resolucion_horas", lambda x: float(round(x.mean(), 2)) if len(x.dropna()) > 0 else 0.0)
    ).reset_index().sort_values("periodo")

    tendencia_mensual = monthly_group.to_dict(orient="records")

    # Distribuciones categóricas
    dist_estado = {k: int(v) for k, v in df["estado"].value_counts().to_dict().items()}
    dist_prioridad = {k: int(v) for k, v in df["prioridad"].value_counts().to_dict().items()}
    dist_categoria = {k: int(v) for k, v in df["categoria"].value_counts().to_dict().items()}

    # Tiempos y tasas por prioridad
    tiempos_prioridad = {}
    tasas_prioridad = {}
    for p in ["Crítica", "Alta", "Media", "Baja"]:
        sub = df[df["prioridad"] == p]
        if len(sub) > 0:
            tiempos_prioridad[p] = float(round(sub["tiempo_resolucion_horas"].dropna().mean(), 2))
            tasas_prioridad[p] = float(round(((sub["estado"] == "Vencida") | (sub["sla_cumplido"] == 0)).mean() * 100, 2))
        else:
            tiempos_prioridad[p] = 0.0
            tasas_prioridad[p] = 0.0

    # Muestra de solicitudes para la tabla
    sample_df = df.sort_values("fecha_solicitud", ascending=False).head(limit_val)
    sample_list = []
    for _, row in sample_df.iterrows():
        sample_list.append({
            "codigo_ticket": str(row["codigo_ticket"]),
            "fecha_solicitud": str(row["fecha_solicitud"]),
            "estado": str(row["estado"]),
            "prioridad": str(row["prioridad"]),
            "categoria": str(row["categoria"]),
            "tiempo_resolucion_horas": float(row["tiempo_resolucion_horas"]) if pd.notnull(row["tiempo_resolucion_horas"]) else None,
            "sla_cumplido": int(row["sla_cumplido"]),
            "departamento_solicitante": str(row["departamento_solicitante"]),
            "agente_asignado": str(row["agente_asignado"]),
            "satisfaccion_cliente": float(row["satisfaccion_cliente"]) if pd.notnull(row["satisfaccion_cliente"]) else None,
            "canal_origen": str(row["canal_origen"])
        })

    stats = calcular_estadisticas_analytics(df)

    return {
        "kpis_generales": kpis,
        "tendencia_mensual": tendencia_mensual,
        "distribucion_estado": dist_estado,
        "distribucion_prioridad": dist_prioridad,
        "distribucion_categoria": dist_categoria,
        "tiempos_promedio_por_prioridad": tiempos_prioridad,
        "tasa_vencimiento_por_prioridad": tasas_prioridad,
        "ultimas_solicitudes": sample_list,
        "rendimiento_agentes": calcular_rendimiento_agentes(df),
        "estadisticas_detalladas": stats,
        "distribucion_dia_semana": stats["dias_semana"],
        "distribucion_canal": stats["canales"],
        "distribucion_departamento": stats["departamentos"],
        "estadisticas_tiempos": stats["tiempos_resolucion"]
    }

@app.get("/analytics/statistics", response_model=AnalyticsStatisticsResponse)
def get_analytics_statistics(
    start_date: Optional[str] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    prioridad: Optional[str] = Query("Todas", description="Filtrar por prioridad"),
    categoria: Optional[str] = Query("Todas", description="Filtrar por categoría")
):
    """
    Genera el reporte y conjunto de estadísticas para el módulo de Analytics de HelpPeople:
    - Distribución de volumen y SLA por día de la semana con identificación de día pico.
    - Momentos estadísticos y percentiles de tiempos de resolución (P25, P50, P75, P90, P95).
    - Desglose estadístico por canal de origen (Chatbot, Web, Teléfono, Correo).
    - Estadísticas por departamento solicitante.
    - Resumen analítico generado en tiempo real.
    """
    df = load_solicitudes_df()

    start_date = _clean_param(start_date)
    end_date = _clean_param(end_date)
    prioridad = _clean_param(prioridad, "Todas")
    categoria = _clean_param(categoria, "Todas")

    if start_date:
        try:
            df = df[df["fecha_solicitud"] >= pd.to_datetime(start_date)]
        except Exception:
            pass
    if end_date:
        try:
            df = df[df["fecha_solicitud"] <= pd.to_datetime(end_date) + pd.Timedelta(days=1)]
        except Exception:
            pass
    if prioridad and prioridad != "Todas":
        df = df[df["prioridad"] == prioridad]
    if categoria and categoria != "Todas":
        df = df[df["categoria"] == categoria]

    return calcular_estadisticas_analytics(df)

@app.get("/agents-performance", response_model=List[AgentPerformance])
def get_agents_performance(
    start_date: Optional[str] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    prioridad: Optional[str] = Query("Todas", description="Filtrar por prioridad"),
    categoria: Optional[str] = Query("Todas", description="Filtrar por categoría")
):
    """
    Retorna la evaluación de rendimiento de los agentes técnicos basada en:
    - Cantidad de tickets resueltos vs asignados.
    - Tiempo de respuesta / resolución promedio en horas.
    - Cumplimiento de SLA y satisfacción del cliente.
    - Puntuación integral de desempeño.
    """
    df = load_solicitudes_df()

    start_date = _clean_param(start_date)
    end_date = _clean_param(end_date)
    prioridad = _clean_param(prioridad, "Todas")
    categoria = _clean_param(categoria, "Todas")

    if start_date:
        try:
            df = df[df["fecha_solicitud"] >= pd.to_datetime(start_date)]
        except Exception:
            pass
    if end_date:
        try:
            df = df[df["fecha_solicitud"] <= pd.to_datetime(end_date) + pd.Timedelta(days=1)]
        except Exception:
            pass
    if prioridad and prioridad != "Todas":
        df = df[df["prioridad"] == prioridad]
    if categoria and categoria != "Todas":
        df = df[df["categoria"] == categoria]

    return calcular_rendimiento_agentes(df)

@app.post("/predict", response_model=PredictResponse)
def post_predict(params: PredictRequest):
    """
    Genera predicciones en tiempo real utilizando el modelo de Machine Learning (Random Forest & Regresión Lineal):
    - Volumen futuro desglosado (abiertas, cerradas, vencidas).
    - Porcentaje de solicitudes vencidas proyectado.
    - Tiempo promedio estimado de resolución.
    - Probabilidad de vencimiento por prioridad.
    """
    try:
        resultado = ml_service.predict(
            months_ahead=params.months_ahead,
            prioridad=params.prioridad or "Todas",
            categoria=params.categoria or "Todas"
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar predicciones: {str(e)}")

@app.get("/recommendations", response_model=RecommendationsResponse)
def get_recommendations():
    """
    Genera recomendaciones estratégicas y operativas automáticas basadas en el análisis
    de los datos históricos y las proyecciones de Machine Learning.
    """
    try:
        return ml_service.generate_recommendations()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar recomendaciones: {str(e)}")

# =========================================================================
# ENDPOINTS CRUD DE SOLICITUDES / TICKETS
# =========================================================================

@app.get("/tickets/{codigo_ticket}")
def get_single_ticket(codigo_ticket: str):
    """Obtiene los detalles de un ticket específico."""
    ticket = get_ticket(codigo_ticket)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket '{codigo_ticket}' no encontrado.")
    return ticket

@app.post("/tickets")
def post_create_ticket(ticket: TicketCreate):
    """Crea una nueva solicitud en el sistema y reentrena los modelos predictivos."""
    from datetime import datetime, timedelta

    # Autogenerar código automáticamente de forma correlativa
    codigo = ticket.codigo_ticket.strip() if ticket.codigo_ticket else ""
    if not codigo:
        codigo = get_next_ticket_code()
    elif get_ticket(codigo):
        # Si ya existe el código especificado, asignar automáticamente el siguiente correlativo libre
        codigo = get_next_ticket_code()

    now = datetime.now()
    if ticket.fecha_solicitud:
        try:
            dt_sol = datetime.fromisoformat(ticket.fecha_solicitud.replace("Z", "").strip())
        except Exception:
            try:
                dt_sol = datetime.strptime(ticket.fecha_solicitud.strip(), "%Y-%m-%d %H:%M:%S")
            except Exception:
                dt_sol = now
    else:
        dt_sol = now
    fecha_solicitud = dt_sol.strftime("%Y-%m-%d %H:%M:%S")

    # Calcular fecha límite de SLA según prioridad si no se especificó
    if ticket.fecha_limite_sla:
        try:
            dt_sla = datetime.fromisoformat(ticket.fecha_limite_sla.replace("Z", "").strip())
            fecha_limite_sla = dt_sla.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            sla_hours = {"Crítica": 8, "Alta": 24, "Media": 48, "Baja": 72}.get(ticket.prioridad, 48)
            fecha_limite_sla = (dt_sol + timedelta(hours=sla_hours)).strftime("%Y-%m-%d %H:%M:%S")
    else:
        sla_hours = {"Crítica": 8, "Alta": 24, "Media": 48, "Baja": 72}.get(ticket.prioridad, 48)
        fecha_limite_sla = (dt_sol + timedelta(hours=sla_hours)).strftime("%Y-%m-%d %H:%M:%S")

    estado = ticket.estado or "Abierta"
    fecha_cierre = ticket.fecha_cierre
    tiempo_resolucion = ticket.tiempo_resolucion_horas
    sla_cumplido = ticket.sla_cumplido if ticket.sla_cumplido is not None else 1

    if estado in ["Cerrada", "Vencida"]:
        if not fecha_cierre:
            fecha_cierre = now.strftime("%Y-%m-%d %H:%M:%S")
        else:
            try:
                dt_cie = datetime.fromisoformat(fecha_cierre.replace("Z", "").strip())
                fecha_cierre = dt_cie.strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                fecha_cierre = now.strftime("%Y-%m-%d %H:%M:%S")

        if tiempo_resolucion is None:
            try:
                dt_cie = datetime.strptime(fecha_cierre, "%Y-%m-%d %H:%M:%S")
                delta_h = max(round((dt_cie - dt_sol).total_seconds() / 3600, 2), 0.1)
                tiempo_resolucion = delta_h
            except Exception:
                tiempo_resolucion = 12.0
        if estado == "Vencida":
            sla_cumplido = 0
    else:
        fecha_cierre = None
        tiempo_resolucion = None

    record = {
        "codigo_ticket": codigo,
        "fecha_solicitud": fecha_solicitud,
        "fecha_cierre": fecha_cierre,
        "fecha_limite_sla": fecha_limite_sla,
        "estado": estado,
        "prioridad": ticket.prioridad or "Media",
        "categoria": ticket.categoria or "Software",
        "tiempo_resolucion_horas": tiempo_resolucion,
        "departamento_solicitante": ticket.departamento_solicitante or "Soporte General",
        "agente_asignado": ticket.agente_asignado or "Sin Asignar",
        "sla_cumplido": int(sla_cumplido),
        "satisfaccion_cliente": ticket.satisfaccion_cliente,
        "canal_origen": ticket.canal_origen or "Portal Web"
    }

    try:
        created = create_ticket(record)
        # Actualizar modelos predictivos y analítica
        try:
            ml_service.train_models()
        except Exception as err:
            print(f"[Aviso] No se pudieron reentrenar modelos: {err}")
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear el ticket: {str(e)}")

@app.put("/tickets/{codigo_ticket}")
def put_update_ticket(codigo_ticket: str, update_data: TicketUpdate):
    """Actualiza una solicitud existente y sincroniza las métricas."""
    from datetime import datetime

    existing = get_ticket(codigo_ticket)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Ticket '{codigo_ticket}' no encontrado.")

    data_dict = update_data.model_dump(exclude_unset=True)
    if not data_dict:
        return existing

    nuevo_estado = data_dict.get("estado", existing.get("estado"))
    if nuevo_estado in ["Cerrada", "Vencida"]:
        if "fecha_cierre" not in data_dict or not data_dict["fecha_cierre"]:
            if not existing.get("fecha_cierre"):
                data_dict["fecha_cierre"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if nuevo_estado == "Vencida" and "sla_cumplido" not in data_dict:
            data_dict["sla_cumplido"] = 0
    elif nuevo_estado in ["Abierta", "En Proceso"]:
        data_dict["fecha_cierre"] = None
        data_dict["tiempo_resolucion_horas"] = None

    try:
        updated = update_ticket(codigo_ticket, data_dict)
        try:
            ml_service.train_models()
        except Exception as err:
            print(f"[Aviso] No se pudieron reentrenar modelos: {err}")
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el ticket: {str(e)}")

@app.delete("/tickets/{codigo_ticket}")
def delete_single_ticket(codigo_ticket: str):
    """Elimina una solicitud y actualiza los indicadores."""
    existing = get_ticket(codigo_ticket)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Ticket '{codigo_ticket}' no encontrado.")

    try:
        deleted = delete_ticket(codigo_ticket)
        if not deleted:
            raise HTTPException(status_code=500, detail="No se pudo eliminar el ticket en base de datos.")
        
        try:
            ml_service.train_models()
        except Exception as err:
            print(f"[Aviso] No se pudieron reentrenar modelos: {err}")

        return {
            "success": True,
            "message": f"Solicitud '{codigo_ticket}' eliminada con éxito.",
            "codigo_ticket": codigo_ticket
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar ticket: {str(e)}")

# ============================================================================
# ENDPOINTS DE PLANIFICACIÓN SLA Y CALENDARIO
# ============================================================================

@app.get("/sla-planning", response_model=List[SlaEvent])
def list_sla_planning_events(
    start_date: Optional[str] = Query(None, description="Fecha mínima (YYYY-MM-DD o ISO)"),
    end_date: Optional[str] = Query(None, description="Fecha máxima (YYYY-MM-DD o ISO)"),
    prioridad: Optional[str] = Query(None, description="Filtrar por prioridad"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de planificación"),
    estado: Optional[str] = Query(None, description="Filtrar por estado")
):
    """Retorna las planificaciones y eventos de SLA programados en el calendario."""
    start_date = _clean_param(start_date)
    end_date = _clean_param(end_date)
    prioridad = _clean_param(prioridad)
    tipo = _clean_param(tipo)
    estado = _clean_param(estado)

    events = get_sla_events(
        start_date=start_date,
        end_date=end_date,
        prioridad=prioridad,
        tipo=tipo,
        estado=estado
    )
    return events

@app.get("/sla-planning/ticket-deadlines")
def get_sla_ticket_deadlines(
    start_date: Optional[str] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Retorna solicitudes activas con sus fechas límites de SLA
    para ser visualizadas como hitos de vencimiento en el calendario.
    """
    try:
        df = load_solicitudes_df()
        df_deadlines = df.dropna(subset=["fecha_limite_sla"]).copy()
        
        start_date = _clean_param(start_date)
        end_date = _clean_param(end_date)
        if start_date:
            try:
                dt_s = pd.to_datetime(start_date)
                df_deadlines = df_deadlines[df_deadlines["fecha_limite_sla"] >= dt_s]
            except Exception:
                pass
        if end_date:
            try:
                dt_e = pd.to_datetime(end_date)
                df_deadlines = df_deadlines[df_deadlines["fecha_limite_sla"] <= dt_e + pd.Timedelta(days=1)]
            except Exception:
                pass

        df_sample = df_deadlines.head(limit)
        deadlines = []
        for _, row in df_sample.iterrows():
            deadlines.append({
                "codigo_ticket": str(row.get("codigo_ticket", "")),
                "fecha_limite_sla": str(row.get("fecha_limite_sla", "")),
                "estado": str(row.get("estado", "")),
                "prioridad": str(row.get("prioridad", "")),
                "categoria": str(row.get("categoria", "")),
                "agente_asignado": str(row.get("agente_asignado", "")),
                "departamento_solicitante": str(row.get("departamento_solicitante", ""))
            })
        return deadlines
    except Exception as e:
        print(f"[Aviso] Error al obtener ticket deadlines: {e}")
        return []

@app.get("/sla-planning/{event_id}", response_model=SlaEvent)
def get_single_sla_event(event_id: int):
    """Retorna los detalles de un evento de planificación SLA específico."""
    ev = get_sla_event(event_id)
    if not ev:
        raise HTTPException(status_code=404, detail=f"Planificación SLA con ID {event_id} no encontrada.")
    return ev

@app.post("/sla-planning", response_model=SlaEvent)
def post_create_sla_event(event: SlaEventCreate):
    """Crea una nueva planificación de SLA."""
    try:
        data = event.model_dump()
        created = create_sla_event(data)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear planificación SLA: {str(e)}")

@app.put("/sla-planning/{event_id}", response_model=SlaEvent)
def put_update_sla_event(event_id: int, event_update: SlaEventUpdate):
    """Actualiza una planificación de SLA existente."""
    existing = get_sla_event(event_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Planificación SLA con ID {event_id} no encontrada.")

    data = event_update.model_dump(exclude_unset=True)
    try:
        updated = update_sla_event(event_id, data)
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar planificación SLA: {str(e)}")

@app.delete("/sla-planning/{event_id}")
def delete_single_sla_event(event_id: int):
    """Elimina una planificación de SLA por su ID."""
    existing = get_sla_event(event_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Planificación SLA con ID {event_id} no encontrada.")

    try:
        deleted = delete_sla_event(event_id)
        if not deleted:
            raise HTTPException(status_code=500, detail="No se pudo eliminar la planificación SLA.")
        return {
            "success": True,
            "message": f"Planificación '{existing.get('titulo')}' eliminada con éxito.",
            "id": event_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar planificación SLA: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

