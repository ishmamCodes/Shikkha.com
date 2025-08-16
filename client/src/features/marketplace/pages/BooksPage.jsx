import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import studentApi from '../../student/services/studentApi';
import toast from 'react-hot-toast';
import BookCard from '../components/BookCard';
import BookFilter from '../components/BookFilter';
import Pagination from '../../catalog/components/Pagination'; // Reusing pagination component

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params = Object.fromEntries(searchParams.entries());
        const response = await studentApi.getBooks(params);
        if (response.success) {
          setBooks(response.books);
          setPagination(response.pagination);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        toast.error('Failed to load books');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [searchParams]);

  const handleFilterChange = (filters) => {
    setSearchParams(filters);
  };

  const handlePageChange = (page) => {
    setSearchParams(prev => {
      prev.set('page', page);
      return prev;
    });
  };

  return (
    <div className="bg-purple-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-purple-800 text-white p-6 rounded-lg mb-8">
          <h1 className="text-3xl font-bold">Book Library</h1>
          <p className="mt-2 text-purple-200">Find the resources you need for your studies.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4">
            <BookFilter onFilterChange={handleFilterChange} />
          </div>

          <div className="w-full md:w-3/4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <BookCard.Skeleton key={i} />)}
              </div>
            ) : books.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {books.map(book => (
                    <BookCard key={book._id} book={book} />
                  ))}
                </div>
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold">No Books Found</h2>
                <p className="text-gray-600 mt-2">Try adjusting your filters or check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BooksPage;
