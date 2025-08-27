import React, { useState, useEffect } from 'react';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import studentApi from '../../student/services/studentApi';
import ShippingForm from '../../../components/ShippingForm';
import CartItem from '../components/CartItem';
import { FaShoppingCart, FaCreditCard } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const API_BASE_URL = 'https://shikkha-com.onrender.com';

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Check if user is a student
      if (user.role !== 'student') {
        toast.error('Only students can access the cart');
        setLoading(false);
        return;
      }
      
      // Use absolute API base to avoid proxy-related ERR_NETWORK
      const response = await axios.get(`${API_BASE_URL}/api/marketplace/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const newCart = response.data.cart;
        setCart(newCart);

        // After loading cart, remove items that the user already purchased
        try {
          const purchasesResp = await studentApi.getPurchases();
          const purchasedIds = new Set(
            (purchasesResp?.data || []).map(p => p.book?._id).filter(Boolean)
          );

          const itemsToRemove = (newCart.items || []).filter(it => purchasedIds.has(it.bookId?._id));
          if (itemsToRemove.length > 0) {
            const token2 = localStorage.getItem('token');
            // Optimistically update UI first
            const remaining = newCart.items.filter(it => !purchasedIds.has(it.bookId?._id));
            setCart({ ...newCart, items: remaining, totalAmount: remaining.reduce((s, it) => s + (it.bookId?.price || 0) * it.quantity, 0) });
            // Fire-and-forget deletes
            itemsToRemove.forEach(async (it) => {
              try {
                await axios.delete(`${API_BASE_URL}/api/marketplace/cart/items/${it._id}` , {
                  headers: { 'Authorization': `Bearer ${token2}`, 'Content-Type': 'application/json' }
                });
              } catch (_) { /* ignore */ }
            });
          }
        } catch (e) {
          // If purchases call fails, ignore and keep cart
          console.warn('Skip purchased removal, purchases fetch failed:', e?.message || e);
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/api/marketplace/cart/items/${itemId}`, 
        { quantity },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.success) {
        setCart(response.data.cart);
        toast.success('Cart updated');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/api/marketplace/cart/items/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setCart(response.data.cart);
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'student') {
      toast.error('Please log in as a student to proceed with checkout');
      return;
    }
    setShowShippingForm(true);
  };

  const handleShippingSubmit = async (shippingInfo) => {
    setCheckingOut(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const studentId = user?._id || user?.id;
      
      if (!studentId) {
        toast.error('Please log in to proceed with checkout');
        return;
      }

      // Store shipping info for later use
      localStorage.setItem('cart_shipping_info', JSON.stringify(shippingInfo));

      // Create Stripe checkout session for multiple books
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/payments/create-checkout-session`, {
        type: 'cart',
        studentId: studentId,
        shippingInfo: shippingInfo
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Invalid request. Please check your cart.');
      } else {
        toast.error('An error occurred during checkout.');
      }
    } finally {
      setCheckingOut(false);
      setShowShippingForm(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-4xl font-bold text-white mb-4">Your Cart is Empty</h2>
            <p className="text-xl text-white/80 mt-2">Looks like you haven't added any books yet</p>
            <Link to="/library" className="mt-8 inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              Browse Books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Shopping Cart</h1>
          <p className="text-xl text-white/80">Review your selected books</p>
        </div>
        <div className="lg:flex gap-8">
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-md">
              {cart.items.map(item => (
                <CartItem 
                  key={item._id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>
          </div>
          <div className="lg:w-1/3 mt-8 lg:mt-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${cart.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t my-4"></div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${cart.totalAmount.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FaCreditCard className="mr-2" />
                {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showShippingForm && (
        <ShippingForm
          title="Cart Checkout - Shipping Information"
          items={cart.items.map(item => ({
            title: item.bookId.title,
            price: item.bookId.price,
            quantity: item.quantity
          }))}
          onSubmit={handleShippingSubmit}
          onClose={() => setShowShippingForm(false)}
          loading={checkingOut}
        />
      )}
    </div>
  );
};

export default CartPage;
