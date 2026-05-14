/*
 * Copyright 2025, Inteligencia móvil.
 * Licensed under the Apache License, Version 2.0.
 */
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