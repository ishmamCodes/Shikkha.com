import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';

const BookCard = ({ book }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
      <Link to={`/library/${book._id}`} className="block">
        <img 
          src={book.coverImage || 'https://via.placeholder.com/300x450.png?text=Book+Cover'}
          alt={book.title}
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-md font-bold text-gray-900 mb-1 flex-grow">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-3">{book.author}</p>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-lg font-bold text-blue-600">${book.price.toFixed(2)}</span>
          <Link 
            to={`/library/${book._id}`}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
             <FaShoppingCart />
          </Link>
        </div>
      </div>
    </div>
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
