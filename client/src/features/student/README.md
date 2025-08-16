# Student Feature Module

This module contains all student-related components, pages, and services.

## Structure
- `pages/` - All student dashboard pages
- `components/` - Reusable student components
- `services/` - API services for student features
- `hooks/` - Custom React hooks
- `styles/` - Student-specific styles

## Routes Added
- `/dashboard` → StudentDashboard (main dashboard with nested routes)
- `/courses` → CoursesPage (browse public courses)
- `/courses/:id` → CourseDetailsPage (course details and enrollment)
- `/library` → LibraryPage (browse books/materials)
- `/library/:id` → BookDetailsPage (book details)
- `/cart` → CartPage (shopping cart)

## API Endpoints Used
### Student Dashboard
- `GET /api/student/schedule` - Get student's class schedule
- `GET /api/student/grades` - Get student's grades
- `GET /api/student/appointments` - Get booked appointments
- `DELETE /api/student/appointments/:id` - Cancel appointment

### Course Catalog
- `GET /api/catalog/courses` - List public courses (with filters)
- `GET /api/catalog/courses/:id` - Get course details
- `POST /api/catalog/enrollments` - Enroll in course

### Marketplace
- `GET /api/marketplace/books` - List books (with filters)
- `GET /api/marketplace/books/:id` - Get book details
- `GET /api/marketplace/cart` - Get user's cart
- `POST /api/marketplace/cart/items` - Add item to cart
- `DELETE /api/marketplace/cart/items/:itemId` - Remove item from cart
- `POST /api/marketplace/checkout` - Create order from cart

## How to Test
1. Login as a student user
2. Navigate to `/dashboard` to see student dashboard
3. Browse courses at `/courses`
4. Browse library at `/library`
5. Add books to cart and checkout

## Environment Variables
No additional environment variables required for student features.
