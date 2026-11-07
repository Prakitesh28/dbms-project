const API_BASE = '/api';

export async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data && data.error ? data.error : (typeof data === 'string' ? data : 'API Request Failed');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Farms
  getFarms: () => fetchJson('/farms'),
  getFarm: (id) => fetchJson(`/farms/${id}`),

  // Plots
  getPlots: (farmId) => fetchJson(`/plots${farmId ? `?farm_id=${farmId}` : ''}`),
  getPlotHistory: (plotId) => fetchJson(`/plots/${plotId}/history`),
  createPlot: (data) => fetchJson('/plots', { method: 'POST', body: JSON.stringify(data) }),
  updatePlot: (id, data) => fetchJson(`/plots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlot: (id) => fetchJson(`/plots/${id}`, { method: 'DELETE' }),

  // Crops & Varieties
  getCrops: () => fetchJson('/crops'),
  getVarieties: () => fetchJson('/crops/varieties'),
  createCrop: (data) => fetchJson('/crops', { method: 'POST', body: JSON.stringify(data) }),
  createVariety: (data) => fetchJson('/crops/varieties', { method: 'POST', body: JSON.stringify(data) }),

  // Crop Cycles
  getCropCycles: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/crop-cycles${q ? `?${q}` : ''}`);
  },
  getCropCycle: (id) => fetchJson(`/crop-cycles/${id}`),
  createCropCycle: (data) => fetchJson('/crop-cycles', { method: 'POST', body: JSON.stringify(data) }),
  updateCropCycle: (id, data) => fetchJson(`/crop-cycles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCropCycle: (id) => fetchJson(`/crop-cycles/${id}`, { method: 'DELETE' }),

  // Inventory
  getInventoryItems: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/inventory/items${q ? `?${q}` : ''}`);
  },
  createInventoryItem: (data) => fetchJson('/inventory/items', { method: 'POST', body: JSON.stringify(data) }),
  updateInventoryItem: (id, data) => fetchJson(`/inventory/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventoryItem: (id) => fetchJson(`/inventory/items/${id}`, { method: 'DELETE' }),

  getTransactions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/inventory/transactions${q ? `?${q}` : ''}`);
  },
  createTransaction: (data) => fetchJson('/inventory/transactions', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: () => fetchJson('/suppliers'),
  createSupplier: (data) => fetchJson('/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  // Harvests & Sales
  getHarvests: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/harvests${q ? `?${q}` : ''}`);
  },
  createHarvest: (data) => fetchJson('/harvests', { method: 'POST', body: JSON.stringify(data) }),
  getSales: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/sales${q ? `?${q}` : ''}`);
  },
  createSale: (data) => fetchJson('/sales', { method: 'POST', body: JSON.stringify(data) }),

  // Dashboard Aggregates
  getDashboardStats: (farmId) => fetchJson(`/dashboard/stats${farmId ? `?farm_id=${farmId}` : ''}`),
  getInventoryCharts: () => fetchJson('/dashboard/inventory-charts'),
  getFinancials: (farmId) => fetchJson(`/dashboard/financial${farmId ? `?farm_id=${farmId}` : ''}`),
  getOperations: (farmId) => fetchJson(`/dashboard/operations${farmId ? `?farm_id=${farmId}` : ''}`),

  // Reports
  getCostPerAcre: () => fetchJson('/reports/cost-per-acre'),
  getYieldPerAcre: () => fetchJson('/reports/yield-per-acre'),
  getProfitByCrop: () => fetchJson('/reports/profit-by-crop'),
  getSeasonalComparisons: () => fetchJson('/reports/seasonal-comparisons'),

  // Yield Trends
  getYieldTrends: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/yield-trends${q ? `?${q}` : ''}`);
  },

  // Weather API
  getWeather: (farmId) => fetchJson(`/weather${farmId ? `?farm_id=${farmId}` : ''}`),

  // Step 4: DBMS Lab & Schema Introspection
  getSchema: () => fetchJson('/schema'),
  getLabQueries: () => fetchJson('/lab/queries'),
  runPlaygroundQuery: (sql) => fetchJson('/lab/playground/execute', { method: 'POST', body: JSON.stringify({ sql }) }),
  testLiveTrigger: (scenario) => fetchJson('/lab/triggers/test', { method: 'POST', body: JSON.stringify({ scenario }) }),
};

