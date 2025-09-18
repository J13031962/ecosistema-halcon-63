import * as React from "react"
import { cn } from "@/lib/utils"
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated'

const OPERATIONAL_ROLES = [
  'operador_alarmas',
  'despachador_patrullas', 
  'supervisor_motorizado'
];

const OperationalCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { user } = useAuthConsolidatedContext();
  const isOperationalRole = user && OPERATIONAL_ROLES.includes(user.role);
  
  if (isOperationalRole) {
    return (
      <div
        ref={ref}
        className={cn(
          "operational-card rounded-lg border text-card-foreground shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
})
OperationalCard.displayName = "OperationalCard"

const OperationalCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
OperationalCardHeader.displayName = "OperationalCardHeader"

const OperationalCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
OperationalCardTitle.displayName = "OperationalCardTitle"

const OperationalCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
OperationalCardDescription.displayName = "OperationalCardDescription"

const OperationalCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
OperationalCardContent.displayName = "OperationalCardContent"

const OperationalCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
OperationalCardFooter.displayName = "OperationalCardFooter"

export { OperationalCard, OperationalCardHeader, OperationalCardFooter, OperationalCardTitle, OperationalCardDescription, OperationalCardContent }