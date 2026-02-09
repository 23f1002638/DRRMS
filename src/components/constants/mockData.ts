export const mockAidRequests = [
  {
    id: 'REQ001',
    title: 'Emergency Food Supply Request',
    type: 'Food & Water',
    status: 'pending',
    priority: 'high',
    location: 'Downtown Community Center',
    description: 'Need food packages for 50 families affected by recent flooding',
    requiredItems: ['Food packages', 'Clean water', 'Baby formula'],
    requestedBy: 'Sarah Johnson',
    requestDate: '2024-01-20T10:00:00Z',
    deadline: '2024-01-21T18:00:00Z'
  },
  {
    id: 'REQ002',
    title: 'Critical Medical Emergency',
    type: 'Medical Aid',
    status: 'in-progress',
    priority: 'critical',
    location: 'Emergency Shelter Zone B',
    description: 'Medical supplies urgently needed for injured victims',
    requiredItems: ['First aid kits', 'Medications', 'Medical equipment'],
    requestedBy: 'Dr. Michael Chen',
    requestDate: '2024-01-19T14:30:00Z',
    deadline: '2024-01-19T20:00:00Z'
  },
  {
    id: 'REQ003',
    title: 'Temporary Shelter Setup',
    type: 'Shelter',
    status: 'fulfilled',
    priority: 'medium',
    location: 'Park Avenue Field',
    description: 'Setting up temporary shelter for displaced families',
    requiredItems: ['Tents', 'Blankets', 'Portable toilets'],
    requestedBy: 'Relief Coordinator',
    requestDate: '2024-01-18T12:00:00Z',
    fulfillmentProgress: 100
  }
];

export const mockInventoryItems = [
  {
    id: 'INV001',
    name: 'Emergency Food Packages',
    category: 'Food',
    quantity: 150,
    unit: 'packages',
    status: 'available',
    location: 'Warehouse A - Section 1',
    expiryDate: '2024-06-30',
    lastUpdated: '2024-01-20T08:00:00Z'
  },
  {
    id: 'INV002',
    name: 'Medical First Aid Kits',
    category: 'Medical',
    quantity: 45,
    unit: 'kits',
    status: 'low-stock',
    location: 'Medical Storage B',
    lastUpdated: '2024-01-19T16:30:00Z'
  },
  {
    id: 'INV003',
    name: 'Emergency Blankets',
    category: 'Shelter',
    quantity: 0,
    unit: 'pieces',
    status: 'out-of-stock',
    location: 'Warehouse C - Section 2',
    lastUpdated: '2024-01-18T14:15:00Z'
  }
];

export const mockVolunteers = [
  {
    id: 'VOL001',
    name: 'Alex Rodriguez',
    email: 'alex.r@volunteer.org',
    skills: ['Medical', 'Search & Rescue'],
    availability: 'available',
    location: 'Zone A',
    joinDate: '2024-01-15',
    tasksCompleted: 12,
    currentAssignments: [],
    rating: 4.8
  },
  {
    id: 'VOL002',
    name: 'Emily Chen',
    email: 'emily.c@volunteer.org',
    skills: ['Logistics', 'Translation'],
    availability: 'busy',
    location: 'Zone B',
    joinDate: '2024-01-10',
    tasksCompleted: 18,
    currentAssignments: ['REQ002'],
    rating: 4.9
  },
  {
    id: 'VOL003',
    name: 'David Kim',
    email: 'david.k@volunteer.org',
    skills: ['Construction', 'Heavy Lifting'],
    availability: 'unavailable',
    location: 'Zone C',
    joinDate: '2024-01-05',
    tasksCompleted: 25,
    currentAssignments: [],
    rating: 4.7
  }
];

export const mockDonations = [
  {
    id: 'DON001',
    donorName: 'Community Foundation',
    donorEmail: 'contact@foundation.org',
    amount: 5000,
    type: 'monetary',
    status: 'confirmed',
    date: '2024-01-20T09:00:00Z',
    notes: 'Emergency relief fund contribution'
  },
  {
    id: 'DON002',
    donorName: 'Local Food Bank',
    donorEmail: 'donations@foodbank.org',
    items: ['Canned goods', 'Rice', 'Pasta'],
    type: 'supplies',
    status: 'delivered',
    date: '2024-01-19T11:30:00Z',
    location: 'Warehouse A'
  },
  {
    id: 'DON003',
    donorName: 'Medical Supplies Inc',
    donorEmail: 'help@medsupplies.com',
    items: ['First aid kits', 'Bandages', 'Antiseptic'],
    type: 'supplies',
    status: 'pending',
    date: '2024-01-18T15:45:00Z',
    location: 'Medical Storage B'
  }
];

export const mockAvailableResources = [
  {
    name: 'Emergency Shelter A',
    location: '123 Main Street, Downtown',
    contact: '(555) 123-4567',
    available: true
  },
  {
    name: 'Food Distribution Center',
    location: '456 Oak Avenue, Midtown',
    contact: '(555) 234-5678',
    available: true
  },
  {
    name: 'Medical Clinic',
    location: '789 Pine Street, Uptown',
    contact: '(555) 345-6789',
    available: false
  },
  {
    name: 'Emergency Hotline',
    contact: '(555) 911-HELP',
    available: true
  }
];