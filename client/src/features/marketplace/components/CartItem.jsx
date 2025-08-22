import React from 'react';
import { Link } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';

const CartItem = ({ item, onUpdateQuantity, onRemoveItem }) => {
  // Support both shapes: { book: {...} } and { bookId: {...} }
  const book = item.book || item.bookId;
  const quantity = item.quantity;
  const price = item.price ?? (book?.price ?? 0);

  if (!book) {
    // This can happen if a book is deleted but still in a user's cart.
    // Or if the `populate` on the backend fails.
    return (
      <div className="flex items-center justify-between p-4 border-b">
        <p className="text-red-500">This book is no longer available.</p>
        <button onClick={() => onRemoveItem(item._id)} className="text-gray-500 hover:text-red-600">
          <FaTrash />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center p-4 border-b last:border-b-0">
      <img
        src={(() => {
          const img = book.coverImage || book.thumbnailUrl || '';
          if (!img) return 'https://via.placeholder.com/100x150.png?text=Book';
          return img.startsWith('/') ? `http://localhost:4000${img}` : img;
        })()}
        alt={book.title}
        className="w-20 h-30 object-cover rounded-md mr-4"
        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/100x150.png?text=Book'; }}
      />
      <div className="flex-grow">
        <Link to={`/library/${book._id}`} className="font-semibold hover:text-blue-600">
          {book.title}
        </Link>
        <p className="text-sm text-gray-500">by {book.author}</p>
        <p className="text-lg font-bold text-blue-600 mt-1">${price.toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center border rounded-md">
          <button 
            onClick={() => onUpdateQuantity(item._id, quantity - 1)}
            className="px-3 py-1 text-lg" 
            disabled={quantity <= 1}
          > - </button>
          <span className="px-4 py-1">{quantity}</span>
          <button 
            onClick={() => onUpdateQuantity(item._id, quantity + 1)}
            className="px-3 py-1 text-lg"
          > + </button>
        </div>
        <button onClick={() => onRemoveItem(item._id)} className="text-gray-500 hover:text-red-600">
          <FaTrash size={20} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
