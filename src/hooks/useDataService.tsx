import { useState, useEffect, useCallback } from 'react';
import { mockDataService } from '../services/mockDataService';

export interface AidRequest {
  id: string;
  title: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'fulfilled' | 'cancelled';
  location: string;
  description: string;
  requiredItems: string[];
  requestedBy: string;
  requestDate: string;
  deadline?: string;
  assignedVolunteers?: string[];
  fulfillmentProgress?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: 'available' | 'low-stock' | 'out-of-stock' | 'reserved';
  location: string;
  expiryDate?: string;
  lastUpdated: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  skills: string[];
  availability: 'available' | 'busy' | 'unavailable';
  location: string;
  joinDate: string;
  tasksCompleted: number;
  currentAssignments: string[];
  rating: number;
}

export interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount?: number;
  items?: string[];
  type: 'monetary' | 'supplies' | 'services';
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  date: string;
  location?: string;
  notes?: string;
}

export interface Analytics {
  totalRequests: number;
  pendingRequests: number;
  fulfilledRequests: number;
  totalInventoryItems: number;
  lowStockItems: number;
  totalVolunteers: number;
  availableVolunteers: number;
  totalDonations: number;
  confirmedDonations: number;
  requestsByPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  requestsByStatus: {
    pending: number;
    'in-progress': number;
    fulfilled: number;
    cancelled: number;
  };
}

export function useDataService() {
  const [aidRequests, setAidRequests] = useState<AidRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any, action: string) => {
    console.error(`Error ${action}:`, err);
    setError(err instanceof Error ? err.message : `Failed to ${action}`);
  };

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        aidRequestsResult,
        inventoryResult,
        volunteersResult,
        donationsResult,
        analyticsResult
      ] = await Promise.allSettled([
        mockDataService.getAidRequests(),
        mockDataService.getInventory(),
        mockDataService.getVolunteers(),
        mockDataService.getDonations(),
        mockDataService.getAnalytics()
      ]);

      if (aidRequestsResult.status === 'fulfilled') {
        setAidRequests(aidRequestsResult.value || []);
      }
      
      if (inventoryResult.status === 'fulfilled') {
        setInventory(inventoryResult.value || []);
      }
      
      if (volunteersResult.status === 'fulfilled') {
        setVolunteers(volunteersResult.value || []);
      }
      
      if (donationsResult.status === 'fulfilled') {
        setDonations(donationsResult.value || []);
      }
      
      if (analyticsResult.status === 'fulfilled') {
        setAnalytics(analyticsResult.value);
      }

    } catch (err) {
      handleError(err, 'fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Aid Requests
  const createAidRequest = async (requestData: Omit<AidRequest, 'id' | 'requestDate'>) => {
    try {
      const result = await mockDataService.createAidRequest(requestData);
      setAidRequests(prev => [result, ...prev]);
      return result;
    } catch (err) {
      handleError(err, 'create aid request');
      throw err;
    }
  };

  const updateAidRequest = async (id: string, updates: Partial<AidRequest>) => {
    try {
      const result = await mockDataService.updateAidRequest(id, updates);
      if (result) {
        setAidRequests(prev => 
          prev.map(request => 
            request.id === id ? result : request
          )
        );
      }
      return result;
    } catch (err) {
      handleError(err, 'update aid request');
      throw err;
    }
  };

  // Inventory
  const createInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    try {
      const result = await mockDataService.addInventoryItem(itemData);
      setInventory(prev => [result, ...prev]);
      return result;
    } catch (err) {
      handleError(err, 'create inventory item');
      throw err;
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const result = await mockDataService.updateInventory(id, updates);
      if (result) {
        setInventory(prev => 
          prev.map(item => 
            item.id === id ? result : item
          )
        );
      }
      return result;
    } catch (err) {
      handleError(err, 'update inventory item');
      throw err;
    }
  };

  // Volunteers
  const assignVolunteer = async (volunteerId: string, taskData: { taskId: string; taskName: string }) => {
    try {
      const result = await mockDataService.assignVolunteer(volunteerId, taskData);
      if (result) {
        setVolunteers(prev => 
          prev.map(volunteer => 
            volunteer.id === volunteerId ? result : volunteer
          )
        );
      }
      return result;
    } catch (err) {
      handleError(err, 'assign volunteer');
      throw err;
    }
  };

  const updateVolunteer = async (id: string, updates: Partial<Volunteer>) => {
    try {
      const result = await mockDataService.updateVolunteer(id, updates);
      if (result) {
        setVolunteers(prev => 
          prev.map(volunteer => 
            volunteer.id === id ? result : volunteer
          )
        );
      }
      return result;
    } catch (err) {
      handleError(err, 'update volunteer');
      throw err;
    }
  };

  // Donations
  const createDonation = async (donationData: Omit<Donation, 'id' | 'date'>) => {
    try {
      const result = await mockDataService.addDonation(donationData);
      setDonations(prev => [result, ...prev]);
      return result;
    } catch (err) {
      handleError(err, 'create donation');
      throw err;
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    // Data
    aidRequests,
    inventory,
    volunteers,
    donations,
    analytics,
    
    // State
    loading,
    error,
    
    // Actions
    fetchAllData,
    createAidRequest,
    updateAidRequest,
    createInventoryItem,
    updateInventoryItem,
    assignVolunteer,
    updateVolunteer,
    createDonation,
    
    // Clear error
    clearError: () => setError(null)
  };
}