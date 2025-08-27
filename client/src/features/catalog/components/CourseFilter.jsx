import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const CourseFilter = ({ onFilterChange }) => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    level: searchParams.get('level') || '',
    sortBy: searchParams.get('sortBy') || 'title',
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      onFilterChange(cleanFilters);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [filters, onFilterChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Filter Courses</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            name="search"
            id="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Course title..."
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            id="category"
            value={filters.category}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          >
            <option value="">All</option>
            <option value="technology">Technology</option>
            <option value="business">Business</option>
            <option value="arts">Arts</option>
            <option value="health">Health</option>
          </select>
        </div>
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700">Level</label>
          <select
            name="level"
            id="level"
            value={filters.level}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          >
            <option value="">All</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Sort By</label>
          <select
            name="sortBy"
            id="sortBy"
            value={filters.sortBy}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          >
            <option value="title">Title</option>
            <option value="createdAt">Newest</option>
            <option value="enrollmentCount">Popularity</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CourseFilter;
