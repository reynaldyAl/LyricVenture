"use client";

import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { moderateContent } from "@/app/(admin)/dashboard/actions/moderation";

type Table = "songs" | "artists" | "albums" | "lyric_analyses";

interface ModerationButtonsProps {
  table: Table;
  id: string;
  status: string | null;
  revalidate?: string;
}

export default function ModerationButtons({
  table, id, status, revalidate,
}: ModerationButtonsProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Hanya tampil kalau pending
  if (status !== "pending") return null;

  function handleModerate(action: "published" | "rejected") {
    startTransition(async () => {
      const result = await moderateContent(table, id, action, revalidate);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({
          title: action === "published" ? "✓ Approved" : "✗ Rejected",
          description: action === "published"
            ? "Content has been published."
            : "Content has been rejected.",
        });
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => handleModerate("published")}
        className="h-7 text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2"
      >
        ✓ Approve
      </Button>
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => handleModerate("rejected")}
        className="h-7 text-xs bg-red-900/60 hover:bg-red-800 text-red-300 px-2"
      >
        ✗ Reject
      </Button>
    </div>
  );
}