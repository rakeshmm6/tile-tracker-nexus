import React from "react";
import { 
  Dialog, 
  DialogContent,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import OrderForm from "@/components/OrderForm";
import { Order, OrderItem, InventoryItem } from "@/lib/types";

interface CreateOrderDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (order: Order, items: OrderItem[]) => Promise<void>;
  inventory: InventoryItem[];
}

const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({
  isOpen,
  setIsOpen,
  onSubmit,
  inventory
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh] p-6 overflow-y-auto">
        <DialogDescription>
          Fill out the order form to create a new tax invoice. All fields marked with * are required.
        </DialogDescription>
        <OrderForm 
          inventory={inventory} 
          onSubmit={onSubmit} 
          onCancel={() => setIsOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;
