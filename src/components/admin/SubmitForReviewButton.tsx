"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { submitForReview } from "@/app/(admin)/dashboard/actions/moderation";

type Table = "songs" | "artists" | "albums" | "lyric_analyses";

interface SubmitForReviewButtonProps {
  table: Table;
  id: string;
  status: string | null;
  revalidate?: string;
}

export default function SubmitForReviewButton({
  table,
  id,
  status,
  revalidate,
}: SubmitForReviewButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Hanya muncul kalau draft atau rejected
  if (status === "published") return null;

  // Kalau pending — tampilkan info, disabled
  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/20 border border-amber-800/40 rounded text-xs text-amber-400">
        <span className="animate-pulse">●</span>
        Waiting for review...
      </div>
    );
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitForReview(table, id, revalidate);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submitted for Review",
          description: "Admin will review your content shortly.",
        });
        router.refresh();
      }
    });
  }

  return (
    <Button
      size="sm"
      onClick={handleSubmit}
      disabled={isPending}
      className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-white px-3"
    >
      {isPending
        ? "Submitting..."
        : status === "rejected"
        ? "↺ Resubmit for Review"
        : "↑ Submit for Review"}
    </Button>
  );
}