/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import express, { text } from "express";
import axios from "axios";
import fetch from "node-fetch";

import {TIPOS_OPCIONES_MNK, TIPOS_OPCIONES_AUTOEXPEDIBLES_MNK} from "./utils/tipos-opciones.js"
import {ENDPOINTS_API_MNK, ENDPOINTS_API_AUTOEXPEDIBLES_MNK}from "./networking/endpoints.api.js"
import {convertImageBase64, consultarFecha, esSaludo} from "./utils/utils.js"

let message = null;
let contac = null;
let business_phone_number_id = null;
let mensaje = null;
//let URL_SERVICE = null;
//let AUTHORIZATION_SERVICE = null;

let TOKENT = null; 

const app = express();
app.use(express.json()); 

//OBTIENE LOS DATOS DE LAS VARIABLES CREADAS EN .ENV
const { WEBHOOK_VERIFY_TOKEN, 
  GRAPH_API_TOKEN, FLOW_DATOS_PAGO_MNK, 
  FLOW_VALIDACION_IDENTIDAD_MNK, 
  FLOW_DATOS_POLIZA_AUTOEXPEDIBLES_NMK, 
  FLOW_VALIDAR_DATOS_CONCILIACION_NMK, 
  AUTHORIZATION_SERVICE, 
  URL_SERVICE, 
  PORT } = process.env;

app.post("/webhook", async (req, res) => {
   
  //URL Desarrollo
  //URL_SERVICE = "http://34.42.187.146:8084/api/";
  //AUTHORIZATION_SERVICE = "Basic MmViYmZmNjBkYTFmM2JjZlhVYUxWTHcrV3lQTi9BM0pGVFRhelp4RU9POXNmUHNpYmYvTG5PZjN2WUE9OjJlYmJmZjYwZGExZjNiY2YzOElOMUcvUEtoMU9vOU5TbEJXZkxnPT0=";
  
  // check if the webhook request contains a message
  // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
  contac = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0];
  business_phone_number_id = req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
  
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

    if(esSaludo(message.text.body)){
      console.log('💬 Es Saludo:', true); 

      //Consume servicio para almacenar el mensaje
      const url = URL_SERVICE + ENDPOINTS_API_MNK.REGISTRAR_MENSAJE;
      const hashFecha = consultarFecha();
      
      const opcion =  {
        "IdOpcion": TIPOS_OPCIONES_MNK.REGISTRAR_MENSAJE,
        "Celular": contac.wa_id,
        "Codigo": hashFecha + contac.wa_id
      };

      // Datos que deseas enviar
      const data = {
        'data':{
          'opcion': opcion,
          "Mensaje": message.text.body
        },
        'platform': "ConciliacionMNKWhatsApp",
        'idAplicacion': 4
      }; 

      console.log("📦 Mensaje de Texto", data);

      // Haciendo la solicitud POST
      fetch(url, {
          method: 'POST', // Método de la solicitud
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer '+TOKENT
          },
          body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
      }).then(response => {
          if (!response.ok) {
              console.error('❌ Error registrando el mensa');
          }

          return response.json(); // Convertir la respuesta a JSON
      }).then(data => {
          if(data.statusCode === 1){

            switch (data.result.idUltimoMensaje) {
              case TIPOS_OPCIONES_MNK.INICIO_CONVERSACION:
                console.log("El mensaje anterior es INICIO_CONVERSACION");
                 
                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Mensaje no identificado, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajePlantillaFlow(message, business_phone_number_id);
                break;

              case TIPOS_OPCIONES_MNK.REGISTRAR_PERSONA:
                console.log("El mensaje anterior es REGISTRAR_PERSONA");

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Mensaje no identificado, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajePlantillaFlow(message, business_phone_number_id);
                break;

              case TIPOS_OPCIONES_MNK.REGISTRAR_OPCION:
                console.log("El mensaje anterior es REGISTRAR_OPCION");

               mensajeFormulario("\u200B", "❌ Mensaje no identificado, Por favor asegúrate de llenar la información del formulario.", 
                    "Por favor haga clic en el botón para reeintentar", "Reeintentar", FLOW_VALIDAR_DATOS_CONCILIACION_NMK);
                break;

              case TIPOS_OPCIONES_MNK.REGISTRAR_OPCION:
                console.log("El mensaje anterior es ESTADO_VALORACION");

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajePlantillaReintentar(message, business_phone_number_id, contac);
                break;

              default:
                console.log("El mesanje anterior no existe");

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Mensaje no identificado, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);
            }

          }else if(data.statusCode === 0){
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ "+data.statusMessage;
            mensajeTexto(mensaje, message, business_phone_number_id);
          }else if(data.statusCode === 99){
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ "+data.statusMessage;
            mensajeTexto(mensaje, message, business_phone_number_id);
          }else if(data.statusCode === 401){
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //Genera el nuevo token
            generarToken();

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error registrando el mensaje, por favor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);
          }else{
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error registrando el mensaje, por favor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);
          }
      }).catch((error) => {
          console.error('❌ Error registrando la opcion:', error); // Manejar errores

          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error registrando el mensaje, por favor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);
      });
    










    }else if(message.text.body === "Gracias"){
      console.log('💬 Es Despedida:', true); 
      
      //IDENTIFICA SI ES UNA DESPUEDIDA
      mensaje = "👋 Esperamos haber resuelto tus inquietudes";
      mensajeTexto(mensaje); 
    } else if (!isNaN(message.text.body)) {
      //IDENTIFICA SI INGRESO UN CODIGO DE 4 DIGITOS
      if(message.text.body.length === 6){

        console.log('💬 Es Codigo de 6 digitos:', true); 
        
        //Consume servicio para validar el codigo
        const url = URL_SERVICE + ENDPOINTS_API_MNK.VALIDAR_CODIGO;
        const hashFecha = consultarFecha();

        const opcion =  {
          "IdOpcion": TIPOS_OPCIONES_MNK.VALIDAR_CODIGO,
          "Celular": contac.wa_id,
          "Codigo": hashFecha + contac.wa_id
        };

        const hash =  {
          "CodigoHash": message.text.body
        };

        // Datos que deseas enviar
        const data = {
          'data':{
            'opcion': opcion,
            'TipoHash': hash
          },
          'platform': "ConciliacionMNKWhatsApp",
          'idAplicacion': 4
        }; 

        console.log("📦 Peticion validar codigo OTP", data);

        // Haciendo la solicitud POST
        fetch(url, {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+TOKENT
            },
            body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
        }).then(response => {
            if (!response.ok) {
                console.error('❌ Error validando el codigo');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
              if(data.result.idAplicacion === 4){
                mensajeFormulario("DATOS CONCILIACIÓN", "Nos alegramos que aceptarás nuestra oferta!\n\nPara terminar el proceso ingresa los siguientes datos.\n\n",
                                  "Haga clic en el botón para finalizar", "FINALIZAR", FLOW_DATOS_PAGO_MNK);
              }else if(data.result.idAplicacion === 5){
                //Consume servicio para almacenar el mensaje
                const url = URL_SERVICE + ENDPOINTS_API_AUTOEXPEDIBLES_MNK.OBTENER_RESUMEN_POLIZA;
                const hashFecha = consultarFecha();
                
                const opcion =  {
                  "IdOpcion": TIPOS_OPCIONES_AUTOEXPEDIBLES_MNK.OBTENER_RESUMEN_POLIZA,
                  "Celular": contac.wa_id,
                  "Codigo": hashFecha + contac.wa_id
                };

                // Datos que deseas enviar
                const data = {
                  'data':{
                    'opcion': opcion
                  },
                  'platform': "AutoexpediblesMNKWhatsApp",
                  'idAplicacion': 5
                }; 

                console.log("📦 Mensaje de Texto", data);

                // Haciendo la solicitud POST
                fetch(url, {
                    method: 'POST', // Método de la solicitud
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+TOKENT
                    },
                    body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
                }).then(response => {
                    if (!response.ok) {
                        console.error('❌ Error registrando el mensa');
                    }

                    return response.json(); // Convertir la respuesta a JSON
                }).then(data => {
                    if(data.statusCode === 1){

                    
                      

                      mensajeInteractivePagar("*VALIDACIÓN PLAN*\n\n"+
                        "🚙 Placa: *"+ data.result.placa +"*\n"+
                        "📃 Tipo Póliza:\n*"+ data.result.detalleCotizacion +"*\n"+
                        "🗓️ Vigencia: *"+ data.result.tipoVigencia +"*\n"+
                        "🏭 Emitida por: *MNK Seguros*\n"+
                        "☑️ Plan:\n*"+ data.result.codigoPlan +"*\n"+
                        "💵 Monto asegurado: *$ 30,000.00 us*\n"+
                        "🧾 Valor a pagar: *$ 38,39 us*");

                    }else if(data.statusCode === 0){
                      //MENSAJE ERROR
                      console.error('❌ Error statusCode', data.statusCode);
                      console.error('❌ Mensaje de Error', data.statusMessage); 

                      //MENSAJE ENVIADO OPCION SELECCIONADA
                      mensaje = "🔐 Para continuar con el proceso de adquirir tu póliza *Autoexpedible Colisiones Simples*, te enviamos un código de 4 digitos al correo ingresado. Por favor, ingresalo a continuación.";
                      mensajeTexto(mensaje);
                    }else if(data.statusCode === 99){
                      //MENSAJE ERROR
                      console.error('❌ Error statusCode', data.statusCode);
                      console.error('❌ Mensaje de Error', data.statusMessage); 

                      //MENSAJE ENVIADO OPCION SELECCIONADA
                      mensaje = "🔐 Para continuar con el proceso de adquirir tu póliza *Autoexpedible Colisiones Simples*, te enviamos un código de 4 digitos al correo ingresado. Por favor, ingresalo a continuación.";
                      mensajeTexto(mensaje);
                    }else if(data.statusCode === 401){
                      //MENSAJE ERROR
                      console.error('❌ Error statusCode', data.statusCode);
                      console.error('❌ Mensaje de Error', data.statusMessage); 

                      //Genera el nuevo token
                      generarToken();

                      //MENSAJE ENVIADO OPCION SELECCIONADA
                      mensaje = "🔐 Para continuar con el proceso de adquirir tu póliza *Autoexpedible Colisiones Simples*, te enviamos un código de 4 digitos al correo ingresado. Por favor, ingresalo a continuación.";
                      mensajeTexto(mensaje);
                    }else{
                      //MENSAJE ERROR
                      console.error('❌ Error statusCode', data.statusCode);
                      console.error('❌ Mensaje de Error', data.statusMessage); 

                      //MENSAJE ENVIADO OPCION SELECCIONADA
                      mensaje = "🔐 Para continuar con el proceso de adquirir tu póliza *Autoexpedible Colisiones Simples*, te enviamos un código de 4 digitos al correo ingresado. Por favor, ingresalo a continuación.";
                      mensajeTexto(mensaje);
                    }
                }).catch((error) => {
                    console.error('❌ Error registrando la opcion:', error); // Manejar errores

                    //MENSAJE ENVIADO OPCION SELECCIONADA
                    mensaje = "🔐 Para continuar con el proceso de adquirir tu póliza *Autoexpedible Colisiones Simples*, te enviamos un código de 4 digitos al correo ingresado. Por favor, ingresalo a continuación.";
                    mensajeTexto(mensaje);
                });

              }
              
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

              axios({
                method: "POST",
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                  url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                        "text": "❌ Ocurrio un error al validar el código. Por favor, intenta de nuevo con el código que enviamos a tu correo electrónico."
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
                  url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

              axios({
                method: "POST",
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                          "text": "❌ "+data.statusMessage
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
                    url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

              // mark incoming message as read
              axios({
                method: "POST",
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                      "text": "❌ Ocurrio un error al validar el código. Por favor, intenta de nuevo con el código que enviamos a tu correo electrónico."
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
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
      }      































    }else{
      //Consume servicio para almacenar el mensaje
      const url = URL_SERVICE + ENDPOINTS_API_MNK.REGISTRAR_MENSAJE;
      const hashFecha = consultarFecha();
      
      const opcion =  {
        "IdOpcion": TIPOS_OPCIONES_MNK.REGISTRAR_MENSAJE,
        "Celular": contac.wa_id,
        "Codigo": hashFecha + contac.wa_id
      };

      // Datos que deseas enviar
      const data = {
        'data':{
          'opcion': opcion,
          "Mensaje": message.text.body
        },
        'platform': "ConciliacionMNKWhatsApp",
        'idAplicacion': 4
      }; 

      console.log("📦 Mensaje de Texto", data);

      // Haciendo la solicitud POST
      fetch(url, {
          method: 'POST', // Método de la solicitud
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer '+TOKENT
          },
          body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
      }).then(response => {
          if (!response.ok) {
              console.error('❌ Error registrando el mensa');
          }

          return response.json(); // Convertir la respuesta a JSON
      }).then(data => {
          if(data.statusCode === 1){

            switch (data.result.idUltimoMensaje) {
              case TIPOS_OPCIONES_MNK.INICIO_CONVERSACION:
                console.log("El mensaje anterior es INICIO_CONVERSACION");
                 
                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Mensaje no identificado, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajePlantillaFlow(message, business_phone_number_id);
                break;

              case TIPOS_OPCIONES_MNK.REGISTRAR_PERSONA:
                console.log("El mensaje anterior es REGISTRAR_PERSONA");

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Mensaje no identificado, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajePlantillaFlow(message, business_phone_number_id);
                break;

              case TIPOS_OPCIONES_MNK.REGISTRAR_OPCION:
                console.log("El mensaje anterior es REGISTRAR_OPCION");

               mensajeFormulario("\u200B", "❌ Mensaje no identificado, Por favor asegúrate de llenar la información del formulario.", 
                    "Por favor haga clic en el botón para reeintentar", "Reeintentar", FLOW_VALIDAR_DATOS_CONCILIACION_NMK);
                break;

              case TIPOS_OPCIONES_MNK.REGISTRAR_OPCION:
                console.log("El mensaje anterior es ESTADO_VALORACION");

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajePlantillaReintentar(message, business_phone_number_id, contac);
                break;

              default:
                console.log("El mesanje anterior no existe");

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Mensaje no identificado, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);
            }

          }else if(data.statusCode === 0){
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ "+data.statusMessage;
            mensajeTexto(mensaje, message, business_phone_number_id);
          }else if(data.statusCode === 99){
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ "+data.statusMessage;
            mensajeTexto(mensaje, message, business_phone_number_id);
          }else if(data.statusCode === 401){
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //Genera el nuevo token
            generarToken();

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error registrando el mensaje, por favor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);
          }else{
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error registrando el mensaje, por favor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);
          }
      }).catch((error) => {
          console.error('❌ Error registrando la opcion:', error); // Manejar errores

          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error registrando el mensaje, por favor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);
      });
    }
    
  }else if(message?.type === "interactive" && message?.interactive.type === "button_reply"){
    console.log("💬 PRESIONO EL BOTON:", message.interactive.button_reply.id);
    
    //IDENTIFICA SI PRESIONO UN BOTON
    if(message.interactive.button_reply.id === "SOLICITAR_ACUERDO"){  
      
      mensajeFormulario("DATOS CONCILIACIÓN", "Nos alegramos que aceptarás nuestra oferta!\n\nPara terminar el proceso ingresa los siguientes datos.\n\n",
                   "Haga clic en el botón para finalizar", "FINALIZAR", FLOW_DATOS_PAGO_MNK);
      
    }else if(message.interactive.button_reply.id === "CONSULTAR_ACUERDO"){ 
      
      mensaje = "❌ Lamentamos que no hayas aceptado nuestra oferta.\n\n"+
        "Para continuar con el proceso, es necesario realizar una revisión técnica de tu vehículo en uno de nuestros centros de servicio autorizados. Para ello, el *Asegurado* deberá agendar una cita dentro de un plazo máximo de 30 días calendario a partir de esta notificación en uno de los siguientes centros:\n\n"+
        "🧰 Centro de Servicio Curridabat\n📍 Curridabat, contiguo a Agencia Datsun.\n📲 https://www.supersaas.es/schedule/MNK_Seguros/Centro_de_servicio_Curridabat \n\n"+
        "🧰 Centro de Servicio Heredia\n📍 Lagunilla, 200 norte Cocorisa, Calle Inmaculada.\n📲 https://www.supersaas.es/schedule/MNK_Seguros/Centro_de_Servicio_Heredia \n\n"+
        "🧰 Centro de Servicio Uruca\n📍 Uruca, 300 metros oeste del Hospital México, contiguo a las instalaciones de Reprete.\n📲 https://www.supersaas.es/schedule/MNK_Seguros/Horario_ValorRepa";
      mensajeTexto(mensaje);
       
    }else if(message.interactive.button_reply.id === "PREGUNTAS_FRECUENTES"){ 
      
      mensaje = "https://mnkseguros.com/contactenos/";
      mensajeTexto(mensaje);
      
    }else if(message.interactive.button_reply.id === "PAGAR"){ 
      
      
      
      const url = URL_SERVICE + ENDPOINTS_API_AUTOEXPEDIBLES_MNK.CREAR_POLIZA; 
      const hashFecha = consultarFecha();

       const opcion =  {
          "idOpcion": TIPOS_OPCIONES_AUTOEXPEDIBLES_MNK.CREAR_POLIZA,
          "celular": contac.wa_id,
          "idOpcion": hashFecha + contac.wa_id,
        };

      // Datos que deseas enviar
      const data = {
        'data':{
          'opcion': opcion
        },
        'platform': "AutoexpediblesMNKWhatsApp",
        'idAplicacion': 5
      }; 
      
      console.log("📦 Peticion Seleccionar Plan", data);

      // Haciendo la solicitud POST
      fetch(url, {
          method: 'POST', // Método de la solicitud
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer '+TOKENT
          },
          body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
      }).then(response => {
          if (!response.ok) {
              console.error('❌ Error registrando selección de plan');
          }

          return response.json(); // Convertir la respuesta a JSON
      }).then(data => {
          if(data.statusCode === 1){

            console.log(data.result.data);
            const URLPago = data.result.urlCheckOut;
            mensaje = "Por favor, completa el proceso realizando el pago de tu plan en el siguiente enlace. Ten en cuenta que este pago se efectúa una sola vez durante toda la vigencia.\n👉 "+URLPago;
            mensajeTexto(mensaje, message, business_phone_number_id);

            

            
          }else if(data.statusCode === 401){
            //MENSAJE ERROR DE SEGURIDAD
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //Genera el nuevo token
            generarToken();

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error generando link de pago, por favor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);

            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error generando link de pago, por favor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);

            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
            //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
            mensaje = "❌ Error generando link de pago, por favor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);

            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
          console.error('❌ Error registrando el formulario:', error); // Manejar errores
        
          //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
          mensaje = "❌ Error generando link de pago, por favor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);

          axios({
            method: "POST",
            url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
            url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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


      





      

    }else if(message.interactive.button_reply.id === "VALIDAR"){ 

      //Consume servicio para reenviar el codigo
      const url = URL_SERVICE + ENDPOINTS_API_AUTOEXPEDIBLES_MNK.CONFIRMAR_IDENTIDAD_CLIENTE;
      const hashFecha = consultarFecha();

      // Datos que deseas enviar
      const data = {
          'data':{
            'opcion':{
              "idOpcion": TIPOS_OPCIONES_AUTOEXPEDIBLES_MNK.CONFIRMAR_IDENTIDAD_CLIENTE,
              "celular": contac.wa_id,
              "codigo": hashFecha + contac.wa_id
            }
          },
          'platform': "AutoexpediblesMNKWhatsApp",
          'idAplicacion': 5
      }; 

      console.log("📦 Peticion reenvio de codigo", data);

      // Haciendo la solicitud POST
      fetch(url, { 
          method: 'POST', // Método de la solicitud
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer '+TOKENT
          },
          body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
      }).then(response => {
          if (!response.ok) {
              console.error('❌ Error registrandi confirmación identidad del cliente');
          }

          return response.json(); // Convertir la respuesta a JSON
      }).then(data => {
          if(data.statusCode === 1){
            
            mensajeFormulario("DATOS PÓLIZA", 
                "Por favor ingresa los siguientes datos para continuar con el proceso", 
                "Haga clic en el botón para iniciar", 
                "INICIAR", 
                FLOW_DATOS_POLIZA_AUTOEXPEDIBLES_NMK);

          }else if(data.statusCode === 0){
            //MENSAJE ERROR
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Ocurrio un error, intentando enviar la validación de identidad, porfavor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);
            
            //RESPUESTA MENSAJE TIPO FORMULARIO DE DATOS DE VALIDACION
            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                    "text": "*VALIDACIÓN DATOS*\n\nSi los datos anteriormente mostrados son correctos, responde SI.\n"+
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

            // mark incoming message as read
            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Ocurrio un error, intentando enviar la validación de identidad, porfavor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);
            
            //RESPUESTA MENSAJE TIPO FORMULARIO DE DATOS DE VALIDACION
            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                    "text": "*VALIDACIÓN DATOS*\n\nSi los datos anteriormente mostrados son correctos, responde SI.\n"+
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

            // mark incoming message as read
            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Ocurrio un error, intentando enviar la validación de identidad, porfavor intente de nuevo";
            mensajeTexto(mensaje,message, business_phone_number_id);
            
            //RESPUESTA MENSAJE TIPO FORMULARIO DE DATOS DE VALIDACION
            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                    "text": "*VALIDACIÓN DATOS*\n\nSi los datos anteriormente mostrados son correctos, responde SI.\n"+
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

            // mark incoming message as read
            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Ocurrio un error, intentando enviar la validación de identidad, porfavor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);
          
          //RESPUESTA MENSAJE TIPO FORMULARIO DE DATOS DE VALIDACION
          axios({
            method: "POST",
            url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                  "text": "*VALIDACIÓN DATOS*\n\nSi los datos anteriormente mostrados son correctos, responde SI.\n"+
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

          // mark incoming message as read
          axios({
            method: "POST",
            url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

       
    }else if(message.interactive.button_reply.id === "CANCELAR"){ 
      mensajeFormulario("VALIDACIÓN IDENTIDAD",
          "Para iniciar el proceso debemos validar tu identidad",
          "Haga clic en el botón para iniciar", 
          "INICIAR", 
          FLOW_VALIDACION_IDENTIDAD_MNK);

    }else if(message.interactive.button_reply.id === "REENVIAR_CODIGO"){ 
      
      //Consume servicio para reenviar el codigo
        const url = URL_SERVICE + ENDPOINTS_API_MNK.REENVIAR_CODIGO;
        const hashFecha = consultarFecha();

        // Datos que deseas enviar
        const data = {
            'data':{
              'opcion':{
                "idOpcion": TIPOS_OPCIONES_MNK.REENVIAR_CODIGO,
                "celular": contac.wa_id,
                "codigo": hashFecha + contac.wa_id
              }
            },
            'platform': "ConciliacionMNKWhatsApp",
            'idAplicacion': 4
        }; 

        console.log("📦 Peticion reenvio de codigo", data);

        // Haciendo la solicitud POST
        fetch(url, { 
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+TOKENT
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
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                        "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico registrado para validar tu identidad y continuar con el proceso." 
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
                  url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                      "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico registrado para validar tu identidad y continuar con el proceso."
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
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                      "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico registrado para validar tu identidad y continuar con el proceso."
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
                url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
              
              
              mensajeTexto("❌ Se ha alcanzado el limite de peticiones que se pueden para el reenvio del otp al correo.\n\nPara continuar con el proceso, debes dirigirte a una de nuestras oficinas y realizar la gestión con uno de nuestros asesores. Las cuales estan ubicadas en las siguientes direcciones:\n\n📍 Call 1 #123-1\n\n📍 Call 2 #456-2", message, business_phone_number_id);
              
             

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

    }else{

      //ENVIA LOS DATOS DEL FORMULARIO DE ACUERDO DE PAGO
      const url = URL_SERVICE + ENDPOINTS_API_AUTOEXPEDIBLES_MNK.SELECCIONAR_PLAN; 
      const hashFecha = consultarFecha();

       const opcion =  {
          "idOpcion": TIPOS_OPCIONES_AUTOEXPEDIBLES_MNK.SELECCIONAR_PLAN,
          "celular": contac.wa_id,
          "idOpcion": hashFecha + contac.wa_id,
        };

      // Datos que deseas enviar
      const data = {
        'data':{
          'opcion': opcion,
          'codigoRevisionPlan': message.interactive.button_reply.id
        },
        'platform': "AutoexpediblesMNKWhatsApp",
        'idAplicacion': 5
      }; 
      
      console.log("📦 Peticion Seleccionar Plan", data);

      // Haciendo la solicitud POST
      fetch(url, {
          method: 'POST', // Método de la solicitud
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer '+TOKENT
          },
          body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
      }).then(response => {
          if (!response.ok) {
              console.error('❌ Error registrando selección de plan');
          }

          return response.json(); // Convertir la respuesta a JSON
      }).then(data => {
          if(data.statusCode === 1){
            axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                    "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico ingresado y continuar con el proceso."
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
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error registrando datos de seleccionar plan, por favor vuelva a intentar";
            mensajeTexto(mensaje,message, business_phone_number_id);

            mensajeFormulario("DATOS PÓLIZA", 
                "Por favor ingresa los siguientes datos para continuar con el proceso", 
                "Haga clic en el botón para iniciar", 
                "INICIAR", 
                FLOW_DATOS_POLIZA_AUTOEXPEDIBLES_NMK);

          }else if(data.statusCode === 0){
            console.error('❌ Error statusCode', data.statusCode);
            console.error('❌ Mensaje de Error', data.statusMessage); 

            //MENSAJE ENVIADO OPCION SELECCIONADA
            mensaje = "❌ Error registrando datos de seleccionar plan, por favor vuelva a intentar";
            mensajeTexto(mensaje,message, business_phone_number_id);

            mensajeFormulario("DATOS PÓLIZA", 
                "Por favor ingresa los siguientes datos para continuar con el proceso", 
                "Haga clic en el botón para iniciar", 
                "INICIAR", 
                FLOW_DATOS_POLIZA_AUTOEXPEDIBLES_NMK);
              
          }else{
            //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
            mensaje = "❌ Error registrando datos de seleccionar plan, por favor vuelva a intentar";
            mensajeTexto(mensaje,message, business_phone_number_id);

            mensajeFormulario("DATOS PÓLIZA", 
                "Por favor ingresa los siguientes datos para continuar con el proceso", 
                "Haga clic en el botón para iniciar", 
                "INICIAR", 
                FLOW_DATOS_POLIZA_AUTOEXPEDIBLES_NMK);

          }
      }).catch((error) => {
          console.error('❌ Error registrando el formulario:', error); // Manejar errores
        
          //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
          mensaje = "❌ Error registrando datos de seleccionar plan, por favor vuelva a intentar";
            mensajeTexto(mensaje,message, business_phone_number_id);

            mensajeFormulario("DATOS PÓLIZA", 
                "Por favor ingresa los siguientes datos para continuar con el proceso", 
                "Haga clic en el botón para iniciar", 
                "INICIAR", 
                FLOW_DATOS_POLIZA_AUTOEXPEDIBLES_NMK);
      });      
      









    }

























  }else if(message?.type === "button"){
      console.log("💬 PRESIONO EL BOTON:", message.button?.payload);

      let respuesta = 0;

      if(message.button?.payload === "Aceptar"){ 
        respuesta = 1;
        consumoSeleccionOpcionMenuReclamaciones(respuesta);
      }else if(message.button?.payload === "Rechazar"){
        respuesta = 0;
        consumoSeleccionOpcionMenuReclamaciones(respuesta);
      }else if(message.button?.payload === "Solicitar_Polizas"){
        respuesta = 1;
        consumoSeleccionOpcionMenuAutoexpedibles(respuesta);

      }else if(message.button?.payload === "Mis_polizas_activas"){
        respuesta = 2;
        consumoSeleccionOpcionMenuAutoexpedibles(respuesta);
      }else if(message.button?.payload === "Preguntas_frecuentes"){
        respuesta = 3;
        consumoSeleccionOpcionMenuAutoexpedibles(respuesta);
      }
    
  }else if(message?.type === "interactive" && message?.interactive.type === "list_reply"){
    //IDENTIFICA SI UN MENSAJE DE RESPUESTA DE TIPO LISTA
      
      
    
  }else if (message?.type === "location") {
      //IDENTIFICA SI ES UN MENSAJE DE TIPO LOCALIZACION
      
    
    
  }else if (message?.type === "interactive" && message?.interactive.type === "nfm_reply") {
      //IDENTIFICA SI ES UN MENSAJE DE RESPUESTA DE UN FORMULARIO
      let respuesta = JSON.parse(message?.interactive.nfm_reply.response_json);
    
      console.log("💬 RESPUESTAS DEL FORMUALRIO", respuesta);
    
      let listaImagenes = [];
      
      if(respuesta.Formulario === "1"){
          for (let i = 0; i < respuesta.FotoCedula.length; i++) {            
            let id = `${respuesta.FotoCedula?.[i].id}`;

            try {
              const response = await axios.get(`https://graph.facebook.com/v22.0/${id}`, {
                headers: {
                  Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                },
              });

              const mediaUrl = response.data.url;

              const imagenBase64 = await convertImageBase64(mediaUrl);
              
              if(i === 0){
                listaImagenes.push(imagenBase64);
                console.log("📦 Imagenes", "Adiciono la imagen 1");
              }

              if(i === 1){
                listaImagenes.push(imagenBase64);
                console.log("📦 Imagenes", "Adiciono la imagen 2");
              }

              if(i === 2){
                listaImagenes.push(imagenBase64);
                console.log("📦 Imagenes", "Adiciono la imagen 3");
              }
             
            } catch (error) {
              console.error('❌ Error al obtener URL IMAGEN:', error.response?.data || error.message);
            }
          }

          console.log("📦 Cantidad de imagenes", listaImagenes.length);
        
          //ENVIA LOS DATOS DEL FORMULARIO DE ACUERDO DE PAGO
          const url = URL_SERVICE + ENDPOINTS_API_MNK.REGISTRAR_PERSONA;
          const hashFecha = consultarFecha();

          const opcion =  {
            "IdOpcion": TIPOS_OPCIONES_MNK.REGISTRAR_PERSONA,
            "Celular": contac.wa_id,
            "Codigo": hashFecha + contac.wa_id,
            "Placa": respuesta.Placa
          };

          const persona =  {
            "Nombre": respuesta.Nombre,
            "Apellido": respuesta.Apellido,
            "IdTipoDocumento": respuesta.TipoDocumento,
            "NumeroDocumento": respuesta.Cedula,
            "Celular": contac.wa_id,
            "Email": respuesta.Correo,
            "Direccion": respuesta.Direccion
          };

          const habeasGeneral = {"IdTerminosyCondiciones":75,"AceptaTermino":1};
          const habeasVida = {"IdTerminosyCondiciones":76,"AceptaTermino":1};

          const habeas = [habeasGeneral, habeasVida];

          // Datos que deseas enviar
          const data = {
            'data':{
              'Opcion': opcion,
              'Persona': persona,
              'lstTerminosYCondiciones': habeas,
              'EvidenciaChoque': {'Evidencia1':listaImagenes[0], 'Evidencia2':listaImagenes[1], 'Evidencia3':listaImagenes[2]}
            },
            'platform': "ConciliacionMNKWhatsApp",
            'idAplicacion': 4
          }; 
          
          console.log("📦 Peticion Formulario Registro", JSON.stringify(data));

           // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer '+TOKENT
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
                    url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
                    headers: {
                      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                    data: {
                      messaging_product: "whatsapp",
                      to: message.from,
                      text: { body: "✅ ¡Gracias! Estamos revisando la información. Por favor, esperá un momento mientras realizamos la validación para continuar con el proceso."}
                    },
                  });
            
                  // mark incoming message as read
                  axios({
                    method: "POST",
                    url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error registrando los datos del formulario, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("\u200B", "❌ No pudimos realizar el proceso. Por favor asegúrate de llenar la información del formulario.", 
                  "Por favor haga clic en el botón para reeintentar", "Reeintentar", FLOW_VALIDAR_DATOS_CONCILIACION_NMK);

              }else if(data.statusCode === 0){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error registrando los datos del formulario, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);
                  
                //MENSAJE ERROR ENVIANDO FORMULARIO D
                mensajeFormulario("\u200B", "❌ No pudimos realizar el proceso. Por favor asegúrate de llenar la información del formulario.", 
                    "Por favor haga clic en el botón para reeintentar", "Reeintentar", FLOW_VALIDAR_DATOS_CONCILIACION_NMK);
                  
              }else{
                //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error registrando los datos del formulario, por favor intente de nuevo";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("\u200B", "❌ No pudimos realizar el proceso. Por favor asegúrate de llenar la información del formulario.", 
                    "Por favor haga clic en el botón para reeintentar", "Reeintentar", FLOW_VALIDAR_DATOS_CONCILIACION_NMK);

              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores

              //MENSAJE ENVIADO OPCION SELECCIONADA
              mensaje = "❌ Error registrando los datos del formulario, por favor intente de nuevo";
              mensajeTexto(mensaje,message, business_phone_number_id);
            
              //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
              mensajeFormulario("\u200B", "❌ No pudimos realizar el proceso. Por favor asegúrate de llenar la información del formulario.", 
                  "Por favor haga clic en el botón para reeintentar", "Reeintentar", FLOW_VALIDAR_DATOS_CONCILIACION_NMK);
          });      


      }else if(respuesta.Formulario === "2"){
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

              //await convertImageBase64(mediaUrl);
              const imagenBase64 = await convertImageBase64(mediaUrl);
              
              //let imagen = {imagenBase64};
              listaImagenes.push(imagenBase64);
              
            } catch (error) {
              console.error('❌ Error al obtener URL IMAGEN:', error.response?.data || error.message);
            }
          }

          //ENVIA LOS DATOS DEL FORMULARIO DE ACUERDO DE PAGO
          const url = URL_SERVICE + ENDPOINTS_API_MNK.DATOS_PAGO; 
          const hashFecha = consultarFecha();

          const opcion =  {
            "idOpcion": TIPOS_OPCIONES_MNK.DATOS_PAGO,
            "celular": contac.wa_id,
            "codigo": hashFecha + contac.wa_id,
          };

          const pago = {
            "codigoBanco": respuesta.Banco,
            "idTipoCuenta": respuesta.TipoCuenta,
            "numeroCuenta": respuesta.NumeroCuenta
          };

          const indicadores = {
            "acepta": true
          };

          // Datos que deseas enviar
          const data = {
            'data':{
              'opcion': opcion,
              'tercero': pago,
              'indicadores': indicadores,
              'fotoCedula': listaImagenes[0]
            },
            'platform': "ConciliacionMNKWhatsApp",
            'idAplicacion': 4
          }; 
        
          console.log("📦 Peticion Formulario de datos datos cuenta", data);

          // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer '+TOKENT
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
                    url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
                    headers: {
                      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                    data: {
                      messaging_product: "whatsapp",
                      to: message.from,
                      //text: { body: "✅ Gracias por realizar la conciliación con nosotros, pronto recibiras por correo electronico los datos de la confirmación del pago realizado"},
                      //text: { body: JSON.stringify(data.result)},
                      text: { body: "✅ ¡Tu trámite está listo! Una vez realizado el pago recibirás un correo electrónico con la confirmación *de la indemnización* según la propuesta aceptada, el cual *se hará efectivo a más tardar en 7 días hábiles.*\n\nSi tenés alguna duda o consulta, escribinos al correo electrónico *pagosindemnizaciones@mnkseguros.com.*\n¡Estamos para servirte!"},

                    },
                  });
            
                  // mark incoming message as read
                  axios({
                    method: "POST",
                    url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error registrando datos de pago";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("DATOS CONCILIACIÓN", "Nos alegramos que aceptarás nuestra oferta!\n\nPara terminar el proceso ingresa los siguientes datos.\n\n",
                   "Haga clic en el botón para finalizar", "FINALIZAR", FLOW_DATOS_PAGO_MNK);

              }else if(data.statusCode === 0){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error registrando datos de pago";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("DATOS CONCILIACIÓN", "Nos alegramos que aceptarás nuestra oferta!\n\nPara terminar el proceso ingresa los siguientes datos.\n\n",
                   "Haga clic en el botón para finalizar", "FINALIZAR", FLOW_DATOS_PAGO_MNK);
                  
              }else{
                //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error registrando datos de pago";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("DATOS CONCILIACIÓN", "Nos alegramos que aceptarás nuestra oferta!\n\nPara terminar el proceso ingresa los siguientes datos.\n\n",
                   "Haga clic en el botón para finalizar", "FINALIZAR", FLOW_DATOS_PAGO_MNK);

              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
              mensaje = "❌ Error registrando datos de pago";
              mensajeTexto(mensaje,message, business_phone_number_id);

              mensajeFormulario("DATOS CONCILIACIÓN", "Nos alegramos que aceptarás nuestra oferta!\n\nPara terminar el proceso ingresa los siguientes datos.\n\n",
                   "Haga clic en el botón para finalizar", "FINALIZAR", FLOW_DATOS_PAGO_MNK);
          });      
      } else if(respuesta.Formulario === "3"){

          //ENVIA LOS DATOS DEL FORMULARIO DE ACUERDO DE PAGO
          const url = URL_SERVICE + ENDPOINTS_API_AUTOEXPEDIBLES_MNK.VALIDAR_IDENTIDAD_CLIENTE; 
          const hashFecha = consultarFecha();

          const opcion =  {
            "idOpcion": TIPOS_OPCIONES_AUTOEXPEDIBLES_MNK.VALIDAR_IDENTIDAD_CLIENTE,
            "celular": contac.wa_id,
            "idOpcion": hashFecha + contac.wa_id
          };

         const persona =  {
            "idTipoDocumento": respuesta.IdTipoDocumento,
            "numeroDocumento": respuesta.NumeroDocumento,
            "email": respuesta.Correo
          };

          const habeasGeneral = {"idTerminosyCondiciones":5, "aceptaTermino":1};
          const habeasVida = {"idTerminosyCondiciones":6, "aceptaTermino":1};

          const habeas = [habeasGeneral, habeasVida];

          // Datos que deseas enviar
          const data = {
            'data':{
              'opcion': opcion,
              'persona': persona,
              'terminosYCondiciones': habeas
            },
            'platform': "AutoexpediblesMNKWhatsApp",
            'idAplicacion': 5
          }; 
        
          console.log("📦 Peticion Formulario de validación de identidad", data);

          // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer '+TOKENT
              },
              body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
          }).then(response => {
              if (!response.ok) {
                  console.error('❌ Error registrando formulario');
              }

              return response.json(); // Convertir la respuesta a JSON
          }).then(data => {
              if(data.statusCode === 1){

                axios({
                  method: "POST",
                  url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                          "🪪 Tipo de Documento:\n*"+data.result.codigoTipoIdentificacion+"*\n\n"+
                          "🔢 Número documento:\n*"+data.result.numeroIdentificacion+"*\n\n"+
                          "👤 Nombres:\n*"+data.result.nombre+" "+data.result.apellido+"*\n\n"+
                          "🏳️ Nacionalidad: *"+data.result.codigoNacionalidad+"*\n\n"+
                          "🧬 Genero: *"+data.result.codigoGenero+"*\n\n"+
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
                  
                
              }else if(data.statusCode === 401){
                //MENSAJE ERROR DE SEGURIDAD
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //Genera el nuevo token
                generarToken();

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error registrando datos de validación de identidad, por favor vuelva a intentar";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("VALIDACIÓN IDENTIDAD", "Para iniciar el proceso debemos validar tu identidad",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_VALIDACION_IDENTIDAD_MNK);

              }else if(data.statusCode === 0){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error registrando datos de validación de identidad, por favor vuelva a intentar";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("VALIDACIÓN IDENTIDAD", "Para iniciar el proceso debemos validar tu identidad",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_VALIDACION_IDENTIDAD_MNK);
                  
              }else{
                //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
                mensaje = "❌ Error registrando datos de validación de identidad, por favor vuelva a intentar";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("VALIDACIÓN IDENTIDAD", "Para iniciar el proceso debemos validar tu identidad",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_VALIDACION_IDENTIDAD_MNK);

              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
              mensaje = "❌ Error registrando datos de validación de identidad, por favor vuelva a intentar";
              mensajeTexto(mensaje,message, business_phone_number_id);

              mensajeFormulario("VALIDACIÓN IDENTIDAD", "Para iniciar el proceso debemos validar tu identidad",
                  "Haga clic en el botón para iniciar", "INICIAR", FLOW_VALIDACION_IDENTIDAD_MNK);
          });      
      } else if(respuesta.Formulario === "4"){

          //ENVIA LOS DATOS DEL FORMULARIO DE ACUERDO DE PAGO
          const url = URL_SERVICE + ENDPOINTS_API_AUTOEXPEDIBLES_MNK.OBTENER_PLANES; 
          const hashFecha = consultarFecha();

          const opcion =  {
            "idOpcion": TIPOS_OPCIONES_AUTOEXPEDIBLES_MNK.OBTENER_PLANES,
            "celular": contac.wa_id,
            "idOpcion": hashFecha + contac.wa_id,
            "placa": respuesta.Placa
          };

          // Datos que deseas enviar
          const data = {
            'data':{
              'opcion': opcion,
              'marca': respuesta.Marca,
              'modelo': respuesta.Modelo,
              'anio': respuesta.Ano,
              'codigoMoneda': respuesta.IdMoneda,
              'codigoProducto': "ACOS"
            },
            'platform': "AutoexpediblesMNKWhatsApp",
            'idAplicacion': 5
          }; 
        
          console.log("📦 Peticion Formulario Consultar planes", data);

          // Haciendo la solicitud POST
          fetch(url, {
              method: 'POST', // Método de la solicitud
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer '+TOKENT
              },
              body: JSON.stringify(data) // Convertir el objeto a una cadena JSON
          }).then(response => {
              if (!response.ok) {
                  console.error('❌ Error registrando formulario consultar planes');
              }

              return response.json(); // Convertir la respuesta a JSON
          }).then(data => {
              if(data.statusCode === 1){

                for (let i = 0; i < data.result.length; i++) {
                 
                  let Texto = "☑️ *"+ `${rdata.result?.[i].descplanprod}` +"*\n\n"+
                    "🗒️ *"+ `${data.result?.[i].descprod}` +"*\n"+
                    "⚖️ Covertura: *"+ `${data.result?.[i].desccobert}` +"*\n"+
                    "💵 Monto asegurado: *"+ `${data.result?.[i].sumaasegmin}` +"*\n"+
                    "🧾 Valor de la prima: *"+ `${data.result?.[i].primamin}` +"*";

                  mensajeInteractiveLista(Texto, `${data.result?.[i].revplan}`);
                }                  
                
              }else if(data.statusCode === 401){
                //MENSAJE ERROR DE SEGURIDAD
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //Genera el nuevo token
                generarToken();

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error registrando formulario, por favor vuelva a intentar";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("CONSULTAR PLANES PÓLIZA", 
                  "Por favor ingresa los siguientes datos para continuar con el proceso", 
                  "Haga clic en el botón para iniciar", 
                  "INICIAR", 
                  FLOW_DATOS_POLIZA_AUTOEXPEDIBLES_NMK);

              }else if(data.statusCode === 0){
                console.error('❌ Error statusCode', data.statusCode);
                console.error('❌ Mensaje de Error', data.statusMessage); 

                //MENSAJE ENVIADO OPCION SELECCIONADA
                mensaje = "❌ Error registrando formulario, por favor vuelva a intentar";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("CONSULTAR PLANES PÓLIZA", 
                  "Por favor ingresa los siguientes datos para continuar con el proceso", 
                  "Haga clic en el botón para iniciar", 
                  "INICIAR", 
                  FLOW_DATOS_POLIZA_AUTOEXPEDIBLES_NMK);
                  
              }else{
                //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
                mensaje = "❌ Error registrando formulario, por favor vuelva a intentar";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("CONSULTAR PLANES PÓLIZA", 
                  "Por favor ingresa los siguientes datos para continuar con el proceso", 
                  "Haga clic en el botón para iniciar", 
                  "INICIAR", 
                  FLOW_DATOS_POLIZA_AUTOEXPEDIBLES_NMK);

              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
              mensaje = "❌ Error registrando formulario, por favor vuelva a intentar";
                mensajeTexto(mensaje,message, business_phone_number_id);

                mensajeFormulario("CONSULTAR PLANES PÓLIZA", 
                  "Por favor ingresa los siguientes datos para continuar con el proceso", 
                  "Haga clic en el botón para iniciar", 
                  "INICIAR", 
                  FLOW_DATOS_POLIZA_AUTOEXPEDIBLES_NMK);
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
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
            text: titulo
          },
          body: {
            text:mensaje,
          },
          footer: {
            text: footer,
          },
          action: {
            name: "flow",
            parameters: {
              flow_id: id,
              flow_message_version: "3",
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
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                  "title": "ACEPTAR"
                }
              },
              {
                "type": "reply",
                "reply": {
                  "id": "CONSULTAR_ACUERDO",
                  "title": "RECHAZAR"
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
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

//FUNCION PARA ENVIAR MENSAJE DE TIPO LOCALIZACION
function mensajeUbicacion() {
  //ENVIA MENSAJE CON EL FORMULARIO
  axios({
    method: "POST",
    url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
    headers: {
      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      "Content-Type": "application/json",
      "recipient_type": "individual"
    },
    data: {
      messaging_product: "whatsapp",
      to: message.from,
      "type": "interactive",
      "interactive": {
        "type": "location_request_message",
        "body": {
          "text": "Por favor, envía la ubicación actual donde ocurrió la colisión."
        },
        "action": {
          "name": "Enviar ubicación"
        }
      }
    },
  });
}

//FUNCION PARA ENVIAR MENSAJE DE TIPO PLANTILLA CON FLOW
function mensajePlantillaFlow(message, business_phone_number_id) {
  // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
  axios({
    method: "POST",
    url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                }
              }
            ]
          },
          {
            "type": "body",
            "parameters": [
              {
                "type": "text",
                "text": "N/A"
              }
            ]
          },
          {
            "type": "button",
            "sub_type": "flow",
            "index": "0",
            "parameters": [
              {
                "type": "text",
                "text": FLOW_VALIDAR_DATOS_CONCILIACION_NMK
              }
            ]
          }
        ]
      }
    }
  });
}

//FUNCION PARA ENVIAR MENSAJE DE TIPO PLATILLA
function mensajePlantilla() {
    // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
function mensajePlantillaSaludoInicial(message, business_phone_number_id, contac) {
    // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
          "name": "saludo_menu_autoexpedibles_mnk", 
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
                  "payload": "Solicitar_Polizas"
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
                  "payload": "Mis_polizas_activas"
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
                  "payload": "Preguntas_frecuentes"
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
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
function mensajePlantillaReintentar() {
    // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
          "name": "reintentar_cotizacion_mnk", 
          "language": { 
            "code": "es" 
          },
          "components": [
            {
              "type": "button",
              "sub_type": "quick_reply",
              "index": "0",
              "parameters": [
                {
                  "type": "payload",
                  "payload": "Aceptar"
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
                  "payload": "Rechazar"
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
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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

function consumoSeleccionOpcionMenuReclamaciones(respuesta){
    const url = URL_SERVICE + ENDPOINTS_API_MNK.ESTADO_VALORACION;
    const hashFecha = consultarFecha();

    const opcion =  {
      "IdOpcion": TIPOS_OPCIONES_MNK.ESTADO_VALORACION,
      "Celular": contac.wa_id,
      "Codigo": hashFecha + contac.wa_id,
      "EstadoValoracion": respuesta
    };

    // Datos que deseas enviar
    const data = {
      'data':{
        'opcion': opcion
      },
      'platform': "ConciliacionMNKWhatsApp",
      'idAplicacion': 4
    }; 

    console.log("📦 Peticion insertar opción de menú seleccionada", data);

    // Haciendo la solicitud POST
    fetch(url, {
        method: 'POST', // Método de la solicitud
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+TOKENT
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
          if(message.button?.payload === "Aceptar"){ 
            mensaje = "¡Gracias por aceptar la propuesta de conciliación!\n\n✍🏼 Para continuar con el proceso, es necesario que firmés el finiquito. En los próximos minutos vas a recibir un correo electrónico con el enlace para realizar la firma correspondiente y así poder dar continuidad al trámite.";
            mensajeTexto(mensaje,message, business_phone_number_id);

            /*axios({
              method: "POST",
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                    "text": "⏱️ Por favor, ingresa el código de validación que hemos enviado a tu correo electrónico registrado para validar tu identidad y continuar con el proceso."
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
              url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
              headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
              },
              data: {
                messaging_product: "whatsapp",
                status: "read",
                message_id: message.id,
              },
            });*/

            
              
          }else if(message.button?.payload === "Rechazar"){
              
            mensaje = "Entendemos tu decisión con respecto a la propuesta presentada.\n\n"+
              "Para continuar con el proceso de indemnización, es necesario realizar una *revisión presencial de tu vehículo en uno de nuestros Centros de Servicios.* Para ello, el asegurado, es decir, la otra parte involucrada en la colisión deberá agendar una cita dentro de un plazo máximo de 30 días calendario, a partir de esta notificación, en cualquiera de las siguientes sedes:\n\n"+
              "🔧 *Centro de Servicios – Uruca*\n📍 300 metros oeste del Hospital México, contiguo a Repretel, Uruca.\n🔗 Citas: https://bit.ly/CSUruca \n\n"+
              "🔧 *Centro de Servicios – Curridabat*\n📍 Contiguo a la agencia Datsun, Curridabat.\n🔗 https://bit.ly/CSCurridabat \n\n"+
              "🔧 *Centro de Servicios – Heredia*\n📍 200 norte de Cocorisa, Calle Inmaculada, Lagunilla, Heredia.\n🔗 https://bit.ly/CSHeredia";
            mensajeTexto(mensaje);
          }
          
        }else if(data.statusCode === 0){
          //MENSAJE ERROR
          console.error('❌ Error statusCode', data.statusCode);
          console.error('❌ Mensaje de Error', data.statusMessage); 

          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);

          mensajePlantillaReintentar(message, business_phone_number_id, contac);
        }else if(data.statusCode === 401){
          //MENSAJE ERROR
          console.error('❌ Error statusCode', data.statusCode);
          console.error('❌ Mensaje de Error', data.statusMessage); 

          //Genera el nuevo token
          generarToken();

          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);

          mensajePlantillaReintentar(message, business_phone_number_id, contac);
        }else{
          //MENSAJE ERROR
          console.error('❌ Error statusCode', data.statusCode);
          console.error('❌ Mensaje de Error', data.statusMessage); 

          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);

          mensajePlantillaReintentar(message, business_phone_number_id, contac);
        }
    }).catch((error) => {
        console.error('❌ Error registrando la opcion:', error); // Manejar errores

        //MENSAJE ENVIADO OPCION SELECCIONADA
        mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
        mensajeTexto(mensaje,message, business_phone_number_id);

        mensajePlantillaReintentar(message, business_phone_number_id, contac);
    });
}

function consumoSeleccionOpcionMenuAutoexpedibles(respuesta){
    //Consume servicio para almacenar el mensaje
    const url = URL_SERVICE + ENDPOINTS_API_AUTOEXPEDIBLES_MNK.REGISTRAR_MENSAJE;
    const hashFecha = consultarFecha();
    
    const opcion =  {
      "IdOpcion": TIPOS_OPCIONES_AUTOEXPEDIBLES_MNK.OPCION_MENU,
      "Celular": contac.wa_id,
      "Codigo": hashFecha + contac.wa_id
    };

    // Datos que deseas enviar
    const data = {
      'data':{
        'opcion': opcion,
        'Mensaje': respuesta
      },
      'platform': "AutoexpediblesMNKWhatsApp",
      'idAplicacion': 5
    }; 

    console.log("📦 Peticion insertar opción de menú seleccionada", data);

    // Haciendo la solicitud POST
    fetch(url, {
        method: 'POST', // Método de la solicitud
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+TOKENT
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
          if(message.button?.payload === "Solicitar_Polizas"){ 

            mensajeFormulario("VALIDACIÓN IDENTIDAD", "Para iniciar el proceso debemos validar tu identidad",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_VALIDACION_IDENTIDAD_MNK);

          }else if(message.button?.payload === "Mis_polizas_activas"){
              
            //FALTA ACA

          }else if(message.button?.payload === "Preguntas_frecuentes"){
              
            //FALTA ACA

          }
          
        }else if(data.statusCode === 0){
          //MENSAJE ERROR
          console.error('❌ Error statusCode', data.statusCode);
          console.error('❌ Mensaje de Error', data.statusMessage); 

          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);

          mensajePlantillaSaludoInicial(message, business_phone_number_id, contac);



        }else if(data.statusCode === 401){
          //MENSAJE ERROR
          console.error('❌ Error statusCode', data.statusCode);
          console.error('❌ Mensaje de Error', data.statusMessage); 

          //Genera el nuevo token
          generarToken();

          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);

          mensajePlantillaSaludoInicial(message, business_phone_number_id, contac);


        }else{
          //MENSAJE ERROR
          console.error('❌ Error statusCode', data.statusCode);
          console.error('❌ Mensaje de Error', data.statusMessage); 

          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
          mensajeTexto(mensaje,message, business_phone_number_id);

          mensajePlantillaSaludoInicial(message, business_phone_number_id, contac);



        }
    }).catch((error) => {
        console.error('❌ Error registrando la opcion:', error); // Manejar errores

        //MENSAJE ENVIADO OPCION SELECCIONADA
        mensaje = "❌ Error ingresando a la opción seleccionada, por favor intente de nuevo";
        mensajeTexto(mensaje,message, business_phone_number_id);

        mensajePlantillaSaludoInicial(message, business_phone_number_id, contac);



    });
}






//FUNCION PARA GENERAR EL TOKEN
const generarToken = async () => {
  //const url = URL_SERVICE + ENDPOINTS_API_MNK.OBTENER_TOKEN;
  const url = URL_SERVICE + ENDPOINTS_API_AUTOEXPEDIBLES_MNK.GENERAR_TOKEN;

  // Datos que deseas enviar
  const data = {
      'data':{
          "email": "Wasap@im.com",
          "clave": "123456789"
      },
      'platform': "AutoexpediblesMNKWhatsApp",
      'idAplicacion': 5
      //"platform": "ConciliacionMNKWhatsApp",
      //"idAplicacion": 4
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

//FUNCION PARA ENVIAR MENSAJE DE TIPO LISTA DE BOTON
function mensajeInteractiveLista(texto, plan) {
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
                  "id": plan,
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
      url: `https://graph.facebook.com/v25.0/${business_phone_number_id}/messages`,
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
  
