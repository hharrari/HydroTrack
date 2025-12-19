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
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";

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
  const [remindersEnabled, setRemindersEnabled] = useState(
    currentProfile.remindersEnabled ?? false
  );
  const [reminderHours, setReminderHours] = useState(
    currentProfile.reminderHours ?? 2
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setGoal(currentProfile.dailyGoal);
    setUnits(currentProfile.units);
    setRemindersEnabled(currentProfile.remindersEnabled ?? false);
    setReminderHours(currentProfile.reminderHours ?? 2);
  }, [currentProfile]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "This browser does not support desktop notification",
        variant: "destructive",
      });
      return false;
    }
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        return true;
      }
    }
    return false;
  };

  const handleSave = async () => {
    if (!user || !firestore) return;

    if (remindersEnabled) {
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        toast({
          title: "Permission Denied",
          description:
            "Please enable notifications in your browser settings to receive reminders.",
          variant: "destructive",
        });
        setRemindersEnabled(false); // Toggle it back off if permission denied
        return;
      }
    }

    setIsLoading(true);
    try {
      const newProfileData: Partial<UserProfile> = {
        dailyGoal: goal,
        units,
        remindersEnabled,
        reminderHours,
      };
      await updateProfile(firestore, user.uid, newProfileData);
      onUpdate({ ...currentProfile, ...newProfileData });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
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
            Update your daily hydration goal and reminder preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Hydration Goal</h3>
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
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
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

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-3">Reminders</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="reminders-enabled" className="flex flex-col gap-1">
                <span>Enable Notifications</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Get reminded to drink water.
                </span>
              </Label>
              <Switch
                id="reminders-enabled"
                checked={remindersEnabled}
                onCheckedChange={setRemindersEnabled}
              />
            </div>
            {remindersEnabled && (
              <div className="grid grid-cols-4 items-center gap-4 mt-4">
                <Label htmlFor="reminder-hours" className="text-right">
                  Remind After
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="reminder-hours"
                    type="number"
                    value={reminderHours}
                    onChange={(e) => setReminderHours(Number(e.target.value))}
                    className="w-20"
                  />
                  <span>hours</span>
                </div>
              </div>
            )}
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
