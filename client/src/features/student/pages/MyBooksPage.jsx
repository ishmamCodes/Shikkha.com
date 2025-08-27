import React, { useState, useEffect, useRef } from 'react';
import { FaBook, FaTruck, FaCheckCircle, FaClock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import studentApi from '../services/studentApi';

const MyBooksPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);
  const pollingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchMyBooks();

    // If coming from payment success, a flag will be present in localStorage.
    // Trigger immediate refresh and start short polling to reflect newly created purchase.
    try {
      const flag = localStorage.getItem('triggerMyBooksRefresh');
      if (flag) {
        const ts = Number(flag);
        const within2min = !Number.isNaN(ts) && Date.now() - ts < 2 * 60 * 1000;
        if (within2min) {
          startShortPolling();
        }
        // Clear flag after handling
        localStorage.removeItem('triggerMyBooksRefresh');
      }
    } catch (_) {}

    // Listen for cross-tab updates
    const onStorage = (e) => {
      if (e.key === 'triggerMyBooksRefresh' && e.newValue) {
        startShortPolling();
        try { localStorage.removeItem('triggerMyBooksRefresh'); } catch (_) {}
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      stopShortPolling();
    };
  }, []);

  const startShortPolling = () => {
    // Avoid duplicate intervals
    stopShortPolling();
    // Immediate fetch
    fetchMyBooks(true);
    // Poll every 5s for up to 60s or until we have at least 1 recent purchase
    pollingRef.current = setInterval(() => {
      fetchMyBooks(true);
    }, 5000);
    pollingTimeoutRef.current = setTimeout(() => {
      stopShortPolling();
    }, 60000);
  };

  const stopShortPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };

  const fetchMyBooks = async (silent = false) => {
    try {
      // Try multiple ways to get student ID
      let studentId = localStorage.getItem('studentId');
      
      if (!studentId) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        studentId = user._id || user.id;
      }
      
      if (!studentId) {
        toast.error('Please log in to view your books');
        return;
      }

      if (!silent) console.log('Fetching books for student ID:', studentId);
      const response = await studentApi.getPurchases();
      if (response.success) {
        if (!silent) console.log('Books response:', response.data);
        // If we get purchases, we can stop polling
        if ((response.data || []).length > 0) {
          stopShortPolling();
        }
        setPurchases(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load your books');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <FaCheckCircle className="text-green-500" />;
      case 'shipped':
        return <FaTruck className="text-blue-500" />;
      case 'delivered':
        return <FaCheckCircle className="text-purple-500" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded-lg h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Books</h1>
          <p className="text-white/80">Track your book purchases and delivery status</p>
        </div>

        {purchases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <FaBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Books Yet</h2>
            <p className="text-gray-600 mb-4">You haven't purchased any books yet.</p>
            <a
              href="/library"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaBook className="mr-2" />
              Browse Books
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {purchases.map((purchase) => (
              <div key={purchase._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {purchase.title || 'Unknown Book'}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        by {purchase.author || 'Unknown Author'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Quantity: {purchase.quantity}</span>
                        <span>•</span>
                        <span>Total: ৳{purchase.price?.toFixed(2)}</span>
                        <span>•</span>
                        <span>Ordered: {new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(purchase.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchase.status)}`}>
                        {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {purchase.shippingInfo && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Shipping Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Name:</strong> {purchase.shippingInfo.name}</p>
                          <p><strong>Email:</strong> {purchase.shippingInfo.email}</p>
                          <p><strong>Phone:</strong> {purchase.shippingInfo.phone}</p>
                        </div>
                        <div>
                          <p><strong>Address:</strong> {purchase.shippingInfo.address}</p>
                          <p><strong>City:</strong> {purchase.shippingInfo.city}</p>
                          <p><strong>Country:</strong> {purchase.shippingInfo.country}</p>
                          {purchase.shippingInfo.postalCode && (
                            <p><strong>Postal Code:</strong> {purchase.shippingInfo.postalCode}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {purchase.trackingNumber && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm text-gray-600">
                        <strong>Tracking Number:</strong> {purchase.trackingNumber}
                      </p>
                    </div>
                  )}

                  {purchase.deliveryDate && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm text-gray-600">
                        <strong>Delivered:</strong> {new Date(purchase.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooksPage;
