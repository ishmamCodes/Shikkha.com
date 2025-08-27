const API_BASE_URL = 'https://shikkha-com.onrender.com';

// Get available exams for a student (based on enrolled courses)
export const getAvailableExams = async (studentId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/exams?studentId=${studentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch exams');
  }
  
  return response.json();
};

// Get exam by ID for attempt page
export const getExamById = async (examId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/exams/${examId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch exam');
  }
  
  return response.json();
};

// Submit exam answers
export const submitExam = async (examData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/exams/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(examData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit exam');
  }
  
  return response.json();
};

// Get student grades
export const getStudentGrades = async (studentId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/students/${studentId}/grades`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch grades');
  }
  
  return response.json();
};
