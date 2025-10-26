"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ProblemStatus, PROBLEM_STATUS_DISPLAY } from "@/types";
import { CheckCircle2, Pencil, ListTodo } from "lucide-react";

const statusConfig = {
  solved: {
    Icon: CheckCircle2,
    bgColor: "bg-green-100",
    textColor: "text-green-800",
  },
  attempted: {
    Icon: Pencil,
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
  },
  todo: {
    Icon: ListTodo,
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
  },
};

const ProblemStatusIconComponent: React.FC<{ status: ProblemStatus }> = ({
  status,
}) => {
  if (status === "none" || !PROBLEM_STATUS_DISPLAY[status]) return null;

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  const { Icon, bgColor, textColor } = config;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              bgColor,
            )}
          >
            <Icon
              className={cn("h-5 w-5", textColor)}
              aria-label={`Status: ${PROBLEM_STATUS_DISPLAY[status]?.label}`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{PROBLEM_STATUS_DISPLAY[status]?.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const ProblemStatusIcon = React.memo(ProblemStatusIconComponent);
