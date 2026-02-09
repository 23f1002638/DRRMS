// Legacy Supabase client - replaced with mock data service
// This file is kept for backwards compatibility to prevent import errors

export const ApiClient = {
  signUp: () => Promise.reject(new Error('Supabase removed - use AuthSystem directly')),
  signIn: () => Promise.reject(new Error('Supabase removed - use AuthSystem directly')),
  signOut: () => Promise.reject(new Error('Supabase removed - use AuthSystem directly')),
  getSession: () => Promise.reject(new Error('Supabase removed - use AuthSystem directly')),
  getUserProfile: () => Promise.reject(new Error('Supabase removed - use AuthSystem directly')),
  getAidRequests: () => Promise.reject(new Error('Use mockDataService instead')),
  createAidRequest: () => Promise.reject(new Error('Use mockDataService instead')),
  getInventory: () => Promise.reject(new Error('Use mockDataService instead')),
  updateInventory: () => Promise.reject(new Error('Use mockDataService instead')),
  getVolunteers: () => Promise.reject(new Error('Use mockDataService instead')),
  assignVolunteer: () => Promise.reject(new Error('Use mockDataService instead')),
  getDonations: () => Promise.reject(new Error('Use mockDataService instead')),
  getAnalytics: () => Promise.reject(new Error('Use mockDataService instead'))
};