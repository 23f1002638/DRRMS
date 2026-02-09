// Mock data service to replace Supabase API calls
import { mockAidRequests, mockInventoryItems, mockVolunteers, mockDonations } from '../components/constants/mockData';

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

class MockDataService {
  // Local storage keys
  private readonly AID_REQUESTS_KEY = 'disaster-relief-aid-requests';
  private readonly INVENTORY_KEY = 'disaster-relief-inventory';
  private readonly VOLUNTEERS_KEY = 'disaster-relief-volunteers';
  private readonly DONATIONS_KEY = 'disaster-relief-donations';

  // Initialize data if not exists
  private initializeData() {
    if (!localStorage.getItem(this.AID_REQUESTS_KEY)) {
      localStorage.setItem(this.AID_REQUESTS_KEY, JSON.stringify(mockAidRequests));
    }
    if (!localStorage.getItem(this.INVENTORY_KEY)) {
      localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(mockInventoryItems));
    }
    if (!localStorage.getItem(this.VOLUNTEERS_KEY)) {
      localStorage.setItem(this.VOLUNTEERS_KEY, JSON.stringify(mockVolunteers));
    }
    if (!localStorage.getItem(this.DONATIONS_KEY)) {
      localStorage.setItem(this.DONATIONS_KEY, JSON.stringify(mockDonations));
    }
  }

  // Generic localStorage helpers
  private getData<T>(key: string): T[] {
    this.initializeData();
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error loading data from ${key}:`, error);
      return [];
    }
  }

  private saveData<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving data to ${key}:`, error);
    }
  }

  // Simulate API delay
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Aid Requests
  async getAidRequests(): Promise<AidRequest[]> {
    await this.delay();
    return this.getData<AidRequest>(this.AID_REQUESTS_KEY);
  }

  async createAidRequest(requestData: Omit<AidRequest, 'id' | 'requestDate'>): Promise<AidRequest> {
    await this.delay();
    const requests = this.getData<AidRequest>(this.AID_REQUESTS_KEY);
    const newRequest: AidRequest = {
      ...requestData,
      id: `req_${Date.now()}`,
      requestDate: new Date().toISOString(),
    };
    requests.push(newRequest);
    this.saveData(this.AID_REQUESTS_KEY, requests);
    return newRequest;
  }

  async updateAidRequest(id: string, updates: Partial<AidRequest>): Promise<AidRequest | null> {
    await this.delay();
    const requests = this.getData<AidRequest>(this.AID_REQUESTS_KEY);
    const index = requests.findIndex(req => req.id === id);
    if (index === -1) return null;

    requests[index] = { ...requests[index], ...updates };
    this.saveData(this.AID_REQUESTS_KEY, requests);
    return requests[index];
  }

  // Inventory
  async getInventory(): Promise<InventoryItem[]> {
    await this.delay();
    return this.getData<InventoryItem>(this.INVENTORY_KEY);
  }

  async updateInventory(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    await this.delay();
    const inventory = this.getData<InventoryItem>(this.INVENTORY_KEY);
    const index = inventory.findIndex(item => item.id === id);
    if (index === -1) return null;

    inventory[index] = { 
      ...inventory[index], 
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    this.saveData(this.INVENTORY_KEY, inventory);
    return inventory[index];
  }

  async addInventoryItem(itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> {
    await this.delay();
    const inventory = this.getData<InventoryItem>(this.INVENTORY_KEY);
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv_${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    inventory.push(newItem);
    this.saveData(this.INVENTORY_KEY, inventory);
    return newItem;
  }

  // Volunteers
  async getVolunteers(): Promise<Volunteer[]> {
    await this.delay();
    return this.getData<Volunteer>(this.VOLUNTEERS_KEY);
  }

  async assignVolunteer(volunteerId: string, taskData: { taskId: string; taskName: string }): Promise<Volunteer | null> {
    await this.delay();
    const volunteers = this.getData<Volunteer>(this.VOLUNTEERS_KEY);
    const index = volunteers.findIndex(vol => vol.id === volunteerId);
    if (index === -1) return null;

    if (!volunteers[index].currentAssignments.includes(taskData.taskId)) {
      volunteers[index].currentAssignments.push(taskData.taskId);
      volunteers[index].availability = 'busy';
    }
    this.saveData(this.VOLUNTEERS_KEY, volunteers);
    return volunteers[index];
  }

  async updateVolunteer(id: string, updates: Partial<Volunteer>): Promise<Volunteer | null> {
    await this.delay();
    const volunteers = this.getData<Volunteer>(this.VOLUNTEERS_KEY);
    const index = volunteers.findIndex(vol => vol.id === id);
    if (index === -1) return null;

    volunteers[index] = { ...volunteers[index], ...updates };
    this.saveData(this.VOLUNTEERS_KEY, volunteers);
    return volunteers[index];
  }

  // Donations
  async getDonations(): Promise<Donation[]> {
    await this.delay();
    return this.getData<Donation>(this.DONATIONS_KEY);
  }

  async addDonation(donationData: Omit<Donation, 'id' | 'date'>): Promise<Donation> {
    await this.delay();
    const donations = this.getData<Donation>(this.DONATIONS_KEY);
    const newDonation: Donation = {
      ...donationData,
      id: `don_${Date.now()}`,
      date: new Date().toISOString(),
    };
    donations.push(newDonation);
    this.saveData(this.DONATIONS_KEY, donations);
    return newDonation;
  }

  // Analytics
  async getAnalytics(): Promise<any> {
    await this.delay();
    const aidRequests = this.getData<AidRequest>(this.AID_REQUESTS_KEY);
    const inventory = this.getData<InventoryItem>(this.INVENTORY_KEY);
    const volunteers = this.getData<Volunteer>(this.VOLUNTEERS_KEY);
    const donations = this.getData<Donation>(this.DONATIONS_KEY);

    return {
      totalRequests: aidRequests.length,
      pendingRequests: aidRequests.filter(req => req.status === 'pending').length,
      fulfilledRequests: aidRequests.filter(req => req.status === 'fulfilled').length,
      totalInventoryItems: inventory.length,
      lowStockItems: inventory.filter(item => item.status === 'low-stock').length,
      totalVolunteers: volunteers.length,
      availableVolunteers: volunteers.filter(vol => vol.availability === 'available').length,
      totalDonations: donations.length,
      confirmedDonations: donations.filter(don => don.status === 'confirmed').length,
      requestsByPriority: {
        critical: aidRequests.filter(req => req.priority === 'critical').length,
        high: aidRequests.filter(req => req.priority === 'high').length,
        medium: aidRequests.filter(req => req.priority === 'medium').length,
        low: aidRequests.filter(req => req.priority === 'low').length,
      },
      requestsByStatus: {
        pending: aidRequests.filter(req => req.status === 'pending').length,
        'in-progress': aidRequests.filter(req => req.status === 'in-progress').length,
        fulfilled: aidRequests.filter(req => req.status === 'fulfilled').length,
        cancelled: aidRequests.filter(req => req.status === 'cancelled').length,
      }
    };
  }

  // Reset data to defaults
  async resetData(): Promise<void> {
    localStorage.removeItem(this.AID_REQUESTS_KEY);
    localStorage.removeItem(this.INVENTORY_KEY);
    localStorage.removeItem(this.VOLUNTEERS_KEY);
    localStorage.removeItem(this.DONATIONS_KEY);
    this.initializeData();
  }
}

export const mockDataService = new MockDataService();