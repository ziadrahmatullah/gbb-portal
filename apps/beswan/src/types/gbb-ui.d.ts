// @gbb/ui adalah paket workspace JS tanpa deklarasi type (main: src/index.js → .jsx).
// Named export dienumerasi (typed any) supaya wrapper `export * from "@gbb/ui"` di
// src/shared/components/ui/*.jsx tetap bisa meneruskan named import ke file .ts/.tsx.
// Typing proper per komponen menyusul di luar tahap fondasi.
declare module "@gbb/ui" {
  import type { ComponentType } from "react";

  type UIComponent = ComponentType<Record<string, unknown>>;

  export function cn(...inputs: unknown[]): string;

  export const Button: UIComponent;
  export const buttonVariants: (options?: Record<string, unknown>) => string;

  export const Card: UIComponent;
  export const CardHeader: UIComponent;
  export const CardFooter: UIComponent;
  export const CardTitle: UIComponent;
  export const CardDescription: UIComponent;
  export const CardContent: UIComponent;

  export const Dialog: UIComponent;
  export const DialogPortal: UIComponent;
  export const DialogOverlay: UIComponent;
  export const DialogTrigger: UIComponent;
  export const DialogClose: UIComponent;
  export const DialogContent: UIComponent;
  export const DialogHeader: UIComponent;
  export const DialogFooter: UIComponent;
  export const DialogTitle: UIComponent;
  export const DialogDescription: UIComponent;

  export const DropdownMenu: UIComponent;
  export const DropdownMenuTrigger: UIComponent;
  export const DropdownMenuContent: UIComponent;
  export const DropdownMenuItem: UIComponent;
  export const DropdownMenuCheckboxItem: UIComponent;
  export const DropdownMenuRadioItem: UIComponent;
  export const DropdownMenuLabel: UIComponent;
  export const DropdownMenuSeparator: UIComponent;
  export const DropdownMenuShortcut: UIComponent;
  export const DropdownMenuGroup: UIComponent;
  export const DropdownMenuPortal: UIComponent;
  export const DropdownMenuSub: UIComponent;
  export const DropdownMenuSubContent: UIComponent;
  export const DropdownMenuSubTrigger: UIComponent;
  export const DropdownMenuRadioGroup: UIComponent;

  export const ImageUpload: UIComponent;
  export const Input: UIComponent;
  export const Label: UIComponent;

  export const Popover: UIComponent;
  export const PopoverTrigger: UIComponent;
  export const PopoverContent: UIComponent;

  export const SearchableSelect: UIComponent;

  export const Select: UIComponent;
  export const SelectGroup: UIComponent;
  export const SelectValue: UIComponent;
  export const SelectTrigger: UIComponent;
  export const SelectContent: UIComponent;
  export const SelectLabel: UIComponent;
  export const SelectItem: UIComponent;
  export const SelectSeparator: UIComponent;
  export const SelectScrollUpButton: UIComponent;
  export const SelectScrollDownButton: UIComponent;

  export const Switch: UIComponent;

  export const Table: UIComponent;
  export const TableHeader: UIComponent;
  export const TableBody: UIComponent;
  export const TableFooter: UIComponent;
  export const TableHead: UIComponent;
  export const TableRow: UIComponent;
  export const TableCell: UIComponent;
  export const TableCaption: UIComponent;

  export const Textarea: UIComponent;
}

// ===== Tambahan komponen shadcn/ui v4 (rombakan tema shadcn-admin) =====
declare module "@gbb/ui" {
  import type { ComponentType } from "react";

  type UIComponent2 = ComponentType<Record<string, unknown>>;

  export function useIsMobile(): boolean;

  export interface FileDropzoneProps {
    id?: string;
    value?: File | File[] | null;
    onChange: ((file: File | null) => void) | ((files: File[]) => void);
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    maxSizeMb?: number;
    hint?: string;
    onReject?: (message: string) => void;
    className?: string;
    zoneClassName?: string;
  }
  export const FileDropzone: ComponentType<FileDropzoneProps>;

  export const Alert: UIComponent2;
  export const AlertTitle: UIComponent2;
  export const AlertDescription: UIComponent2;

  export const Avatar: UIComponent2;
  export const AvatarImage: UIComponent2;
  export const AvatarFallback: UIComponent2;

  export const Badge: UIComponent2;
  export const badgeVariants: (options?: Record<string, unknown>) => string;

  export const Collapsible: UIComponent2;
  export const CollapsibleTrigger: UIComponent2;
  export const CollapsibleContent: UIComponent2;

  export const CardAction: UIComponent2;

  export const DateInput: UIComponent2;

  export const LoginShowcase: UIComponent2;

  export const ScrollArea: UIComponent2;
  export const ScrollBar: UIComponent2;

  export const Separator: UIComponent2;

  export const Sheet: UIComponent2;
  export const SheetTrigger: UIComponent2;
  export const SheetClose: UIComponent2;
  export const SheetContent: UIComponent2;
  export const SheetHeader: UIComponent2;
  export const SheetFooter: UIComponent2;
  export const SheetTitle: UIComponent2;
  export const SheetDescription: UIComponent2;

  export const Sidebar: UIComponent2;
  export const SidebarContent: UIComponent2;
  export const SidebarFooter: UIComponent2;
  export const SidebarGroup: UIComponent2;
  export const SidebarGroupAction: UIComponent2;
  export const SidebarGroupContent: UIComponent2;
  export const SidebarGroupLabel: UIComponent2;
  export const SidebarHeader: UIComponent2;
  export const SidebarInput: UIComponent2;
  export const SidebarInset: UIComponent2;
  export const SidebarMenu: UIComponent2;
  export const SidebarMenuAction: UIComponent2;
  export const SidebarMenuBadge: UIComponent2;
  export const SidebarMenuButton: UIComponent2;
  export const SidebarMenuItem: UIComponent2;
  export const SidebarMenuSkeleton: UIComponent2;
  export const SidebarMenuSub: UIComponent2;
  export const SidebarMenuSubButton: UIComponent2;
  export const SidebarMenuSubItem: UIComponent2;
  export const SidebarProvider: UIComponent2;
  export const SidebarRail: UIComponent2;
  export const SidebarSeparator: UIComponent2;
  export const SidebarTrigger: UIComponent2;
  export function useSidebar(): {
    state: "expanded" | "collapsed";
    open: boolean;
    setOpen: (open: boolean) => void;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    toggleSidebar: () => void;
  };

  export const Skeleton: UIComponent2;

  export const Tabs: UIComponent2;
  export const TabsList: UIComponent2;
  export const TabsTrigger: UIComponent2;
  export const TabsContent: UIComponent2;

  export const Tooltip: UIComponent2;
  export const TooltipTrigger: UIComponent2;
  export const TooltipContent: UIComponent2;
  export const TooltipProvider: UIComponent2;
}
