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
- `/exams` → ExamsPage (list available exams)
- `/exams/attempt/:examId` → ExamAttemptPage (timer-based attempt UI)
- `/exams/result/:attemptId` → ExamResultPage (score + details)
- `/grades` → GradesPage (overall results & stats)
- `/evaluations` → EvaluationsPage (rate completed courses)

## API Endpoints Used
### Student Dashboard
- `GET /api/student/schedule` - Get student's class schedule
- `GET /api/student/appointments` - Get booked appointments
- `DELETE /api/student/appointments/:id` - Cancel appointment

### Exams & Grades
- `GET /api/exams?studentId=...` - List available exams for the student
- `POST /api/exams/submit` - Submit an exam attempt (auto-graded)
- `GET /api/students/:id/grades` - Get exam results and statistics

### Evaluations
- `GET /api/students/:id/completed-courses` - Courses eligible for evaluation
- `GET /api/instructors/:id/evaluations-summary` - Instructor ratings (for display)

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
- Payments: `POST /api/payments/create-checkout-session` (unified course/book checkout)

## How to Test
1. Login as a student user
2. Navigate to `/dashboard` to see student dashboard
3. Exams
   - Go to `/exams` to view available exams
   - Start an attempt at `/exams/attempt/:examId` and submit
   - View results at `/exams/result/:attemptId` and overall `/grades`
4. Evaluations
   - Go to `/evaluations` and submit ratings/comments (optional comment max 300 chars)
5. Marketplace
   - Browse library at `/library`, add to cart, then checkout via Stripe (unified checkout)

## Environment Variables
No additional environment variables required for student features.
