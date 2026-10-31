"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { products as localProducts, isStorefrontProduct, type Product } from "@/lib/catalogue";
import { fetchCatalogue } from "@/lib/commerce";
import { isLegacyAuthReturn } from "@/lib/auth-return";

interface CatalogueState { products: Product[]; loading: boolean; live: boolean; reload: () => Promise<void> }
const CatalogueContext = createContext<CatalogueState>({ products: localProducts.filter(isStorefrontProduct), loading: true, live: false, reload: async () => {} });

export function CommerceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [products, setProducts] = useState(localProducts.filter(isStorefrontProduct));
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const reload = useCallback(async () => {
    try { const catalogue = await fetchCatalogue(); setProducts(catalogue.filter(isStorefrontProduct)); setLive(true); }
    catch { /* The existing catalogue remains usable until shared data is activated. */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (pathname === "/login") return;
    // Let legacy auth callbacks complete before starting the optional catalogue request.
    if (window.location.pathname === "/" && isLegacyAuthReturn(window.location.search, window.location.hash)) return;
    void reload();
    const refresh = () => { if (document.visibilityState === "visible") void reload(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [pathname, reload]);
  return <CatalogueContext.Provider value={{ products, loading, live, reload }}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue() { return useContext(CatalogueContext); }
