'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";

interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LogoutConfirmDialog({
  open,
  onOpenChange,
}: LogoutConfirmDialogProps) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout(true); // Set to true, indicating redirection to logout page is needed
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-4 border-black bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-pixelated text-center">CONFIRM LOGOUT</DialogTitle>
          <DialogDescription className="text-center font-pixelated mt-2">
            Are you sure you want to log out?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white border-2 border-black hover:bg-gray-100 font-pixelated"
          >
            CANCEL
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="bg-red-500 border-2 border-black hover:bg-red-600 font-pixelated"
          >
            LOGOUT
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 