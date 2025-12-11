"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function LoadingButton({
  isLoading = false,
  loadingText = "Loading...",
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}



