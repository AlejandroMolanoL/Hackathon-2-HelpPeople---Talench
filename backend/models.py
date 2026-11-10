"""
Modelos de Datos y Esquemas Pydantic para la API HelpPeople.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    months_ahead: int = Field(default=3, ge=1, le=12, description="Meses a proyectar en el futuro")
    prioridad: Optional[str] = Field(default="Todas", description="Filtrar por prioridad o 'Todas'")
    categoria: Optional[str] = Field(default="Todas", description="Filtrar por categoría o 'Todas'")

class MonthlyPrediction(BaseModel):
    periodo: str
    total_solicitudes: int
    abiertas_estimadas: int
    cerradas_estimadas: int
    vencidas_estimadas: int
    tiempo_promedio_horas: float
    tasa_vencimiento_pct: float

class PredictResponse(BaseModel):
    meses_proyectados: int
    filtro_prioridad: str
    filtro_categoria: str
    tiempo_promedio_estimado_horas: float
    porcentaje_vencidas_estimado: float
    predicciones_mensuales: List[MonthlyPrediction]
    probabilidad_vencimiento_por_prioridad: Dict[str, float]
    tiempos_resolucion_por_prioridad: Dict[str, float]
    metricas_modelo: Dict[str, Any]

class RecommendationItem(BaseModel):
    id: str
    tipo: str  # Alerta SLA, Capacidad de Equipo, Cuello de Botella, Optimización
    nivel_prioridad: str  # Crítica, Alta, Media, Preventiva
    titulo: str
    descripcion: str
    accion_sugerida: str
    metrica_impactada: str
    estimacion_mejora: str

class RecommendationsResponse(BaseModel):
    resumen_ejecutivo: str
    alerta_riesgo_general: str  # Bajo, Moderado, Crítico
    tasa_riesgo_vencimiento_global: float
    recomendaciones: List[RecommendationItem]

class TicketSample(BaseModel):
    codigo_ticket: str
    fecha_solicitud: str
    fecha_cierre: Optional[str] = None
    fecha_limite_sla: Optional[str] = None
    estado: str
    prioridad: str
    categoria: str
    tiempo_resolucion_horas: Optional[float] = None
    sla_cumplido: int = 1
    departamento_solicitante: str
    agente_asignado: str
    satisfaccion_cliente: Optional[float] = None
    canal_origen: str

class AgentPerformance(BaseModel):
    agente: str
    total_asignados: int
    tickets_resueltos: int
    tickets_en_curso: int
    tickets_vencidos: int
    tasa_resolucion_pct: float
    tiempo_respuesta_promedio_horas: float
    sla_cumplimiento_pct: float
    satisfaccion_promedio: float
    score_rendimiento: float
    nivel_rendimiento: str

class TicketCreate(BaseModel):
    codigo_ticket: Optional[str] = Field(default=None, description="Código de ticket. Si se omite, se autogenera.")
    fecha_solicitud: Optional[str] = Field(default=None, description="Fecha de solicitud (YYYY-MM-DD HH:MM:SS)")
    fecha_limite_sla: Optional[str] = Field(default=None, description="Fecha límite de SLA")
    fecha_cierre: Optional[str] = Field(default=None, description="Fecha de cierre (si aplica)")
    estado: str = Field(default="Abierta", description="Estado: Abierta, En Proceso, Cerrada, Vencida")
    prioridad: str = Field(default="Media", description="Prioridad: Crítica, Alta, Media, Baja")
    categoria: str = Field(default="Software", description="Categoría del requerimiento")
    departamento_solicitante: str = Field(default="Soporte General", description="Departamento solicitante")
    agente_asignado: str = Field(default="Sin Asignar", description="Agente técnico asignado")
    canal_origen: str = Field(default="Portal Web", description="Canal de origen")
    tiempo_resolucion_horas: Optional[float] = Field(default=None, description="Horas de resolución")
    sla_cumplido: Optional[int] = Field(default=1, description="1 si cumplió SLA, 0 si no")
    satisfaccion_cliente: Optional[float] = Field(default=None, description="Satisfacción (1.0 - 5.0)")

class TicketUpdate(BaseModel):
    fecha_solicitud: Optional[str] = None
    fecha_limite_sla: Optional[str] = None
    fecha_cierre: Optional[str] = None
    estado: Optional[str] = None
    prioridad: Optional[str] = None
    categoria: Optional[str] = None
    departamento_solicitante: Optional[str] = None
    agente_asignado: Optional[str] = None
    canal_origen: Optional[str] = None
    tiempo_resolucion_horas: Optional[float] = None
    sla_cumplido: Optional[int] = None
    satisfaccion_cliente: Optional[float] = None

class HistoricalDataResponse(BaseModel):
    kpis_generales: Dict[str, Any]
    tendencia_mensual: List[Dict[str, Any]]
    distribucion_estado: Dict[str, int]
    distribucion_prioridad: Dict[str, int]
    distribucion_categoria: Dict[str, int]
    tiempos_promedio_por_prioridad: Dict[str, float]
    tasa_vencimiento_por_prioridad: Dict[str, float]
    ultimas_solicitudes: List[TicketSample]
    rendimiento_agentes: Optional[List[AgentPerformance]] = None
    estadisticas_detalladas: Optional[Dict[str, Any]] = None
    distribucion_dia_semana: Optional[List[Dict[str, Any]]] = None
    distribucion_canal: Optional[List[Dict[str, Any]]] = None
    distribucion_departamento: Optional[List[Dict[str, Any]]] = None
    estadisticas_tiempos: Optional[Dict[str, Any]] = None

class AnalyticsStatisticsResponse(BaseModel):
    total_analizadas: int
    solicitudes_cumplidas: int
    solicitudes_vencidas: int
    tasa_cumplimiento_pct: float
    tasa_vencimiento_pct: float
    resolucion_rapida_menor_4h_pct: float
    dias_semana: List[Dict[str, Any]]
    tiempos_resolucion: Dict[str, Any]
    canales: List[Dict[str, Any]]
    departamentos: List[Dict[str, Any]]
    resumen_ejecutivo: str

class SlaEventCreate(BaseModel):
    titulo: str = Field(..., min_length=2, max_length=255, description="Título del evento o planificación")
    tipo: str = Field(default="Revisión SLA", description="Tipo: Ventana de Mantenimiento, Turno de Soporte, Revisión SLA, Auditoría, Despliegue, Capacitación")
    fecha_inicio: str = Field(..., description="Fecha y hora de inicio (YYYY-MM-DD HH:MM)")
    fecha_fin: str = Field(..., description="Fecha y hora de fin (YYYY-MM-DD HH:MM)")
    prioridad: str = Field(default="Media", description="Prioridad: Crítica, Alta, Media, Baja")
    responsable: Optional[str] = Field(default="Sin Asignar", description="Responsable o equipo asignado")
    estado: str = Field(default="Programado", description="Estado: Programado, En Curso, Completado, Cancelado")
    meta_sla: Optional[str] = Field(default="", description="Meta de SLA u objetivo")
    descripcion: Optional[str] = Field(default="", description="Detalles o notas operativas")

class SlaEventUpdate(BaseModel):
    titulo: Optional[str] = None
    tipo: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    prioridad: Optional[str] = None
    responsable: Optional[str] = None
    estado: Optional[str] = None
    meta_sla: Optional[str] = None
    descripcion: Optional[str] = None

class SlaEvent(BaseModel):
    id: int
    titulo: str
    tipo: str
    fecha_inicio: str
    fecha_fin: str
    prioridad: str
    responsable: Optional[str] = None
    estado: str
    meta_sla: Optional[str] = None
    descripcion: Optional[str] = None
    created_at: Optional[str] = None


