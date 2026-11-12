import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function BaselineProviders({ children }: { children: ReactNode }) {
  return <TooltipProvider><Toaster />{children}</TooltipProvider>;
}
