![alt text](frontend/public/Logo-helppeople-2021-horizontal.png)

HACKATHON #2 HELPPEOPLE

Retos
Predicción y Gestión Inteligente de Solicitudes

Requisitos Técnicos Objetivo del Reto:
Ayudar a HelpPeople a optimizar la gestión de solicitudes mediante la creación de una solución innovadora que combine visualización de datos históricos, predicciones futuras basadas en inteligencia artificial y recomendaciones estratégicas para mejorar la eficiencia operativa.

Este desafío busca desarrollar una herramienta que permita anticipar tendencias, identificar riesgos de vencimiento y proponer soluciones efectivas, garantizando una mejor experiencia tanto para los usuarios como para los equipos internos.

Frontend:
1.  Framework: Desarrollar el frontend utilizando React.js
2. Interactividad: Gráficos interactivos que representen los datos históricos y predicciones futuras (pueden usar bibliotecas como Chart.js o D3.js). Un módulo para que el usuario ajuste parámetros (e.g., rango de fechas, prioridades específicas, etc.) y actualice las predicciones en tiempo real.
3. Diseño: Utilizar componentes modernos y accesibles, como PrimeReact o Vuetify.
4. Funcionalidad: Incluir filtros dinámicos, visualización comparativa entre datos reales y predicciones, y un módulo para mostrar las recomendaciones.

Backend:
1. Framework: Utilizar Node.js (Express) o Python.
2. Base de Datos: Manejar datos históricos de las solicitudes en SQL SERVER.
3. Modelo de IA: Integrar una API que utilice un modelo de machine learning (desarrollado en Python con TensorFlow, PyTorch, o Scikit-learn). El modelo debe entrenarse con los datos históricos para predecir: El volumen de solicitudes para los próximos meses. El porcentaje de solicitudes que podrían quedar vencidas. Los tiempos promedio de resolución.
4. Endpoints: o GET /historical-data: Para enviar los datos históricos al frontend. POST /predict: Recibir parámetros de predicción (e.g., rango de fechas) y devolver resultados predictivos. GET /recommendations: Generar estrategias basadas en las predicciones. 


Modelo de IA:
1. Entrenar un modelo basado en algoritmos como Regresión Lineal, Bosques Aleatorios, LSTM (si los datos tienen una fuerte componente temporal).
2. Datos necesarios: Fecha de solicitud. Estado de la solicitud (abierta, cerrada, vencida, etc.). Prioridad. Tiempo de resolución.
3. Salidas del modelo: Predicción de número de solicitudes abiertas/cerradas/vencidas para un período futuro. Tiempo promedio estimado de resolución. Probabilidad de que una solicitud quede vencida, basada en su prioridad.

Entrega del Reto:
1. Funcionalidades Esperadas: Visualización de datos históricos y predicciones. Recomendaciones automáticas basadas en las predicciones. Filtros personalizables para que el usuario explore datos específicos.
2. Evaluación: o Precisión del modelo predictivo (ejemplo: margen de error en la predicción del volumen de solicitudes). Fluidez y experiencia de usuario en el frontend. o Organización y estructura del código.
3. Extras Opcionales: Implementar notificaciones automáticas (e.g., un correo o alerta en el dashboard) cuando se detecte una alta probabilidad de vencimiento de solicitudes.

