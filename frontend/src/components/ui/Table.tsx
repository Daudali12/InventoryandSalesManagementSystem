import { cn } from "@/utils/cn";
import { forwardRef } from "react";

interface TableProps {
  className?: string;
  children?: React.ReactNode;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <div className="overflow-x-auto">
      <table ref={ref} className={cn("w-full text-sm text-left text-gray-700", className)} {...props}>
        {children}
      </table>
    </div>
  )
);

Table.displayName = "Table";

export const TableHeader = forwardRef<HTMLTableSectionElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props}>
      {children}
    </thead>
  )
);

TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef<HTMLTableSectionElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props}>
      {children}
    </tbody>
  )
);

TableBody.displayName = "TableBody";

export const TableFooter = forwardRef<HTMLTableSectionElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <tfoot ref={ref} className={cn("bg-gray-50 border-t font-medium", className)} {...props}>
      {children}
    </tfoot>
  )
);

TableFooter.displayName = "TableFooter";

export const TableRow = forwardRef<HTMLTableRowElement, TableProps & { hover?: boolean }>(
  ({ className, children, hover = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-gray-100 transition-colors",
        hover && "hover:bg-gray-50",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
);

TableRow.displayName = "TableRow";

export const TableHead = forwardRef<HTMLTableCellElement, TableProps & { width?: string }>(
  ({ className, children, width, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-4 py-3 font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200",
        width && `w-[${width}]`,
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
);

TableHead.displayName = "TableHead";

export const TableCell = forwardRef<HTMLTableCellElement, TableProps & { width?: string; colSpan?: number }>(
  ({ className, children, width, colSpan, ...props }, ref) => (
    <td
      ref={ref}
      colSpan={colSpan}
      className={cn("px-4 py-3 border-b border-gray-100", width && `w-[${width}]`, className)}
      {...props}
    >
      {children}
    </td>
  )
);

TableCell.displayName = "TableCell";

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <caption ref={ref} className={cn("px-4 py-3 text-sm text-gray-500", className)} {...props}>
      {children}
    </caption>
  )
);

TableCaption.displayName = "TableCaption";