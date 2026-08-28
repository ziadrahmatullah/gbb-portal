import { MoreHorizontal } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ActionMenu({ actions, className }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("size-8", className)}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => {
          if (action.separator) {
            return <DropdownMenuSeparator key={`separator-${index}`} />;
          }

          const Icon = action.icon;

          return (
            <DropdownMenuItem
              key={action.label}
              onClick={action.onClick}
              className={cn("cursor-pointer", action.variant === "destructive" && "text-destructive focus:text-destructive")}
              disabled={action.disabled}
            >
              {Icon && <Icon className="mr-2 size-4" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
