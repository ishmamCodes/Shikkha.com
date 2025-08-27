import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const BookFilter = ({ onFilterChange }) => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
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
      <h3 className="text-xl font-bold mb-4">Filter Books</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            name="search"
            id="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Title or author..."
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            id="category"
            value={filters.category}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All</option>
            <option value="textbook">Textbook</option>
            <option value="fiction">Fiction</option>
            <option value="non-fiction">Non-Fiction</option>
            <option value="reference">Reference</option>
          </select>
        </div>
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Sort By</label>
          <select
            name="sortBy"
            id="sortBy"
            value={filters.sortBy}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="title">Title</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="createdAt">Newest</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default BookFilter;
