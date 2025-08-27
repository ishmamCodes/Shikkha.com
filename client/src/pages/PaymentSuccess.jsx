import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId) {
      const handlePaymentSuccess = async () => {
        // Get payment type from URL params or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const paymentType = urlParams.get('type') || localStorage.getItem('lastPaymentType') || 'course';
        
        // Show appropriate success message
        if (paymentType === 'book' || paymentType === 'cart') {
          toast.success('🎉 Payment successful! Your book purchase is confirmed.');
        } else {
          toast.success('🎉 Payment successful! You are now enrolled in the course.');
        }
        
        // Set payment details
        setPaymentDetails({
          sessionId,
          timestamp: new Date().toLocaleString(),
          type: paymentType === 'book' || paymentType === 'cart' ? 'Book Purchase' : 'Course Enrollment'
        });

        // Trigger manual webhook processing to ensure enrollment is created
        try {
          const token = localStorage.getItem('token');
          if (token) {
            // First, trigger manual webhook processing
            console.log('🔄 Triggering manual webhook for session:', sessionId);
            const webhookResponse = await fetch('http://localhost:4000/api/payments/trigger-webhook', {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ sessionId })
            });
            
            if (webhookResponse.ok) {
              const webhookData = await webhookResponse.json();
              console.log('✅ Manual webhook processed:', webhookData);
            } else {
              console.warn('⚠️ Manual webhook failed:', await webhookResponse.text());
            }

            // Wait a moment for processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (paymentType === 'book' || paymentType === 'cart') {
              // Refresh purchases data
              const response = await fetch('http://localhost:4000/api/students/purchases', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                const data = await response.json();
                console.log('Updated purchases:', data.data);
                // Update localStorage to trigger UI refresh
                localStorage.setItem('lastPurchaseUpdate', Date.now().toString());
              }
            } else {
              // Refresh enrolled courses data
              const response = await fetch('http://localhost:4000/api/students/enrolled-courses', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                const data = await response.json();
                console.log('Updated enrolled courses:', data.data);
                // Update localStorage to trigger UI refresh
                localStorage.setItem('lastEnrollmentUpdate', Date.now().toString());
              }
            }
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
        
        // Auto-redirect based on purchase type
        const redirectTimer = setTimeout(() => {
          if (paymentType === 'book' || paymentType === 'cart') {
            navigate('/dashboard/student/books');
          } else {
            navigate('/courses'); // Redirect to courses page to see enrollment status
          }
        }, 3000);

        setLoading(false);
        
        return () => clearTimeout(redirectTimer);
      };

      handlePaymentSuccess();
    } else {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {paymentDetails?.type === 'Book Purchase' ? 'Book Purchase Successful!' : 'Course Enrollment Successful!'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {paymentDetails?.type === 'Book Purchase' 
              ? 'Your payment has been processed and your book order is confirmed.'
              : 'Your payment has been processed and you are now enrolled in the course.'
            }
          </p>
          <p className="mt-1 text-xs text-blue-600">
            {paymentDetails?.type === 'Book Purchase' 
              ? 'Redirecting to My Books page in 3 seconds...'
              : 'Redirecting to courses page in 3 seconds...'
            }
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Type</span>
              <span className="text-sm text-gray-900">
                {paymentDetails?.type || 'Course Enrollment'}
              </span>
            </div>
            
            {paymentDetails?.sessionId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Transaction ID</span>
                <span className="text-sm text-gray-900 font-mono">
                  {paymentDetails.sessionId.slice(-8)}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Date</span>
              <span className="text-sm text-gray-900">
                {paymentDetails?.timestamp}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/dashboard/student"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            Go to Dashboard
          </Link>
          
          <Link
            to="/courses"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            Browse More Courses
          </Link>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            You will receive a confirmation email shortly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
