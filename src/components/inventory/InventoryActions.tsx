import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import InventoryForm from "@/components/InventoryForm";
import { InventoryItem } from "@/lib/types";

interface InventoryActionsProps {
  isFormDialogOpen: boolean;
  setIsFormDialogOpen: (isOpen: boolean) => void;
  editingItem: InventoryItem | null;
  handleFormSubmit: (item: InventoryItem) => Promise<void>;
}

const InventoryActions: React.FC<InventoryActionsProps> = ({
  isFormDialogOpen,
  setIsFormDialogOpen,
  editingItem,
  handleFormSubmit,
}) => {
  return (
    <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogDescription>
          {editingItem ? "Edit the item details below." : "Fill out the form to add a new inventory item."}
        </DialogDescription>
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <InventoryForm
          initialData={editingItem || undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default InventoryActions;
