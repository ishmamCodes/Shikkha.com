# Shikkha.com - Educator Platform

A comprehensive MERN stack platform for educators to create courses, manage content, and interact with students.

## 🚀 Features

### Module 1: Educator Profile Management ✅
- **Profile Management**: Complete profile setup with avatar upload, bio, experience, education background, achievements, and certifications
- **Settings**: Password reset, email change requests with admin approval
- **Authentication**: JWT-based authentication with role-based access control
- **Dashboard**: Overview of courses, students, and platform statistics

### Module 2: Course & Content Management ✅
- **Enhanced Course Creation**: Create courses with categories, difficulty levels, thumbnails, and pricing
- **Content Upload**: Multi-format content upload (PDFs, videos, images, documents, presentations)
- **Appointment Management**: View and manage student appointment requests
- **Messaging System**: Send and receive messages with students
- **Material Management**: Organize and manage course materials

## 🛠️ Tech Stack

- **Frontend**: React 19, TailwindCSS, Axios, React Router
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT, bcrypt
- **File Upload**: Multer (local storage)
- **UI Components**: Custom components with TailwindCSS

## 📁 Project Structure

```
Shikkha.com/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Shared components
│   │   ├── features/
│   │   │   └── educator/   # Educator-specific features
│   │   ├── pages/          # Main pages
│   │   └── services/       # API services
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   └── middleware/        # Authentication middleware
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB
- Git

### Backend Setup
```bash
cd server
npm install
npm run server
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

## 📚 API Documentation

### Educator Endpoints

#### Profile Management
- `GET /api/educators/:id` - Get educator profile
- `PUT /api/educators/:id` - Update educator profile
- `PUT /api/educators/:id/password` - Update password

#### Course Management
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `GET /api/courses/:id/students` - Get course students
- `DELETE /api/courses/:id/students/:studentId` - Remove student from course

#### Appointment Management
- `GET /api/appointments` - Get educator appointments
- `PUT /api/appointments/:id/status` - Update appointment status

#### Content Management
- `POST /api/uploads` - Upload course materials
- `GET /api/courses/:courseId/materials` - Get course materials
- `DELETE /api/materials/:materialId` - Delete material

#### Messaging
- `GET /api/messages` - Get educator messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:messageId/read` - Mark message as read

### Student Endpoints (Backend Only - For Future Implementation)
- `GET /api/students/educators/search` - Search educators
- `GET /api/students/educators/:educatorId` - Get educator profile
- `POST /api/students/appointments` - Book appointment
- `GET /api/students/appointments` - Get student appointments
- `PUT /api/students/appointments/:appointmentId/cancel` - Cancel appointment
- `GET /api/students/messages` - Get student messages
- `POST /api/students/messages` - Send message
- `PUT /api/students/messages/:messageId/read` - Mark message as read
- `POST /api/students/courses/:courseId/enroll` - Enroll in course
- `GET /api/students/courses` - Get enrolled courses
- `DELETE /api/students/courses/:courseId/enroll` - Unenroll from course

## 🎯 How It Works

### Course Creation & Content Management

1. **Course Creation**:
   - Educators create courses with title, description, category, difficulty level
   - Upload course thumbnails and set pricing
   - Configure privacy settings (public/private)
   - Add tags for better discoverability

2. **Content Upload**:
   - Upload multiple content types: PDFs, videos, images, documents, presentations
   - Organize materials with titles and descriptions
   - Manage content visibility and ordering
   - Track file sizes and upload dates

### Appointment Management

1. **Educator Flow**:
   - Receive appointment requests in dashboard
   - Review student details and appointment information
   - Confirm, reschedule, or cancel appointments
   - Add notes and meeting links
   - Track appointment status (pending, confirmed, completed, no-show)

### Messaging System

1. **Communication**:
   - Educators can send and receive messages with students
   - Support for text, file attachments, and media
   - Message read status tracking
   - Conversation history management

## 🔐 Authentication & Security

- JWT-based authentication with role-based access control
- Password hashing with bcrypt
- Protected routes for educators
- File upload validation and size limits
- Input sanitization and validation

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Interface**: Clean, intuitive design with TailwindCSS
- **Loading States**: Proper loading indicators and error handling
- **Toast Notifications**: Success/error feedback for user actions
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Deployment

### Environment Variables
Create `.env` file in server directory:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=4000
```

### Production Build
```bash
# Backend
cd server
npm run build

# Frontend
cd client
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.