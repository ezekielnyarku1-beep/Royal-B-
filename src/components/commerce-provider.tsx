"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { products as localProducts, type Product } from "@/lib/catalogue";
import { fetchCatalogue } from "@/lib/commerce";

interface CatalogueState { products: Product[]; loading: boolean; live: boolean; reload: () => Promise<void> }
const CatalogueContext = createContext<CatalogueState>({ products: localProducts, loading: true, live: false, reload: async () => {} });

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(localProducts);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const reload = useCallback(async () => {
    try { const catalogue = await fetchCatalogue(); setProducts(catalogue); setLive(true); }
    catch { /* The existing catalogue remains usable until shared data is activated. */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void reload();
    const refresh = () => { if (document.visibilityState === "visible") void reload(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [reload]);
  return <CatalogueContext.Provider value={{ products, loading, live, reload }}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue() { return useContext(CatalogueContext); }
