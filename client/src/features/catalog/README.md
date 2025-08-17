# Course Catalog Feature

This feature allows users to browse, search, and enroll in public courses.

## Structure
- `pages/` - Contains pages for listing courses and viewing course details.
- `components/` - Reusable components like course cards and filters.

## Routes Added
- `/courses` -> `CoursesPage`
- `/courses/:id` -> `CourseDetailsPage`

## API Endpoints Used
- `GET /api/catalog/courses`
- `GET /api/catalog/courses/:id`
- `POST /api/catalog/enrollments`
