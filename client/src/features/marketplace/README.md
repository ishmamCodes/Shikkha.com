# Marketplace Feature

This feature provides a marketplace for students to browse, purchase, and manage books.

## Structure
- `pages/` - Contains pages for the book library, book details, and shopping cart.
- `components/` - Reusable components like book cards, filters, and cart items.

## Routes Added
- `/library` -> `BooksPage`
- `/library/:id` -> `BookDetailsPage`
- `/cart` -> `CartPage`

## API Endpoints Used
- `GET /api/marketplace/books`
- `GET /api/marketplace/books/:id`
- `GET /api/marketplace/cart`
- `POST /api/marketplace/cart/items`
- `DELETE /api/marketplace/cart/items/:itemId`
- `POST /api/marketplace/checkout`
