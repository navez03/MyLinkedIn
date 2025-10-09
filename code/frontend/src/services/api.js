const API_BASE_URL = 'http://localhost:3000';

export const authAPI = {
  /**
   * Registra um novo utilizador
   * @param {string} email - Email do utilizador
   * @param {string} password - Password do utilizador
   * @returns {Promise<Object>} - Resposta da API
   */
  register: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erro ao criar conta');
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro de ligação ao servidor',
      };
    }
  },

  /**
   * Faz login do utilizador
   * @param {string} email - Email do utilizador
   * @param {string} password - Password do utilizador
   * @returns {Promise<Object>} - Resposta da API
   */
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erro ao fazer login');
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro de ligação ao servidor',
      };
    }
  },
};