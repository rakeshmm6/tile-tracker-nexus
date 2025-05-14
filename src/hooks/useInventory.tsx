import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { 
  getInventory, 
  addInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem,
  calculateSquareFeet
} from "@/lib/database";
import { InventoryItem } from "@/lib/types";

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
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

  const handleFormSubmit = (item: InventoryItem) => {
    return editingItem 
      ? handleEditItem(item)
      : handleAddItem(item);
  };

  // Add a refresh function
  const refresh = fetchInventory;

  return {
    inventory,
    searchQuery,
    setSearchQuery,
    editingItem,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    itemToDelete,
    isFormDialogOpen,
    setIsFormDialogOpen,
    loading,
    currentPage,
    totalPages,
    currentItems,
    filteredInventory,
    totalInventoryValue,
    openEditDialog,
    confirmDelete,
    handleFormSubmit,
    handleDeleteItem,
    paginate,
    refresh,
  };
};
