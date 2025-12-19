"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getProfile, getDailySummary, logWater } from "@/lib/firestore";
import type { UserProfile, DailySummary } from "@/types";
import { Header } from "@/components/header";
import { HydroProgress } from "@/components/hydro-progress";
import { LogWaterDialog } from "@/components/log-water-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot, GlassWater, Plus, Droplet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isLogWaterOpen, setLogWaterOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [profileData, summaryData] = await Promise.all([
        getProfile(user.uid),
        getDailySummary(user.uid),
      ]);
      setProfile(profileData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Could not load your hydration data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleLogWater = async (amount: number) => {
    if (!user || !summary || !profile) return;
    const amountInMl =
      profile.units === "oz" ? Math.round(amount * 29.5735) : amount;

    const oldSummary = { ...summary };
    setSummary((prev) =>
      prev ? { ...prev, totalIntake: prev.totalIntake + amountInMl } : null
    );

    try {
      const newSummary = await logWater(user.uid, amountInMl);
      setSummary(newSummary);
    } catch (error) {
      console.error("Error logging water:", error);
      setSummary(oldSummary);
      toast({
        title: "Error",
        description: "Could not save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading || !profile || !summary) {
    return <LoadingSkeleton />;
  }

  const quickAddAmounts = profile.units === "oz" ? [8, 16, 24] : [250, 500, 750];

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header onSettingsClick={() => setSettingsOpen(true)} />
        <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
          <div className="w-full max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="items-center pb-2">
                <CardTitle className="text-2xl font-bold tracking-tight text-center font-headline">
                  Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 p-6">
                <HydroProgress
                  value={summary.totalIntake}
                  goal={profile.dailyGoal}
                  units={profile.units}
                />
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {summary.totalIntake.toLocaleString()}
                    <span className="text-lg font-medium text-muted-foreground ml-1">
                      / {profile.dailyGoal.toLocaleString()} {profile.units}
                    </span>
                  </p>
                </div>
                <div className="w-full text-center">
                  <p className="text-muted-foreground mb-4">
                    Quickly log your intake
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex flex-col h-24 gap-2"
                      onClick={() => handleLogWater(quickAddAmounts[0])}
                    >
                      <GlassWater className="w-8 h-8 text-primary" />
                      <span className="font-semibold">
                        {quickAddAmounts[0]} {profile.units}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex flex-col h-24 gap-2"
                      onClick={() => handleLogWater(quickAddAmounts[1])}
                    >
                      <Bot className="w-8 h-8 text-primary" />
                      <span className="font-semibold">
                        {quickAddAmounts[1]} {profile.units}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex flex-col h-24 gap-2"
                      onClick={() => setLogWaterOpen(true)}
                    >
                      <Plus className="w-8 h-8 text-primary" />
                      <span className="font-semibold">Custom</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <SettingsDialog
        isOpen={isSettingsOpen}
        setIsOpen={setSettingsOpen}
        currentProfile={profile}
        onUpdate={(newProfile) => {
          setProfile(newProfile);
          fetchData(); // re-fetch summary in case goal changed
        }}
      />
      <LogWaterDialog
        isOpen={isLogWaterOpen}
        setIsOpen={setLogWaterOpen}
        units={profile.units}
        onLog={handleLogWater}
      />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header isLoading />
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="w-full max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="items-center pb-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-center font-headline">
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 p-6">
              <Skeleton className="w-64 h-64 rounded-full" />
              <div className="text-center">
                <Skeleton className="h-10 w-48" />
              </div>
              <div className="w-full text-center">
                <Skeleton className="h-5 w-40 mb-4 mx-auto" />
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
