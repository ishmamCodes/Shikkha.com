import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import paymentApi from '../api/paymentApi';
import { toast } from 'react-hot-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      handlePaymentSuccess(sessionId);
    } else {
      setProcessing(false);
      toast.error('Invalid payment session');
      navigate('/');
    }
  }, [searchParams, navigate]);

  const handlePaymentSuccess = async (sessionId) => {
    try {
      const response = await paymentApi.handlePaymentSuccess(sessionId);
      if (response.success) {
        setSuccess(true);
        toast.success('Payment processed successfully!');
        // If the last payment was a book purchase, trigger MyBooks refresh and redirect there
        try {
          const lastType = localStorage.getItem('lastPaymentType');
          if (lastType === 'book') {
            localStorage.setItem('triggerMyBooksRefresh', String(Date.now()));
            // small delay to show success state briefly
            setTimeout(() => navigate('/dashboard/student/books'), 600);
            return;
          }
        } catch (_) {}
      } else {
        toast.error('Payment verification failed');
        navigate('/');
      }
    } catch (error) {
      console.error('Payment success error:', error);
      toast.error('Failed to process payment');
      navigate('/');
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. You should receive a confirmation email shortly.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              try {
                const lastType = localStorage.getItem('lastPaymentType');
                if (lastType === 'book') {
                  localStorage.setItem('triggerMyBooksRefresh', String(Date.now()));
                  navigate('/dashboard/student/books');
                  return;
                }
              } catch (_) {}
              navigate('/dashboard/student');
            }}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
