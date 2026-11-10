const API_BASE = import.meta.env.VITE_API_BASE !== undefined 
  ? import.meta.env.VITE_API_BASE 
  : "http://localhost:8000";

export async function fetchDbStatus() {
  const res = await fetch(`${API_BASE}/db-status`);
  if (!res.ok) throw new Error("Error consultando estado de DB");
  return res.json();
}

export async function fetchFilterOptions() {
  const res = await fetch(`${API_BASE}/filter-options`);
  if (!res.ok) throw new Error("Error consultando opciones de filtro");
  return res.json();
}

export async function fetchHistoricalData(params = {}) {
  const query = new URLSearchParams();
  if (params.start_date) query.append("start_date", params.start_date);
  if (params.end_date) query.append("end_date", params.end_date);
  if (params.prioridad && params.prioridad !== "Todas") query.append("prioridad", params.prioridad);
  if (params.categoria && params.categoria !== "Todas") query.append("categoria", params.categoria);
  if (params.limit) query.append("limit", params.limit);

  const res = await fetch(`${API_BASE}/historical-data?${query.toString()}`);
  if (!res.ok) throw new Error("Error cargando datos históricos");
  return res.json();
}

export async function fetchAnalyticsStatistics(params = {}) {
  const query = new URLSearchParams();
  if (params.start_date) query.append("start_date", params.start_date);
  if (params.end_date) query.append("end_date", params.end_date);
  if (params.prioridad && params.prioridad !== "Todas") query.append("prioridad", params.prioridad);
  if (params.categoria && params.categoria !== "Todas") query.append("categoria", params.categoria);

  const res = await fetch(`${API_BASE}/analytics/statistics?${query.toString()}`);
  if (!res.ok) throw new Error("Error generando estadísticas analíticas");
  return res.json();
}

export async function fetchAgentsPerformance(params = {}) {
  const query = new URLSearchParams();
  if (params.start_date) query.append("start_date", params.start_date);
  if (params.end_date) query.append("end_date", params.end_date);
  if (params.prioridad && params.prioridad !== "Todas") query.append("prioridad", params.prioridad);
  if (params.categoria && params.categoria !== "Todas") query.append("categoria", params.categoria);

  const res = await fetch(`${API_BASE}/agents-performance?${query.toString()}`);
  if (!res.ok) throw new Error("Error cargando métricas de rendimiento de agentes");
  return res.json();
}

export async function fetchPredictions(params) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Error generando predicciones");
  return res.json();
}

export async function fetchRecommendations() {
  const res = await fetch(`${API_BASE}/recommendations`);
  if (!res.ok) throw new Error("Error cargando recomendaciones");
  return res.json();
}

export async function fetchNextTicketCode() {
  try {
    const res = await fetch(`${API_BASE}/next-ticket-code`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.next_ticket_code;
  } catch {
    return null;
  }
}

async function extractErrorMessage(res, fallback) {
  try {
    const errorData = await res.json();
    if (typeof errorData.detail === "string") return errorData.detail;
    if (Array.isArray(errorData.detail)) return errorData.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    if (errorData.message) return errorData.message;
  } catch {
    return `Error del servidor (${res.status}: ${res.statusText || 'Petición fallida'})`;
  }
  return fallback;
}

export async function createTicket(ticketData) {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticketData),
  });
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Error al crear la solicitud");
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function updateTicket(codigoTicket, ticketData) {
  const res = await fetch(`${API_BASE}/tickets/${encodeURIComponent(codigoTicket)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticketData),
  });
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Error al actualizar la solicitud");
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function deleteTicket(codigoTicket) {
  const res = await fetch(`${API_BASE}/tickets/${encodeURIComponent(codigoTicket)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Error al eliminar la solicitud");
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function fetchTicket(codigoTicket) {
  const res = await fetch(`${API_BASE}/tickets/${encodeURIComponent(codigoTicket)}`);
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Error al obtener la solicitud");
    throw new Error(errorMsg);
  }
  return res.json();
}

// ============================================================================
// API PLANIFICACIÓN SLA Y CALENDARIO
// ============================================================================

export async function fetchSlaEvents(params = {}) {
  const query = new URLSearchParams();
  if (params.start_date) query.append("start_date", params.start_date);
  if (params.end_date) query.append("end_date", params.end_date);
  if (params.prioridad && params.prioridad !== "Todas") query.append("prioridad", params.prioridad);
  if (params.tipo && params.tipo !== "Todos") query.append("tipo", params.tipo);
  if (params.estado && params.estado !== "Todos") query.append("estado", params.estado);

  const res = await fetch(`${API_BASE}/sla-planning?${query.toString()}`);
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Error al cargar eventos de planificación SLA");
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function fetchSlaEvent(id) {
  const res = await fetch(`${API_BASE}/sla-planning/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Error al obtener el evento SLA");
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function createSlaEvent(eventData) {
  const res = await fetch(`${API_BASE}/sla-planning`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Error al crear la planificación SLA");
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function updateSlaEvent(id, eventData) {
  const res = await fetch(`${API_BASE}/sla-planning/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Error al actualizar la planificación SLA");
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function deleteSlaEvent(id) {
  const res = await fetch(`${API_BASE}/sla-planning/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Error al eliminar la planificación SLA");
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function fetchSlaTicketDeadlines(params = {}) {
  const query = new URLSearchParams();
  if (params.start_date) query.append("start_date", params.start_date);
  if (params.end_date) query.append("end_date", params.end_date);
  if (params.limit) query.append("limit", params.limit);

  try {
    const res = await fetch(`${API_BASE}/sla-planning/ticket-deadlines?${query.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("No se pudieron cargar los vencimientos de tickets para el calendario:", err);
    return [];
  }
}



