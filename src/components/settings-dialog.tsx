"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useFirebase } from "@/firebase";
import { updateProfile } from "@/lib/firestore";
import type { UserProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SettingsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentProfile: UserProfile;
  onUpdate: (newProfile: UserProfile) => void;
}

export function SettingsDialog({
  isOpen,
  setIsOpen,
  currentProfile,
  onUpdate,
}: SettingsDialogProps) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [goal, setGoal] = useState(currentProfile.dailyGoal);
  const [units, setUnits] = useState<"ml" | "oz">(currentProfile.units);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setGoal(currentProfile.dailyGoal);
    setUnits(currentProfile.units);
  }, [currentProfile]);

  const handleSave = async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    try {
      const newProfileData: Partial<UserProfile> = { dailyGoal: goal, units };
      await updateProfile(firestore, user.uid, newProfileData);
      onUpdate({ ...currentProfile, ...newProfileData });
      toast({
        title: "Settings Saved",
        description: "Your hydration goal has been updated.",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Could not save your settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Update your daily hydration goal and preferred units.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goal" className="text-right">
              Daily Goal
            </Label>
            <Input
              id="goal"
              type="number"
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="units" className="text-right">
              Units
            </Label>
            <Select
              value={units}
              onValueChange={(value: "ml" | "oz") => setUnits(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ml">Milliliters (ml)</SelectItem>
                <SelectItem value="oz">Ounces (oz)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
