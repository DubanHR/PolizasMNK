/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import express, { text } from "express";
import axios from "axios";
import fetch from "node-fetch";

import {TIPOS_OPCIONES} from "./utils/tipos-opciones.js"
import {ENDPOINTS_API}from "./networking/endpoints.api.js"
import {ExternalApi} from "./networking/external.api.js";
import {calcularEdad,convertImageBase64, consultarFecha, esAnuncio, esSaludo} from "./utils/utils.js"

// let message = null;
// let contac = null;
// let business_phone_number_id = null;
let mensaje = null;

let TOKENT = null; 

const app = express();
app.use(express.json()); 

//OBTIENE LOS DATOS DE LAS VARIABLES CREADAS EN .ENV
const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, FLOW_AUTORIZACION_LEY2300, FLOW_CORREO, FLOW_VIABILIDAD, FLOW_ACUERDO, FLOW_MIS_POLIZAS,FLOW_REGISTRAR_PERSONA, URL_SERVICE, AUTHORIZATION_SERVICE, PORT } = process.env;

app.post("/webhook", async (req, res) => {
  
  // check if the webhook request contains a message
  // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
  const contac = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0];
  const business_phone_number_id = req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

  //await generarToken();
  
  //VALIDA SI TIENE UN TOKEN SI NO LO GENERA
  if(TOKENT === null){
    await generarToken();
  }
  
  if(message != null){
    // log incoming messages
    console.log("JSON NUEVO MENSAJE entrante en webhook:", JSON.stringify(req.body, null, 2));
  }
  
  // MENSAJE DE TIPO TEXTO
  if (message?.type === "text") {
    console.log("💬 NUEVO TEXTO MENSAJE:", message.text.body);
    
    if(esAnuncio(message.text.body)){
      //IDENTIFICA SI ES UN ANUNCIO
      console.log('💬 Es Anuncio:', true); 
      
      //Consume servicio para registro de inicio de conversacion
        const url = URL_SERVICE + ENDPOINTS_API.INICIO_CONVERSACION;
        const hashFecha = consultarFecha();

        // Datos que deseas enviar
        const data = {
            'data':{
              'opcion':{
                "opcion": TIPOS_OPCIONES.INICIO_CONVERSACION,
                "numeroCelular": contac.wa_id,
                "hashConversacion": hashFecha + contac.wa_id
              },
              "mensaje": message.text.body
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
        }; 

        console.log("📦 Peticion inicio conversacion", data);

        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
                'token': TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error iniciando conversación');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
              mensajePlantilla(message, business_phone_number_id, contac);
            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 
              
              mensaje = "❌ "+data.statusMessage;
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

              mensaje = "❌ Error iniciando conversación";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensaje = "❌ Error iniciando conversación";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }
        }).catch((error) => {
            console.error('❌ Error validando el código:', error); // Manejar errores

            //MENSAJE ERROR
            mensaje = "❌ Error iniciando conversación";
            mensajeTexto(mensaje,message, business_phone_number_id);
        });
    }else if(esSaludo(message.text.body)){
        //IDENTIFICA SI ES UN SALUDO
        console.log('💬 Es Saludo:', true); 

        //Consume servicio para registro de inicio de conversacion
        const url = URL_SERVICE + ENDPOINTS_API.INICIO_CONVERSACION;
        const hashFecha = consultarFecha();

        // Datos que deseas enviar
        const data = {
            'data':{
              'opcion':{
                "opcion": TIPOS_OPCIONES.INICIO_CONVERSACION,
                "numeroCelular": contac.wa_id,
                "hashConversacion": hashFecha + contac.wa_id
              },
              "mensaje": message.text.body
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
        }; 

        console.log("📦 Peticion inicio conversacion", data);

        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
                'token': TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error iniciando conversación');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
              mensajePlantillaSaludo(message, business_phone_number_id, contac);
            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensaje = "❌ "+data.statusMessage;
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

              mensaje = "❌ Error iniciando conversación";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensaje = "❌ Error iniciando conversación";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }
        }).catch((error) => {
            console.error('❌ Error validando el código:', error); // Manejar errores

            //MENSAJE ERROR
            mensaje = "❌ Error iniciando conversación";
            mensajeTexto(mensaje,message, business_phone_number_id);
        });
     
    }else if(message.text.body === "Gracias"){
      console.log('💬 Es Despedida:', true); 
      
      //IDENTIFICA SI ES UNA DESPUEDIDA
      mensaje = "👋 Gracias por preferirnos. ¡Hasta pronto!";
      mensajeTexto(mensaje,message, business_phone_number_id); 
    }else if (!isNaN(message.text.body)) {
      consultarUltimoMensaje(message, business_phone_number_id, contac);
    }else{
      //MENSAJE NO ES VALIDO
      mensaje = "Mensaje no identificado";
      mensajeTexto(mensaje,message, business_phone_number_id);

      consultarUltimoMensajeNoIdentificado(message, business_phone_number_id, contac);
    }
    
  }else if(message?.type === "button"){
      console.log("💬 PRESIONO EL BOTON:", message.button?.payload);

      const url = URL_SERVICE + ENDPOINTS_API.REGISTRAR_OPCION;
      const hashFecha = consultarFecha();

      const opcion =  {
        "opcion": TIPOS_OPCIONES.REGISTRAR_OPCION,
        "numeroCelular": contac.wa_id,
        "hashConversacion": hashFecha + contac.wa_id
      };

      // Datos que deseas enviar
      const data = {
        'data':{
          'opcion': opcion,
          'mensaje': message.button?.payload
        },
        'platform': "PolizaWhatsApp",
        'idAplicacion': 2
      }; 

      console.log("📦 Peticion insertar opción de menú seleccionada", data);

      // Haciendo la solicitud POST
      fetch(url, {
          method: 'POST', // Método de la solicitud
          headers: {
              'Content-Type': 'application/json',
              'Authorization': AUTHORIZATION_SERVICE,
              'token': TOKENT
          },
          body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
      }).then(response => {
          if (!response.ok) {
              console.error('❌ Error registrando opcion seleccionada');
          }

          return response.json(); // Convertir la respuesta a JSON
      }).then(data => {
          if(data.statusCode === 1){
            //IDENTIFICA SI PRESIONO UN BOTON 
            if(message.button?.payload === "SOLICITAR_POLIZA"){  
              mensajePlantillaFlow(message, business_phone_number_id);
              
            }else if(message.button?.payload === "CONSULTAR_POLIZA"){ 
              
              mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar tus pólizas",
                                "Has clic en el botón para continuar", "CONSULTAR", FLOW_MIS_POLIZAS, message, business_phone_number_id);
              
            }else if(message.button?.payload === "PREGUNTAS_FRECUENTES"){ 
              
              mensaje = "Conoce más del Seguro de Vida de Colmena Seguros\n" +
              "https://www.colmenaseguros.com/documents/d/guest/infografia-trans-vida-3-\n\n" +
              "Conoce más del Seguro de Cumplimiento de Colmena Seguros\n" +
              "https://www.colmenaseguros.com/documents/d/guest/infografia-trans-cumplimiento-2-";
              mensajeTexto(mensaje,message, business_phone_number_id);
              
            }else if(message.button?.payload === "FINALIZAR"){ 
              mensaje = "✅ Hemos finalizado la conversación.\nGracias por elegirnos!";
              mensajeTexto(mensaje, message, business_phone_number_id);

            }else if(message.button?.payload === "REINTENTAR_PAGO"){ 

                const url = URL_SERVICE + ENDPOINTS_API.OBTENER_URL_PAGO;
                const hashFecha = consultarFecha();

                // Datos que deseas enviar
                const data = {
                    'data':{
                      'opcion':{
                        "opcion": TIPOS_OPCIONES.OBTENER_URL_PAGO,
                        "numeroCelular": contac.wa_id,
                        "hashConversacion": hashFecha + contac.wa_id
                      },
                      "AceptarPago": 1
                    },
                    'platform': "PolizaWhatsApp",
                    'idAplicacion': 2
                }; 

                console.log("📦 Peticion link de pago", data);

                // Haciendo la solicitud POST
                fetch(url, {
                    method: 'POST', // Método de la solicitud
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': AUTHORIZATION_SERVICE,
                        'token': TOKENT
                    },
                    body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
                }).then(response => {
                    if (!response.ok) {
                        console.error('❌ Error generando link de pago');
                    }

                    return response.json(); // Convertir la respuesta a JSON
                }).then(data => {
                    if(data.statusCode === 1){
                      console.log(data.result.data);
                      const URLPago = data.result.data.paymentURL;
                      mensaje = "Por favor, completa el proceso realizando el pago de tus pólizas en el siguiente enlace. Ten en cuenta que este pago se efectúa una sola vez durante toda la vigencia.\n👉 "+URLPago;
                      mensajeTexto(mensaje, message, business_phone_number_id);
                      
                    }else if(data.statusCode === 0){
                      //MENSAJE ERROR
                      console.error('❌ Error statusCode', data.statusCode);
                      console.error('❌ Mensaje de Error', data.statusMessage); 
                      
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
                                  "text": "✅ Has aceptado las autorizaciones y condiciones de tus pólizas. Para finalizar el proceso, realiza el pago haciendo clic en el botón." 
                                },
                                "action": {
                                  "buttons": [
                                    {
                                      "type": "reply",
                                      "reply": {
                                        "id": "PAGAR",
                                        "title": "REALIZAR PAGO"
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

                    }else if(data.statusCode === 401){
                      //MENSAJE ERROR
                      console.error('❌ Error statusCode', data.statusCode);
                      console.error('❌ Mensaje de Error', data.statusMessage); 

                      //Genera el nuevo token
                      generarToken();

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
                              "text": "✅ Has aceptado las autorizaciones y condiciones de tus pólizas. Para finalizar el proceso, realiza el pago haciendo clic en el botón." 
                            },
                            "action": {
                              "buttons": [
                                {
                                  "type": "reply",
                                  "reply": {
                                    "id": "PAGAR",
                                    "title": "REALIZAR PAGO"
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
                    }else{
                      //MENSAJE ERROR
                      console.error('❌ Error statusCode', data.statusCode);
                      console.error('❌ Mensaje de Error', data.statusMessage); 

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
                                  "text": "✅ Has aceptado las autorizaciones y condiciones de tus pólizas. Para finalizar el proceso, realiza el pago haciendo clic en el botón." 
                                },
                                "action": {
                                  "buttons": [
                                    {
                                      "type": "reply",
                                      "reply": {
                                        "id": "PAGAR",
                                        "title": "REALIZAR PAGO"
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

                    }
                }).catch((error) => {
                    console.error('❌ Error generar link:', error); // Manejar errores

                    //MENSAJE ERROR
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
                                  "text": "✅ Has aceptado las autorizaciones y condiciones de tus pólizas. Para finalizar el proceso, realiza el pago haciendo clic en el botón." 
                                },
                                "action": {
                                  "buttons": [
                                    {
                                      "type": "reply",
                                      "reply": {
                                        "id": "PAGAR",
                                        "title": "REALIZAR PAGO"
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

                });



















              
              
              
            }else if(message.button?.payload.startsWith("ENVIO_POLIZA_CORREO_")){ 
              const polizaId = message.button?.payload.replace("ENVIO_POLIZA_CORREO_", "");
              EnviarCaratula(polizaId, message, business_phone_number_id, contac);
            }
          }else if(data.statusCode === 0){
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);

            mensajePlantilla(message, business_phone_number_id, contac);
          }else if(data.statusCode === 401){
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //Genera el nuevo token
            generarToken();

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);

            mensajePlantilla(message, business_phone_number_id, contac);
          }else{
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);

            mensajePlantilla(message, business_phone_number_id, contac);
          }
      }).catch((error) => {
          console.error('❌ Error validando el código:', error); // Manejar errores

          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);

           mensajePlantilla(message, business_phone_number_id, contac);
      });



  }else if(message?.type === "interactive" && message?.interactive.type === "button_reply"){
    console.log("💬 PRESIONO EL BOTON:", message.interactive.button_reply.id);
    
    //IDENTIFICA SI PRESIONO UN BOTON Y CONSUME SERVICIO PARA REGISTRAR LA OPCION Q SELECCIONO
    if(message.interactive.button_reply.id === "PAGAR"){ 

        const url = URL_SERVICE + ENDPOINTS_API.OBTENER_URL_PAGO;
        const hashFecha = consultarFecha();

        // Datos que deseas enviar
        const data = {
            'data':{
              'opcion':{
                "opcion": TIPOS_OPCIONES.OBTENER_URL_PAGO,
                "numeroCelular": contac.wa_id,
                "hashConversacion": hashFecha + contac.wa_id
              },
              "AceptarPago": 1
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
        }; 

        console.log("📦 Peticion link de pago", data);

        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
                'token': TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error generando link de pago');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
              console.log(data.result.data);
              const URLPago = data.result.data.paymentURL;
              mensaje = "Por favor, completa el proceso realizando el pago de tus pólizas en el siguiente enlace. Ten en cuenta que este pago se efectúa una sola vez durante toda la vigencia.\n👉 "+URLPago;
              mensajeTexto(mensaje, message, business_phone_number_id);
              
            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 
              
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
                          "text": "✅ Has aceptado las autorizaciones y condiciones de tus pólizas. Para finalizar el proceso, realiza el pago haciendo clic en el botón." 
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "PAGAR",
                                "title": "REALIZAR PAGO"
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

            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

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
                      "text": "✅ Has aceptado las autorizaciones y condiciones de tus pólizas. Para finalizar el proceso, realiza el pago haciendo clic en el botón." 
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "PAGAR",
                            "title": "REALIZAR PAGO"
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
            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

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
                          "text": "✅ Has aceptado las autorizaciones y condiciones de tus pólizas. Para finalizar el proceso, realiza el pago haciendo clic en el botón." 
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "PAGAR",
                                "title": "REALIZAR PAGO"
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

            }
        }).catch((error) => {
            console.error('❌ Error generar link:', error); // Manejar errores

            //MENSAJE ERROR
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
                          "text": "✅ Has aceptado las autorizaciones y condiciones de tus pólizas. Para finalizar el proceso, realiza el pago haciendo clic en el botón." 
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "PAGAR",
                                "title": "REALIZAR PAGO"
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

        });

    }else if(message.interactive.button_reply.id === "REENVIAR_CODIGO"){ 
       //Consume servicio para reenviar el codigo
        const url = URL_SERVICE + ENDPOINTS_API.REENVIAR_CODIGO_CORREO;
        const hashFecha = consultarFecha();

        // Datos que deseas enviar
        const data = {
            'data':{
              'opcion':{
                "opcion": TIPOS_OPCIONES.REENVIAR_CODIGO_CORREO,
                "numeroCelular": contac.wa_id,
                "hashConversacion": hashFecha + contac.wa_id
              },
              "mensaje": "Presionó boton reenviar codigo"
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
        }; 

        console.log("📦 Peticion reenvio de codigo", data);

        // Haciendo la solicitud POST
        fetch(url, { 
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
                'token': TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error reenviando codigo');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
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
                        "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                      },
                      "action": {
                        "buttons": [
                          {
                            "type": "reply",
                            "reply": {
                              "id": "REENVIAR_CODIGO",
                              "title": "Reenviar código"
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

            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 
              
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
                  type: "interactive",
                  interactive: {
                    "type": "button",
                    "body": {
                      "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO",
                            "title": "Reenviar código"
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
            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

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
                  type: "interactive",
                  interactive: {
                    "type": "button",
                    "body": {
                      "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO",
                            "title": "Reenviar código"
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
            }else if(data.statusCode === 98 || data.statusCode === 96){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage);
              
              
              mensajeTexto("❌ Se ha alcanzado el limite de peticiones que se pueden para el reenvio del otp al correo, se comenzara de nuevo en el paso anterior.", message, business_phone_number_id);
              sleep(5000);
              mensajePlantillaFlow(message, business_phone_number_id)
              // mensajeFormulario("ESTUDIO DE VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
              //      "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD, message, business_phone_number_id);
                


              //mensajeTexto("❌ Se ha alcanzado el limite de peticiones que se pueden realizar, por favor comuniquese con un asesor para continuar con el proceso");

              // mensajeFormulario(data.statusMessage, "❌ Por favor ingrese el correo electronico al cual quiere enviar el codigo de validacion.\n\n",
              //             "Haga clic en el botón para ingresar correo", "INGRESAR CORREO", FLOW_CORREO);


            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensaje = "❌ Error reenvio del código";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }
        }).catch((error) => {
            console.error('❌ Error validando el código:', error); // Manejar errores

            //MENSAJE ERROR
            mensaje = "❌ Error reenvio del código";
            mensajeTexto(mensaje,message, business_phone_number_id);
        });

    }else if(message.interactive.button_reply.id === "INGRESAR_CORREO"){ 
       mensajeFormulario("NUEVO CORREO DE VALIDACIÓN", "Por favor ingrese el correo electronico al cual quiere enviar el codigo de validacion.\n\n",
                          "Haga clic en el botón para ingresar correo", "INGRESAR CORREO", FLOW_CORREO, message, business_phone_number_id);
    }else if(message.interactive.button_reply.id === "REENVIAR_CODIGO_CONSULTA"){ 
 //Consume servicio para reenviar el codigo
        const url = URL_SERVICE + ENDPOINTS_API.REENVIAR_CODIGO_CONSULTA;
        const hashFecha = consultarFecha();

        // Datos que deseas enviar
        const data = {
            'data':{
              'opcion':{
                "opcion": TIPOS_OPCIONES.REENVIAR_CODIGO_CONSULTA,
                "numeroCelular": contac.wa_id,
                "hashConversacion": hashFecha + contac.wa_id
              },
              "mensaje": "Presionó boton reenviar codigo"
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
        }; 

        console.log("📦 Peticion reenvio de codigo", data);

        // Haciendo la solicitud POST
        fetch(url, { 
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
                'token': TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error reenviando codigo');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
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
                      "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO_CONSULTA",
                            "title": "Reenviar código"
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

            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 
              
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
                  type: "interactive",
                  interactive: {
                    "type": "button",
                    "body": {
                      "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO_CONSULTA",
                            "title": "Reenviar código"
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
            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

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
                  type: "interactive",
                  interactive: {
                    "type": "button",
                    "body": {
                      "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO_CONSULTA",
                            "title": "Reenviar código"
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
            }else if(data.statusCode === 98){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage);
              mensajeTexto("❌ Se ha alcanzado el limite de peticiones que se pueden realizar, por favor comuniquese con un asesor para continuar con el proceso", message, business_phone_number_id);

              // mensajeFormulario(data.statusMessage, "❌ Por favor ingrese el correo electronico al cual quiere enviar el codigo de validacion.\n\n",
              //             "Haga clic en el botón para ingresar correo", "INGRESAR CORREO", FLOW_CORREO);


            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensaje = "❌ Error reenviando codigo";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }
        }).catch((error) => {
            console.error('❌ Error validando el código:', error); // Manejar errores

            //MENSAJE ERROR
            mensaje = "❌ Error reenviando codigo";
            mensajeTexto(mensaje,message, business_phone_number_id);
        });
    
    }else if(message.interactive.button_reply.id === "REENVIAR_CODIGO_Ley2300"){ 
       //Consume servicio para reenviar el codigo
        const url = URL_SERVICE + ENDPOINTS_API.REENVIAR_CODIGO_LEY;
        const hashFecha = consultarFecha();

        // Datos que deseas enviar
        const data = {
            'data':{
              'opcion':{
                "opcion": TIPOS_OPCIONES.REENVIAR_CODIGO_LEY,
                "numeroCelular": contac.wa_id,
                "hashConversacion": hashFecha + contac.wa_id
              },
              "mensaje": "Presionó boton reenviar codigo"
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
        }; 

        console.log("📦 Peticion reenvio de codigo", data);

        // Haciendo la solicitud POST
        fetch(url, { 
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
                'token': TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error reenviando codigo');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
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
                      "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO_Ley2300",
                            "title": "Reenviar código"
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

            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 
              
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
                  type: "interactive",
                  interactive: {
                    "type": "button",
                    "body": {
                      "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO_Ley2300",
                            "title": "Reenviar código"
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
            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

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
                  type: "interactive",
                  interactive: {
                    "type": "button",
                    "body": {
                      "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO_Ley2300",
                            "title": "Reenviar código"
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
            }else if(data.statusCode === 98){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage);
              mensajeTexto("❌ Se ha alcanzado el limite de peticiones que se pueden realizar, por favor comuniquese con un asesor para continuar con el proceso",message, business_phone_number_id);

              // mensajeFormulario(data.statusMessage, "❌ Por favor ingrese el correo electronico al cual quiere enviar el codigo de validacion.\n\n",
              //             "Haga clic en el botón para ingresar correo", "INGRESAR CORREO", FLOW_CORREO);


            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensaje = "❌ Error reenviando codigo";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }
        }).catch((error) => {
            console.error('❌ Error validando el código:', error); // Manejar errores

            //MENSAJE ERROR
            mensaje = "❌ Error reenviando codigo";
            mensajeTexto(mensaje,message, business_phone_number_id);
        });
    }

  }else if(message?.type === "interactive" && message?.interactive.type === "list_reply"){
    //IDENTIFICA SI UN MENSAJE DE RESPUESTA DE TIPO LISTA
      
      
    
  }else if (message?.type === "location") {
      //IDENTIFICA SI ES UN MENSAJE DE TIPO LOCALIZACION
      
    
    
  }else if (message?.type === "interactive" && message?.interactive.type === "nfm_reply") {
      //IDENTIFICA SI ES UN MENSAJE DE RESPUESTA DE UN FORMULARIO
      let respuesta = JSON.parse(message?.interactive.nfm_reply.response_json);
      let listaImagenes = [];
    
      console.log("💬 RESPUESTAS DEL FORMUALRIO", respuesta);
    
      if(respuesta.Formulario === "1"){   
          //ENVIA LOS DATOS DEL FORMULARIO
          const url = URL_SERVICE + ENDPOINTS_API.REGISTRAR_PERSONA;
          const hashFecha = consultarFecha();

          const opcion =  {
            "opcion": TIPOS_OPCIONES.REGISTRAR_PERSONA,
            "numeroCelular": contac.wa_id,
            "hashConversacion": hashFecha + contac.wa_id
          };

          const persona = {
            "primerNombre": respuesta.PrimerNombre,
            "segundoNombre": respuesta.SegundoNombre ?? "",
            "primerApellido": respuesta.PrimerApellido,
            "segundoApellido": respuesta.SegundoApellido ?? "",
            "email": respuesta.Correo,
            "idTipoDocumento": respuesta.TipoDocumento,
            "numeroDocumento": respuesta.NumeroDocumento,
          };

          const habeasGeneral = {"idTerminosyCondiciones":75,"aceptaTermino":1};
          const habeasVida = {"idTerminosyCondiciones":76,"aceptaTermino":1};

          const habeas = [habeasGeneral, habeasVida];

          console.log("HabeasData2:", JSON.stringify(habeas, null, 2));

         
          // Datos que deseas enviar
          const data = {
            'data':{
              'opcion': opcion,
              'persona': persona,
              'habeasData': habeas
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
          }; 

          console.log("📦 Peticion Formulario Validacion de identidad", JSON.stringify(data, null, 2));

          // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': AUTHORIZATION_SERVICE,
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
                      type: "interactive",
                      interactive: {
                        "type": "button",
                        "body": {
                          "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO",
                                "title": "Reenviar código"
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

              }else if(data.statusCode === 0){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //MENSAJE ERROR ENVIANDO FORMULARIO DE VALIDACION DE IDENTIDAD
                mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
                mensajeTexto(mensaje,message, business_phone_number_id);
                
                mensajePlantillaFlow(message, business_phone_number_id);
              }else if(data.statusCode === 401){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //Genera el nuevo token
                generarToken();

                //MENSAJE ERROR DE SEGURIDAD
                mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
                mensajeTexto(mensaje,message, business_phone_number_id);
                
                mensajePlantillaFlow(message, business_phone_number_id);
                
              }else{
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 
                
                //MENSAJE ERROR ENVIADO FORMUALRIO DE VALDIACION DE IDENTIDAD
                mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
                mensajeTexto(mensaje,message, business_phone_number_id);
                
                mensajePlantillaFlow(message, business_phone_number_id);
              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
              mensajeTexto(mensaje,message, business_phone_number_id);
              
              mensajePlantillaFlow(message, business_phone_number_id);
          }); 
      }else if(respuesta.Formulario === "2"){
          let listaImagenes = [];

          for (let i = 0; i < respuesta.FotoCedula.length; i++) {            
            let id = `${respuesta.FotoCedula?.[i].id}`;

            try {
              const response = await axios.get(`https://graph.facebook.com/v22.0/${id}`, {
                headers: {
                  Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                },
              });

              const mediaUrl = response.data.url;
              //console.log('✅ URL IMAGEN obtenida:', mediaUrl);

              const imagenBase64 = await convertImageBase64(mediaUrl);
              
              if(i === 0){
                let imagen = {cedulaFrontal:imagenBase64};
                listaImagenes.push(imagen);
              }

              if(i === 1){
                let imagen = {cedulaLateral:imagenBase64};
                listaImagenes.push(imagen);
              }
             
            } catch (error) {
              console.error('❌ Error al obtener URL IMAGEN:', error.response?.data || error.message);
            }
          }
        
          //ENVIA LOS DATOS DEL FORMULARIO DE ACUERDO DE PAGO
          const url = URL_SERVICE + ENDPOINTS_API.VALIDACION_VIABILIDAD;
          const hashFecha = consultarFecha();

          const opcion =  {
            "opcion": TIPOS_OPCIONES.VALIDACION_VIABILIDAD,
            "numeroCelular": contac.wa_id,
            "hashConversacion": hashFecha + contac.wa_id
          };

          const persona =  {
            "IdTipoDocumento": respuesta.TipoDocumento,
            "NumeroDocumento": respuesta.NumeroDocumento
          };

          // Datos que deseas enviar
          const data = {
            'data':{
              'opcion': opcion,
              'persona': persona,
              'imagenes': listaImagenes[0]
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
          };

          console.log("📦 Peticion Formulario de datos viabilidad", JSON.stringify(data));

           // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': AUTHORIZATION_SERVICE,
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
                      text: { body: "✅ Estamos validando tu información, Por favor, espera un momento para continuar con el proceso."}
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
                mensaje = "❌ Ocurrió un error al registrar los datos del formulario de viabilidad. Por favor, inténtalo de nuevo.";
                mensajeTexto(mensaje,message, business_phone_number_id);

                //Genera el nuevo token
                generarToken();
                
                mensajeFormulario("ESTUDIO DE VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD, message, business_phone_number_id);
                
              }else if(dat.statusCode === 0){
                  //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
                  mensaje = "❌ Ocurrió un error al registrar los datos del formulario de viabilidad. Por favor, inténtalo de nuevo.";
                  mensajeTexto(mensaje,message, business_phone_number_id);
                
                  mensajeFormulario("ESTUDIO DE VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                    "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD, message, business_phone_number_id);
              }else{
                  //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
                  mensaje = "❌ Ocurrió un error al registrar los datos del formulario de viabilidad. Por favor, inténtalo de nuevo.";
                  mensajeTexto(mensaje,message, business_phone_number_id);
                
                  mensajeFormulario("ESTUDIO DE VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                    "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD, message, business_phone_number_id);
              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
                  mensaje = "❌ Ocurrió un error al registrar los datos del formulario de viabilidad. Por favor, inténtalo de nuevo.";
                  mensajeTexto(mensaje,message, business_phone_number_id);
                
                  mensajeFormulario("ESTUDIO DE VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                    "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD, message, business_phone_number_id);
          });          
      }else if(respuesta.Formulario === "3"){

          const edad = calcularEdad(respuesta.FechaNacimiento);

          if (edad < 16 || edad > 70) {
              console.error('❌ Edad invalida:', edad); // Manejar errores
              mensajeFormulario(`ACUERDO`, "❌ La edad para aplicar a una poliza debe estar entre 16 y 70 años, si te equivocaste por favor vuelve a ingresar los datos\n\n",
                         "Por favor haga clic en el botón para FINALIZAR", "FINALIZAR", FLOW_ACUERDO, message, business_phone_number_id);
          }else{
            let listaImagenes = [];
            for (let i = 0; i < respuesta.FotoAcuerdo.length; i++) {            
              let id = `${respuesta.FotoAcuerdo?.[i].id}`;

              try {
                const response = await axios.get(`https://graph.facebook.com/v22.0/${id}`, {
                  headers: {
                    Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                  },
                });

              const mediaUrl = response.data.url;
                //console.log('✅ URL IMAGEN obtenida:', mediaUrl);

                const imagenBase64 = await convertImageBase64(mediaUrl);
                let imagen = {acuerdoDePago:imagenBase64};
                listaImagenes.push(imagen);

              } catch (error) {
                console.error('❌ Error al obtener URL IMAGEN:', error.response?.data || error.message);
              }
            }
            //ENVIA LOS DATOS DEL FORMULARIO DE ACUERDO DE PAGO
            const url = URL_SERVICE + ENDPOINTS_API.GENERAR_PREPOLIZA;
            const hashFecha = consultarFecha();

            const opcion =  {
              "opcion": TIPOS_OPCIONES.GENERAR_PREPOLIZA,
              "numeroCelular": contac.wa_id,
              "hashConversacion": hashFecha + contac.wa_id
            };

            const Beneficiario =  {
              "idRol": 16,
              "idTipoPersona": 1,
              "idTipoDocumento": respuesta.TipoDocumentoBeneficiario ?? "",
              "numeroDocumento": respuesta.NumeroDocumentoBeneficiario ?? "",
              "primerNombre": respuesta.PrimerNombreBeneficiario,
              "segundoNombre": respuesta.SegundoNombreBeneficiario ?? "",
              "primerApellido": respuesta.PrimerApellidoBeneficiario,
              "segundoApellido": respuesta.SegundoApellidoBeneficiario ?? "",
              "idParentesco": respuesta.ParentescoBeneficiario
            };

            const Cotizacion =  {
              "beneficiario": Beneficiario
            };

            const TelefonoBeneficiario =  {
              "idTipoTelefono": "2",
              "codigoPais": contac.wa_id.substring(0, 2),
              "numeroTelefono": contac.wa_id
            };

            const DireccionBeneficiario =  {
              "idTipoDeDireccion": "1",
              "direccionCompleta": respuesta.Direccion+", "+respuesta.Municipio,
              "idCodigoDane": respuesta.Departamento ?? 0,
            };

            const Persona =  {
              "idTipoPersona": 1,
              "rol": 1,
              "fechaNacimiento": respuesta.FechaNacimiento,
              "fechaExpedicion": respuesta.FechaExpedicion,
              "idGenero": respuesta.Genero,
              "idNacionalidad": respuesta.Nacionalidad ?? 1
            };

            const ima =  {
              "acuerdoDePago": ""
            };


            Persona.telefono = TelefonoBeneficiario;
            Persona.direccion = DireccionBeneficiario;

            // Datos que deseas enviar
            const data = {
              'data':{
                'persona': Persona,
                'opcion': opcion,
                'cotizacion': Cotizacion,
                'imagenes': listaImagenes[0]
              },
              'platform': "PolizaWhatsApp",
              'idAplicacion': 2
            };

            console.log("📦 Peticion Formulario de datos de acuerdo de pago", JSON.stringify(data, null, 2));

            // Haciendo la solicitud POST
            fetch(url, {
                method: 'POST', // Método de la solicitud
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTHORIZATION_SERVICE,
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
                        text: { body: "✅ Estamos preparando tu cotización, Por favor, espera un momento."}
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
                  console.error('❌ Error statusCode', data.statusCode);
                  console.error('❌ Mensaje de Error', data.statusMessage); 

                  //Genera el nuevo token
                  generarToken();

                  mensajeFormulario("ACUERDO", "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago.\n\nPor favor ingresa los siguientes datos para terminar",
                          "Por favor haga clic en el botón para FINALIZAR", "FINALIZAR", FLOW_ACUERDO,message, business_phone_number_id);
                  
                }else if(dat.statusCode === 0){
                  //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE ACUERDO DE PAGO
                  console.error('❌ Error statusCode', data.statusCode);
                  console.error('❌ Mensaje de Error', data.statusMessage); 

                  mensajeFormulario("ACUERDO", "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago.\n\nPor favor ingresa los siguientes datos para terminar",
                          "Por favor haga clic en el botón para FINALIZAR", "FINALIZAR", FLOW_ACUERDO, message, business_phone_number_id);
                }else{             
                  console.error('❌ Error statusCode', data.statusCode);
                  console.error('❌ Mensaje de Error', data.statusMessage); 

                  mensajeFormulario("ACUERDO", "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago.\n\nPor favor ingresa los siguientes datos para terminar",
                          "Por favor haga clic en el botón para FINALIZAR", "FINALIZAR", FLOW_ACUERDO, message, business_phone_number_id);
                }
            }).catch((error) => {
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 
              
                mensajeFormulario("ACUERDO", "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago.\n\nPor favor ingresa los siguientes datos para terminar",
                          "Por favor haga clic en el botón para FINALIZAR", "FINALIZAR", FLOW_ACUERDO, message, business_phone_number_id);
            }); 
          }
      }else if(respuesta.Formulario === "4"){
          const url = URL_SERVICE + ENDPOINTS_API.APROBAR_CONSULTA;
          const hashFecha = consultarFecha();

          const opcion =  {
            "opcion": TIPOS_OPCIONES.APROBAR_CONSULTA,
            "numeroCelular": contac.wa_id,
            "hashConversacion": hashFecha + contac.wa_id
          };
          const persona =  {
            "idTipoDocumento": respuesta.TipoDocumento,
            "numeroDocumento": respuesta.NumeroDocumento,
          };

          // Datos que deseas enviar
          const data = {
            'data':{
              'opcion': opcion,
              'persona': persona,
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
          }; 

          console.log("📦 Peticion Formulario consultar mis polizas", data);

          // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': AUTHORIZATION_SERVICE,
                  'token': TOKENT
              },
              body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
          }).then(response => {
              if (!response.ok) {
                  console.error('❌ Ocurrio un error registrando el formulario de consultar mis polizas');
              }

              return response.json(); // Convertir la respuesta a JSON
          }).then(data => {
              if(data.statusCode === 1){
                  
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
                        "text": "⏱️ Para continuar con el proceso, debemos validar tu identidad. Por favor ingresa el código que enviamos a tu correo electrónico."
                      },
                      "action": {
                        "buttons": [
                          {
                            "type": "reply",
                            "reply": {
                              "id": "REENVIAR_CODIGO_CONSULTA",
                              "title": "Reenviar código"
                            }
                          }
                        ]
                      }
                    },
                  },
                });  

                  // axios({
                  //   method: "POST",
                  //   url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                  //   headers: {
                  //     Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                  //   },
                  //   data: {
                  //     messaging_product: "whatsapp",
                  //     to: message.from,
                  //     //NOTA: Falta aca mapear los datos de las polizas
                  //     text: { body: "✅ Actualmente tiene las siguientes polizas activas"}
                  //   },
                  // });
                  
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
                mensaje = "❌ Ocurrio un error consultando las polizas, por favor intente de nuevo.";
                mensajeTexto(mensaje,message, business_phone_number_id);

                //Genera el nuevo token
                generarToken();
       
                mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus tus pólizas.",
                         "Has clic en el botón para continuar", "CONSULTAR", FLOW_MIS_POLIZAS, message, business_phone_number_id);
                
              }else if(data.statusCode === 0){
                //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE CONSULTAR POLIZAS
                mensaje = "❌ Ocurrio un error consultando las polizas, por favor intente de nuevo.";
                mensajeTexto(mensaje,message, business_phone_number_id);
                
                mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus tus pólizas.",
                         "Has clic en el botón para continuar", "CONSULTAR", FLOW_MIS_POLIZAS, message, business_phone_number_id);
              }else if(data.statusCode === 97){
                mensaje = "❌ El número de cédula ingresado no cuenta con pólizas registradas";
                mensajeTexto(mensaje,message, business_phone_number_id);
              
            }else{
                 //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE CONSULTAR POLIZAS
                mensaje = "❌ Ocurrio un error consultando las polizas, por favor intente de nuevo.";
                mensajeTexto(mensaje,message, business_phone_number_id);
                
                mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus tus pólizas.",
                         "Has clic en el botón para continuar", "CONSULTAR", FLOW_MIS_POLIZAS, message, business_phone_number_id);
              }
          }).catch((error) => {
              console.error('❌ Error Consultando polizas:', error); // Manejar errores
            
              //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE CONSULTAR POLIZAS
                mensaje = "❌ Ocurrio un error consultando las polizas, por favor intente de nuevo.";
                mensajeTexto(mensaje,message, business_phone_number_id);
                
                mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus tus pólizas.",
                         "Has clic en el botón para continuar", "CONSULTAR", FLOW_MIS_POLIZAS, message, business_phone_number_id);
          }); 

      }else if(respuesta.Formulario === "5"){    
          //ENVIA LOS DATOS DEL FORMULARIO CAMBIO DE CORREO
          const url = URL_SERVICE + "WhatsApp/ActualizarCorreo";
          const hashFecha = consultarFecha();

          const opcion =  {
            "opcion": 20,
            "numeroCelular": contac.wa_id,
            "hashConversacion": hashFecha + contac.wa_id
          };

          const persona = {
            "email": respuesta.Correo
          };
         
          // Datos que deseas enviar
          const data = {
            'data':{
              'opcion': opcion,
              'persona': persona
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
          }; 

          console.log("📦 Peticion Reenvio Correo Validacion", JSON.stringify(data, null, 2));

          // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': AUTHORIZATION_SERVICE,
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
                      type: "interactive",
                      interactive: {
                        "type": "button",
                        "body": {
                          "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO",
                                "title": "Reenviar código"
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

              }else if(data.statusCode === 0){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //MENSAJE ERROR ENVIANDO FORMULARIO DE NUEVO CORREO
                mensajeFormulario(data.statusMessage, "❌ Por favor ingrese el correo electronico al cual quiere enviar el codigo de validacion.\n\n",
                          "Haga clic en el botón para ingresar correo", "INGRESAR CORREO", FLOW_CORREO, message, business_phone_number_id);

              }else if(data.statusCode === 401){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //Genera el nuevo token
                generarToken();

                //MENSAJE ERROR ENVIANDO FORMULARIO DE NUEVO CORREO
                mensajeFormulario(data.statusMessage, "❌ Por favor ingrese el correo electronico al cual quiere enviar el codigo de validacion.\n\n",
                          "Haga clic en el botón para ingresar correo", "INGRESAR CORREO", FLOW_CORREO, message, business_phone_number_id);
              }else{
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 
                
                //MENSAJE ERROR ENVIANDO FORMULARIO DE NUEVO CORREO
                mensajeFormulario(data.statusMessage, "❌ Por favor ingrese el correo electronico al cual quiere enviar el codigo de validacion.\n\n",
                          "Haga clic en el botón para ingresar correo", "INGRESAR CORREO", FLOW_CORREO, message, business_phone_number_id);
              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              //MENSAJE ERROR ENVIANDO FORMULARIO DE NUEVO CORREO
              mensajeFormulario(data.statusMessage, "❌ Por favor ingrese el correo electronico al cual quiere enviar el codigo de validacion.\n\n",
                          "Haga clic en el botón para ingresar correo", "INGRESAR CORREO", FLOW_CORREO, message, business_phone_number_id);
          }); 
      }else if(respuesta.Formulario === "6"){    
          //ENVIA LOS DATOS DEL FORMULARIO CAMBIO DE CORREO
          const url = URL_SERVICE + ENDPOINTS_API.REGISTRAR_LEY;
          const hashFecha = consultarFecha();

          const opcion =  {
            "opcion": TIPOS_OPCIONES.REGISTRAR_LEY,
            "numeroCelular": contac.wa_id,
            "hashConversacion": hashFecha + contac.wa_id
          };
         
          // Datos que deseas enviar
          const data = {
            'data':{
              'opcion': opcion,
              'aceptaLey2300': 1
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
          }; 

          console.log("📦 Peticion aprovacion Ley 2300", JSON.stringify(data, null, 2));

          // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': AUTHORIZATION_SERVICE,
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
                  //RESPUESTA MENSAJE TIPO FORMULARIO AUTORIZACION LEY2300
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
                          "text": "⏱️ Para continuar con el proceso, ingresa el código de 6 dígitos que hemos enviado a tu correo electrónico como señal de aceptación de las condiciones de las pólizas y las autorizaciones brindadas."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO_Ley2300",
                                "title": "Reenviar código"
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

              }else if(data.statusCode === 0){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //MENSAJE ERROR ENVIANDO FORMULARIO DE AUTORIZACION LEY 2300
                mensajeFormulario(data.statusMessage, "❌ Ocurrio un error al intentar enviar la autorizacion por favor intente de nuevo\n\n",
                          "Haga clic en el botón Autorizar", "AUTORIZAR", FLOW_AUTORIZACION_LEY2300, message, business_phone_number_id);

              }else if(data.statusCode === 2){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //MENSAJE ERROR ENVIANDO FORMULARIO DE AUTORIZACION LEY 2300
                mensajeFormulario(data.statusMessage, "❌ "+data.statusMessage +" por favor intente de nuevo\n\n",
                          "Haga clic en el botón Autorizar", "AUTORIZAR", FLOW_AUTORIZACION_LEY2300, message, business_phone_number_id);

              }else if(data.statusCode === 401){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //Genera el nuevo token
                generarToken();

               //MENSAJE ERROR ENVIANDO FORMULARIO DE AUTORIZACION LEY 2300
                mensajeFormulario(data.statusMessage, "❌ Ocurrio un error al intentar enviar la autorizacion por favor intente de nuevo\n\n",
                          "Haga clic en el botón Autorizar", "AUTORIZAR", FLOW_AUTORIZACION_LEY2300, message, business_phone_number_id);

              }else{
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 
                
               //MENSAJE ERROR ENVIANDO FORMULARIO DE AUTORIZACION LEY 2300
                mensajeFormulario(data.statusMessage, "❌ Ocurrio un error al intentar enviar la autorizacion por favor intente de nuevo\n\n",
                          "Haga clic en el botón Autorizar", "AUTORIZAR", FLOW_AUTORIZACION_LEY2300, message, business_phone_number_id);
              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
             //MENSAJE ERROR ENVIANDO FORMULARIO DE AUTORIZACION LEY 2300
              mensajeFormulario(data.statusMessage, "❌ Ocurrio un error al intentar enviar la autorizacion por favor intente de nuevo\n\n",
                          "Haga clic en el botón Autorizar", "AUTORIZAR", FLOW_AUTORIZACION_LEY2300, message, business_phone_number_id);
          }); 
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

//FUNCION PARA ENVIAR MENSAJE DE TIPO TEXTO
function mensajeFormulario(titulo, mensaje, footer, nombreBoton, id, message, business_phone_number_id) {
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

//FUNCION PARA ENVIAR MENSAJE DE TIPO TEXTO
function mensajeTexto(texto, message, business_phone_number_id) {
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

//FUNCION PARA ENVIAR MENSAJE DE TIPO PLANTILLA
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
          "name": "saludo_menu_colmena_consultar", 
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
                    "link": "https://devpolizasmart.imsoluciones.net:8443/app/repositorio/Imagenes/LogoColmena.png"
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
                  "payload": "PREGUNTAS_FRECUENTES"
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
                  "payload": "CONSULTAR_POLIZA"
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

//FUNCION PARA ENVIAR MENSAJE DE TIPO PLANTILLA
function mensajePlantilla(message, business_phone_number_id, contac) {
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
          "name": "saludo_menu_colmena", 
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
                    "link": "https://devpolizasmart.imsoluciones.net:8443/app/repositorio/Imagenes/LogoColmena.png"
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
                  "payload": "SOLICITAR_POLIZA"
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
                  "payload": "PREGUNTAS_FRECUENTES"
                }
              ]
            },
            {          
              "type": "button",
              "sub_type": "quick_reply",
              "index": "2",
              "parameters": [
                {
                  "type": "payload",
                  "payload": "CONSULTAR_POLIZA"
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



//FUNCION PARA ENVIAR MENSAJE DE TIPO PLANTILLA CON FLOW
function mensajePlantillaFlow(message, business_phone_number_id) {
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
        "name": "plantilla_validar_identidad", 
        "language": { 
          "code": "es" 
        },
        "components": [
          {
            "type": "button",
            "sub_type": "flow",
            "index": "0",
            "parameters": [
              {
                "type": "text",
                "text": "838994295420992"
              }
            ]
          }
        ]
      }
    }
  });
}

//FUNCION PARA GENERAR EL TOKEN
const generarToken = async () => {
  const url = URL_SERVICE + ENDPOINTS_API.OBTENER_TOKEN;

  // Datos que deseas enviar
  const data = {
      'data':{
          "username": "Wasap@im.com",
          "clave": "4c0f5362badb1400Ed5WRNgZ7vYYBO832rgDmSCcx7HGIJR7jGZ6yQ0E5b8="
      },
      "platform": "PolizaWhatsApp",
      "idAplicacion":2
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

const validarPersona = (message, business_phone_number_id, contac) =>{
        console.log('💬 Es Codigo de 4 digitos:', true); 
        
        //Consume servicio para validar el codigo
        const url = URL_SERVICE + ENDPOINTS_API.VALIDAR_PERSONA;
        const hashFecha = consultarFecha();

        const opcion =  {
          "opcion": TIPOS_OPCIONES.VALIDAR_PERSONA,
          "numeroCelular": contac.wa_id,
          "hashConversacion": hashFecha + contac.wa_id
        };

        // Datos que deseas enviar
        const data = {
          'data':{
            'opcion': opcion,
            'mensaje': message.text.body
          },
          'platform': "PolizaWhatsApp",
          'idAplicacion': 2
        }; 

        console.log("📦 Peticion validar codigo OTP", data);

        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
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
              mensajeFormulario("ESTUDIO DE VIABILIDAD", "✅ Tu identidad ha sido validada exitosamente.\n\nAhora debemos validar la viabilidad para adquirir tus pólizas.\n\nPor favor, ingresa los siguientes datos para continuar.\n\n",
                          "Haz clic en el botón para iniciar", "INGRESAR DATOS", FLOW_VIABILIDAD, message, business_phone_number_id);

            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //MENSAJE ENVIANDO EL CORREO
              mensaje = "❌ "+data.statusMessage;
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

              //MENSAJE ENVIANDO EL CORREO
              // mensaje = "❌ Error validando el código, por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
              // mensajeTexto(mensaje);
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
                      "text": "❌ El código ingresado es incorrecto. Por favor, intenta de nuevo con el código de 4 dígitos que enviamos a tu correo electrónico."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO",
                            "title": "Reenviar código"
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
            }else if(data.statusCode === 99){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //MENSAJE ENVIANDO EL CORREO
              // mensaje = "❌ El "+data.statusMessage+", por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
              // mensajeTexto(mensaje);

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
                          "text": "❌ El código ingresado es incorrecto. Por favor, intenta de nuevo con el código de 4 dígitos que enviamos a tu correo electrónico"
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO",
                                "title": "Reenviar código"
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

            }else if(data.statusCode === 98){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensajeTexto("❌ Se ha alcanzado el limite de peticiones que se pueden realizar, por favor comuniquese con un asesor para continuar con el proceso",message, business_phone_number_id);


              //RESPUESTA MENSAJE TIPO FORMULARIO DE DATOS DE VALIDACION
                  // axios({
                  //   method: "POST",
                  //   url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                  //   headers: {
                  //     Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                  //   },
                  //   data: {
                  //     messaging_product: "whatsapp",
                  //     to: message.from,
                  //     type: "interactive",
                  //     interactive: {
                  //       "type": "button",
                  //       "body": {
                  //         "text": "❌ "+data.statusMessage+", Quiere?\n\nReenviar código al correo actual o ingresar un nuevo correo?" 
                  //       },
                  //       "action": {
                  //         "buttons": [
                  //           {
                  //             "type": "reply",
                  //             "reply": {
                  //               "id": "REENVIAR_CODIGO",
                  //               "title": "Reenviar código"
                  //             }
                  //           },
                  //           {
                  //             "type": "reply",
                  //             "reply": {
                  //               "id": "INGRESAR_CORREO",
                  //               "title": "Nuevo correo"
                  //             }
                  //           }
                  //         ]
                  //       }
                  //     },
                  //   },
                  // });

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
              
              
            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //MENSAJE ENVIANDO EL CORREO
              // mensaje = "❌ Error validando el código, por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
              // mensajeTexto(mensaje);

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
                          "text": "❌ El código ingresado es incorrecto. Por favor, intenta de nuevo con el código de 4 dígitos que enviamos a tu correo electrónico."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO",
                                "title": "Reenviar código"
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

            }
        }).catch((error) => {
            console.error('❌ Error validando el código:', error); // Manejar errores

            //MENSAJE ENVIANDO EL CORREO
            // mensaje = "❌ Error validando el código, por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
            // mensajeTexto(mensaje);

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
                          "text": "❌ El código ingresado es incorrecto. Por favor, intenta de nuevo con el código de 4 dígitos que enviamos a tu correo electrónico."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO",
                                "title": "Reenviar código"
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
        });     
};
const validarLey = (message, business_phone_number_id, contac) =>{
  
       console.log('💬 Es Codigo de 6 digitos:', true); 
        
        //Consume servicio para validar el codigo
        const url = URL_SERVICE + ENDPOINTS_API.VALIDAR_LEY;
        const hashFecha = consultarFecha();

        const opcion =  {
          "opcion": TIPOS_OPCIONES.VALIDAR_LEY,
          "numeroCelular": contac.wa_id,
          "hashConversacion": hashFecha + contac.wa_id
        };

        // Datos que deseas enviar
        const data = {
          'data':{
            'opcion': opcion,
            'mensaje': message.text.body
          },
          'platform': "PolizaWhatsApp",
          'idAplicacion': 2
        }; 

        console.log("📦 Peticion validar codigo OTP", data);

        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
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
                  type: "interactive",
                  interactive: {
                    "type": "button",
                    "body": {
                      "text": "✅ Has aceptado las autorizaciones y condiciones de tus pólizas. Para finalizar el proceso, realiza el pago haciendo clic en el botón." 
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "PAGAR",
                            "title": "REALIZAR PAGO"
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

            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //MENSAJE ENVIANDO EL CORREO
              mensaje = "❌ "+data.statusMessage;
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else if(data.statusCode === 2){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //MENSAJE ENVIANDO EL CORREO
              // mensaje = "❌ "+data.statusMessage+" Por favor ingresa el código de 6 digitos enviado a tú correo electrónico";
              // mensajeTexto(mensaje);

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
                          "text": "❌ El código ingresado no es válido. Por favor ingresa el código de 6 dígitos que enviamos a tu correo electrónico para continuar."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO",
                                "title": "Reenviar código"
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

            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

              //MENSAJE ENVIANDO EL CORREO
              // mensaje = "❌ Error validando el código, por favor ingresa el código de 6 digitos enviado a tú correo electrónico";
              // mensajeTexto(mensaje);
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
                      "text": "❌ El código ingresado no es válido. Por favor ingresa el código de 6 dígitos que enviamos a tu correo electrónico para continuar."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO",
                            "title": "Reenviar código"
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
            }else if(data.statusCode === 99){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //MENSAJE ENVIANDO EL CORREO
              // mensaje = "❌ El "+data.statusMessage+", por favor ingresa el código de 6 digitos enviado a tú correo electrónico";
              // mensajeTexto(mensaje);

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
                          "text": "❌ El código ingresado no es válido. Por favor ingresa el código de 6 dígitos que enviamos a tu correo electrónico para continuar."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO",
                                "title": "Reenviar código"
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

            }else if(data.statusCode === 98){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //RESPUESTA MENSAJE TIPO FORMULARIO DE DATOS DE VALIDACION
                  // axios({
                  //   method: "POST",
                  //   url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                  //   headers: {
                  //     Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                  //   },
                  //   data: {
                  //     messaging_product: "whatsapp",
                  //     to: message.from,
                  //     type: "interactive",
                  //     interactive: {
                  //       "type": "button",
                  //       "body": {
                  //         "text": "❌ "+data.statusMessage+", Quiere?\n\nReenviar código al correo actual o ingresar un nuevo correo?" 
                  //       },
                  //       "action": {
                  //         "buttons": [
                  //           {
                  //             "type": "reply",
                  //             "reply": {
                  //               "id": "REENVIAR_CODIGO_ACUERDO",
                  //               "title": "Reenviar código"
                  //             }
                  //           },
                  //           {
                  //             "type": "reply",
                  //             "reply": {
                  //               "id": "INGRESAR_CORREO_ACUERDO",
                  //               "title": "Nuevo correo"
                  //             }
                  //           }
                  //         ]
                  //       }
                  //     },
                  //   },
                  // });
                  mensajeTexto("❌ Se ha alcanzado el limite de peticiones que se pueden realizar, por favor comuniquese con un asesor para continuar con el proceso",message, business_phone_number_id);

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
              
              
            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //MENSAJE ENVIANDO EL CORREO
              // mensaje = "❌ Error validando el código, por favor ingresa el código de 6 digitos enviado a tú correo electrónico";
              // mensajeTexto(mensaje);
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
                          "text": "❌ El código ingresado no es válido. Por favor ingresa el código de 6 dígitos que enviamos a tu correo electrónico para continuar."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO",
                                "title": "Reenviar código"
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

            }
        }).catch((error) => {
            console.error('❌ Error validando el código:', error); // Manejar errores

            //MENSAJE ENVIANDO EL CORREO
            // mensaje = "❌ Error validando el código, por favor ingresa el código de 6 digitos enviado a tú correo electrónico";
            // mensajeTexto(mensaje);

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
                          "text": "❌ El código ingresado no es válido. Por favor ingresa el código de 6 dígitos que enviamos a tu correo electrónico para continuar."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO",
                                "title": "Reenviar código"
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

        });
};
const validarConsulta = (ultimoMensaje, message, business_phone_number_id, contac) =>{
    console.log('💬 Es Codigo de 4 digitos:', true); 
        
        //Consume servicio para validar el codigo
        const url = URL_SERVICE + ENDPOINTS_API.VALIDAR_CONSULTA;
        const hashFecha = consultarFecha();

        const opcion =  {
          "opcion": TIPOS_OPCIONES.VALIDAR_CONSULTA,
          "numeroCelular": contac.wa_id,
          "hashConversacion": hashFecha + contac.wa_id
        };

        // Datos que deseas enviar
        const data = {
          'data':{
            'opcion': opcion,
            'mensaje': message.text.body
          },
          'platform': "PolizaWhatsApp",
          'idAplicacion': 2
        }; 

        console.log("📦 Peticion validar codigo OTP", data);

        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
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
                        text: { body: "✅ Estamos consultando tus póliza, por favor, espera un momento."}
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

              consultarPolizas(ultimoMensaje, message, business_phone_number_id, contac);
            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //MENSAJE ENVIANDO EL CORREO
              mensaje = "❌ "+data.statusMessage;
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

              //MENSAJE ENVIANDO EL CORREO
              // mensaje = "❌ Error validando el código, por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
              // mensajeTexto(mensaje);
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
                      "text": "❌ El código ingresado es incorrecto. Por favor, intenta de nuevo con el código que enviamos a tu correo electrónico."
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "REENVIAR_CODIGO_CONSULTA",
                            "title": "Reenviar código"
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
            }else if(data.statusCode === 99){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //MENSAJE ENVIANDO EL CORREO
              // mensaje = "❌ El "+data.statusMessage+", por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
              // mensajeTexto(mensaje);

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
                          "text": "❌ El código ingresado es incorrecto. Por favor, intenta de nuevo con el código que enviamos a tu correo electrónico."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO_CONSULTA",
                                "title": "Reenviar código"
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

            }else if(data.statusCode === 98){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensajeTexto("❌ Se ha alcanzado el limite de peticiones que se pueden realizar, por favor comuniquese con un asesor para continuar con el proceso",message, business_phone_number_id);


              //RESPUESTA MENSAJE TIPO FORMULARIO DE DATOS DE VALIDACION
                  // axios({
                  //   method: "POST",
                  //   url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                  //   headers: {
                  //     Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                  //   },
                  //   data: {
                  //     messaging_product: "whatsapp",
                  //     to: message.from,
                  //     type: "interactive",
                  //     interactive: {
                  //       "type": "button",
                  //       "body": {
                  //         "text": "❌ "+data.statusMessage+", Quiere?\n\nReenviar código al correo actual o ingresar un nuevo correo?" 
                  //       },
                  //       "action": {
                  //         "buttons": [
                  //           {
                  //             "type": "reply",
                  //             "reply": {
                  //               "id": "REENVIAR_CODIGO",
                  //               "title": "Reenviar código"
                  //             }
                  //           },
                  //           {
                  //             "type": "reply",
                  //             "reply": {
                  //               "id": "INGRESAR_CORREO",
                  //               "title": "Nuevo correo"
                  //             }
                  //           }
                  //         ]
                  //       }
                  //     },
                  //   },
                  // });

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
              
              
            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //MENSAJE ENVIANDO EL CORREO
              // mensaje = "❌ Error validando el código, por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
              // mensajeTexto(mensaje);

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
                          "text": "❌ El código ingresado es incorrecto. Por favor, intenta de nuevo con el código que enviamos a tu correo electrónico."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO_CONSULTA",
                                "title": "Reenviar código"
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

            }
        }).catch((error) => {
            console.error('❌ Error validando el código:', error); // Manejar errores

            //MENSAJE ENVIANDO EL CORREO
            // mensaje = "❌ Error validando el código, por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
            // mensajeTexto(mensaje);

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
                          "text": "❌ El código ingresado es incorrecto. Por favor, intenta de nuevo con el código que enviamos a tu correo electrónico."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO_CONSULTA",
                                "title": "Reenviar código"
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

        });        

};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const consultarPolizas = (ultimoMensaje, message, business_phone_number_id, contac) => {
  console.log(ultimoMensaje)

    console.log('💬 Consulta poliza:', true); 
      
      //Consume servicio para registro de inicio de conversacion
        const url = URL_SERVICE + ENDPOINTS_API.OBTENER_POLIZAS_DOCUMENTO;
        const hashFecha = consultarFecha();

        // Datos que deseas enviar
        const data = {
            'data':{
              'opcion':{
                "opcion": TIPOS_OPCIONES.OBTENER_POLIZAS_DOCUMENTO,
                "numeroCelular": contac.wa_id,
                "hashConversacion": hashFecha + contac.wa_id
              },
              "persona":{
                  "idTipoDocumento": ultimoMensaje.idTipoDocumento,
                  "numeroDocumento": ultimoMensaje.numeroDocumento,
              }
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
        }; 

        console.log("📦 Peticion consulta poliza", data);
        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
                'token': TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error consulta poliza');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
              sleep(5000); // 2 segundos

              data.result.poliza.forEach(poliza => {
                  console.log(poliza)

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
                        "name": "plantilla_mis_polizas", 
                        "language": { 
                          "code": "es" 
                        },
                        "components": [
                          {
                            "type": "body",
                            "parameters": [
                              {
                                "type": "text",
                                "text": `${poliza.detallePolizas[0].tipoPoliza}`
                              },
                              {
                                "type": "text",
                                "text": `${poliza.detallePolizas[0].codigoPoliza}`
                              },
                              {
                                "type": "text",
                                "text": `${poliza.detallePolizas[1].tipoPoliza}`
                              },
                              {
                                "type": "text",
                                "text": `${poliza.detallePolizas[1].codigoPoliza}`
                              },
                              {
                                "type": "text",
                                "text": `${poliza.fechaInicioPoliza}`
                              },
                              {
                                "type": "text",
                                "text": `${poliza.fechaFinPoliza}`
                              },
                              {
                                "type": "text",
                                "text": `${poliza.montoAsegurado}`
                              },
                              {
                                "type": "text",
                                "text": `${poliza.valorPoliza}`
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
                                "payload": `ENVIO_POLIZA_CORREO_${poliza.codigoPoliza}`
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
                  
                  
                  
                  
                  
                  
                  
                  
                  
                  
                  
                  
                  
                  
                  
                  
                  
                  /*const texto = `*Código póliza* ${poliza.codigoPoliza}\n*Monto asegurado* ${poliza.montoAsegurado} \n*Cantidad cuotas* ${poliza.cantidadCuotas}\n*Valor póliza* ${poliza.valorPoliza}\n*Fecha inicio póliza* ${poliza.fechaInicioPoliza}\n*Fecha fin póliza* ${poliza.fechaFinPoliza}`
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
                                  "id": `ENVIO_POLIZA_CORREO_${poliza.codigoPoliza}`,
                                  "title": "Enviar a correo"
                                }
                              }
                            ]
                          }
                        },
                      },
                    });*/
              });
            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 
              
              mensaje = "❌ "+data.statusMessage;
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

              mensaje = "❌ Error consulta poliza";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensaje = "❌ Error consulta poliza";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }
        }).catch((error) => {
            console.error('❌ Error validando el código:', error); // Manejar errores

            //MENSAJE ERROR
            mensaje = "❌ Error consulta poliza";
            mensajeTexto(mensaje,message, business_phone_number_id);
        });

}

const consultarUltimoMensaje = (message, business_phone_number_id, contac) => {
    //Consume servicio para registro de inicio de conversacion
        const url = URL_SERVICE + ENDPOINTS_API.OBTENER_ULTIMO_MENSAJE;
        const hashFecha = consultarFecha();

        // Datos que deseas enviar
        const data = {
            'data':{
              'opcion':{
                "opcion": TIPOS_OPCIONES.OBTENER_ULTIMO_MENSAJE,
                "numeroCelular": contac.wa_id,
                "hashConversacion": hashFecha + contac.wa_id
              },
              "mensaje": ""
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
        }; 

        console.log("📦 Peticion estado actual conversación", data);
        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
                'token': TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error estado actual conversación');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
                if(message.text.body.length != 4 && message.text.body.length != 6){
                  mensaje = "❌ El código ingresado no tiene una longitud valida, Por favor ingresa el código enviado a tú correo electrónico.";
                        mensajeTexto(mensaje,message, business_phone_number_id);
                }else{
                   console.log(data);
                    if(data.result.idUltimoMensaje == TIPOS_OPCIONES.VALIDAR_CONSULTA || data.result.idUltimoMensaje == TIPOS_OPCIONES.APROBAR_CONSULTA || data.result.idUltimoMensaje == TIPOS_OPCIONES.REENVIAR_CODIGO_CONSULTA ){
                      validarConsulta(data.result.persona, message, business_phone_number_id, contac);
                    }else if(data.result.idUltimoMensaje == TIPOS_OPCIONES.REGISTRAR_PERSONA || data.result.idUltimoMensaje == TIPOS_OPCIONES.REENVIAR_CODIGO_CORREO || data.result.idUltimoMensaje == TIPOS_OPCIONES.VALIDAR_PERSONA){
                      validarPersona(message, business_phone_number_id,contac);
                  }else if(data.result.idUltimoMensaje == TIPOS_OPCIONES.REGISTRAR_LEY || data.result.idUltimoMensaje == TIPOS_OPCIONES.REENVIAR_CODIGO_LEY || data.result.idUltimoMensaje == TIPOS_OPCIONES.VALIDAR_LEY){
                      validarLey(message, business_phone_number_id, contac);
                  }
                }
            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 
              
              mensaje = "❌ "+data.statusMessage;
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

              mensaje = "❌ Error estado conversación";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensaje = "❌ Error estado conversación";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }
        }).catch((error) => {
            console.error('❌ Error estado conversación:', error); // Manejar errores

            //MENSAJE ERROR
            mensaje = "❌ Error estado de la conversación";
            mensajeTexto(mensaje,message, business_phone_number_id);
        });

}


const consultarUltimoMensajeNoIdentificado = (message, business_phone_number_id, contac) => {
    //Consume servicio para registro de inicio de conversacion
        const url = URL_SERVICE + ENDPOINTS_API.OBTENER_ULTIMO_MENSAJE;
        const hashFecha = consultarFecha();

        // Datos que deseas enviar
        const data = {
            'data':{
              'opcion':{
                "opcion": TIPOS_OPCIONES.OBTENER_ULTIMO_MENSAJE,
                "numeroCelular": contac.wa_id,
                "hashConversacion": hashFecha + contac.wa_id
              },
              "mensaje": ""
            },
            'platform': "PolizaWhatsApp",
            'idAplicacion': 2
        }; 

        console.log("📦 Peticion estado actual conversación", data);
        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
                'token': TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error estado actual conversación');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){

              switch (data.result.idUltimoMensaje) {
                case TIPOS_OPCIONES.INICIO_CONVERSACION:
                  console.log("El mensaje anterior es INICIO_CONVERSACION");

                  mensajePlantilla(message, business_phone_number_id, contac);
                  break;

                case TIPOS_OPCIONES.REGISTRAR_OPCION:
                  console.log("El mensaje anterior es REGISTRAR_OPCION");

                  mensajePlantillaFlow(message, business_phone_number_id);
                  break;

                case TIPOS_OPCIONES.REGISTRAR_PERSONA:
                  console.log("El mensaje anterior es REGISTRAR_PERSONA");

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
                          "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO",
                                "title": "Reenviar código"
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
                  break;

                case TIPOS_OPCIONES.VALIDAR_PERSONA:
                  console.log("El mensaje anterior es VALIDAR_PERSONA");

                  mensajeFormulario("ESTUDIO DE VIABILIDAD", "✅ Tu identidad ha sido validada exitosamente.\n\nAhora debemos validar la viabilidad para adquirir tus pólizas.\n\nPor favor, ingresa los siguientes datos para continuar.\n\n",
                          "Haga clic en el botón  Ingresar datos", "INGRESAR DATOS", FLOW_VIABILIDAD, message, business_phone_number_id);
                  break;

                case TIPOS_OPCIONES.REENVIAR_CODIGO_CORREO:
                  console.log("El mensaje anterior es REENVIAR_CODIGO_CORREO");

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
                            "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                          },
                          "action": {
                            "buttons": [
                              {
                                "type": "reply",
                                "reply": {
                                  "id": "REENVIAR_CODIGO",
                                  "title": "Reenviar código"
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
                  break;

                case TIPOS_OPCIONES.VALIDACION_VIABILIDAD:
                  console.log("El mensaje anterior es VALIDACION_VIABILIDAD");

                  axios({
                    method: "POST",
                    url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                    headers: {
                      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                    data: {
                      messaging_product: "whatsapp",
                      to: message.from,
                      text: { body: "✅ Estamos validando tu información, Por favor, espera un momento para continuar con el proceso."}
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
                  break;

                case TIPOS_OPCIONES.GENERAR_PREPOLIZA:
                  console.log("El mensaje anterior es GENERAR_PREPOLIZA");

                  axios({
                      method: "POST",
                      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                      headers: {
                        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                      },
                      data: {
                        messaging_product: "whatsapp",
                        to: message.from,
                        text: { body: "✅ Estamos preparando tu cotización, Por favor, espera un momento."}
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
                  break;

                case TIPOS_OPCIONES.REGISTRAR_LEY:
                  console.log("El mensaje anterior es REGISTRAR_LEY");

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
                          "text": "⏱️ Para continuar con el proceso, ingresa el código de 6 dígitos que hemos enviado a tu correo electrónico como señal de aceptación de las condiciones de las pólizas y las autorizaciones brindadas."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO_Ley2300",
                                "title": "Reenviar código"
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
                  break;

                case TIPOS_OPCIONES.VALIDAR_LEY:
                  console.log("El mensaje anterior es VALIDAR_LEY");

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
                          "text": "✅ Has aceptado la compra éxitosamente, por favor oprima el boton pagar, para ir al link" 
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "PAGAR",
                                "title": "IR A PAGAR"
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
                  break;

                case TIPOS_OPCIONES.REENVIAR_CODIGO_LEY:
                  console.log("El mensaje anterior es REENVIAR_CODIGO_LEY");

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
                          "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO_Ley2300",
                                "title": "Reenviar código"
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

                  break;

                case TIPOS_OPCIONES.OBTENER_URL_PAGO:
                  console.log("El mensaje anterior es OBTENER_URL_PAGO");

                  mensaje = "Por favor, completa el proceso realizando el pago de tus pólizas en el enlace enviado anteriormente.\n\nTen en cuenta que este pago se realizá una única vez durante toda la vigencia.";
                  mensajeTexto(mensaje ,message, business_phone_number_id);

                  break;

                case TIPOS_OPCIONES.APROBAR_CONSULTA:
                  console.log("El mensaje anterior es APROBAR_CONSULTA");

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
                          "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO_CONSULTA",
                                "title": "Reenviar código"
                              }
                            }
                          ]
                        }
                      },
                    },
                  });  

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
                  mensajeTexto(mensaje ,message, business_phone_number_id);

                  break;

                case TIPOS_OPCIONES.VALIDAR_CONSULTA:
                  console.log("El mensaje anterior es VALIDAR_CONSULTA");

                  axios({
                    method: "POST",
                    url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                    headers: {
                      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                    data: {
                      messaging_product: "whatsapp",
                      to: message.from,
                      text: { body: "✅ Estamos consultando tus póliza, por favor, espera un momento."}
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

                  break;

                case TIPOS_OPCIONES.REENVIAR_CODIGO_CONSULTA:
                  console.log("El mensaje anterior es REENVIAR_CODIGO_CONSULTA");

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
                          "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico para continuar con el proceso."
                        },
                        "action": {
                          "buttons": [
                            {
                              "type": "reply",
                              "reply": {
                                "id": "REENVIAR_CODIGO_CONSULTA",
                                "title": "Reenviar código"
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

                  break;

                case TIPOS_OPCIONES.OBTENER_POLIZAS_DOCUMENTO:
                  console.log("El mensaje anterior es OBTENER_POLIZAS_DOCUMENTO");

                  mensaje = "📄 Tus pólizas fueron enviadas en el mensaje anterior";
                  mensajeTexto(mensaje,message, business_phone_number_id);

                  break;

                case TIPOS_OPCIONES.ENVIAR_CARATULA:
                  console.log("El mensaje anterior es ENVIAR_CARATULA");

                  mensajeTexto("✅ Hemos enviado a tu correo electrónico registrado la copia de tus pólizas. Si tienes alguna inquietud, comunícate desde tu celular al #833, Línea Efectiva de Colmena Seguros. Estamos atentos para ayudarte.", message, business_phone_number_id);

                  break;


                default:
                  console.log("Día no válido");

              }
            }else if(data.statusCode === 0){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 
              
              mensaje = "❌ "+data.statusMessage;
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else if(data.statusCode === 401){
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              //Genera el nuevo token
              generarToken();

              mensaje = "❌ Error estado conversación";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }else{
              //MENSAJE ERROR
              console.error('❌ Error statusCode', data.statusCode);
              console.error('❌ Mensaje de Error', data.statusMessage); 

              mensaje = "❌ Error estado conversación";
              mensajeTexto(mensaje,message, business_phone_number_id);
            }
        }).catch((error) => {
            console.error('❌ Error estado conversación:', error); // Manejar errores

            //MENSAJE ERROR
            mensaje = "❌ Error estado de la conversación";
            mensajeTexto(mensaje,message, business_phone_number_id);
        });

}


const EnviarCaratula = (codigo, message, business_phone_number_id, contac) => {
    console.log('💬 Envio caratula:', true); 
    
    //Consume servicio para registro de inicio de conversacion
    const url = URL_SERVICE + ENDPOINTS_API.ENVIAR_CARATULA;
    const hashFecha = consultarFecha();

    // Datos que deseas enviar
    const data = {
        'data':{
          'opcion':{
            "opcion": TIPOS_OPCIONES.ENVIAR_CARATULA,
            "numeroCelular": contac.wa_id,
            "hashConversacion": hashFecha + contac.wa_id
          },
          "mensaje": codigo
        },
        'platform': "PolizaWhatsApp",
        'idAplicacion': 2
    }; 

    console.log("📦 Peticion envio caratula", data);
    // Haciendo la solicitud POST
    fetch(url, {
        method: 'POST', // Método de la solicitud
        headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTHORIZATION_SERVICE,
            'token': TOKENT
        },
        body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
    }).then(response => {
        if (!response.ok) {
            console.error('❌ Error envio caratula');
        }

        return response.json(); // Convertir la respuesta a JSON
    }).then(data => {
        if(data.statusCode === 1){
          mensajeTexto("✅ Hemos enviado a tu correo electrónico registrado la copia de tus pólizas. Si tienes alguna inquietud, comunícate desde tu celular al #833, Línea Efectiva de Colmena Seguros. Estamos atentos para ayudarte.", message, business_phone_number_id);
        }else if(data.statusCode === 0){
          //MENSAJE ERROR
          console.error('❌ Error statusCode', data.statusCode);
          console.error('❌ Mensaje de Error', data.statusMessage); 
          
          mensaje = "❌ "+data.statusMessage;
          mensajeTexto(mensaje,message, business_phone_number_id);
        }else if(data.statusCode === 401){
          //MENSAJE ERROR
          console.error('❌ Error statusCode', data.statusCode);
          console.error('❌ Mensaje de Error', data.statusMessage); 

          //Genera el nuevo token
          generarToken();

          mensaje = "❌ Error envio caratula";
          mensajeTexto(mensaje,message, business_phone_number_id);
        }else{
          //MENSAJE ERROR
          console.error('❌ Error statusCode', data.statusCode);
          console.error('❌ Mensaje de Error', data.statusMessage); 

          mensaje = "❌ Error envio caratula";
          mensajeTexto(mensaje,message, business_phone_number_id);
        }
    }).catch((error) => {
        console.error('❌ Error envio caratula:', error); // Manejar errores

        //MENSAJE ERROR
        mensaje = "❌ Error envio caratula";
        mensajeTexto(mensaje,message, business_phone_number_id);
    });
}

async function postRequest(url, data, headersExtra = {}) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headersExtra
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('❌ Error en postRequest:', error);
        throw error;
    }
}