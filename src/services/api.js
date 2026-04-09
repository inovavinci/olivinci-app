const API_URL = 'https://script.google.com/macros/s/AKfycbwbG6rDyLIHzNA1if_nVExt2ppv78tn1rKKOUZFMFDSJ40fGaegnFE9qno6P7Nb4lRMDQ/exec';

export const api = {
  // Buscar dados (questões e equipes) com filtros de unidade e série
  getData: async (unidade, serie) => {
    try {
      // Adiciona timestamp para cache-busting
      const timestamp = Date.now();
      const url = `${API_URL}?unidade=${encodeURIComponent(unidade)}&serie=${encodeURIComponent(serie)}&t=${timestamp}`;
      console.log('API: Buscando dados em:', url);

      const response = await fetch(url, { redirect: 'follow' });

      if (!response.ok) {
        console.error(`API Error: Status ${response.status}`);
        const text = await response.text();
        console.error('API Error Response:', text);
        throw new Error('Erro ao buscar dados');
      }

      const data = await response.json();
      console.log('API: Dados recebidos com sucesso:', data);

      // Validação básica da estrutura
      if (!data.equipes && !data.questoes) {
        console.warn('API: Estrutura de resposta inesperada (faltam chaves equipes/questoes)', data);
        // Tentar normalizar se vier formato antigo (array direto de equipes)
        if (Array.isArray(data)) {
          console.log('API: Detectado formato antigo (array), adaptando...');
          return { questoes: [], equipes: data };
        }
      }

      return data;
    } catch (error) {
      console.error('API Error (getData):', error);
      throw error;
    }
  },

  // Enviar resposta do desafio
  submitChallenge: async (data) => {
    try {
      console.log('----- DEBUG POST GAS -----');
      console.log('Payload:', JSON.stringify(data, null, 2));
      console.log('--------------------------');

      // Tenta enviar requisição primária
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const text = await response.text();
          console.error('API Error Response:', text);
          throw new Error(`Erro ao enviar resposta: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const result = await response.json();
          console.log('API Success (JSON):', result);
          return result;
        } else {
          const text = await response.text();
          console.log('API Success (Text):', text);
          try {
            return JSON.parse(text);
          } catch (e) {
            return { status: 'success', message: text };
          }
        }
      } catch (primaryError) {
        console.warn('API: Falha na requisição primária, tentando fallback no-cors...', primaryError);

        // Fallback: Tenta enviar com no-cors se a primeira falhar (ex: erro de rede/CORS estrito)
        await fetch(API_URL, {
          method: 'POST',
          mode: 'no-cors', // Importante: não retorna resposta legível
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(data)
        });

        console.log('API: Requisição enviada via fallback no-cors (resposta opaca).');
        return { status: 'success', message: 'Enviado via fallback' };
      }
    } catch (error) {
      console.error('API Error (submitChallenge):', error);
      throw error;
    }
  },

  // Reset administrativo
  adminReset: async (unidade, serie, password) => {
    const payload = {
      action: 'RESET',
      unidade,
      serie,
      password
    };

    return api.submitChallenge(payload);
  },

  // Salvar tempo restante
  saveTime: async (unidade, serie, equipe, tempo) => {
    const payload = {
      action: 'SAVE_TIME',
      unidade,
      serie,
      equipe,
      tempo
    };
    return api.submitChallenge(payload);
  }
};
