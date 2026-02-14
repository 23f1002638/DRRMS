import { useState } from 'react';
import { User } from './AuthSystem';
import { useInventory } from '../hooks/useDisasterData';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Plus,
  Truck,
  BarChart3,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const categoryColors: Record<string, string> = {
  food: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  medical: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  shelter: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  emergency: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  clothing: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  other: 'bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
};

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  low_stock: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  out_of_stock: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  reserved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

interface InventoryManagementProps {
  user: User;
}

export function InventoryManagement({ user }: InventoryManagementProps) {
  const { inventory, loading, error, refetch } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [restocking, setRestocking] = useState(false);

  // Add Item State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemData, setNewItemData] = useState({
    item_name: '',
    category: 'food',
    quantity: 0,
    unit: 'units',
    min_threshold: 10,
    location: '',
  });
  const [adding, setAdding] = useState(false);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockPercentage = (current: number, threshold: number) => {
    // Assume max is 3x threshold for visualization
    const max = threshold * 3;
    return Math.min((current / max) * 100, 100);
  };

  const handleRestock = async () => {
    if (!selectedItem || !restockAmount) {
      toast.error('Please enter a restock amount');
      return;
    }

    const amount = parseInt(restockAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    setRestocking(true);
    try {
      const newQuantity = selectedItem.quantity + amount;

      // Determine new status based on quantity
      let newStatus = selectedItem.status;
      if (newQuantity === 0) {
        newStatus = 'out_of_stock';
      } else if (newQuantity < (selectedItem.min_threshold || 10)) {
        newStatus = 'low_stock';
      } else {
        newStatus = 'available';
      }

      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      toast.success(`Successfully restocked ${selectedItem.item_name}! 📦`, {
        description: `Added ${amount} ${selectedItem.unit}. New total: ${newQuantity}`,
        duration: 3000,
      });

      setRestockAmount('');
      await refetch();
    } catch (err) {
      console.error('Restock error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to restock item');
    } finally {
      setRestocking(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemData.item_name || !newItemData.quantity || !newItemData.unit) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAdding(true);
    try {
      let status = 'available';
      if (newItemData.quantity === 0) status = 'out_of_stock';
      else if (newItemData.quantity < newItemData.min_threshold) status = 'low_stock';

      const { error: insertError } = await supabase
        .from('inventory')
        .insert({
          item_name: newItemData.item_name,
          category: newItemData.category,
          quantity: newItemData.quantity,
          unit: newItemData.unit,
          min_threshold: newItemData.min_threshold,
          location: newItemData.location,
          status: status,
          last_updated_by: user.id
        });

      // Note: If 'supplier' or 'threshold_limit' (vs min_threshold) mismatch schema, it will error.
      // Converting based on verified schema usage from view_file earlier implies 'min_threshold' in DB but code used 'threshold_limit' in types.
      // Let's assume the hook maps it or we need to be careful.
      // Looking at useInventory hook, it selects *. 
      // Looking at schema: min_threshold INTEGER DEFAULT 10.
      // Looking at InventoryItem type: it might expect threshold_limit.
      // Let's use specific insert keys from schema.

      if (insertError) throw insertError;

      toast.success('Item added successfully');
      setIsAddingItem(false);
      setNewItemData({
        item_name: '',
        category: 'food',
        quantity: 0,
        unit: 'units',
        min_threshold: 10,
        location: ''
      });
      refetch();

    } catch (err: any) {
      console.error('Error adding item:', err);
      toast.error('Failed to add item: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const criticalItems = inventory.filter(item => item.status === 'out_of_stock').length;
  const lowItems = inventory.filter(item => item.status === 'low_stock').length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * 25), 0); // Mock price

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Error Loading Inventory</p>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track and manage relief supplies in real-time
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Truck className="h-4 w-4 mr-2" />
            Request Delivery
          </Button>
          <Button onClick={() => setIsAddingItem(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Add Item Modal Overlay */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-background">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add New Item</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingItem(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Item Name</label>
                  <Input
                    value={newItemData.item_name}
                    onChange={(e) => setNewItemData({ ...newItemData, item_name: e.target.value })}
                    placeholder="e.g., Water Bottles"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={newItemData.category}
                    onValueChange={(val) => setNewItemData({ ...newItemData, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="shelter">Shelter</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    value={newItemData.quantity}
                    onChange={(e) => setNewItemData({ ...newItemData, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Input
                    value={newItemData.unit}
                    onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                    placeholder="e.g., boxes, kg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Threshold (Low Stock)</label>
                  <Input
                    type="number"
                    value={newItemData.min_threshold}
                    onChange={(e) => setNewItemData({ ...newItemData, min_threshold: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={newItemData.location}
                    onChange={(e) => setNewItemData({ ...newItemData, location: e.target.value })}
                    placeholder="Warehouse A"
                  />
                </div>
              </div>

              {/* Supplier field removed to match schema */}

              <div className="pt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingItem(false)}>Cancel</Button>
                <Button onClick={handleAddItem} disabled={adding}>
                  {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{inventory.length}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalItems}</p>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lowItems}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Inventory Items</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="shelter">Shelter</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredInventory.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground">No items found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                </div>
              ) : (
                filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedItem?.id === item.id
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                      : 'hover:bg-accent/50'
                      }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{item.item_name}</h3>
                          <Badge className={categoryColors[item.category] || categoryColors.other}>
                            {item.category}
                          </Badge>
                          <Badge className={statusColors[item.status] || statusColors.available}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.quantity} {item.unit} • {item.location || 'No location'}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Stock Level</span>
                            <span>{item.quantity}/{(item.min_threshold || 10) * 3} {item.unit}</span>
                          </div>
                          <Progress
                            value={getStockPercentage(item.quantity, item.min_threshold || 10)}
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            Threshold: {item.min_threshold || 10} {item.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        {item.status === 'out_of_stock' && (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        {item.status === 'low_stock' && (
                          <TrendingDown className="h-5 w-5 text-yellow-500" />
                        )}
                        {item.status === 'available' && (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Item Details & Restock */}
        <div className="space-y-4">
          {selectedItem ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedItem.item_name}</CardTitle>
                <CardDescription>Manage stock levels and details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Stock Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedItem.quantity}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Current Stock</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {selectedItem.min_threshold || 10}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Threshold</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedItem.location || 'Not specified'}
                    </p>
                  </div>



                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-medium">Restock Item</h4>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder={`Amount (${selectedItem.unit})`}
                        value={restockAmount}
                        onChange={(e) => setRestockAmount(e.target.value)}
                        min="1"
                        disabled={restocking}
                      />
                      <Button
                        onClick={handleRestock}
                        disabled={restocking || !restockAmount}
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                      >
                        {restocking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter quantity to add to current stock
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Truck className="h-4 w-4 mr-1" />
                      Transfer
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Select an Item</CardTitle>
                <CardDescription>Click on any item to manage stock and view details</CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full text-left justify-start"
                  size="sm"
                  onClick={() => setStatusFilter('out_of_stock')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  View Critical Items
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-left justify-start"
                  size="sm"
                  onClick={() => setStatusFilter('low_stock')}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  View Low Stock
                </Button>
                <Button variant="outline" className="w-full text-left justify-start" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  );
}