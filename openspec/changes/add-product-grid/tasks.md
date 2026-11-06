# Tasks

## 1. Schema and server

- [x] 1.1 Write the `product-grid` schema and tool description with a "use when" line; verify the smoke test calls `show_products` with a valid and an invalid payload
- [x] 1.2 Write the markdown fallback; verify unit tests cover a full and a minimal payload

## 2. View

- [x] 2.1 Render the responsive grid of product cards with image placeholder, price, rating, merchant and availability; verify render tests at desktop and 320 px
- [x] 2.2 Add sorting by price and rating; verify render tests check order including missing values
- [x] 2.3 Add "View at store" and "Compare selected" (2 to 4); verify the test host receives the open-link request and the compare message, and that no cart or checkout action exists
- [x] 2.4 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list with a screenshot and sample prompt; verify the prompt triggers `show_products` in Claude Desktop
