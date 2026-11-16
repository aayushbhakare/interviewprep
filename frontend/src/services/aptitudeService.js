import api from './api';

const aptitudeService = {
  // Student APIs
  getAptitudeConfig: () => api.get('/aptitude/config/'),
  startOrResumeSession: (sessionType = 'standalone') =>
    api.post('/aptitude/sessions/start/', { session_type: sessionType }),
  getSessionDetail: (sessionId) => api.get(`/aptitude/sessions/${sessionId}/`),
  autosaveAnswers: (sessionId, answers) =>
    api.post(`/aptitude/sessions/${sessionId}/autosave/`, { answers }),
  abandonSession: (sessionId) => api.post(`/aptitude/sessions/${sessionId}/abandon/`),
  submitSession: (sessionId) => api.post(`/aptitude/sessions/${sessionId}/submit/`),
  getSessionResults: (sessionId) => api.get(`/aptitude/sessions/${sessionId}/results/`),
  getAptitudeHistory: () => api.get('/aptitude/history/'),
  reportQuestion: (questionId, reason, description) =>
    api.post('/aptitude/questions/report/', { question_id: questionId, reason, description }),

  // Admin APIs
  adminGetQuestions: (params) => api.get('/admin-panel/aptitude/questions/', { params }),
  adminCreateQuestion: (data) => api.post('/admin-panel/aptitude/questions/', data),
  adminGetQuestionDetail: (questionId) =>
    api.get(`/admin-panel/aptitude/questions/${questionId}/`),
  adminPublishVersion: (questionId, data) =>
    api.post(`/admin-panel/aptitude/questions/${questionId}/version/`, data),
  adminUpdateStatus: (questionId, status) =>
    api.patch(`/admin-panel/aptitude/questions/${questionId}/status/`, { status }),
  adminGetReports: () => api.get('/admin-panel/aptitude/reports/'),
  adminResolveReport: (reportId, action, notes) =>
    api.post(`/admin-panel/aptitude/reports/${reportId}/resolve/`, { action, notes }),
  adminGetConfig: () => api.get('/admin-panel/aptitude/config/'),
  adminUpdateConfig: (data) => api.patch('/admin-panel/aptitude/config/', data),
};

export default aptitudeService;
