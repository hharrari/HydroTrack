"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LogWaterDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  units: "ml" | "oz";
  onLog: (amount: number) => void;
}

export function LogWaterDialog({
  isOpen,
  setIsOpen,
  units,
  onLog,
}: LogWaterDialogProps) {
  const [amount, setAmount] = useState("");

  const handleLog = () => {
    const numAmount = parseInt(amount, 10);
    if (!isNaN(numAmount) && numAmount > 0) {
      onLog(numAmount);
      setAmount("");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Custom Amount</DialogTitle>
          <DialogDescription>
            Enter the amount of water you drank.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount ({units})
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder={`e.g., ${units === "ml" ? "300" : "10"}`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleLog}>
            Log Water
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
