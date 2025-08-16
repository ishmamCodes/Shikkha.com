import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import studentApi from '../../student/services/studentApi';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaInfoCircle, FaTag } from 'react-icons/fa';

const BookDetailsPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const response = await studentApi.getBookById(id);
        if (response.success) {
          setBook(response.book);
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        console.error('Error fetching book:', error);
        toast.error('Failed to load book details');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const response = await studentApi.addToCart(book._id, 1);
      if (response.success) {
        toast.success('Added to cart!');
      } else {
        toast.error(response.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Book Not Found</h2>
        <Link to="/library" className="text-blue-600 mt-4 inline-block">Back to Library</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8 md:flex gap-8">
          <div className="md:w-1/3 mb-8 md:mb-0">
            <img 
              src={book.coverImage || 'https://via.placeholder.com/300x450.png?text=Book+Cover'}
              alt={book.title}
              className="w-full h-auto object-cover rounded-lg shadow-md"
            />
          </div>
          <div className="md:w-2/3">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{book.title}</h1>
            <p className="text-lg text-gray-600 mb-4">by {book.author}</p>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">{book.category}</span>
              <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full">ISBN: {book.isbn}</span>
            </div>

            <p className="text-gray-700 mb-6">{book.description}</p>

            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-3xl font-bold text-blue-600">${book.price.toFixed(2)}</span>
              {book.stock > 0 ? (
                <span className="text-green-600 font-semibold">In Stock</span>
              ) : (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              )}
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={addingToCart || book.stock === 0}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              <FaShoppingCart />
              <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
            </button>

            {book.stock > 0 && book.stock < 10 && (
              <div className="flex items-center gap-2 mt-4 text-sm text-yellow-600">
                <FaInfoCircle />
                <span>Only {book.stock} left in stock - order soon.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsPage;
