# Admin Dashboard

A comprehensive admin dashboard for managing the Shikkha.com MERN stack application. The dashboard provides full administrative control over users, content, and marketplace operations.

## Features

### Authentication
- **Frontend-only authentication** with hardcoded credentials
- **Admin Credentials:**
  - Email: `admin@shikkha.com`
  - Password: `Admin123`
- Secure session management with localStorage
- Protected routes with automatic redirect

### Dashboard Pages

#### 1. Website Analytics (`/admin/dashboard`)
- **Overview Statistics:** Total students, educators, courses, books, blogs, marketplace sales
- **Interactive Charts:** Monthly growth trends with visual representations
- **Real-time Data:** Fetches live data from backend APIs
- **Quick Stats:** Active users, content items, average sales metrics

#### 2. Manage Educators (`/admin/educators`)
- **User Management:** View all registered educators
- **Search & Filter:** Find educators by name or email
- **Actions:** Suspend, activate, or delete educator accounts
- **Status Tracking:** Monitor educator account status
- **Summary Dashboard:** Active vs suspended educator counts

#### 3. Manage Students (`/admin/students`)
- **User Management:** View all registered students
- **Search & Filter:** Find students by name or email
- **Actions:** Suspend, activate, or delete student accounts
- **Status Tracking:** Monitor student account status
- **Summary Dashboard:** Active vs suspended student counts

#### 4. Add Instructor (`/admin/add-instructor`)
- **Educator Selection:** Browse and select from existing educators
- **Instructor Card Creation:** Generate instructor profiles for public display
- **Form Fields:** Name, expertise, image, achievements, contact information
- **Live Preview:** See instructor card before publishing
- **API Integration:** Posts to `/api/instructors` for public instructor page

#### 5. Manage Blogs (`/admin/blogs`)
- **Content Moderation:** Approve, reject, or delete blog posts
- **Search & Filter:** Find blogs by title, author, or content
- **Detailed View:** Full blog content preview in modal
- **Status Management:** Track pending, approved, and rejected blogs
- **Summary Dashboard:** Blog approval statistics

#### 6. Manage Orders (`/admin/orders`)
- **Order Management:** View all marketplace orders
- **Status Control:** Mark orders as completed or canceled
- **Customer Information:** View customer details and contact info
- **Order Details:** Full order breakdown with items and pricing
- **Revenue Tracking:** Total sales and revenue analytics

#### 7. Manage Books (`/admin/books`)
- **Content Moderation:** Approve, reject, or delete books/materials
- **Visual Preview:** Book covers and detailed information
- **Search & Filter:** Find books by title, author, or description
- **Price Management:** View and track book pricing
- **Category Organization:** Manage book categories and classifications

#### 8. Appointments & Exams Oversight
- **Appointment Slots**: Review/publish educator time slots (uses `isPublished` flag)
- **Exam Insights**: View exams per instructor/course and results summaries
- **Evaluations Summary**: Access instructor ratings overview

## Technical Implementation

### File Structure
```
src/features/admin/
├── components/
│   ├── AdminSidebar.jsx          # Navigation sidebar
│   └── ProtectedAdminRoute.jsx   # Route protection
├── pages/
│   ├── AdminDashboard.jsx        # Main dashboard layout
│   ├── AdminLogin.jsx            # Authentication page
│   ├── WebsiteAnalytics.jsx      # Analytics dashboard
│   ├── ManageEducators.jsx       # Educator management
│   ├── ManageStudents.jsx        # Student management
│   ├── AddInstructor.jsx         # Instructor creation
│   ├── ManageBlogs.jsx           # Blog moderation
│   ├── ManageOrders.jsx          # Order management
│   └── ManageBooks.jsx           # Book moderation
└── README.md                     # Documentation
```

### Design System
- **Consistent Styling:** Matches existing educator/student dashboard design
- **Color Scheme:** Purple theme (`purple-800`, `purple-900`) consistent with app branding
- **Responsive Design:** Mobile-first approach with Tailwind CSS
- **Component Reuse:** Utilizes same UI patterns as existing dashboards

### API Integration
The dashboard integrates with these backend endpoints:
- `GET /api/students` - Fetch all students
- `GET /api/educators` - Fetch all educators
- `GET /api/courses` - Fetch all courses
- `GET /api/books` - Fetch all books
- `GET /api/blogs` - Fetch all blogs
- `GET /api/orders` - Fetch all orders
- `POST /api/instructors` - Create instructor cards
- `PATCH /api/[resource]/[id]/[action]` - Update resource status
- `DELETE /api/[resource]/[id]` - Delete resources

Appointments & Exams related:
- `GET /api/appointments/slots/:educatorId` - Review educator slots
- `PATCH /api/appointments/slots/:slotId` - Approve/publish slot (if implemented)
- `GET /api/exams/educator/:educatorId` - View educator exams
- `GET /api/instructors/:id/evaluations-summary` - Ratings summary

Payments (Stripe unified checkout):
- `POST /api/payments/create-checkout-session` - Create checkout session (course/book)
- `POST /api/payments/stripe/webhook` - Webhook (checkout.session.completed)
  - Revenue sharing: 60% educator, 40% admin for courses

### Authentication Flow
1. User navigates to `/admin/login`
2. Enters hardcoded credentials
3. Frontend validates credentials
4. Sets `adminToken` and `adminUser` in localStorage
5. Redirects to `/admin/dashboard`
6. Protected routes check for valid admin session

## Usage

### Accessing the Admin Dashboard
1. Navigate to `/admin/login`
2. Enter credentials:
   - Email: `admin@shikkha.com`
   - Password: `Admin123`
3. Click "Sign In"
4. You'll be redirected to the admin dashboard

### Navigation
- Use the fixed sidebar to navigate between different management pages
- Each page includes search and filter functionality
- Action buttons provide quick access to common operations
- Modal dialogs show detailed information for items

### Data Management
- All data is fetched from real backend APIs
- Actions like approve/reject/delete send API requests
- Real-time updates reflect changes immediately
- Error handling with toast notifications

## Security Considerations

- **Frontend-only authentication** - credentials are hardcoded as requested
- **Session management** - uses localStorage for admin session
- **Route protection** - unauthorized users redirected to login
- **No database storage** - admin user not stored in backend

## Responsive Design

- **Mobile-friendly** - works on all screen sizes
- **Touch-optimized** - buttons and interactions work on mobile
- **Flexible layouts** - tables and cards adapt to screen width
- **Consistent experience** - maintains usability across devices

## Future Enhancements

- Role-based permissions for different admin levels
- Advanced analytics with custom date ranges
- Bulk operations for managing multiple items
- Export functionality for reports and data
- Real-time notifications for new content submissions
- Advanced search with multiple filters
- Activity logs for admin actions
