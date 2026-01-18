import { useMutation } from "@tanstack/react-query";
import { api, type InsertReport } from "@shared/schema"; // Actually routes.ts exports schema imports, but direct import is safer
import { insertReportSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useReportStranger() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertReport) => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error("Failed to submit report");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });
}
