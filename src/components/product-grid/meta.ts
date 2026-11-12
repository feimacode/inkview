import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "product_grid",
  tool: "show_products",
  title: "Show products",
  schemaVersion: "1",
  description:
    "Display shopping results as a grid of product cards with image, price, rating, merchant and availability; the user can sort, compare a few, or open the product at the store. Use it after a product or shopping search with 2 to 12 products. Pass only real products from your tools with their real product page URLs and image URLs; never invent prices. Give each product its own source when they come from different stores. Pass source with retrievedAt (when you fetched the data), and list in unverified the fields you did not fetch. Inkview never handles carts or checkout. After calling it, add at most one sentence.",
};
