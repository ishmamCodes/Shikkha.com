const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Upload material
export const uploadMaterial = async (formData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/materials/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload material');
  }
  
  return await response.json();
};

// Get educator materials
export const getEducatorMaterials = async (courseId = null) => {
  const token = localStorage.getItem('token');
  const url = courseId 
    ? `${API_BASE_URL}/api/materials/educator?courseId=${courseId}`
    : `${API_BASE_URL}/api/materials/educator`;
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch materials');
  }
  
  return await response.json();
};

// Get course materials (for students)
export const getCourseMaterials = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/materials/course/${courseId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch course materials');
  }
  
  return await response.json();
};

// Download material
export const downloadMaterial = async (materialId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/materials/download/${materialId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to download material');
  }
  
  return response; // Return response for blob handling
};

// Update material
export const updateMaterial = async (materialId, updateData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/materials/${materialId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update material');
  }
  
  return await response.json();
};

// Delete material
export const deleteMaterial = async (materialId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/materials/${materialId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete material');
  }
  
  return await response.json();
};
