"use client"

import * as React from "react"

import { ArrowUp, Eye, EyeOff } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { cn } from "@/shared/lib/utils"

const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [capsLockActive, setCapsLockActive] = React.useState(false)

    const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const isCapsLock = e.getModifierState("CapsLock")
      setCapsLockActive(isCapsLock)
    }

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", capsLockActive && "pr-16", className)}
          ref={ref}
          {...props}
          onKeyDown={(e) => {
            handleKeyEvent(e)
            props.onKeyDown?.(e)
          }}
          onKeyUp={(e) => {
            handleKeyEvent(e)
            props.onKeyUp?.(e)
          }}
        />
        {capsLockActive && (
          <div
            className="absolute right-10 top-0 flex h-full items-center justify-center text-amber-500"
            title="Caps Lock is ON"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Caps Lock is ON</span>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
