Educator Feature (Dashboard + API Usage)

Structure
- components
  - EducatorSidebar.jsx: Left sidebar navigation
  - StudentList.jsx: Lists students for a given course and allows removal
- pages
  - EducatorDashboard.jsx: Protected layout that renders the sidebar and nested pages
  - ProfilePage.jsx: View/update educator profile
  - CreateCoursePage.jsx: Create a new course
  - ManageCoursesPage.jsx: View courses and manage enrolled students
  - AppointmentsPage.jsx: View upcoming appointments
  - UploadMaterialsPage.jsx: Upload files, optionally linked to a course
- services
  - educatorApi.js: Axios wrapper for backend endpoints
- hooks
  - (reserved for future custom hooks)
- styles
  - (use Tailwind; primary = purple, secondary = white)

Routes and Backend Endpoints
- ProfilePage → GET/PUT `/api/educators/:id`
- Password update (not on UI) → PUT `/api/educators/:id/password`
- CreateCoursePage → POST `/api/courses`
- ManageCoursesPage → GET `/api/educators/:id` (to list educator courses)
- StudentList → GET `/api/courses/:id/students`, DELETE `/api/courses/:id/students/:studentId`
- AppointmentsPage → GET `/api/appointments?educatorId=<id>`
- UploadMaterialsPage → POST `/api/uploads` (multipart/form-data)

Example usage
```jsx
// Example: Get educator profile
useEffect(() => {
  educatorApi.getProfile(educatorId).then(setProfile);
}, []);
```

Auth
- JWT stored in localStorage as `token`
- User object stored as `user` (must have `role==='educator'`)
- Route `/dashboard/educator/*` is protected in `EducatorDashboard.jsx`


