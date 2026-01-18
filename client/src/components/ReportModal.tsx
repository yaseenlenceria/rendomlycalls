import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useReportStranger } from "@/hooks/use-reports";
import { Flag } from "lucide-react";

interface ReportModalProps {
  onReportSubmitted?: () => void;
}

export function ReportModal({ onReportSubmitted }: ReportModalProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("inappropriate");
  const [details, setDetails] = useState("");
  const { mutate, isPending } = useReportStranger();

  const handleSubmit = () => {
    mutate(
      { reason, details },
      {
        onSuccess: () => {
          setOpen(false);
          setDetails("");
          setReason("inappropriate");
          onReportSubmitted?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive transition-colors">
          <Flag className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Report Stranger</DialogTitle>
          <DialogDescription>
            Help us keep the community safe. This report is anonymous.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup value={reason} onValueChange={setReason} className="grid gap-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inappropriate" id="r1" />
              <Label htmlFor="r1">Inappropriate behavior</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spam" id="r2" />
              <Label htmlFor="r2">Spam or advertising</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="abusive" id="r3" />
              <Label htmlFor="r3">Abusive language</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="r4" />
              <Label htmlFor="r4">Other</Label>
            </div>
          </RadioGroup>
          <div className="grid gap-2">
            <Label htmlFor="details">Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder="Tell us more about what happened..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="resize-none bg-background border-input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
