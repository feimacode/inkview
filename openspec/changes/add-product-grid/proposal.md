# Proposal

## Why

Shopping research is a big agent use case, and product results lose a lot as text: images, prices and ratings are what users scan. Inkview only displays products and links to the merchant; it never takes orders or payments.

## What Changes

- New render tool `show_products` for up to 12 products: title, image, price and currency, rating and review count, merchant, availability, variants summary, product URL.
- Sort by price or rating; select 2 to 4 products and ask the agent to compare them.
- "View at store" opens the merchant's product page.
- Markdown fallback as a list with price, rating and store link.

Out of scope: cart, checkout, payments, price tracking and affiliate links (decided 2026-11-04).

## Capabilities

### New Capabilities
- `product-grid`: Shows shopping results as a product grid that links to merchant pages via `show_products`.

### Modified Capabilities

## Impact

- New folder `src/components/product-grid/` registered in the component registry; new examples in the preview gallery.
- Depends on `add-component-runtime`.
