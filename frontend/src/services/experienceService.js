import api from './api';

export const experienceService = {
  // Public Discovery
  getPublicExperiences: async (params = {}) => {
    const res = await api.get('/experiences/', { params });
    return res.data;
  },

  getTaxonomy: async () => {
    const res = await api.get('/experiences/taxonomy/');
    return res.data;
  },

  getExperienceDetail: async (experienceId) => {
    const res = await api.get(`/experiences/${experienceId}/`);
    return res.data;
  },

  // Student Submissions & Drafts
  getMyExperiences: async (status = '') => {
    const params = status ? { status } : {};
    const res = await api.get('/experiences/my/', { params });
    return res.data;
  },

  saveDraft: async (data, experienceId = null) => {
    if (experienceId) {
      const res = await api.put(`/experiences/drafts/${experienceId}/`, data);
      return res.data;
    }
    const res = await api.post('/experiences/drafts/', data);
    return res.data;
  },

  publishExperience: async (experienceId, data = null) => {
    const res = await api.post(`/experiences/${experienceId}/publish/`, data || {});
    return res.data;
  },

  editPublishedExperience: async (experienceId, data) => {
    const res = await api.put(`/experiences/${experienceId}/edit-published/`, data);
    return res.data;
  },

  deleteExperience: async (experienceId) => {
    const res = await api.delete(`/experiences/${experienceId}/delete/`);
    return res.data;
  },

  // Social & Community Feedback
  toggleHelpfulVote: async (experienceId) => {
    const res = await api.post(`/experiences/${experienceId}/helpful/`);
    return res.data;
  },

  reportExperience: async (experienceId, reason, explanation = '') => {
    const res = await api.post(`/experiences/${experienceId}/report/`, {
      reason,
      explanation,
    });
    return res.data;
  },

  // Admin Moderation Console
  getAdminModerationQueue: async (params = {}) => {
    const res = await api.get('/admin-panel/experiences/', { params });
    return res.data;
  },

  getAdminExperienceDetail: async (experienceId) => {
    const res = await api.get(`/admin-panel/experiences/${experienceId}/`);
    return res.data;
  },

  adminModerationAction: async (experienceId, action, reason = '', versionNumber = null) => {
    const payload = { action, reason };
    if (versionNumber) payload.version_number = versionNumber;
    const res = await api.post(`/admin-panel/experiences/${experienceId}/action/`, payload);
    return res.data;
  },

  getAdminReports: async (status = 'pending') => {
    const res = await api.get('/admin-panel/experiences/reports/', {
      params: { status },
    });
    return res.data;
  },

  resolveAdminReport: async (reportId, resolution, adminNotes = '') => {
    const res = await api.post(`/admin-panel/experiences/reports/${reportId}/resolve/`, {
      resolution,
      admin_notes: adminNotes,
    });
    return res.data;
  },
};
