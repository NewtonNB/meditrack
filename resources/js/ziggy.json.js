const Ziggy = {
  url: 'http:\/\/localhost',
  port: null,
  defaults: {},
  routes: {
    dashboard: { uri: 'dashboard', methods: ['GET', 'HEAD'] },
    'medicines.index': { uri: 'medicines', methods: ['GET', 'HEAD'] },
    'medicines.store': { uri: 'medicines', methods: ['POST'] },
    'medicines.update': {
      uri: 'medicines\/{medicine}',
      methods: ['PUT', 'PATCH'],
      parameters: ['medicine'],
      bindings: { medicine: 'id' },
    },
    'medicines.destroy': {
      uri: 'medicines\/{medicine}',
      methods: ['DELETE'],
      parameters: ['medicine'],
      bindings: { medicine: 'id' },
    },
    'customers.index': { uri: 'customers', methods: ['GET', 'HEAD'] },
    'customers.store': { uri: 'customers', methods: ['POST'] },
    'customers.update': {
      uri: 'customers\/{customer}',
      methods: ['PUT', 'PATCH'],
      parameters: ['customer'],
      bindings: { customer: 'id' },
    },
    'customers.destroy': {
      uri: 'customers\/{customer}',
      methods: ['DELETE'],
      parameters: ['customer'],
      bindings: { customer: 'id' },
    },
    'suppliers.index': { uri: 'suppliers', methods: ['GET', 'HEAD'] },
    'suppliers.store': { uri: 'suppliers', methods: ['POST'] },
    'suppliers.update': {
      uri: 'suppliers\/{supplier}',
      methods: ['PUT', 'PATCH'],
      parameters: ['supplier'],
      bindings: { supplier: 'id' },
    },
    'suppliers.destroy': {
      uri: 'suppliers\/{supplier}',
      methods: ['DELETE'],
      parameters: ['supplier'],
      bindings: { supplier: 'id' },
    },
    'sales.index': { uri: 'sales', methods: ['GET', 'HEAD'] },
    'sales.store': { uri: 'sales', methods: ['POST'] },
    'purchases.index': { uri: 'purchases', methods: ['GET', 'HEAD'] },
    'purchases.store': { uri: 'purchases', methods: ['POST'] },
    'profile.edit': { uri: 'profile', methods: ['GET', 'HEAD'] },
    'profile.update': { uri: 'profile', methods: ['PATCH'] },
    'profile.destroy': { uri: 'profile', methods: ['DELETE'] },
    'reports.index': { uri: 'reports', methods: ['GET', 'HEAD'] },
    'stock-movements.index': { uri: 'stock-movements', methods: ['GET', 'HEAD'] },
    'users.index': { uri: 'users', methods: ['GET', 'HEAD'] },
    'settings.index': { uri: 'settings', methods: ['GET', 'HEAD'] },
    logout: { uri: 'logout', methods: ['POST'] },
  },
};
if (typeof window !== 'undefined' && typeof window.Ziggy !== 'undefined') {
  Object.assign(Ziggy.routes, window.Ziggy.routes);
}
export { Ziggy };
