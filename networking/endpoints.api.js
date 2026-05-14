/*
 * Copyright 2025, Inteligencia móvil.
 * Licensed under the Apache License, Version 2.0.
 */

export const ENDPOINTS_API = {
    OBTENER_TOKEN: "Usuario/AutenticarUsuario",
    INICIO_CONVERSACION: "WhatsApp/InicioConversacion",
    REGISTRAR_OPCION: "WhatsApp/RegistrarOpcion",       
    REGISTRAR_PERSONA: "WhatsApp/RegistrarPersona",
    VALIDAR_PERSONA: "WhatsApp/ValidarPersona",
    REENVIAR_CODIGO_CORREO: "WhatsApp/ReenviarCodigoCorreo",
    VALIDACION_VIABILIDAD: "WhatsApp/ValidacionViabilidad",
    GENERAR_PREPOLIZA: "WhatsApp/GenerarPrepoliza",
    REGISTRAR_LEY: "WhatsApp/RegistrarLey",
    VALIDAR_LEY: "WhatsApp/ValidarLey",
    REENVIAR_CODIGO_LEY: "WhatsApp/ReenviarCodigoLey",
    OBTENER_URL_PAGO: "WhatsApp/ObtenerUrlPago",
    APROBAR_CONSULTA : "WhatsApp/AprobarConsulta",
    VALIDAR_CONSULTA : "WhatsApp/ValidarConsulta",
    REENVIAR_CODIGO_CONSULTA : "WhatsApp/ReenviarCodigoConsulta",
    OBTENER_POLIZAS_DOCUMENTO: "WhatsApp/ObtenerPolizasxDocumento",
    ENVIAR_CARATULA: "WhatsApp/EnviarCaratula",
    OBTENER_ULTIMO_MENSAJE: "WhatsApp/ObtenerUltimoMensaje",
    //ACTUALIZAR_CORREO: "WhatsApp/ActualizarCorreo",
}

export const ENDPOINTS_API_MNK = {
    OBTENER_TOKEN: "Auth/GetToken",
    REGISTRAR_PERSONA: "WhatsApp/RegistrarPersona",
    ESTADO_VALORACION: "WhatsApp/ActualizarEstadoValoracion",
    REGISTRAR_MENSAJE: "WhatsApp/RegistrarMensaje",
    VALIDAR_CODIGO : "WhatsApp/ValidarHashWhatsApp",
    REENVIAR_CODIGO : "WhatsApp/ReenviarHashWhatsApp",
    DATOS_PAGO : "Reclamacion/RegistrarReclamacion",
}

export const ENDPOINTS_API_AUTOEXPEDIBLES_MNK = {
    GENERAR_TOKEN: "usuario/autenticar",
    VALIDAR_IDENTIDAD_CLIENTE: "WhatsApp/ValidarIdentidadCliente",
    CONFIRMAR_IDENTIDAD_CLIENTE: "WhatsApp/ConfirmarIdentidadCliente",
    OBTENER_PLANES: "WhatsApp/ObtenerPlanAutoExpedible",
    SELECCIONAR_PLAN: "WhatsApp/ObtenerHash",
    OBTENER_RESUMEN_POLIZA: "WhatsApp/ObtenerResumenAutoExpedible",
    CREAR_POLIZA: "WhatsApp/CrearPlizaAutoExpedible",
}