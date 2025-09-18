import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated'

const OPERATIONAL_ROLES = [
  'operador_alarmas',
  'despachador_patrullas', 
  'supervisor_motorizado'
];

const operationalButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "operational-btn-primary",
        secondary: "operational-btn-secondary", 
        destructive: "operational-btn-danger",
        outline: "border border-operational-border bg-operational-card hover:bg-operational-muted hover:text-operational-accent",
        ghost: "hover:bg-operational-muted hover:text-operational-accent",
        link: "text-operational-accent underline-offset-4 hover:underline",
        // Add specific operational variants
        cancel: "operational-btn-danger", // Maps cancel to red
        delete: "operational-btn-danger", // Maps delete to red
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface OperationalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof operationalButtonVariants> {
  asChild?: boolean
}

const OperationalButton = React.forwardRef<HTMLButtonElement, OperationalButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const { user } = useAuthConsolidatedContext();
    const isOperationalRole = user && OPERATIONAL_ROLES.includes(user.role);
    
    const Comp = asChild ? Slot : "button"
    
    if (isOperationalRole) {
      return (
        <Comp
          className={cn(operationalButtonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      )
    }
    
    // Fallback to regular button styles for non-operational roles
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
          variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          variant === "outline" && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
          variant === "link" && "text-primary underline-offset-4 hover:underline",
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-9 rounded-md px-3",
          size === "lg" && "h-11 rounded-md px-8",
          size === "icon" && "h-10 w-10",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
OperationalButton.displayName = "OperationalButton"

export { OperationalButton, operationalButtonVariants }