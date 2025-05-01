
import React, { useState } from "react";
import Layout from "@/components/Layout";
import PageHeader from "@/components/PageHeader";
import { useOrders } from "@/hooks/useOrders";
import OrdersSearchBar from "@/components/orders/OrdersSearchBar";
import OrdersTable from "@/components/orders/OrdersTable";
import OrdersPagination from "@/components/orders/OrdersPagination";
import DeleteOrderDialog from "@/components/orders/DeleteOrderDialog";
import CreateOrderDialog from "@/components/orders/CreateOrderDialog";

const Orders = () => {
  const { 
    orders,
    currentItems, 
    inventory, 
    loading,
    searchQuery,
    setSearchQuery,
    handleAddOrder,
    handleDeleteOrder,
    confirmDeleteOrder,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    orderToDelete,
    handleSort,
    sortField,
    sortDirection,
    currentPage,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    paginate,
    itemsPerPage
  } = useOrders();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <Layout>
      <PageHeader 
        title="Order Management" 
        description="Create and manage customer orders"
      >
        <CreateOrderDialog 
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          onSubmit={handleAddOrder}
          inventory={inventory}
        />
      </PageHeader>

      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <OrdersSearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />

        <OrdersTable 
          currentItems={currentItems}
          loading={loading}
          searchQuery={searchQuery}
          handleSort={handleSort}
          sortField={sortField}
          confirmDeleteOrder={confirmDeleteOrder}
        />

        <OrdersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          indexOfFirstItem={indexOfFirstItem}
          indexOfLastItem={indexOfLastItem}
          totalItems={orders.length}
          paginate={paginate}
        />
      </div>
      
      <DeleteOrderDialog 
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onDelete={handleDeleteOrder}
      />
    </Layout>
  );
};

export default Orders;
