# Spec Delta

## Purpose

Shows shopping results as a grid of product cards that link to each merchant's product page, via the `show_products` render tool.

## ADDED Requirements

### Requirement: Product grid schema
`show_products` SHALL take `products` (1 to 12, each with `title` and `url` required and optional `imageUrl`, `price`, `currency`, `rating` 0 to 5, `reviewCount`, `merchant`, `availability` and `variants`) plus optional `title` and `source`.

#### Scenario: Six products
- **WHEN** the agent passes 6 products
- **THEN** the grid shows 6 product cards

### Requirement: Product card display
Each card SHALL show image or placeholder, title (two lines max), price formatted in its currency, rating with review count, merchant and availability.

#### Scenario: Out of stock
- **WHEN** a product's availability is "out_of_stock"
- **THEN** its card shows an "Out of stock" label

### Requirement: Sort products
The user SHALL be able to sort the grid by price (low to high, high to low) or by rating without a new tool call, with products lacking that value placed last.

#### Scenario: Sort by price
- **WHEN** the user sorts by price low to high
- **THEN** cards reorder by price with unpriced products last

### Requirement: Link to merchant only
"View at store" SHALL ask the host to open the product's `url`, and the component SHALL NOT offer any cart, checkout or payment action.

#### Scenario: View at store
- **WHEN** the user clicks "View at store"
- **THEN** the host is asked to open the product's URL

### Requirement: Compare selected products
The user SHALL be able to select 2 to 4 products and send a message asking the agent to compare them.

#### Scenario: Compare three
- **WHEN** the user selects 3 products and clicks "Compare selected"
- **THEN** a message naming the 3 products is sent into the chat

### Requirement: Product markdown fallback
The text result SHALL list each product with its linked title, price, rating and merchant.

#### Scenario: Text-only host
- **WHEN** Codex calls `show_products`
- **THEN** the user sees a markdown list of products with store links
