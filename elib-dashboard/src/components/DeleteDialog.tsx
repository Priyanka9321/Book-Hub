import React from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "./ui/button";  // Assuming you have a custom button component

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title: string;
  message: string;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  isDeleting = false,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone."
}) => {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogPanel className="bg-white p-6 rounded-md shadow-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            <div className="ml-4">
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            </div>
          </div>
          <div className="flex justify-end mt-6 space-x-4">
            {/* Cancel Button */}
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </Button>
            {/* Confirm Button */}
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Confirm"}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default DeleteDialog;
