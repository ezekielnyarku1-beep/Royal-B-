import { createClient } from "./supabase/client.ts";
import type { Product } from "./catalogue.ts";
import type { CartItem } from "./cart.ts";
import { validateProduct, validateProfile, type CustomerProfile, type StoreProductRow, type StoreOrder, type OrderEvent, type OrderStatus } from "./commerce-types.ts";

export class CommerceUnavailableError extends Error {
  constructor() { super("Account and store management features are not ready yet. You can still shop and order on WhatsApp."); }
}

function check(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (["PGRST205", "PGRST202", "42P01", "42883"].includes(error.code ?? "")) throw new CommerceUnavailableError();
  if (error.code === "42501") throw new Error("You do not have access to make that change.");
  // Only controlled messages raised by our database functions are shown.
  if (error.code === "P0001" && error.message && error.message.length <= 300) throw new Error(error.message);
  throw new Error("We couldn’t complete that change. Please try again.");
}

export function commerceError(error: unknown): string {
  if (error instanceof TypeError) return "We couldn’t connect. Check your internet connection and try again.";
  return error instanceof Error ? error.message : "We couldn’t complete that request. Please try again.";
}

export async function fetchCatalogue(): Promise<Product[]> {
  const { data, error } = await createClient().from("store_products").select("id,details,active,stock_quantity,stock_status,updated_at").eq("active", true).order("id").abortSignal(AbortSignal.timeout(8000));
  check(error);
  return (data as StoreProductRow[] ?? []).map(row => {
    if (validateProduct(row.details)) throw new Error("Some products could not be loaded. Please refresh the store.");
    return { ...row.details, availability: row.stock_status, stockQuantity: row.stock_quantity };
  });
}

export async function isStoreOwner(): Promise<boolean> {
  const { data, error } = await createClient().rpc("store_access");
  check(error); return data === true;
}

export async function fetchProfile(userId: string): Promise<CustomerProfile | null> {
  const { data, error } = await createClient().from("customer_profiles").select("user_id,name,phone,city,address,landmark").eq("user_id", userId).maybeSingle();
  check(error); return data as CustomerProfile | null;
}

export async function saveProfile(profile: CustomerProfile): Promise<void> {
  const invalid = validateProfile(profile); if (invalid) throw new Error(invalid);
  const { error } = await createClient().from("customer_profiles").upsert({ ...profile, name: profile.name.trim(), phone: profile.phone.trim(), city: profile.city.trim(), address: profile.address.trim(), landmark: profile.landmark.trim(), updated_at: new Date().toISOString() });
  check(error);
}

export async function fetchFavorites(userId: string): Promise<string[]> {
  const { data, error } = await createClient().from("customer_favorites").select("product_id").eq("user_id", userId);
  check(error); return (data ?? []).map(row => row.product_id as string);
}

export async function setFavorite(userId: string, productId: string, saved: boolean): Promise<void> {
  const query = createClient().from("customer_favorites");
  const { error } = saved ? await query.upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id", ignoreDuplicates: true }) : await query.delete().eq("user_id", userId).eq("product_id", productId);
  check(error);
}

const orderFields = "id,reference,user_id,status,items,contact,subtotal,unpriced_quantity,has_estimate,created_at,updated_at";
export async function fetchOrders(userId?: string): Promise<StoreOrder[]> {
  const orders: StoreOrder[] = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    let query = createClient().from("store_orders").select(orderFields)
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    check(error);
    const page = (data ?? []) as StoreOrder[];
    orders.push(...page);
    if (page.length < pageSize) return orders;
  }
}

export async function fetchOrderEvents(orderId: string): Promise<OrderEvent[]> {
  const { data, error } = await createClient().from("store_order_events").select("id,order_id,status,note,created_at").eq("order_id", orderId).order("created_at");
  check(error); return data as OrderEvent[] ?? [];
}

export async function saveOrderRequest(items: CartItem[], requestKey: string): Promise<StoreOrder> {
  const { data, error } = await createClient().rpc("create_order_request", { p_items: items, p_request_key: requestKey });
  check(error); if (!data?.id || !data?.reference) throw new Error("The request was not saved. Please try again.");
  return data as StoreOrder;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, note: string): Promise<StoreOrder> {
  const { data, error } = await createClient().rpc("update_order_status", { p_order_id: orderId, p_status: status, p_note: note });
  check(error); return data as StoreOrder;
}

export async function fetchOwnerProducts(): Promise<StoreProductRow[]> {
  const { data, error } = await createClient().from("store_products").select("id,details,active,stock_quantity,stock_status,updated_at").order("updated_at", { ascending: false });
  check(error); return data as StoreProductRow[] ?? [];
}

export async function saveOwnerProduct(row: Omit<StoreProductRow, "updated_at">): Promise<void> {
  const invalid = validateProduct(row.details); if (invalid) throw new Error(invalid);
  if (row.stock_quantity !== null && (!Number.isInteger(row.stock_quantity) || row.stock_quantity < 0 || row.stock_quantity > 100000)) throw new Error("Enter a whole stock quantity, or leave it blank if unknown.");
  const { error } = await createClient().from("store_products").upsert({ ...row, updated_at: new Date().toISOString() }); check(error);
}

export async function uploadProductPhoto(file: File): Promise<string> {
  const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const extension = types[file.type];
  if (!extension || file.size > 5 * 1024 * 1024) throw new Error("Choose a JPG, PNG or WebP photo under 5 MB.");
  const path = `${crypto.randomUUID()}.${extension}`;
  const bucket = createClient().storage.from("store-product-photos");
  const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false }); check(error);
  return bucket.getPublicUrl(path).data.publicUrl;
}
