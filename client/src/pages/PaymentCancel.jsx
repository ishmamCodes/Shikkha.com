import { Link } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/solid';

const PaymentCancel = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Payment Canceled
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your payment was canceled. No charges were made to your account.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Canceled
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Don't worry! You can try again anytime. Your cart items are still saved.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/courses"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            Continue Shopping
          </Link>
          
          <Link
            to="/dashboard/student"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? <Link to="/contact" className="text-blue-600 hover:text-blue-500">Contact our support team</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
