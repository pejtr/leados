import { getProduct } from "./db/marketplace";

export function calculateProductPrice(cost: number, marginPercent: number): { price: number; profit: number } {
  const price = Math.round(cost / (1 - marginPercent / 100));
  const profit = price - cost;
  return { price, profit };
}

export async function checkInventory(productId: number): Promise<{ inStock: boolean; quantity: number }> {
  const product = await getProduct(productId);
  if (!product) {
    return { inStock: false, quantity: 0 };
  }
  return { inStock: (product.inventory ?? 0) > 0, quantity: product.inventory ?? 0 };
}

export async function validateOrder(
  productId: number,
  quantity: number
): Promise<{ valid: boolean; reason?: string }> {
  const product = await getProduct(productId);
  if (!product) {
    return { valid: false, reason: "Product not found" };
  }
  if (product.status !== "active") {
    return { valid: false, reason: "Product is not active" };
  }
  if ((product.inventory ?? 0) < quantity) {
    return { valid: false, reason: "Insufficient inventory" };
  }
  return { valid: true };
}
