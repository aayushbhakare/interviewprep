import api from './api';

export const interviewService = {
  getEligibility: async () => {
    const res = await api.get('/interviews/eligibility/');
    return res.data;
  },

  getPrepopulateData: async () => {
    const res = await api.get('/interviews/setup-prepopulate/');
    return res.data;
  },

  startSession: async (payload) => {
    const res = await api.post('/interviews/sessions/start/', payload);
    return res.data;
  },

  getSessionDetail: async (sessionId) => {
    const res = await api.get(`/interviews/sessions/${sessionId}/`);
    return res.data;
  },

  sendTurn: async (sessionId, speechText) => {
    const res = await api.post(`/interviews/sessions/${sessionId}/turns/`, {
      speech_text: speechText,
    });
    return res.data;
  },

  completeMixedAptitudeStage: async (sessionId) => {
    const res = await api.post(`/interviews/sessions/${sessionId}/rounds/complete-aptitude/`);
    return res.data;
  },

  evaluateSession: async (sessionId) => {
    const res = await api.post(`/interviews/sessions/${sessionId}/evaluate/`);
    return res.data;
  },

  getResults: async (sessionId) => {
    const res = await api.get(`/interviews/sessions/${sessionId}/results/`);
    return res.data;
  },

  abandonSession: async (sessionId) => {
    const res = await api.post(`/interviews/sessions/${sessionId}/abandon/`);
    return res.data;
  },

  getHistory: async (typeFilter = '') => {
    const url = typeFilter ? `/interviews/history/?type=${typeFilter}` : '/interviews/history/';
    const res = await api.get(url);
    return res.data;
  },

  getHistoryDetail: async (sessionId) => {
    const res = await api.get(`/interviews/history/${sessionId}/`);
    return res.data;
  },

  // Admin APIs
  getAdminConfig: async () => {
    const res = await api.get('/admin-panel/interviews/config/');
    return res.data;
  },

  updateAdminConfig: async (payload) => {
    const res = await api.patch('/admin-panel/interviews/config/', payload);
    return res.data;
  },

  getAdminAnalytics: async () => {
    const res = await api.get('/admin-panel/interviews/analytics/');
    return res.data;
  },
};
