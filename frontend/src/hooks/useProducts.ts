import { useState, useEffect, useCallback } from "react";
import { productApi } from "@/features/inventory/api";
import type { Product, ProductFilters } from "@/types";
import { toast } from "sonner";

export function useProducts(initialFilters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters ?? {});

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await productApi.getAll(filters);
      setProducts(response.data);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { products, isLoading, total, totalPages, filters, setFilters, refetch: fetch };
}
