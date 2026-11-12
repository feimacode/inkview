import { z } from "zod";
import { itemProvenance, SourceSchema } from "../provenance.js";
import { httpUrl } from "../fields.js";

const url = httpUrl;

export const ProductSchema = z.looseObject({
  title: z.string().min(1).max(200),
  url: url.describe("The product page at the merchant."),
  imageUrl: url.optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional().describe("ISO 4217, e.g. USD."),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  merchant: z.string().max(80).optional(),
  availability: z.enum(["in_stock", "limited", "out_of_stock", "preorder", "unknown"]).optional(),
  variants: z.string().max(120).optional().describe('Short summary, e.g. "3 colors, 2 sizes".'),
  ...itemProvenance,
});

export const MAX_PRODUCTS = 12;
/** Upper bound for servers that raise the product cap through the SDK. */
export const HARD_MAX_PRODUCTS = 100;

export function productGridSchema(maxProducts = MAX_PRODUCTS) {
  return z.looseObject({
    title: z.string().max(120).optional(),
    products: z.array(ProductSchema).min(1).max(maxProducts).describe(`1 to ${maxProducts} products, best match first.`),
    source: SourceSchema.optional(),
  });
}

export const schema = productGridSchema();

export type Product = z.infer<typeof ProductSchema>;
export type ProductGrid = z.infer<typeof schema>;
