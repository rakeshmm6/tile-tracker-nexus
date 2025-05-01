
import React from "react";
import Layout from "@/components/Layout";
import PageHeader from "@/components/PageHeader";
import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/contexts/AuthContext";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventorySearchBar from "@/components/inventory/InventorySearchBar";
import InventoryActions from "@/components/inventory/InventoryActions";
import DeleteConfirmationDialog from "@/components/inventory/DeleteConfirmationDialog";

const Inventory = () => {
  const { isAdmin } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    editingItem,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
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
  } = useInventory();

  return (
    <Layout>
      <PageHeader 
        title="Inventory Management" 
        description="Manage your tile inventory"
      >
        {isAdmin() && (
          <InventoryActions
            isFormDialogOpen={isFormDialogOpen}
            setIsFormDialogOpen={setIsFormDialogOpen}
            editingItem={editingItem}
            handleFormSubmit={handleFormSubmit}
          />
        )}
      </PageHeader>

      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <InventorySearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalInventoryValue={totalInventoryValue}
        />

        <InventoryTable
          loading={loading}
          currentItems={currentItems}
          openEditDialog={openEditDialog}
          confirmDelete={confirmDelete}
          currentPage={currentPage}
          totalPages={totalPages}
          paginate={paginate}
          filteredInventory={filteredInventory}
          searchQuery={searchQuery}
        />
      </div>
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirmDelete={handleDeleteItem}
      />
    </Layout>
  );
};

export default Inventory;
