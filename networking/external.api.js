/*
 * Copyright 2025, Inteligencia móvil.
 * Licensed under the Apache License, Version 2.0.
 */

import axios from 'axios';

export class ExternalApi {

  async request(url, AUTHORIZATION_SERVICE, TOKENT, data) {
    try {
      const response = await fetch(url, {
           method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTHORIZATION_SERVICE,
                'token': TOKENT
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response.json();
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Error HTTP
      throw {
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Error de red
      throw {
        status: 0,
        message: 'No se pudo conectar con el servidor',
      };
    } else {
      // Error interno
      throw {
        status: -1,
        message: error.message,
      };
    }
  }
}
