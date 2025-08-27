import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaEye, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { createCheckoutSession } from '../../../api/checkoutApi';
import ShippingForm from '../../../components/ShippingForm';

const BookCard = ({ book, isPurchased = false }) => {
  const [purchasing, setPurchasing] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);

  const handleAddToCart = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'student') {
      toast.error('Please log in as a student to add books to cart');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/marketplace/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookId: book._id,
          quantity: 1
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Book added to cart!');
      } else {
        toast.error(data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = () => {
    const stored = localStorage.getItem('user');
    const authUser = stored ? JSON.parse(stored) : null;
    if (!authUser || authUser.role !== 'student') {
      toast.error('Please log in as a student to purchase books');
      return;
    }
    setShowShippingForm(true);
  };

  const handleShippingSubmit = async (shippingInfo) => {
    const stored = localStorage.getItem('user');
    const authUser = stored ? JSON.parse(stored) : null;
    const studentId = authUser?._id || authUser?.id;
    if (!studentId) {
      toast.error('Unable to determine student account. Please re-login.');
      return;
    }

    setPurchasing(true);
    try {
      localStorage.setItem('lastPaymentType', 'book');
      const response = await createCheckoutSession('book', book._id, studentId, shippingInfo);
      if (response.success && response.url) {
        window.location.href = response.url;
      } else {
        toast.error(response.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout session creation error:', error);
      const errorMessage = error?.message || 'Failed to start checkout';
      toast.error(error.response?.data?.message || errorMessage);
    } finally {
      setPurchasing(false);
      setShowShippingForm(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
        <div className="relative">
          <img 
            src={book.coverImage ? (book.coverImage.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL}${book.coverImage}` : book.coverImage) : 'https://via.placeholder.com/300x450.png?text=Book+Cover'}
            alt={book.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x450.png?text=Book+Cover';
            }}
          />
          {!book.inStock && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
              Out of Stock
            </div>
          )}
          {isPurchased && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <FaCheckCircle className="text-xs" />
              Purchased
            </div>
          )}
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-md font-bold text-gray-900 mb-1 flex-grow">{book.title}</h3>
          <p className="text-sm text-gray-600 mb-1">{book.author}</p>
          <p className="text-xs text-gray-500 mb-3">{book.category}</p>
          <div className="flex justify-between items-center mt-auto">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-blue-600">৳{book.price.toFixed(2)}</span>
              <span className="text-xs text-gray-500">
                {book.stockQuantity > 0 ? `${book.stockQuantity} in stock` : 'Out of stock'}
              </span>
            </div>
            <div className="flex gap-2">
              <Link 
                to={`/library/${book._id}`}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
                title="View Details"
              >
                <FaEye />
              </Link>
              {isPurchased ? (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium flex items-center gap-1">
                  <FaCheckCircle className="text-xs" />
                  Owned
                </div>
              ) : (
                <>
                  <button
                    onClick={handleBuyNow}
                    disabled={!book.inStock || book.stockQuantity === 0 || purchasing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title={book.inStock && book.stockQuantity > 0 ? "Buy with Stripe" : "Out of Stock"}
                  >
                    {purchasing ? 'Processing...' : 'Buy Now'}
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={!book.inStock || book.stockQuantity === 0}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={book.inStock && book.stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
                  >
                    <FaShoppingCart />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shipping modal */}
      {showShippingForm && (
        <ShippingForm
          onSubmit={handleShippingSubmit}
          onClose={() => setShowShippingForm(false)}
          loading={purchasing}
          title={`Shipping for: ${book.title}`}
          items={[{ title: book.title, price: book.price, quantity: 1 }]}
        />
      )}
    </>
  );
};

BookCard.Skeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="w-full h-48 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  </div>
);

export default BookCard;
