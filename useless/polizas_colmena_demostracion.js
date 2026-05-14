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

let message = null;
let contac = null;
let business_phone_number_id = null;

let mensaje = null;
let TOKENT = null;

const app = express();
app.use(express.json()); 

//OBTIENE LOS DATOS DE LAS VARIABLES CREADAS EN .ENV
const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, FLOW_VIABILIDAD, FLOW_ACUERDO, FLOW_MIS_POLIZAS, URL_SERVICE, AUTHORIZATION_SERVICE, PORT } = process.env;

app.post("/webhook", async (req, res) => {
   
  //URL Desarrollo
  //http://34.42.187.146/im/datosinteligentes/api/gateway/
  
  //URL Presentacion
  //http://34.42.187.146/im/datosinteligentes/test/gateway/
  
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
      mensajePlantilla();
    }else if(message.text.body === "Gracias"){
      console.log('💬 Es Despedida:', true); 
      
      //IDENTIFICA SI ES UNA DESPUEDIDA
      mensaje = "👋 Gracias por preferirnos. ¡Hasta pronto!";
      mensajeTexto(mensaje); 
    }else if (!isNaN(message.text.body)) {
      //IDENTIFICA SI INGRESO UN CODIGO DE 4 DIGITOS
      if(message.text.body.length === 4){
        console.log('💬 Es Codigo de 4 digitos:', true); 
        
        if(message.text.body === "3377"){
          mensajeInteractive("✅ Tu identidad ha sido validada exitosamente.\n\nEn que podemos ayudarte?");
        }else{
          //MENSAJE SI EL MENSAJE NO ES VALIDO
          mensaje = "❌ El código ingresado no es válido, Por favor ingresa el código de 4 digitos enviado a tu correo electrónico.";
          mensajeTexto(mensaje);
        }
        
        
        //Consume servicio para validar el codigo
        /*const url = URL_SERVICE + "reporte/ValidarCodigoOTP";

        // Datos que deseas enviar
        const data = {
            'data':{
              "IdOpcion": 2,
              "NumeroCelular": contac.wa_id,

              "Codigo": message.text.body,

              "Canal": "WhatsAppPoliza"
            },
            'platform': "WhatsAppPoliza"
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
              mensajeInteractive("✅ Tu identidad ha sido validada exitosamente.\n\nEn que podemos ayudarte?");
            }else if(data.statusCode === 0){
              //MENSAJE ENVIANDO EL CORREO
              mensaje = "❌ "+data.statusMessage;
              mensajeTexto(mensaje);
            }else if(data.statusCode === 401){
              //MENSAJE ENVIANDO EL CORREO
              mensaje = "❌ Error validando el código, por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
              mensajeTexto(mensaje);

              generarToken();
            }else{
              //MENSAJE ENVIANDO EL CORREO
              mensaje = "❌ Error validando el código, por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
              mensajeTexto(mensaje);
            }
        }).catch((error) => {
            console.error('❌ Error validando el código:', error); // Manejar errores

            //MENSAJE ENVIANDO EL CORREO
            mensaje = "❌ Error validando el código, por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
            mensajeTexto(mensaje);
        });*/
        
      }else{
        //MENSAJE NO ES VALIDO
        mensaje = "❌ El código ingresado no es válido, Por favor ingresa el código de 4 digitos enviado a tú correo electrónico.";
        mensajeTexto(mensaje);
      }
    }else{
      //MENSAJE NO ES VALIDO
      mensaje = "Mensaje no identificado, para realizar una consulta debe inciar la conversación con un saludo\n*(Ejemplo: Hola, Buenas tardes, Buenas noches, etc)*";
      mensajeTexto(mensaje);





      //Consume servicio mensaje invalido
      /*const url = URL_SERVICE + "reporte/MensajeInvalido";

        // Datos que deseas enviar
        const data = {
            'data':{
              "IdOpcion": 99,
              "NumeroCelular": contac.wa_id,

              "Mensaje": message.text.body,

              "Canal": "WhatsAppPoliza"
            },
            'platform': "WhatsAppPoliza"
        }; 

        console.log("📦 Peticion mensaje invalido", data);

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
                console.error('❌ Error validando mensaje anterior');
            }

            return response.json(); // Convertir la respuesta a JSON
        }).then(data => {
            if(data.statusCode === 1){
              mensajeInteractive("❌ Mensaje invalido, por favor intente de nuevo.");
              
              let OpcionAnterior = data.result.OpcionAnterior;

              switch (OpcionAnterior) {
                case 1:
                  console.log("Formulario validar identidad");
                  
                  mensajePlantilla();
                  break;

                case 2:
                  console.log("Ingresar código");

                  mensaje = "❌ Error validando el código, por favor ingresa el código de 4 digitos enviado a tú correo electrónico";
                  mensajeTexto(mensaje);
                  break;

                case 3:
                  console.log("Opcion de menu");

                  mensaje = "❌ Error ingresando a la opción seleccionada, porfavor intente de nuevo";
                  mensajeTexto(mensaje);
                  break;

                case 4:
                  console.log("Formulario viabilidad");

                  mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                    "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD);
                  break;

                case 5:
                  console.log("Formulario acuerdo");

                  mensajeFormulario("DATOS ACUERDO", "¡Felicidades! 🎉\nNos complace informarte que tu viabilidad para adquierir la Póliza ha sido aprobada.\n\nPor favor ingresa los siguientes datos para terminar",
                          "Por favor haga clic en el botón para terminar", "TERMINAR", FLOW_ACUERDO);
                  break;

                case 7:
                  console.log("Formulario acuerdo");

                  mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus polizas",
                          "Por favor haga clic en el botón para consultar", "TERMINAR", FLOW_MIS_POLIZAS);
                  break;

                default:
                  console.log("Día no válido");
              }



            }else if(data.statusCode === 0){
              //MENSAJE INVALIDO
              mensaje = "❌ Mensaje invalido, por favor intente de nuevo.";
              mensajeTexto(mensaje);
            }else if(data.statusCode === 401){
              //MENSAJE INVALIDO
              mensaje = "❌ Mensaje invalido, por favor intente de nuevo.";
              mensajeTexto(mensaje);

              generarToken();
            }else{
              //MENSAJE INVALIDO
              mensaje = "❌ Mensaje invalido, por favor intente de nuevo.";
              mensajeTexto(mensaje);
            }
        }).catch((error) => {
            console.error('❌ Error validando mensaje anterior:', error); // Manejar errores

             //MENSAJE INVALIDO
              mensaje = "❌ Mensaje invalido, por favor intente de nuevo.";
              mensajeTexto(mensaje);
        });*/










    }
    
  }else if(message?.type === "interactive" && message?.interactive.type === "button_reply"){
    console.log("💬 PRESIONO EL BOTON:", message.interactive.button_reply.id);
    
    //IDENTIFICA SI PRESIONO UN BOTON
    if(message.interactive.button_reply.id === "SOLICITAR_POLIZA"){  
      
      mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD);
      
    }else if(message.interactive.button_reply.id === "CONSULTAR_POLIZA"){ 
      
      mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus polizas",
                         "Por favor haga clic en el botón para consultar", "TERMINAR", FLOW_MIS_POLIZAS);
      
    }else if(message.interactive.button_reply.id === "PREGUNTAS_FRECUENTES"){ 
      
      mensaje = "Si tienes alguna duda, puedes revisar nuestras preguntas frecuentes en este link\n👉 www.inteligencia-movil.com";
      mensajeTexto(mensaje);
      
    }else if(message.interactive.button_reply.id === "PAGAR"){ 
      mensaje = "Puede realizar su pago de manera segura a través del siguiente enlace:\n👉 www.pse.com.co/persona//\n\nSi tiene alguna duda o inconveniente durante el proceso, no dude en contactarnos.";
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

    }


    //Consume servicio para validar la opcion que selecciono
    /*const url = URL_SERVICE + "reporte/ValidarCodigoOTP";

    // Datos que deseas enviar
    const data = {
        'data':{
          "IdOpcion": 3,
          "NumeroCelular": contac.wa_id,

          "Opcion": message.interactive.button_reply.id,

          "Canal": "WhatsAppPoliza"
        },
        'platform': "WhatsAppPoliza"
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
            console.error('❌ Error validando el codigo');
        }

        return response.json(); // Convertir la respuesta a JSON
    }).then(data => {
        if(data.statusCode === 1){
          //IDENTIFICA SI PRESIONO UN BOTON
          if(message.interactive.button_reply.id === "SOLICITAR_POLIZA"){  
            
            mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                        "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD);
            
          }else if(message.interactive.button_reply.id === "CONSULTAR_POLIZA"){ 
            
            mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus polizas",
                              "Por favor haga clic en el botón para consultar", "TERMINAR", FLOW_MIS_POLIZAS);
            
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
          }
        }else if(data.statusCode === 0){
          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error ingresando a la opción seleccionada, porfavor intente de nuevo";
          mensajeTexto(mensaje);

          mensajeInteractive("✅ Tu identidad ha sido validada exitosamente.\n\nEn que podemos ayudarte?");
        }else if(data.statusCode === 401){
          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error ingresando a la opción seleccionada, porfavor intente de nuevo";
          mensajeTexto(mensaje);

          generarToken();

          mensajeInteractive("✅ Tu identidad ha sido validada exitosamente.\n\nEn que podemos ayudarte?");
        }else{
          //MENSAJE ENVIADO OPCION SELECCIONADA
          mensaje = "❌ Error ingresando a la opción seleccionada, porfavor intente de nuevo";
          mensajeTexto(mensaje);

          mensajeInteractive("✅ Tu identidad ha sido validada exitosamente.\n\nEn que podemos ayudarte?");
        }else if(data.statusCode === 401){
        }
    }).catch((error) => {
        console.error('❌ Error validando el código:', error); // Manejar errores

        //MENSAJE ENVIADO OPCION SELECCIONADA
        mensaje = "❌ Error ingresando a la opción seleccionada, porfavor intente de nuevo";
        mensajeTexto(mensaje);

        mensajeInteractive("✅ Tu identidad ha sido validada exitosamente.\n\nEn que podemos ayudarte?");
    });*/










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
              text: { body: "⏱️ Por favor, ingrese el código de validación que le hemos enviado al correo electronico para continuar con el proceso"},
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
          //ENVIA LOS DATOS DEL FORMULARIO
          /*const url = URL_SERVICE + "reporte/GetReporte";

          // Datos que deseas enviar
          const data = {
              'data':{
                  "IdOpcion": 1,
                  "NumeroCelular": contac.wa_id,

                  "Correo": respuesta.Correo,
                  "TipoDocumento": respuesta.TipoDocumento,
                  "NumeroDocumento": respuesta.NumeroDocumento,
                  "PrimerNombre": respuesta.PrimerNombre,
                  "SegundoNombre": respuesta.SegundoNombre,
                  "PrimerApellido": respuesta.PrimerApellido,
                  "SegundoApellido": respuesta.SegundoApellido,
                  "TratamientoDatosGeneral": respuesta.TratamientoDatosGeneral,
                  "TratamientoDatosVida": respuesta.TratamientoDatosVida,
                  
                  "Canal": "WhatsAppPoliza"
              },
              'platform': "WhatsAppPoliza"
          }; 

          console.log("📦 Peticion Formulario Validacion de identidad", data);

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
                      text: { body: "⏱️ Por favor, ingrese el código de validación que le hemos enviado al correo electronico para continuar con el proceso"},
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
                
                mensajePlantilla();
              }else if(data.statusCode === 401){
                //MENSAJE ERROR DE SEGURIDAD
                mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                generarToken();
                
                mensajePlantilla();
                
              }else{
                //MENSAJE ERROR ENVIADO FORMUALRIO DE VALDIACION DE IDENTIDAD
                mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                mensajePlantilla();
              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              mensaje = "❌ Ocurrio un error registrando el formulario de validación de identidad, por favor intente de nuevo.";
              mensajeTexto(mensaje);
              
              mensajePlantilla();
          }); */
      }else if(respuesta.Formulario === "2"){
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
              text: { body: "✅ Tu datos se estan validando, por favor espera un momento para continuar con el proceso"}
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
             
              mensajeFormulario("DATOS ACUERDO", "¡Felicidades! 🎉\nNos complace informarte que tu viabilidad para adquierir la Póliza ha sido aprobada.\n\nPor favor ingresa los siguientes datos para terminar",
                         "Por favor haga clic en el botón para terminar", "TERMINAR", FLOW_ACUERDO);
          }, 700);


          /*for (let i = 0; i < respuesta.FotoCedula.length; i++) {            
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
                  "IdOpcion": 3,
                  "NumeroCelular": contac.wa_id,

                  "TipoSolicitante": respuesta.TipoSolicitante,
                  "TipoDocumento": respuesta.TipoDocumento,
                  "NumeroDocumento": respuesta.NumeroDocumento,
                 
                  "ImagenCedula": JSON.stringify(listaImagenes),
                  
                  "Canal": "WhatsAppPoliza"
              },
              'platform': "PolizaWhatsApp"
          }; 

          console.log("📦 Peticion Formulario de datos viabilidad", data);

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
                  console.error('❌ Ocurrio un error registrando el formulario datos viabilidad');
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
                      text: { body: "✅ Tu datos se estan validando, por favor espera un momento para continuar con el proceso"}
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
                mensaje = "❌ Ocurrio un error registrando el envio de los datos del formulario de viabilidad, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                generarToken();
                
                mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                   "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD);
                
              }else if(dat.statusCode === 0){
                  //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
                  mensaje = "❌ Ocurrio un error registrando el envio de los datos del formulario de viabilidad, por favor intente de nuevo.";
                  mensajeTexto(mensaje);
                
                  mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                    "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD);
              }else{
                //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
                  mensaje = "❌ Ocurrio un error registrando el envio de los datos del formulario de viabilidad, por favor intente de nuevo.";
                  mensajeTexto(mensaje);
                
                  mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                    "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD);
              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE VIABILIDAD
                  mensaje = "❌ Ocurrio un error registrando el envio de los datos del formulario de viabilidad, por favor intente de nuevo.";
                  mensajeTexto(mensaje);
                
                  mensajeFormulario("ESTUDIO VIABILIDAD", "Para iniciar el proceso debemos validar la viabilidad para adquirir la poliza.\n\nPor favor ingresa los siguientes datos para continuar.\n\n",
                    "Haga clic en el botón para iniciar", "INICIAR", FLOW_VIABILIDAD);
          });   */       
      }else if(respuesta.Formulario === "3"){
         axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
              messaging_product: "whatsapp",
              to: message.from,
              text: { body: "✅ Tu datos se estan validando, por favor espera un momento para continuar con el proceso"}
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
                      "text": "📃 *COTIZACIÓN PÓLIZA*\n\nTipo de Póliza:\n*Garantia acuerdo pago*\n\nEmitida por:\n*COLMENA SEGUROS*\n\nVigencia:\n*1 Año (hasta 13, 2026)*\n\nEmitida a:\n*Juan Manuel Perez*\n\nValor a pagar:\n*$120.000*"
                    },
                    "action": {
                      "buttons": [
                        {
                          "type": "reply",
                          "reply": {
                            "id": "PAGAR",
                            "title": "Ir a pago"
                          }
                        }
                      ]
                    }
                  },
                },
              });
          }, 700);
          
          /*for (let i = 0; i < respuesta.FotoAcuerdo.length; i++) {            
            let id = `${respuesta.FotoAcuerdo?.[i].id}`;

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
                  "IdOpcion": 5,
                  "NumeroCelular": contac.wa_id,

                  "Cuotas": respuesta.Cuotas,
                  "Valor": respuesta.Valor,
                  "FotoAcuerdo": JSON.stringify(listaImagenes),

                  "Canal": "WhatsAppPoliza"
              },
              'platform': "PolizaWhatsApp"
          }; 

          console.log("📦 Peticion Formulario de datos de acuerdo de pago", data);

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
                      text: { body: "✅ Tu datos se estan validando, por favor espera un momento para continuar con el proceso"}
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
                
                mensajeFormulario("DATOS ACUERDO", "¡Felicidades! 🎉\nNos complace informarte que tu viabilidad para adquierir la Póliza ha sido aprobada.\n\nPor favor ingresa los siguientes datos para terminar",
                         "Por favor haga clic en el botón para terminar", "TERMINAR", FLOW_ACUERDO);
                
              }else if(dat.statusCode === 0){
                //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE ACUERDO DE PAGO
                mensaje = "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                mensajeFormulario("DATOS ACUERDO", "¡Felicidades! 🎉\nNos complace informarte que tu viabilidad para adquierir la Póliza ha sido aprobada.\n\nPor favor ingresa los siguientes datos para terminar",
                         "Por favor haga clic en el botón para terminar", "TERMINAR", FLOW_ACUERDO);
              }else{
                //MENSAJE ERROR ENVIANDO FORMULARIO DE ACUERDOS DE PAGO
                mensaje = "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                mensajeFormulario("DATOS ACUERDO", "¡Felicidades! 🎉\nNos complace informarte que tu viabilidad para adquierir la Póliza ha sido aprobada.\n\nPor favor ingresa los siguientes datos para terminar",
                         "Por favor haga clic en el botón para terminar", "TERMINAR", FLOW_ACUERDO);
              }
          }).catch((error) => {
              console.error('❌ Error registrando el formulario:', error); // Manejar errores
            
              mensaje = "❌ Ocurrio un error registrando el formulario de datos del acuerdo de pago, por favor intente de nuevo.";
              mensajeTexto(mensaje);
                
              mensajeFormulario("DATOS ACUERDO", "¡Felicidades! 🎉\nNos complace informarte que tu viabilidad para adquierir la Póliza ha sido aprobada.\n\nPor favor ingresa los siguientes datos para terminar",
                         "Por favor haga clic en el botón para terminar", "TERMINAR", FLOW_ACUERDO);
          }); */
      }else if(respuesta.Formulario === "4"){

        
          //ENVIA LOS DATOS DEL FORMULARIO DE ACUERDO DE PAGO
          const url = URL_SERVICE + "poliza/SetAcuerdoPoliza";

          // Datos que deseas enviar
          const data = {
              'data':{
                  "IdOpcion": 7,
                  "NumeroCelular": contac.wa_id,

                  "TipoDocumento": respuesta.TipoDocumento,
                  "NumeroDocumento": respuesta.NumeroDocumento,
                 
                  "Canal": "WhatsAppPoliza"
              },
              'platform': "PolizaWhatsApp"
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
                      //NOTA: Falta aca mapear los datos de las polizas
                      text: { body: "✅ Actualmente tiene las siguientes polizas activas"}
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
                mensaje = "❌ Ocurrio un error consultando las polizas, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                generarToken();
                
                mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus polizas",
                         "Por favor haga clic en el botón para consultar", "TERMINAR", FLOW_MIS_POLIZAS);
                
              }else if(dat.statusCode === 0){
                //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE CONSULTAR POLIZAS
                mensaje = "❌ Ocurrio un error consultando las polizas, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus polizas",
                         "Por favor haga clic en el botón para consultar", "TERMINAR", FLOW_MIS_POLIZAS);
              }else{
                 //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE CONSULTAR POLIZAS
                mensaje = "❌ Ocurrio un error consultando las polizas, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus polizas",
                         "Por favor haga clic en el botón para consultar", "TERMINAR", FLOW_MIS_POLIZAS);
              }
          }).catch((error) => {
              console.error('❌ Error Consultando polizas:', error); // Manejar errores
            
              //MENSAJE ERROR ENVIANDO FORMULARIO DE DATOS DE CONSULTAR POLIZAS
                mensaje = "❌ Ocurrio un error consultando las polizas, por favor intente de nuevo.";
                mensajeTexto(mensaje);
                
                mensajeFormulario("CONSULTAR MIS POLIZAS", "Por favor ingresa los siguientes datos para consultar sus polizas",
                         "Por favor haga clic en el botón para consultar", "TERMINAR", FLOW_MIS_POLIZAS);
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
                  "id": "SOLICITAR_POLIZA",
                  "title": "SOLICITAR POLIZA"
                }
              },
              {
                "type": "reply",
                "reply": {
                  "id": "CONSULTAR_POLIZA",
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

//F/FUNCION PARA ENVIAR MENSAJE DE TIPO PLATILLA
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
          "name": "saludo_colmena_2", 
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
                    "link": "http://invesvial.com/IM/logos/polizas/Colmena/LogoColmena.png"
                  }
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
                  "text": "838994295420992"
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


//FUNCION PARA GENERAR EL TOKEN
function generarToken() {
  const url = URL_SERVICE + "Usuario/AutenticarUsuario";

  // Datos que deseas enviar
  const data = {
      'data':{
          "username": "Wasap@im.com",
          "clave": "4c0f5362badb1400Ed5WRNgZ7vYYBO832rgDmSCcx7HGIJR7jGZ6yQ0E5b8="
      },
      'platform': "PolizaWhatsApp"
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
        console.error('❌ Error genenrando TOKENT');
      }else{
        console.error('❌ Error genenrando TOKENT');
      }
  }).catch((error) => {
      console.error('❌ Error genenrando TOKENT:', error); 
  });   
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