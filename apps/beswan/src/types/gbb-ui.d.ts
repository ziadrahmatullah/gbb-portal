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
