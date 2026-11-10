-- =====================================================================
-- Script de Creación de Base de Datos y Tablas - HelpPeople
-- Motor: Microsoft SQL Server
-- Hackathon #2 HelpPeople - Predicción y Gestión Inteligente
-- =====================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'HelpPeopleDB')
BEGIN
    CREATE DATABASE HelpPeopleDB;
END
GO

USE HelpPeopleDB;
GO

-- Crear tabla Solicitudes si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Solicitudes') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.Solicitudes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        codigo_ticket NVARCHAR(50) NOT NULL UNIQUE,
        fecha_solicitud DATETIME2 NOT NULL,
        fecha_cierre DATETIME2 NULL,
        fecha_limite_sla DATETIME2 NOT NULL,
        estado NVARCHAR(50) NOT NULL,
        prioridad NVARCHAR(50) NOT NULL,
        categoria NVARCHAR(100) NOT NULL,
        tiempo_resolucion_horas FLOAT NULL,
        departamento_solicitante NVARCHAR(100) NOT NULL,
        agente_asignado NVARCHAR(100) NOT NULL,
        sla_cumplido BIT NOT NULL DEFAULT 1,
        satisfaccion_cliente FLOAT NULL,
        canal_origen NVARCHAR(100) NOT NULL,
        creado_en DATETIME2 DEFAULT GETDATE()
    );

    -- Índices para optimizar consultas analíticas y filtrado
    CREATE NONCLUSTERED INDEX IX_Solicitudes_FechaSolicitud ON dbo.Solicitudes (fecha_solicitud);
    CREATE NONCLUSTERED INDEX IX_Solicitudes_Estado ON dbo.Solicitudes (estado);
    CREATE NONCLUSTERED INDEX IX_Solicitudes_Prioridad ON dbo.Solicitudes (prioridad);
    CREATE NONCLUSTERED INDEX IX_Solicitudes_Categoria ON dbo.Solicitudes (categoria);
    CREATE NONCLUSTERED INDEX IX_Solicitudes_SlaCumplido ON dbo.Solicitudes (sla_cumplido);
END
GO

