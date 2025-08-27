const API_BASE_URL = 'https://shikkha-com.onrender.com';

// Get completed courses for evaluation
export const getCompletedCourses = async (studentId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/completed-courses`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch completed courses');
  }
  
  return response.json();
};

// Submit evaluation
export const submitEvaluation = async (evaluationData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/evaluations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(evaluationData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit evaluation');
  }
  
  return response.json();
};

// Get instructor evaluations summary (for displaying ratings)
export const getInstructorEvaluationsSummary = async (instructorId) => {
  const response = await fetch(`${API_BASE_URL}/instructors/${instructorId}/evaluations-summary`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch instructor evaluations');
  }
  
  return response.json();
};
