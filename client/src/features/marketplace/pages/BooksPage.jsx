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
  const [initialLoad, setInitialLoad] = useState(true);
  const [purchasedBooks, setPurchasedBooks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch books
        const params = Object.fromEntries(searchParams.entries());
        const booksResponse = await studentApi.getBooks(params);
        if (booksResponse.success) {
          setBooks(booksResponse.books);
          setPagination(booksResponse.pagination);
        }

        // Fetch purchased books for logged-in students
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'student') {
          try {
            const purchasesResponse = await studentApi.getPurchases();
            if (purchasesResponse.success) {
              const purchasedBookIds = purchasesResponse.data.map(purchase => purchase.bookId);
              setPurchasedBooks(purchasedBookIds);
            }
          } catch (error) {
            console.error('Error fetching purchases:', error);
            // Don't show error toast for purchases as it's not critical
          }
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        toast.error('Failed to load books');
      } finally {
        setLoading(false);
        if (initialLoad) setInitialLoad(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Listen for purchase updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'lastPurchaseUpdate') {
        // Refresh purchased books when purchase is updated
        const fetchPurchases = async () => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'student') {
              const purchasesResponse = await studentApi.getPurchases();
              if (purchasesResponse.success) {
                const purchasedBookIds = purchasesResponse.data.map(purchase => purchase.bookId);
                setPurchasedBooks(purchasedBookIds);
                console.log('Refreshed purchased book IDs:', purchasedBookIds);
              }
            }
          } catch (error) {
            console.error('Error refreshing purchases:', error);
          }
        };
        fetchPurchases();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Book Library</h1>
          <p className="text-xl text-white/80">Discover amazing books and resources for your studies</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4">
            <BookFilter onFilterChange={handleFilterChange} />
          </div>

          <div className="w-full md:w-3/4">
            {loading && initialLoad ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <BookCard.Skeleton key={i} />)}
              </div>
            ) : books.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {books.map(book => (
                    <BookCard 
                      key={book._id} 
                      book={book} 
                      isPurchased={purchasedBooks.includes(book._id)}
                    />
                  ))}
                </div>
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-2xl font-bold text-white mb-2">No Books Found</h2>
                <p className="text-white/70">Try adjusting your filters or check back later</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BooksPage;
