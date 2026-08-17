import client from './client';

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboard = {
  get:      () => client.get('/dashboard'),
  enhanced: () => client.get('/dashboard/enhanced'),
};

// ── Medicines ────────────────────────────────────────────────────────────────
export const medicines = {
  list:             (params) => client.get('/medicines', { params }),
  create:           (data)   => client.post('/medicines', data),
  update:           (id, data) => client.put(`/medicines/${id}`, data),
  remove:           (id)     => client.delete(`/medicines/${id}`),
  bulkDelete:       (ids)    => client.post('/medicines/bulk-delete', { ids }),
  restore:          (id)     => client.post(`/medicines/${id}/restore`),
  export:           (params) => client.get('/medicines/export', { params, responseType: 'blob' }),
  history:          (id)     => client.get(`/medicines/${id}/history`),
  validatePricing:  (data)   => client.post('/medicines/validate-pricing', data),
  pricingGuidelines:()       => client.get('/medicines/pricing-guidelines'),
  updatePricing:    (data)   => client.post('/medicines/update-pricing', data),
  pricingReport:    ()       => client.get('/medicines/pricing-report'),
};

// ── Medicine Categories ──────────────────────────────────────────────────────
export const medicineCategories = {
  list:         (params)   => client.get('/medicine-categories', { params }),
  create:       (data)     => client.post('/medicine-categories', data),
  update:       (id, data) => client.put(`/medicine-categories/${id}`, data),
  remove:       (id)       => client.delete(`/medicine-categories/${id}`),
  restore:      (id)       => client.post(`/medicine-categories/${id}/restore`),
  toggleActive: (id)       => client.post(`/medicine-categories/${id}/toggle-active`),
};

// ── Medicine Names ───────────────────────────────────────────────────────────
export const medicineNames = {
  list:   (params)   => client.get('/medicine-names', { params }),
  create: (data)     => client.post('/medicine-names', data),
  update: (id, data) => client.put(`/medicine-names/${id}`, data),
  remove: (id)       => client.delete(`/medicine-names/${id}`),
};

// ── Medicine Brands ──────────────────────────────────────────────────────────
export const medicineBrands = {
  list:   (params)   => client.get('/medicine-brands', { params }),
  create: (data)     => client.post('/medicine-brands', data),
  update: (id, data) => client.put(`/medicine-brands/${id}`, data),
  remove: (id)       => client.delete(`/medicine-brands/${id}`),
};

// ── Customers ────────────────────────────────────────────────────────────────
export const customers = {
  list:       (params)   => client.get('/customers', { params }),
  create:     (data)     => client.post('/customers', data),
  update:     (id, data) => client.put(`/customers/${id}`, data),
  remove:     (id)       => client.delete(`/customers/${id}`),
  bulkDelete: (ids)      => client.post('/customers/bulk-delete', { ids }),
  restore:    (id)       => client.post(`/customers/${id}/restore`),
};

// ── Suppliers ────────────────────────────────────────────────────────────────
export const suppliers = {
  list:       (params)    => client.get('/suppliers', { params }),
  create:     (data)      => client.post('/suppliers', data),
  update:     (id, data)  => client.put(`/suppliers/${id}`, data),
  remove:     (id)        => client.delete(`/suppliers/${id}`),
  bulkDelete: (ids)       => client.post('/suppliers/bulk-delete', { ids }),  restore:    (id)        => client.post(`/suppliers/${id}/restore`),};

// ── Sales ────────────────────────────────────────────────────────────────────
export const sales = {
  list:   (params)    => client.get('/sales', { params }),
  create: (data)      => client.post('/sales', data),
  get:    (id)        => client.get(`/sales/${id}`),
  update: (id, data)  => client.put(`/sales/${id}`, data),
  remove: (id)        => client.delete(`/sales/${id}`),
  refund: (id, data)  => client.post(`/sales/${id}/refund`, data),
  report: (params)    => client.get('/sales/report', { params }),
};

// ── Purchases ────────────────────────────────────────────────────────────────
export const purchases = {
  list:         (params)    => client.get('/purchases', { params }),
  create:       (data)      => client.post('/purchases', data),
  get:          (id)        => client.get(`/purchases/${id}`),
  update:       (id, data)  => client.put(`/purchases/${id}`, data),
  remove:       (id)        => client.delete(`/purchases/${id}`),
  receive:      (id)        => client.get(`/purchases/${id}/receive`),
  processReceive: (id, data) => client.post(`/purchases/${id}/receive`, data),
  cancel:       (id)        => client.post(`/purchases/${id}/cancel`),
  markOrdered:  (id)        => client.post(`/purchases/${id}/mark-ordered`),
  report:       (params)    => client.get('/purchases/report', { params }),
  statistics:   ()          => client.get('/purchases/statistics'),
};

// ── Notifications ────────────────────────────────────────────────────────────
export const notifications = {
  list:         (params)  => client.get('/notifications', { params }),
  unreadCount:  ()        => client.get('/notifications/unread-count'),
  statistics:   ()        => client.get('/notifications/statistics'),
  getPreferences: ()      => client.get('/notifications/preferences'),
  updatePreferences: (d)  => client.post('/notifications/preferences', d),
  markAllRead:  ()        => client.post('/notifications/mark-all-read'),
  cleanup:      ()        => client.post('/notifications/cleanup'),
  markRead:     (id)      => client.post(`/notifications/${id}/read`),
  dismiss:      (id)      => client.post(`/notifications/${id}/dismiss`),
  test:         ()        => client.post('/notifications/test'),
};

// ── Profile ──────────────────────────────────────────────────────────────────
export const profile = {
  get:                ()      => client.get('/profile'),
  update:             (data)  => client.patch('/profile', data),
  updatePassword:     (data)  => client.patch('/profile/password', data),
  uploadAvatar:       (form)  => client.post('/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAvatar:       ()      => client.delete('/profile/avatar'),
  updatePreferences:  (data)  => client.patch('/profile/preferences', data),
  getPreferences:     ()      => client.get('/profile/preferences'),
  setTheme:           (data)  => client.post('/profile/theme', data),
  exportData:         ()      => client.get('/profile/export', { responseType: 'blob' }),
  resetPreferences:   ()      => client.post('/profile/reset-preferences'),
  destroy:            ()      => client.delete('/profile'),
};

// ── Settings ─────────────────────────────────────────────────────────────────
export const settings = {
  get:              ()      => client.get('/settings'),
  updateProfile:    (data)  => client.put('/settings/profile', data),
  updatePharmacy:   (data)  => client.put('/settings/pharmacy', data),
  updateNotifications: (d)  => client.put('/settings/notifications', d),
  updateSecurity:   (data)  => client.put('/settings/security', data),
  updateSystem:     (data)  => client.put('/settings/system', data),
  changePassword:   (data)  => client.post('/settings/password', data),
  exportSettings:   ()      => client.get('/settings/export', { responseType: 'blob' }),
  clearCache:       ()      => client.post('/settings/clear-cache'),
  optimizeDatabase: ()      => client.post('/settings/optimize-database'),
};

// ── Users (admin) ────────────────────────────────────────────────────────────
export const users = {
  list:         (params)    => client.get('/users', { params }),
  create:       (data)      => client.post('/users', data),
  update:       (id, data)  => client.put(`/users/${id}`, data),
  remove:       (id)        => client.delete(`/users/${id}`),
  bulkDelete:   (ids)       => client.post('/users/bulk-delete', { ids }),
  restore:      (id)        => client.post(`/users/${id}/restore`),
  uploadAvatar: (id, form)  => client.post(`/users/${id}/avatar`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAvatar: (id)        => client.delete(`/users/${id}/avatar`),
};

// ── Inventory ────────────────────────────────────────────────────────────────
export const inventory = {
  get:            ()        => client.get('/inventory'),
  stockLevels:    (id)      => client.get(`/inventory/stock-levels/${id}`),
  addStock:       (data)    => client.post('/inventory/add-stock', data),
  removeStock:    (data)    => client.post('/inventory/remove-stock', data),
  transferStock:  (data)    => client.post('/inventory/transfer-stock', data),
  lowStock:       ()        => client.get('/inventory/low-stock'),
  expiringBatches:()        => client.get('/inventory/expiring-batches'),
  movements:      (params)  => client.get('/inventory/movements', { params }),
  summary:        ()        => client.get('/inventory/summary'),
};

// ── Stock Movements ──────────────────────────────────────────────────────────
export const stockMovements = {
  list:       (params)    => client.get('/stock-movements', { params }),
  create:     (data)      => client.post('/stock-movements', data),
  update:     (id, data)  => client.put(`/stock-movements/${id}`, data),
  adjustment: (data)      => client.post('/stock-movements/adjustment', data),
};

// ── POS ──────────────────────────────────────────────────────────────────────
export const pos = {
  get:                ()      => client.get('/pos'),
  searchMedicines:    (q)     => client.get('/pos/search/medicines', { params: { q } }),
  searchCustomers:    (q)     => client.get('/pos/search/customers', { params: { q } }),
  calculateTotals:    (data)  => client.post('/pos/calculate-totals', data),
  createTransaction:  (data)  => client.post('/pos/create-transaction', data),
  processPayment:     (data)  => client.post('/pos/process-payment', data),
  applyCoupon:        (data)  => client.post('/pos/apply-coupon', data),
  getTransaction:     (id)    => client.get(`/pos/transaction/${id}`),
  voidTransaction:    (id)    => client.post(`/pos/transaction/${id}/void`),
  dailySummary:       ()      => client.get('/pos/daily-summary'),
  customerLoyalty:    (id)    => client.get(`/pos/customer/${id}/loyalty`),
  promotions:         ()      => client.get('/pos/promotions'),
  receipt:            (id)    => client.get(`/pos/receipt/${id}`, { responseType: 'blob' }),
};

// ── Analytics ────────────────────────────────────────────────────────────────
export const analytics = {
  get:              ()        => client.get('/analytics'),
  salesTrends:      (params)  => client.get('/analytics/sales-trends', { params }),
  bestSelling:      (params)  => client.get('/analytics/best-selling', { params }),
  expiringMedicines:(params)  => client.get('/analytics/expiring-medicines', { params }),
  stockSummary:     ()        => client.get('/analytics/stock-summary'),
  customerAnalytics:(params)  => client.get('/analytics/customer-analytics', { params }),
  paymentMethods:   ()        => client.get('/analytics/payment-methods'),
  summary:          ()        => client.get('/analytics/summary'),
};

// ── Reports ──────────────────────────────────────────────────────────────────
export const reports = {
  get:              ()        => client.get('/reports'),
  statistics:       ()        => client.get('/reports/statistics'),
  dashboard:        ()        => client.get('/reports/dashboard'),
  dashboardPdf:     ()        => client.get('/reports/dashboard/export-pdf', { responseType: 'blob' }),
  sales:            (params)  => client.get('/reports/sales', { params }),
  salesPdf:         (params)  => client.get('/reports/sales/export-pdf', { params, responseType: 'blob' }),
  salesExcel:       (params)  => client.get('/reports/sales/export-excel', { params, responseType: 'blob' }),
  expiry:           (params)  => client.get('/reports/expiry', { params }),
  expiryPdf:        (params)  => client.get('/reports/expiry/export-pdf', { params, responseType: 'blob' }),
  expiryExcel:      (params)  => client.get('/reports/expiry/export-excel', { params, responseType: 'blob' }),
  stock:            (params)  => client.get('/reports/stock', { params }),
  stockPdf:         (params)  => client.get('/reports/stock/export-pdf', { params, responseType: 'blob' }),
  stockExcel:       (params)  => client.get('/reports/stock/export-excel', { params, responseType: 'blob' }),
};

// ── Search ───────────────────────────────────────────────────────────────────
export const search = {
  global:       (data)    => client.post('/search/global', data),
  medicines:    (data)    => client.post('/search/medicines', data),
  customers:    (data)    => client.post('/search/customers', data),
  sales:        (data)    => client.post('/search/sales', data),
  suppliers:    (data)    => client.post('/search/suppliers', data),
  purchases:    (data)    => client.post('/search/purchases', data),
  suggestions:  (params)  => client.get('/search/suggestions', { params }),
  filterOptions:()        => client.get('/search/filter-options'),
  statistics:   ()        => client.get('/search/statistics'),
};

// ── Audit Logs ───────────────────────────────────────────────────────────────
export const auditLogs = {
  list:       (params)  => client.get('/audit-logs', { params }),
  export:     (params)  => client.get('/audit-logs/export', { params, responseType: 'blob' }),
  security:   ()        => client.get('/audit-logs/security'),
  compliance: ()        => client.get('/audit-logs/compliance'),
  flag:       (id)      => client.post(`/audit-logs/${id}/flag`),
};

// ── AI ───────────────────────────────────────────────────────────────────────
export const ai = {
  health:               ()    => client.get('/ai/health'),
  stockPrediction:      (id)  => client.get(`/ai/stock-predictions/${id}`),
  reorderRecommendations:()   => client.get('/ai/reorder-recommendations'),
  seasonalTrends:       (id)  => client.get(`/ai/seasonal-trends/${id}`),
  retrainStockModel:    ()    => client.post('/ai/retrain-stock-model'),
  expiryAlerts:         ()    => client.get('/ai/expiry-alerts'),
  acknowledgeExpiry:    (id)  => client.post(`/ai/expiry-alerts/${id}/acknowledge`),
  anomalies:            ()    => client.get('/ai/anomalies'),
  reviewAnomaly:        (id, data) => client.post(`/ai/anomalies/${id}/review`, data),
  anomalyDashboard:     ()    => client.get('/ai/anomaly-dashboard'),
};

// ── Automation ───────────────────────────────────────────────────────────────
export const automation = {
  data:               ()    => client.get('/automation/data'),
  quickInsights:      ()    => client.get('/automation/quick-insights'),
  dashboard:          ()    => client.get('/automation/dashboard'),
  reorderSuggestions: ()    => client.get('/automation/reorder-suggestions'),
  reorderAction:      (id, data) => client.post(`/automation/reorder/${id}/action`, data),
  generatePO:         (id)  => client.post(`/automation/generate-po/${id}`),
};

// ── System ───────────────────────────────────────────────────────────────────
export const system = {
  overview: () => client.get('/system/overview'),
  stats:    () => client.get('/system/stats'),
};
