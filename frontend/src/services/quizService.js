import api from './api';

export const quizService = {
  // Weekly quiz overview and readiness
  getWeeklyQuizOverview: async (weekNumber) => {
    const response = await api.get(`/quizzes/weeks/${weekNumber}/assignment/`);
    return response.data;
  },

  // Start or resume a quiz attempt
  startWeeklyQuiz: async (weekNumber) => {
    const response = await api.post(`/quizzes/weeks/${weekNumber}/start/`);
    return response.data;
  },

  // Autosave responses for an active attempt
  autosaveQuizAnswers: async (attemptId, answers) => {
    const response = await api.patch(`/quizzes/attempts/${attemptId}/answers/`, { answers });
    return response.data;
  },

  // Abandon an in-progress attempt (discards draft answers)
  abandonQuizAttempt: async (attemptId) => {
    const response = await api.post(`/quizzes/attempts/${attemptId}/abandon/`);
    return response.data;
  },

  // Final submission of attempt
  submitQuizAttempt: async (attemptId) => {
    const response = await api.post(`/quizzes/attempts/${attemptId}/submit/`);
    return response.data;
  },

  // Get results and question-by-question review
  getQuizResults: async (attemptId) => {
    const response = await api.get(`/quizzes/attempts/${attemptId}/results/`);
    return response.data;
  },

  // Attempt history for a weekly quiz
  getWeeklyQuizHistory: async (weekNumber) => {
    const response = await api.get(`/quizzes/weeks/${weekNumber}/history/`);
    return response.data;
  },

  // Student reporting a question issue
  reportQuestion: async (questionId, reason, description) => {
    const response = await api.post(`/questions/${questionId}/report/`, { reason, description });
    return response.data;
  },

  // Question metadata catalog
  getQuestionCatalog: async () => {
    const response = await api.get('/questions/catalog/');
    return response.data;
  },

  // Admin APIs
  getAdminQuestions: async (params = {}) => {
    const response = await api.get('/admin-panel/questions/', { params });
    return response.data;
  },

  createAdminQuestion: async (payload) => {
    const response = await api.post('/admin-panel/questions/', payload);
    return response.data;
  },

  getAdminQuestionDetail: async (questionId) => {
    const response = await api.get(`/admin-panel/questions/${questionId}/`);
    return response.data;
  },

  createAdminQuestionVersion: async (questionId, payload) => {
    const response = await api.post(`/admin-panel/questions/${questionId}/versions/`, payload);
    return response.data;
  },

  updateAdminQuestionStatus: async (questionId, status, notes = '') => {
    const response = await api.patch(`/admin-panel/questions/${questionId}/status/`, { status, notes });
    return response.data;
  },

  getAdminReports: async (params = {}) => {
    const response = await api.get('/admin-panel/questions/reports/', { params });
    return response.data;
  },

  resolveAdminReport: async (reportId, payload) => {
    const response = await api.patch(`/admin-panel/questions/reports/${reportId}/`, payload);
    return response.data;
  },
};

export default quizService;
