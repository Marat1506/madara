import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface Action<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "destructive" | "outline";
  show?: (item: T) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = "Нет данных",
  onRowClick,
  className = ""
}: DataTableProps<T>) {
  const getValue = (item: T, key: string) => {
    return key.split('.').reduce((obj, k) => obj?.[k], item);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Загрузка...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={String(column.key)} 
                style={{ width: column.width }}
                className="font-semibold"
              >
                {column.label}
              </TableHead>
            ))}
            {actions.length > 0 && (
              <TableHead className="w-[100px]">Действия</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow 
              key={item.id || index}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => {
                const value = getValue(item, String(column.key));
                return (
                  <TableCell key={String(column.key)}>
                    {column.render ? column.render(value, item) : (value as unknown) as React.ReactNode}
                  </TableCell>
                );
              })}
              {actions.length > 0 && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {actions.length <= 2 ? (
                      // Show buttons directly if 2 or fewer actions
                      actions
                        .filter(action => !action.show || action.show(item))
                        .map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            variant={action.variant || "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(item);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {action.icon}
                          </Button>
                        ))
                    ) : (
                      // Show dropdown for more than 2 actions
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions
                            .filter(action => !action.show || action.show(item))
                            .map((action, actionIndex) => (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={() => action.onClick(item)}
                                className={action.variant === "destructive" ? "text-red-600" : ""}
                              >
                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Utility components for common cell types
export const BadgeCell = ({ value, variant = "default" }: { value: string; variant?: "default" | "secondary" | "destructive" | "outline" }) => (
  <Badge variant={variant}>{value}</Badge>
);

export const AvatarCell = ({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) => {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base"
  };
  
  return (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-full flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  );
};

export const DateCell = ({ value }: { value: string }) => {
  const date = new Date(value);
  return <span>{date.toLocaleDateString('ru-RU')}</span>;
};

export const ListCell = ({ items, maxItems = 3 }: { items: string[]; maxItems?: number }) => {
  const displayItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;
  
  return (
    <div>
      {displayItems.join(", ")}
      {remainingCount > 0 && (
        <span className="text-gray-500 text-sm"> +{remainingCount} еще</span>
      )}
    </div>
  );
};
