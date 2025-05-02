import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Order } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlusIcon, Trash2Icon, PencilIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrderTabsProps {
  orders: Order[];
  onCreateOrder: (type: 'quotation' | 'tax_invoice') => void;
  onDeleteOrder: (orderId: string) => Promise<void>;
  loading?: boolean;
}

export default function OrderTabs({ orders, onCreateOrder, onDeleteOrder, loading = false }: OrderTabsProps) {
  const navigate = useNavigate();
  // Split orders into quotations and tax invoices
  const quotations = orders.filter(order => order.order_type === 'quotation');
  const taxInvoices = orders.filter(order => order.order_type === 'tax_invoice');

  const handleEdit = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  // Common columns for both tables
  const commonColumns: ColumnDef<Order>[] = [
    {
      accessorKey: "order_id",
      header: "Order ID",
    },
    {
      accessorKey: "client_name",
      header: "Client Name",
    },
    {
      accessorKey: "order_date",
      header: "Date",
      cell: ({ row }) => new Date(row.getValue("order_date")).toLocaleDateString(),
    },
    {
      accessorKey: "subtotal",
      header: "Subtotal",
      cell: ({ row }) => formatCurrency(row.getValue("subtotal")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(order.order_id!)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteOrder(order.order_id!)}
            >
              <Trash2Icon className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Additional columns for tax invoices
  const taxInvoiceColumns: ColumnDef<Order>[] = [
    ...commonColumns.slice(0, -1), // Remove the actions column to reposition it
    {
      accessorKey: "client_state",
      header: "State",
    },
    {
      accessorKey: "gst_type",
      header: "GST Type",
      cell: ({ row }) => {
        const gstType = row.getValue("gst_type") as string;
        return gstType === 'igst' ? 'IGST' : 'CGST + SGST';
      },
    },
    {
      accessorKey: "total_amount",
      header: "Total (with GST)",
      cell: ({ row }) => formatCurrency(row.getValue("total_amount")),
    },
    commonColumns[commonColumns.length - 1], // Add the actions column at the end
  ];

  // Columns for quotations (simpler)
  const quotationColumns: ColumnDef<Order>[] = [
    ...commonColumns.slice(0, -1), // Remove the actions column to reposition it
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ row }) => formatCurrency(row.getValue("total_amount")),
    },
    commonColumns[commonColumns.length - 1], // Add the actions column at the end
  ];

  return (
    <Tabs defaultValue="tax_invoice" className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="tax_invoice">Tax Invoices</TabsTrigger>
          <TabsTrigger value="quotation">Quotations</TabsTrigger>
        </TabsList>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onCreateOrder('quotation')}
            className="hidden data-[state=active]:flex items-center"
            data-state={location.hash === '#quotation' ? 'active' : 'inactive'}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            New Quotation
          </Button>
          <Button 
            onClick={() => onCreateOrder('tax_invoice')}
            className="hidden data-[state=active]:flex items-center"
            data-state={location.hash !== '#quotation' ? 'active' : 'inactive'}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            New Tax Invoice
          </Button>
        </div>
      </div>

      <TabsContent value="tax_invoice" className="border rounded-lg p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Tax Invoices</h2>
          </div>
          <DataTable
            columns={taxInvoiceColumns}
            data={taxInvoices}
            searchField="client_name"
            loading={loading}
          />
        </div>
      </TabsContent>

      <TabsContent value="quotation" className="border rounded-lg p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Quotations</h2>
          </div>
          <DataTable
            columns={quotationColumns}
            data={quotations}
            searchField="client_name"
            loading={loading}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
} 