
import React from "react";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { calculateSquareFeet } from "@/lib/database";
import { InventoryItem } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

interface InventoryTableProps {
  loading: boolean;
  currentItems: InventoryItem[];
  openEditDialog: (item: InventoryItem) => void;
  confirmDelete: (productId: number) => void;
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => void;
  filteredInventory: InventoryItem[];
  searchQuery: string;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  loading,
  currentItems,
  openEditDialog,
  confirmDelete,
  currentPage,
  totalPages,
  paginate,
  filteredInventory,
  searchQuery,
}) => {
  const { isAdmin } = useAuth();
  
  const indexOfLastItem = currentPage * 10; // itemsPerPage = 10
  const indexOfFirstItem = indexOfLastItem - 10;

  return (
    <>
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
    </>
  );
};

export default InventoryTable;
