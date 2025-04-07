import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { AccountType } from "@/utils/betUtils";

interface Market {
  id: number;
  home: string;
  away: string;
  time: string;
  market: string;
  spread: string;
  sellPrice: string;
  buyPrice: string;
}

export interface NewPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  match?: Market;
  action?: 'buy' | 'sell';
  accountType?: AccountType;
}

const NewPositionModal = ({ isOpen, onClose, match, action, accountType = 'free' }: NewPositionModalProps) => {
  const [positionSize, setPositionSize] = useState("");

  const handleConfirm = () => {
    if (!match || !action) {
      toast({
        title: "Error",
        description: "Match or action not specified.",
        variant: "destructive",
      });
      return;
    }

    if (!positionSize || isNaN(Number(positionSize)) || Number(positionSize) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid position size.",
        variant: "destructive",
      });
      return;
    }

    // Here you would place the logic to handle the new position
    toast({
      title: "Position Created",
      description: `New ${action} position created for ${match.home} vs ${match.away} with size ${positionSize}.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {action === "buy" ? "Buy Position" : "Sell Position"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              Match
            </label>
            <Input
              type="text"
              id="name"
              value={match ? `${match.home} vs ${match.away}` : ""}
              className="col-span-3"
              disabled
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="positionSize" className="text-right">
              Position Size
            </label>
            <Input
              type="number"
              id="positionSize"
              placeholder="Enter amount"
              className="col-span-3"
              value={positionSize}
              onChange={(e) => setPositionSize(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewPositionModal;
