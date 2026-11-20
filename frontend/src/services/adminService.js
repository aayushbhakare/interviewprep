import api from './api';

const adminService = {
  // Dashboard Overview
  getDashboardOverview: async () => {
    const res = await api.get('/admin-panel/dashboard/');
    return res.data;
  },

  // Student Management
  getStudents: async (params = {}) => {
    const res = await api.get('/admin-panel/students/', { params });
    return res.data;
  },

  getStudentDetail: async (studentId) => {
    const res = await api.get(`/admin-panel/students/${studentId}/`);
    return res.data;
  },

  suspendStudent: async (studentId, suspension_reason) => {
    const res = await api.post(`/admin-panel/students/${studentId}/suspend/`, {
      suspension_reason,
    });
    return res.data;
  },

  reactivateStudent: async (studentId) => {
    const res = await api.post(`/admin-panel/students/${studentId}/reactivate/`);
    return res.data;
  },

  // Learning Content Versioning & Management
  getLearningTopics: async (params = {}) => {
    const res = await api.get('/admin-panel/learning/topics/', { params });
    return res.data;
  },

  getLearningTopicDetail: async (topicId) => {
    const res = await api.get(`/admin-panel/learning/topics/${topicId}/`);
    return res.data;
  },

  createOrVersionTopic: async (topicId, payload) => {
    const res = await api.post(`/admin-panel/learning/topics/${topicId}/version/`, payload);
    return res.data;
  },

  toggleTopicStatus: async (topicId, is_published) => {
    const res = await api.post(`/admin-panel/learning/topics/${topicId}/toggle-status/`, {
      is_published,
    });
    return res.data;
  },

  // Platform Settings
  getPlatformSettings: async () => {
    const res = await api.get('/admin-panel/settings/');
    return res.data;
  },

  updatePlatformSetting: async (key, setting_value) => {
    const res = await api.patch(`/admin-panel/settings/${key}/`, {
      setting_value,
    });
    return res.data;
  },

  // AI Models & Routing
  getAIModels: async () => {
    const res = await api.get('/admin-panel/ai-models/');
    return res.data;
  },

  updateAIModel: async (serviceName, payload) => {
    const res = await api.patch(`/admin-panel/ai-models/${serviceName}/`, payload);
    return res.data;
  },

  // System Health, Telemetry & Jobs
  getMonitoringData: async () => {
    const res = await api.get('/admin-panel/monitoring/');
    return res.data;
  },

  retryProcessingJob: async (jobId) => {
    const res = await api.post(`/admin-panel/jobs/${jobId}/retry/`);
    return res.data;
  },

  // Activity Audit Logs
  getActivityLogs: async (params = {}) => {
    const res = await api.get('/admin-panel/activity-logs/', { params });
    return res.data;
  },

  // Maintenance Controls
  getMaintenanceStatus: async () => {
    const res = await api.get('/admin-panel/maintenance/');
    return res.data;
  },

  updateMaintenanceStatus: async (payload) => {
    const res = await api.post('/admin-panel/maintenance/', payload);
    return res.data;
  },

  // Admin Account & Security Management
  getAdminAccounts: async () => {
    const res = await api.get('/admin-panel/admins/');
    return res.data;
  },

  deactivateAdmin: async (adminId) => {
    const res = await api.post(`/admin-panel/admins/${adminId}/deactivate/`);
    return res.data;
  },

  reactivateAdmin: async (adminId) => {
    const res = await api.post(`/admin-panel/admins/${adminId}/reactivate/`);
    return res.data;
  },

  getAdminInvitations: async () => {
    const res = await api.get('/admin-panel/invitations/');
    return res.data;
  },

  sendAdminInvitation: async (email, role = 'staff') => {
    const res = await api.post('/admin-panel/invitations/', { email, role });
    return res.data;
  },

  revokeAdminInvitation: async (invitationId) => {
    const res = await api.post(`/admin-panel/invitations/${invitationId}/revoke/`);
    return res.data;
  },
};

export default adminService;
