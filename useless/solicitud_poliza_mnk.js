/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import express from "express";
import axios from "axios";
import fetch from "node-fetch";
import fs from "fs";

import {TIPOS_OPCIONES_AUTOEXPEDIBLES_MNK} from "./utils/tipos-opciones.js"
import {ENDPOINTS_API_AUTOEXPEDIBLES_MNK}from "./networking/endpoints.api.js"
import {ExternalApi} from "./networking/external.api.js";
import {convertImageBase64, consultarFecha, esAnuncio, esSaludo} from "./utils/utils.js"

let message = null;
let contac = null;
let business_phone_number_id = null;

let mensaje = null;
let TOKENT = null;

const app = express();
app.use(express.json()); 

//OBTIENE LOS DATOS DE LAS VARIABLES CREADAS EN .ENV
const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, FLOW_ID_VALIDACION_NMK, FLOW_ID_DATOS_POLIZA_NMK, FLOW_ID, FLOW_ID_2, URL_SERVICE, Authorization, PORT } = process.env;

app.post("/webhook", async (req, res) => {
   
  //URL Desarrollo
  URL_SERVICE = "http://34.42.187.146:8084/api/";
  AUTHORIZATION_SERVICE = "Basic MmViYmZmNjBkYTFmM2JjZlhVYUxWTHcrV3lQTi9BM0pGVFRhelp4RU9POXNmUHNpYmYvTG5PZjN2WUE9OjJlYmJmZjYwZGExZjNiY2YzOElOMUcvUEtoMU9vOU5TbEJXZkxnPT0=";
  
  
  // check if the webhook request contains a message
  // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
  contac = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0];
  business_phone_number_id = req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
  
  //VALIDA SI TIENE UN TOKEN SI NO LO GENERA
  if(TOKENT === null){
    generarToken();
  }
  
  if(message != null){
    // log incoming messages
    console.log("JSON NUEVO MENSAJE entrante en webhook:", JSON.stringify(req.body, null, 2));
  }
  
  // MENSAJE DE TIPO TEXTO
  if (message?.type === "text") {
    console.log("💬 NUEVO TEXTO MENSAJE:", message.text.body);
    
    if(esAnuncio(message.text.body)){
      console.log('💬 Es Anuncio:', true); 
      
      //IDENTIFICA SI ES UN ANUNCIO
      mensajePlantilla();
    }else if(esSaludo(message.text.body)){
      console.log('💬 Es Saludo:', true); 
      
      //IDENTIFICA SI ES UN SALUDO
      mensajePlantillaSaludo(message, business_phone_number_id, contac);
    }else if(message.text.body === "Gracias"){
      console.log('💬 Es Despedida:', true); 
      
      //IDENTIFICA SI ES UNA DESPUEDIDA
      mensaje = "👋 Esperamos haber resuelto tus inquietudes";
      mensajeTexto(mensaje); 
    }else if(esCorreo(message.text.body)){
      console.log('💬 Es Correo:', true); 
      
      //IDENTIFICA SI INGRESO UN CORREO
      mensaje = "🔐 Para continuar con el proceso de adquirir tu póliza *Autoexpedible Colisiones Simples*, te enviamos un código de 4 digitos al correo ingresado. Por favor, ingresalo a continuación.";
      mensajeTexto(mensaje);
      
      //Consume servicio para enviar el correo
      /*const url = URL_SERVICE + "reporte/GetCorreo";

      // Datos que deseas enviar
      const data = {
          'data':{
              "correo": message.text.body,
              "numeroCelular": contac.wa_id,
              "canal": "WhatsAppPoliza"
          },
          'platform': "WhatsAppPoliza"
      }; 


      console.log("📦 Peticion correo para OTP", data);

      // Haciendo la solicitud POST
      fetch(url, {
          method: 'POST', // Método de la solicitud
          headers: {
              'Content-Type': 'application/json',
              'Authorization': Authorization,
              'token': TOKENT
          },
          body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
      }).then(response => {
          if (!response.ok) {
              console.error('❌ Error enviando el correo');
          }

          return response.json(); // Convertir la respuesta a JSON
      }).then(data => {
          if(data.statusCode === 1){
            mensaje = "🔐 Por favor ingresa el código de 4 digitos enviado a tu correo electrónico";
            mensajeTexto(mensaje);
          }else if(data.statusCode === 0){
            //MENSAJE ENVIANDO EL CORREO
            mensaje = "❌ Ocurrio un error enviando el correo, por favor intente de nuevo.";
            mensajeTexto(mensaje);

            mensajePlantilla();
          }else if(data.statusCode === 401){
            //MENSAJE ENVIANDO EL CORREO
            mensaje = "❌ Ocurrio un error enviando el correo, por favor intente de nuevo.";
            mensajeTexto(mensaje);

            generarToken();

            mensajePlantilla();
          }else{
            //MENSAJE ENVIANDO EL CORREO
            mensaje = "❌ Ocurrio un error enviando el correo, por favor intente de nuevo.";
            mensajeTexto(mensaje);

            mensajePlantilla();
          }
      }).catch((error) => {
          console.error('❌ Error registrando CORREO:', error); // Manejar errores

          //MENSAJE ENVIANDO EL CORREO
          mensaje = "❌ Ocurrio un error enviando el correo, por favor intente de nuevo.";
          mensajeTexto(mensaje);

          mensajePlantilla();
      }); */
      
    }else if (!isNaN(message.text.body)) {
      //IDENTIFICA SI INGRESO UN CODIGO DE 4 DIGITOS
      if(message.text.body.length === 4){
        console.log('💬 Es Codigo de 4 digitos:', true); 
        
        if(message.text.body === "3377"){

          
            mensajeInteractivePagar("*VALIDACIÓN PLAN*\n\n"+
              "🚙 Placa: *AAA111*\n"+
              "📃 Tipo Póliza:\n*A-RC EXTRAC.SUBJ DAÑOSPROPIEDAD TERCERAS PERSONAS*\n"+
              "🗓️ Vigencia: *1 Año*\n"+
              "🏭 Emitida por: *MNK Seguros*\n"+
              "☑️ Plan:\n*PLAN LIVIANOS - Opcion 1*\n"+
              "💵 Monto asegurado: *$ 30,000.00 us*\n"+
              "🧾 Valor a pagar: *$ 38,39 us*");

        }else{
          //MENSAJE SI EL MENSAJE NO ES VALIDO
          mensaje = "🔐 Para continuar con el proceso de adquirir tu póliza *Autoexpedible Colisiones Simples*, te enviamos un código de 4 digitos al correo ingresado. Por favor, ingresalo a continuación.";
          mensajeTexto(mensaje);
        }
        
        
        //Consume servicio para enviar el correo
        /*const url = URL_SERVICE + "reporte/ValidarCodigoOTP";

        // Datos que deseas enviar
        const data = {
            'data':{
                "correo": message.text.body,
                "numeroCelular": contac.wa_id,
                "canal": "WhatsAppPoliza"
            },
            'platform': "WhatsAppPoliza"
        }; 

        console.log("📦 Peticion validar codigo OTP", data);

        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': Authorization,
                'token': TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error validando el codigo');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
              mensajeInteractive("✅ Tu identidad ha sido validada exitosamente.\n\nEn que podemos ayudarte?");
            }else if(data.statusCode === 0){
              //MENSAJE ENVIANDO EL CORREO
              mensaje = "❌ "+data.statusMessage;
              mensajeTexto(mensaje);
            }else if(data.statusCode === 401){
              //MENSAJE ENVIANDO EL CORREO
              mensaje = "❌ Error validando el codigo, por favor ingresa el código de 4 digitos enviado a tu correo electrónico";
              mensajeTexto(mensaje);

              generarToken();
            }else{
              //MENSAJE ENVIANDO EL CORREO
              mensaje = "❌ Error validando el codigo, por favor ingresa el código de 4 digitos enviado a tu correo electrónico";
              mensajeTexto(mensaje);
            }
        }).catch((error) => {
            console.error('❌ Error validando el codigo:', error); // Manejar errores

            //MENSAJE ENVIANDO EL CORREO
            mensaje = "❌ Error validando el codigo, por favor ingresa el código de 4 digitos enviado a tu correo electrónico";
            mensajeTexto(mensaje);
        });*/
        
      }else if(message.text.body === "1040737"){

          mensaje = "📃 *MI PÓLIZA*\n\nTipo de Póliza:\n*Choque  simple*\n\nEmitida por:\n*MNK Seguros*\n\nVigencia:\n*1 Año (hasta 13, 2026)*\n\nEmitida a:\n*Juan Manuel Perez*\n\nValor a pagar:\n*$120.000*\n\n*LINK DESCARGA:*\n👉 www.inteligencia-movil.com";
          mensajeTexto(mensaje);
        
      }else{
        //MENSAJE NO ES VALIDO
        mensaje = "🔐 Para continuar con el proceso de adquirir tu póliza *Autoexpedible Colisiones Simples*, te enviamos un código de 4 digitos al correo ingresado. Por favor, ingresalo a continuación.";
        mensajeTexto(mensaje);
      }
    }else{
      //MENSAJE NO ES VALIDO
      mensaje = "Mensaje no identificado, para realizar una consulta debe inciar la conversación con un saludo\n*(Ejemplo: Hola, Buenas tardes, Buenas noches, etc)*";
      mensajeTexto(mensaje);
    }
    
  }else if(message?.type === "interactive" && message?.interactive.type === "button_reply"){
    console.log("💬 PRESIONO EL BOTON:", message.interactive.button_reply.id);
    
    //IDENTIFICA SI PRESIONO UN BOTON
    if(message.interactive.button_reply.id === "PLAN"){  
      
      mensaje = "🔐 Para continuar con el proceso de adquirir tu póliza *Autoexpedible Colisiones Simples*, te enviamos un código de 4 digitos al correo ingresado. Por favor, ingresalo a continuación.";
      mensajeTexto(mensaje);
      
    }else if(message.interactive.button_reply.id === "CONSULTAR_ACUERDO"){ 
      
      mensaje = "¿Por favor enviarnos tu número de identificación para consultar tus pólizas?";
      mensajeTexto(mensaje);
      
    }else if(message.interactive.button_reply.id === "PREGUNTAS_FRECUENTES"){ 
      
      mensaje = "Si tienes alguna duda, puedes revisar nuestras preguntas frecuentes en este link\n👉 www.inteligencia-movil.com";
      mensajeTexto(mensaje);
      
    }else if(message.interactive.button_reply.id === "PAGAR"){ 
      mensaje = "Puede realizar su pago de manera segura a través del siguiente enlace:\n👉 www.inteligencia-movil.com/\n\nSi tiene alguna duda o inconveniente durante el proceso, no dude en contactarnos.";
      mensajeTexto(mensaje);
      
      setTimeout(() => {
        axios({
          method: "POST",
          url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            to: message.from,
            text: { body: "✅ Gracias por adquirir tu *Poliza* con nosotros, en un momento recibiras por correo electronico todos los datos"},
            //text: { body: JSON.stringify(dat.result)},
          },
        });
     }, 700);              

    }else if(message.interactive.button_reply.id === "VALIDAR"){ 
        mensajeFormulario("DATOS PÓLIZA", "Por favor ingresa los siguientes datos para continuar con el proceso", "Haga clic en el botón para iniciar", "INICIAR", FLOW_ID_DATOS_POLIZA_NMK);
                 
    }else if(message.interactive.button_reply.id === "CANCELAR"){ 
        mensajeFormulario("VALIDACIÓN DE IDENTIDAD", "Ahora debemos validar tu identidad. Por favor, ingresa los siguientes datos para continuar.\n\n",
                    "Haga clic en el botón para INICIAR", "INICIAR", FLOW_ID_VALIDACION_NMK);
    }
  }else if(message?.type === "interactive" && message?.interactive.type === "list_reply"){
    //IDENTIFICA SI UN MENSAJE DE RESPUESTA DE TIPO LISTA
      
      
    
  }else if (message?.type === "location") {
      //IDENTIFICA SI ES UN MENSAJE DE TIPO LOCALIZACION
      
    
    
  }else if(message?.type === "button"){
    console.log("💬 PRESIONO EL BOTON:", message.button?.payload);

    if(message.button?.payload === "Adquirir Pólizas"){  
        mensajeFormulario("VALIDACIÓN DE IDENTIDAD", "Ahora debemos validar tu identidad. Por favor, ingresa los siguientes datos para continuar.\n\n",
                    "Haga clic en el botón para INICIAR", "INICIAR", FLOW_ID_VALIDACION_NMK);
      
    }else if(message.button?.payload === "Mis Pólizas"){ 
        mensaje = "¿Por favor enviarnos tu número de identificación para consultar tus pólizas?";
          mensajeTexto(mensaje);
    }

  }else if (message?.type === "interactive" && message?.interactive.type === "nfm_reply") {
      //IDENTIFICA SI ES UN MENSAJE DE RESPUESTA DE UN FORMULARIO
      let respuesta = JSON.parse(message?.interactive.nfm_reply.response_json);
    
      console.log("💬 RESPUESTAS DEL FORMUALRIO", respuesta);
    
      let listaImagenes = [];
      
      if(respuesta.Formulario === "1"){
          for (let i = 0; i < respuesta.images.length; i++) {            
            let id = `${respuesta.images?.[i].id}`;

            try {
              const response = await axios.get(`https://graph.facebook.com/v22.0/${id}`, {
                headers: {
                  Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                },
              });

              const mediaUrl = response.data.url;
              //console.log('✅ URL IMAGEN obtenida:', mediaUrl);

              //await convertImageBase64(mediaUrl);
              const imagenBase64 = await convertImageBase64(mediaUrl);
              
              let imagen = {imagen:imagenBase64};
              listaImagenes.push(imagen);
              
            } catch (error) {
              console.error('❌ Error al obtener URL IMAGEN:', error.response?.data || error.message);
            }
          }

          //RESPUESTA MENSAJE TIPO FORMULARIO DE DATOS DE VALIDACION
          axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
              messaging_product: "whatsapp",
              to: message.from,
              text: { body: "⏱️ Tus datos se estan validando, por favor espera un momento para continuar con el proceso"},
            },
          });

          // mark incoming message as read
          axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
              messaging_product: "whatsapp",
              status: "read",
              message_id: message.id,
            },
          });

          setTimeout(() => {
              axios({
                method: "POST",
                url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                headers: {
                  Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                },
                data: {
                  messaging_product: "whatsapp",
                  to: message.from,
                  type: "interactive",
                  interactive: {
                    "type": "button",
                    "body": {
                      "text": "*VALIDACIÓN DATOS*\n\nPor favor revisa que los siguientes datos correspondan a tu información:\n\n"+
                        "🪪 Tipo de Documento:\n*Cedula Fisica*\n\n"+
                        "🔢 Número documento:\n*1.040.737.534*\n\n"+
                        "👤 Nombres:\n*Duban Hincapie Ruiz*\n\n"+
                        "🧬 Genero: *Masculino*\n\n"+
                        "Si los datos son correctos, responde SI.\n"+
                        "Si encuentras algún error, responde NO."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "VALIDAR",
                            "title": "SI"
                          }
                        }, {
                          "type": "reply",
                          "reply": {
                            "id": "CANCELAR",
                            "title": "NO"
                          }
                        }
                      ]
                    }
                  },
                },
              });
          }, 700);
        
          //ENVIA LOS DATOS DEL FORMULARIO
          /*const url = URL_SERVICE + "reporte/GetReporte";

          // Datos que deseas enviar
          const data = {
              'data':{
                  "idTipoDocumentoLetra": "C",
                  "idTipoDocumento": 1,
                  "numeroDocumento": respuesta.Cedula,
                  "correo": respuesta.Correo,
                  "fechaExpedicion": respuesta.Fecha.replaceAll("-", "/"),
                  "numeroCelular": contac.wa_id,
                  "imagenes": JSON.stringify(listaImagenes),
                  "canal": "WhatsAppPoliza"
              },
              'platform': "WhatsAppPoliza"
          }; 

          console.log("📦 Peticion Formulario Validacion de identidad", data);
          console.log("📦 JSON Imagenes", JSON.stringify(listaImagenes));

          // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Basic NGNlMDMzMjNjMTgxYmZmN3Z5eUhYbjRIMHlPRHJBbk9JQjJiTjBYZTRLdWRNTGpnQ0pJZ1BxOTBaTmc9OjRjZTAzMzIzYzE4MWJmZjdTZmJUOS9pN2ZveXFFOG5XMlJWTGFUY014UTFRZ3FjalpJRGZmM0huamtrPQ==',
                  'token': TOKENT
              },
              body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
          }).then(response => {
              if (!response.ok) {
                  console.error('❌ Error Consulta registrando formulario');
              }

              return response.json(); // Convertir la respuesta a JSON
          }).then(data => {
              if(data.statusCode === 1){
                  //RESPUESTA MENSAJE TIPO FORMULARIO DE DATOS DE VALIDACION
                  axios({
                    method: "POST",
                    url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                    headers: {
                      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                    data: {
                      messaging_product: "whatsapp",
                      to: message.from,
                      text: { body: "✅ Tu datos se estan validando, por favor espera un momento para continuar con el proceso"},
                    },
                  });

                  // mark incoming message as read
                  axios({
                    method: "POST",
                    url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                    headers: {
                      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                    data: {
                      messaging_product: "whatsapp",
                      status: "read",
                      message_id: message.id,
                    },
                  });

              }else if(data.statusCode === 0){
                //MENSAJE ERROR ENVIANDO FORMULARIO DE VALIDACION DE IDENTIDAD
                mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_ID);
              }else if(data.statusCode === 401){
                //MENSAJE ERROR DE SEGURIDAD
                mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                generarToken();
                
                mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_ID);
                
              }else{
                //MENSAJE ERROR ENVIADO FORMUALRIO DE VALDIACION DE IDENTIDAD
                mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_ID);
              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
              mensajeTexto(mensaje);
              
              mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_ID);
          });  */
        
      }else if(respuesta.Formulario === "2"){
          for (let i = 0; i < respuesta.imagenAcuerdo.length; i++) {            
            let id = `${respuesta.imagenAcuerdo?.[i].id}`;

            try {
              const response = await axios.get(`https://graph.facebook.com/v22.0/${id}`, {
                headers: {
                  Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                },
              });

              const mediaUrl = response.data.url;
              //console.log('✅ URL IMAGEN obtenida:', mediaUrl);

              //await convertImageBase64(mediaUrl);
              const imagenBase64 = await convertImageBase64(mediaUrl);
              
              let imagen = {imagen:imagenBase64};
              listaImagenes.push(imagen);
              
            } catch (error) {
              console.error('❌ Error al obtener URL IMAGEN:', error.response?.data || error.message);
            }
          }
        
          //ENVIA LOS DATOS DEL FORMULARIO DE ACUERDO DE PAGO
          const url = URL_SERVICE + "poliza/SetAcuerdoPoliza";

          // Datos que deseas enviar
          const data = {
              'data':{
                  "numeroMeses": respuesta.Cuotas,
                  "valor": respuesta.Valor,
                  "numeroCelular": contac.wa_id,
                  "imagenAcuerdo": JSON.stringify(listaImagenes)
              },
              'platform': "PolizaWhatsApp"
          }; 

          console.log("📦 Peticion Formulario de datos de acuerdo de pago", data);

          // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Basic NGNlMDMzMjNjMTgxYmZmN3Z5eUhYbjRIMHlPRHJBbk9JQjJiTjBYZTRLdWRNTGpnQ0pJZ1BxOTBaTmc9OjRjZTAzMzIzYzE4MWJmZjdTZmJUOS9pN2ZveXFFOG5XMlJWTGFUY014UTFRZ3FjalpJRGZmM0huamtrPQ==',
                  'token': TOKENT
              },
              body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
          }).then(response => {
              if (!response.ok) {
                  console.error('❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago');
              }

              return response.json(); // Convertir la respuesta a JSON
          }).then(dat => {
              if(dat.statusCode === 1){
                  //RESPUESTA MENSAJE TIPO FORMULARIO
                  axios({
                    method: "POST",
                    url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                    headers: {
                      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                    data: {
                      messaging_product: "whatsapp",
                      to: message.from,
                      text: { body: "✅ Gracias por adquirir tu *Poliza* con nosotros, en un momento recibiras por correo electronico todos los datos"},
                      //text: { body: JSON.stringify(dat.result)},
                    },
                  });
            
                  // mark incoming message as read
                  axios({
                    method: "POST",
                    url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                    headers: {
                      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                    data: {
                      messaging_product: "whatsapp",
                      status: "read",
                      message_id: message.id,
                    },
                  });

              }else if(data.statusCode === 401){
                //MENSAJE ERROR DE SEGURIDAD
                mensaje = "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                generarToken();
                
                mensajeFormulario("DATOS ACUERDO", "¡Felicidades! 🎉\nNos complace informarte que tu solicitud de Póliza ha sido aprobada.\n\nPor favor ingresa los siguientes datos para terminar",
                         "Por favor haga clic en el botón para terminar", "TERMINAR", FLOW_ID_2);
                
              }else if(dat.statusCode === 0){
                 //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE ACUERDO DE PAGO
                  mensaje = "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago, por favor intente de nuevo.";
                  mensajeTexto(mensaje);
                
                  mensajeFormulario("DATOS ACUERDO", "¡Felicidades! 🎉\nNos complace informarte que tu solicitud de Póliza ha sido aprobada.\n\nPor favor ingresa los siguientes datos para terminar",
                         "Por favor haga clic en el botón para terminar", "TERMINAR", FLOW_ID_2);
              }else{
                //MENSAJE ERROR ENVIANDO FORMULARIO DE ACUERDOS DE PAGO
                mensaje = "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                mensajeFormulario("DATOS ACUERDO", "¡Felicidades! 🎉\nNos complace informarte que tu solicitud de Póliza ha sido aprobada.\n\nPor favor ingresa los siguientes datos para terminar",
                         "Por favor haga clic en el botón para terminar", "TERMINAR", FLOW_ID_2);
              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              mensaje = "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago, por favor intente de nuevo.";
              mensajeTexto(mensaje);
                
              mensajeFormulario("DATOS ACUERDO", "¡Felicidades! 🎉\nNos complace informarte que tu solicitud de Póliza ha sido aprobada.\n\nPor favor ingresa los siguientes datos para terminar",
                       "Por favor haga clic en el botón para terminar", "TERMINAR", FLOW_ID_2);
          });          
      } else if(respuesta.Formulario === "3"){
        

        setTimeout(() => {
          let TextoPlan2 = "☑️ *Opción 2:*\n\n"+
              "💵 Monto asegurado: *$ 40,000.00 us*\n"+
              "🧾 Valor de la prima: *$ 48,75 us*"
            mensajeInteractiveLista(TextoPlan2, "Plan2");

             let TextoPlan3 = "☑️ *Opción 3:*\n\n"+
                "💵 Monto asegurado: *$ 50,000.00 us*\n"+
                "🧾 Valor de la prima: *$ 63,99 us*"
              mensajeInteractiveLista(TextoPlan3, "Plan3");
          }, 700);

          mensaje = "Por favor, selecciona *La Opción de PLAN LIVIANOS*, ideal para ti.\n\n"+
            "📃 *Cobertura: A-RC EXTRAC.SUBJ DAÑOSPROPIEDAD TERCERAS PERSONAS*\n\n";
          mensajeTexto(mensaje);

          let TextoPlan1 = "☑️ *Opción 1:*\n\n"+
            "💵 Monto asegurado: *$ 30,000.00 us*\n"+
            "🧾 Valor de la prima: *$ 38,39 us*"
          mensajeInteractiveLista(TextoPlan1, "Plan1");
      }
  }

  res.sendStatus(200);
});

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    // respond with 200 OK and challenge token from the request
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    // respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});

//FUNCION PAAR IDENTIFICAR SI EL MENSAJE ENVIADO ES UN SALUDO
function esSaludo(texto) {
    // Expresión regular para detectar saludos comunes (sin importar mayúsculas o minúsculas)
    const saludoRegex = /\b(hola|buenos\s*días|buenos\s*dias|buenas\s*tardes|buenas\s*noches|qué\s*tal|hey|tardes|noches|días|buenas|ola|saludos|saludo)\b/i;
    
    return saludoRegex.test(texto); 
}

//FUNCION PARA IDENTIFICAR SI EL MENSAJE ES UN ANUNCIO O VIENE DE EL
function esAnuncio(texto) {
    // Expresión regular para detectar saludos comunes (sin importar mayúsculas o minúsculas)
    const anuncioRegex = /\b(¡Hola!\s*Quiero\s*validar\s*mi\s*identidad.)\b/i;
    
    return anuncioRegex.test(texto); 
}

//FUNCION PARA VALIDAR SI EL MENSAJE ES UN CORREO
function esCorreo(texto) {
    // Expresión regular para detectar saludos comunes (sin importar mayúsculas o minúsculas)
    const correoRegex = /^(?:[^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*|"[^\n"]+")@(?:[^<>()[\].,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,63}$/i;
    
    return correoRegex.test(texto); 
}

//FUNCION PARA CONVERTIR NUMERO A FORMATO PESOS
function convertirANumeroAPesos(numero) {
    // Crear el formateador de número
    const formato = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP', 
    }).format(numero);

    return formato;
}


//FUNCION PARA ENVIAR MENSAJE DE TIPO TEXTO
function mensajeFormulario(titulo, mensaje, footer, nombreBoton, id) {
    //ENVIA MENSAJE CON EL FORMULARIO
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        type: "interactive",
        interactive: {
          type: "flow",
          header: {
            type: "text",
            //text: "VALIDACIÓN IDENTIDAD",
            text: titulo
          },
          body: {
            //text: "Hola "+ contac.profile.name +", Bienvenido al centro gestión de polizas para acuerdos de pago de comparendos de transito.\n",
            text:mensaje,
          },
          footer: {
            //text: "Por favor haga clic en el botón para iniciar la validación",
            text: footer,
          },
          action: {
            name: "flow",
            parameters: {
              //flow_id: FLOW_ID,
              flow_id: id,
              flow_message_version: "3",
              //flow_cta: "INICIAR",
              flow_cta: nombreBoton
            },
          },
        },
      },
    });
}


//FUNCION PARA ENVIAR MENSAJE DE TIPO LISTA
function mensajeLista(titulo, descripcion, nn) {
    let datos = "["+nn+"]";

    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        type: "interactive",
        "interactive":{
          "type": "list",
          "header": {
            "type": "text",
            "text": titulo
          },
          "body": {
            "text": descripcion
          },
          "action": {
            "button": titulo,
            "sections":[
              {
                "title":titulo,
                "rows": datos
              }, 
            ]
          } 
        },
      },
    });
}


//FUNCION PARA ENVIAR MENSAJE DE TIPO LISTA DE BOTON
function mensajeInteractive(texto) {
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        type: "interactive",
        interactive: {
          "type": "button",
          "body": {
            "text": texto
          },
          "action": {
            "buttons": [
              {
                "type": "reply",
                "reply": {
                  "id": "SOLICITAR_ACUERDO",
                  "title": "SOLICITAR POLIZA"
                }
              },
              {
                "type": "reply",
                "reply": {
                  "id": "CONSULTAR_ACUERDO",
                  "title": "CONSULTAR POLIZA"
                }
              },
              {
                "type": "reply",
                "reply": {
                  "id": "PREGUNTAS_FRECUENTES",
                  "title": "PREGUNTAS FRECUENTES"
                }
              }
            ]
          }
        },
      },
    });
  
    // mark incoming message as read
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: message.id,
      },
    });
  
  
    //message = null;
    //contac = null;
    //business_phone_number_id = null;
}

//FUNCION PARA ENVIAR MENSAJE DE TIPO TEXTO
function mensajeTexto(texto) {
    // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        text: { body: texto /*+ message.text.body*/ },
        context: {
          message_id: message.id, // shows the message as a reply to the original user message
        },
      }
    });

    // mark incoming message as read
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: message.id,
      },
    });
  
    //message = null;
    //contac = null;
    //business_phone_number_id = null;
}

function mensajePlantillaSaludo(message, business_phone_number_id, contac) {
    // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        "Content-Type": "application/json",
      },
               
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        
        //text: { body: texto /*+ message.text.body*/ },
        // context: {
        //   message_id: message.id, // shows the message as a reply to the original user message
        // },
        "type": "template", 
        "template": { 
          "name": "saludo_emision_polizas_mnk", 
          "language": { 
            "code": "es" 
          },
          "components": [
            {
              "type": "header",
              "parameters": [
                {
                  "type": "image",
                  "image": {
                    "link": "http://imagentes.imsoluciones.net/IM/datosInteligentes/app/mnk.jpeg"
                  }
                }
              ]
            },
            {
            "type": "body",
            "parameters": [
              {
                "type": "text",
                "text": contac.profile.name
              }
            ]
            },
            {
              "type": "button",
              "sub_type": "quick_reply",
              "index": "0",
              "parameters": [
                {
                  "type": "payload",
                  "payload": "Adquirir Pólizas"
                }
              ]
            },
            {          
              "type": "button",
              "sub_type": "quick_reply",
              "index": "1",
              "parameters": [
                {
                  "type": "payload",
                  "payload": "Mis Pólizas"
                }
              ]
            }
          ]
        }
      }
    });  

    // mark incoming message as read
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: message.id,
      },
    });
  
    //message = null;
    //contac = null;
    //business_phone_number_id = null;
}

//FUNCION PARA ENVIAR MENSAJE DE TIPO PLATILLA
function mensajePlantilla() {
    // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        "Content-Type": "application/json",
        "recipient_type": "individual",
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        
        //text: { body: texto /*+ message.text.body*/ },
        context: {
          message_id: message.id, // shows the message as a reply to the original user message
        },
        "type": "template", 
        "template": { 
          "name": "saludo_mnk", 
          "language": { 
            "code": "es" 
          },
          "components": [
            {
              "type": "header",
              "parameters": [
                {
                  "type": "image",
                  "image": {
                    "link": "http://imagentes.imsoluciones.net/IM/datosInteligentes/app/mnk.jpeg"
                    //"link": "http://invesvial.com/IM/datosInteligentes/app/logo_fibrazo.png"
                  }
                }
              ]
            }
          ]
        }
      }
    });

    // mark incoming message as read
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: message.id,
      },
    });
  
    //message = null;
    //contac = null;
    //business_phone_number_id = null;
}

// FUNCION PARA CONVERTIR A BASE64 LA FOTO TOMADA
async function convertImageBase64(mediaUrl) {
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
    console.log('✅ Imagen convertida a Base64 exitosamente');
    //console.log('✅ Imagen convertida a Base64:', base64Image);
    
    // Opcional: guardar el Base64 en un archivo para uso posterior
    //fs.writeFileSync('imagen_base64.txt', base64Image);
    //console.log('✅ Base64 guardado en "imagen_base64.txt"');

    return base64Image;
  } catch (error) {
    console.error('❌ Error convirtiendo la imagen a Base64:', error.response?.data || error.message);
  }
}

//FUNCION PARA ENVIAR MENSAJE DE TIPO LISTA DE BOTON
function mensajeInteractiveLista(texto, numeroComparendo) {
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        type: "interactive",
        interactive: {
          "type": "button",
          "body": {
            "text": texto
          },
          "action": {
            "buttons": [
              {
                "type": "reply",
                "reply": {
                  //"id": numeroComparendo,
                  "id": "PLAN",
                  "title": "SELECCIONAR"
                }
              }
            ]
          }
        },
      },
    });
  }

  function mensajeInteractivePagar(texto) {
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        type: "interactive",
        interactive: {
          "type": "button",
          "body": {
            "text": texto
          },
          "action": {
            "buttons": [
              {
                "type": "reply",
                "reply": {
                  //"id": numeroComparendo,
                  "id": "PAGAR",
                  "title": "IR A PAGAR"
                }
              }
            ]
          }
        },
      },
    });
}

//FUNCION PARA GENERAR EL TOKEN
const generarToken = async () => {
  const url = URL_SERVICE + ENDPOINTS_API_MNK.OBTENER_TOKEN;

  // Datos que deseas enviar
  const data = {
      'data':{
        "email": "Wasap@im.com",
        "clave": "123456789"
      },
      "platform": "AutoexpediblesMNKWhatsApp",
      "idAplicacion": 5
  }; 

  console.log("📦 URL", url);
  console.log("📦 Peticion Generar Nuevo Tokent", data);

  // Haciendo la solicitud POST
  fetch(url, {
      method: 'POST', // Método de la solicitud
      headers: {
          'Content-Type': 'application/json',
          'Authorization': AUTHORIZATION_SERVICE
      },
      body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
  }).then(response => {
      if (!response.ok) {
          console.error('❌ Error genenrardo TOKENT'+response.message);
      }

      return response.json(); // Convertir la respuesta a JSON
  }).then(data => {
      if(data.statusCode === 1){

        TOKENT = data.result.token;
        console.log('✅ NUEVO TOKENT', TOKENT);

      }else if(data.statusCode === 0){
        //MENSAJE ERROR
          console.error('❌ Error statusCode', data.statusCode);
          console.error('❌ Mensaje de Error', data.statusMessage); 

        console.error('❌ Error genenrando TOKENT');
      }else{
        //MENSAJE ERROR
        console.error('❌ Error statusCode', data.statusCode);
        console.error('❌ Mensaje de Error', data.statusMessage); 

        console.error('❌ Error genenrando TOKENT');
      }
  }).catch((error) => {
      console.error('❌ Error genenrando TOKENT:', error); 
  });   
}