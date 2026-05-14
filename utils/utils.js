/*
 * Copyright 2025, Inteligencia móvil.
 * Licensed under the Apache License, Version 2.0.
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import axios from "axios";

dayjs.extend(utc);
dayjs.extend(timezone);

const { GRAPH_API_TOKEN, FLOW_VIABILIDAD } = process.env;

export const calcularEdad = (fechaNacimiento) => {
  const formatos = [
    "YYYY-MM-DD",
    "DD-MM-YYYY",
    "DD/MM/YYYY",
    "YYYY/MM/DD",
    "MM-DD-YYYY",
    "MM/DD/YYYY"
  ];

  const nacimiento = dayjs(fechaNacimiento, formatos, true);

  return dayjs().diff(nacimiento, "year");
}

export const consultarFecha = () => {
    return dayjs()
        .tz('America/Bogota')
        .format('DDMMYYYY');
}

//FUNCION PAAR IDENTIFICAR SI EL MENSAJE ENVIADO ES UN SALUDO
export const esSaludo = (texto) => {
    // Expresión regular para detectar saludos comunes (sin importar mayúsculas o minúsculas)
    const saludoRegex = /\b(hola|buenos\s*días|buenos\s*dias|buenas\s*tardes|buenas\s*noches|qué\s*tal|hey|tardes|noches|días|buenas|ola|saludos|saludo)\b/i;
    
    return saludoRegex.test(texto); 
}

//FUNCION PARA IDENTIFICAR SI EL MENSAJE ES UN ANUNCIO O VIENE DE EL
export const esAnuncio = (texto) => {
    // Expresión regular para detectar saludos comunes (sin importar mayúsculas o minúsculas)
    const anuncioRegex = /\b(¡Hola!\s*Quiero\s*validar\s*mi\s*identidad.)\b/i;
    
    return anuncioRegex.test(texto); 
}

//FUNCION PARA VALIDAR SI EL MENSAJE ES UN CORREO
export const esCorreo = (texto) => {
    // Expresión regular para detectar saludos comunes (sin importar mayúsculas o minúsculas)
    const correoRegex = /^(?:[^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*|"[^\n"]+")@(?:[^<>()[\].,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,63}$/i;
    
    return correoRegex.test(texto); 
}

//FUNCION PARA CONVERTIR NUMERO A FORMATO PESOS
export const convertirANumeroAPesos = (numero) => {
    // Crear el formateador de número
    const formato = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP', 
    }).format(numero);

    return formato;
}

// FUNCION PARA CONVERTIR A BASE64 LA FOTO TOMADA
export const convertImageBase64 = async (mediaUrl) => {
  try {
    // Descargar la imagen como datos binarios
    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',  // Importante para obtener los bytes de la imagen
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`
      },
    });

    // Convertir los datos binarios a una cadena Base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const imagenPrefijo = asegurarPrefijo(base64Image);

    console.log('✅ Imagen convertida a Base64 exitosamente');

    return imagenPrefijo;
  } catch (error) {
    console.error('❌ Error convirtiendo la imagen a Base64:', error.response?.data || error.message);

    mensajeFormulario("ESTUDIO DE VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD);
  }
}

export const asegurarPrefijo = (base64) => {
  if (!base64) return null;

  const prefix = "data:image/jpeg;base64,";
  return base64.startsWith(prefix) ? base64 : prefix + base64;
}