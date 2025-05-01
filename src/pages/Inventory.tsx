import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Layout from "@/components/Layout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import InventoryForm from "@/components/InventoryForm";
import { 
  getInventory, 
  addInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem 
} from "@/lib/database";
import { InventoryItem } from "@/lib/types";
import { calculateSquareFeet, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventory();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (item: InventoryItem) => {
    try {
      await addInventoryItem(item);
      toast.success("Item added successfully");
      fetchInventory();
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    }
  };

  const handleEditItem = async (item: InventoryItem) => {
    try {
      await updateInventoryItem(item.product_id!, item);
      toast.success("Item updated successfully");
      fetchInventory();
      setEditingItem(null);
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async () => {
    if (itemToDelete === null) return;
    
    try {
      await deleteInventoryItem(itemToDelete);
      toast.success("Item deleted successfully");
      fetchInventory();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const confirmDelete = (productId: number) => {
    setItemToDelete(productId);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setIsFormDialogOpen(true);
  };

  // Filter inventory based on search query
  const filteredInventory = inventory.filter((item) =>
    item.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  
  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Calculate total inventory value
  const totalInventoryValue = inventory.reduce((acc, item) => {
    const sqftPerBox = calculateSquareFeet(item.tile_width, item.tile_height, item.tiles_per_box);
    const boxValue = sqftPerBox * item.price_per_sqft;
    return acc + (boxValue * item.boxes_on_hand);
  }, 0);

  return (
    <Layout>
      <PageHeader 
        title="Inventory Management" 
        description="Manage your tile inventory"
      >
        {isAdmin() && (
          <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
              </DialogHeader>
              <InventoryForm
                initialData={editingItem || undefined}
                onSubmit={editingItem ? handleEditItem : handleAddItem}
                onCancel={() => {
                  setIsFormDialogOpen(false);
                  setEditingItem(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row gap-4 justify-between border-b">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="text-sm text-gray-500">
            Total Inventory Value: <span className="font-medium">{formatCurrency(totalInventoryValue)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Product ID</th>
                <th scope="col" className="px-6 py-3">Brand</th>
                <th scope="col" className="px-6 py-3">Size (mm)</th>
                <th scope="col" className="px-6 py-3">Tiles/Box</th>
                <th scope="col" className="px-6 py-3">Sqft/Box</th>
                <th scope="col" className="px-6 py-3">Price/Sqft</th>
                <th scope="col" className="px-6 py-3">Boxes In Stock</th>
                <th scope="col" className="px-6 py-3">Value</th>
                {isAdmin() && <th scope="col" className="px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin() ? 9 : 8} className="px-6 py-4 text-center">
                    Loading inventory data...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin() ? 9 : 8} className="px-6 py-4 text-center">
                    {searchQuery ? "No matching products found" : "No products found. Add some!"}
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => {
                  const sqftPerBox = calculateSquareFeet(
                    item.tile_width, 
                    item.tile_height, 
                    item.tiles_per_box
                  );
                  const totalValue = item.boxes_on_hand * sqftPerBox * item.price_per_sqft;
                  
                  return (
                    <tr key={item.product_id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{item.product_id}</td>
                      <td className="px-6 py-4 font-medium">{item.brand}</td>
                      <td className="px-6 py-4">{item.tile_width}×{item.tile_height}</td>
                      <td className="px-6 py-4">{item.tiles_per_box}</td>
                      <td className="px-6 py-4">{sqftPerBox.toFixed(2)}</td>
                      <td className="px-6 py-4">₹{item.price_per_sqft}</td>
                      <td className="px-6 py-4">{item.boxes_on_hand}</td>
                      <td className="px-6 py-4">{formatCurrency(totalValue)}</td>
                      {isAdmin() && (
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => confirmDelete(item.product_id!)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredInventory.length)} of {filteredInventory.length} items
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={i}
                    size="sm"
                    variant={currentPage === pageNum ? "default" : "outline"}
                    onClick={() => paginate(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                size="sm"
                variant="outline"
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected inventory item and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Inventory;
