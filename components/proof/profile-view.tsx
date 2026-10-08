"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/client";

export function ProfileViewed({ handle, project }: { handle: string; project?: string }) {
  useEffect(() => {
    track("profile_viewed", { handle, project });
  }, [handle, project]);
  return null;
}
