import Payment from '../models/Payment.js';
import BookPurchase from '../models/BookPurchase.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Book from '../models/Book.js';
import Student from '../models/Student.js';
import Educator from '../models/Educator.js';

// Get sales summary for admin dashboard
export const getSalesSummary = async (req, res) => {
  try {
    console.log(' Admin sales summary requested');
    
    // Get all completed payments
    const payments = await Payment.find({ status: 'completed' })
      .populate('studentId', 'name email')
      .populate({
        path: 'itemId',
        populate: {
          path: 'instructor',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    console.log(`Found ${payments.length} completed payments`);

    // Separate course and book payments (including cart payments)
    const coursePayments = payments.filter(p => p.type === 'course');
    const bookPayments = payments.filter(p => p.type === 'book' || p.type === 'cart');

    // Get detailed course sales
    const courseSales = await Promise.all(
      coursePayments.map(async (payment) => {
        const course = await Course.findById(payment.itemId).populate('instructor', 'name email');
        const enrollment = await Enrollment.findOne({ 
          studentId: payment.studentId._id, 
          courseId: payment.itemId 
        });

        return {
          _id: payment._id,
          courseName: course?.title || payment.metadata.courseName,
          educator: {
            name: course?.instructor?.name || payment.metadata.educatorName,
            email: course?.instructor?.email
          },
          student: {
            name: payment.studentId.name,
            email: payment.studentId.email
          },
          amount: payment.amount,
          educatorShare: payment.educatorShare,
          adminShare: payment.adminShare,
          enrollmentDate: enrollment?.createdAt || payment.createdAt,
          enrolledCount: course?.enrolledCount || 0,
          maxStudents: course?.maxStudents || 'Unlimited'
        };
      })
    );

    // Get detailed book sales (including cart purchases)
    const bookSales = [];
    
    for (const payment of bookPayments) {
      try {
        if (payment.type === 'cart') {
          // Handle cart purchases - get all book purchases for this cart payment
          const cartPurchases = await BookPurchase.find({ paymentId: payment._id }).populate('bookId');
          
          for (const purchase of cartPurchases) {
            bookSales.push({
              _id: `${payment._id}-${purchase._id}`,
              bookTitle: purchase.bookId?.title || 'Unknown Book',
              author: purchase.bookId?.author || 'Unknown Author',
              student: {
                name: payment.studentId?.name || 'Unknown Student',
                email: payment.studentId?.email || 'No Email'
              },
              amount: purchase.amount * purchase.quantity,
              quantity: purchase.quantity,
              status: purchase.status || 'confirmed',
              purchaseDate: payment.createdAt,
              shippingInfo: purchase.shippingInfo
            });
          }
        } else {
          // Handle individual book purchases
          const book = await Book.findById(payment.bookId || payment.itemId);
          const purchase = await BookPurchase.findOne({ paymentId: payment._id });

          bookSales.push({
            _id: payment._id,
            bookTitle: book?.title || payment.metadata?.bookTitle || 'Unknown Book',
            author: book?.author || 'Unknown Author',
            student: {
              name: payment.studentId?.name || 'Unknown Student',
              email: payment.studentId?.email || 'No Email'
            },
            amount: payment.amount,
            quantity: purchase?.quantity || 1,
            status: purchase?.status || 'confirmed',
            purchaseDate: payment.createdAt,
            shippingInfo: purchase?.shippingInfo
          });
        }
      } catch (error) {
        console.error('Error processing book sale:', error);
        // Continue processing other sales even if one fails
      }
    }

    // Calculate totals with proper revenue split
    const totalCourseRevenue = coursePayments.reduce((sum, p) => sum + p.amount, 0);
    const totalBookRevenue = bookPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Admin earnings: 40% from courses + 100% from books
    const adminCourseEarnings = coursePayments.reduce((sum, p) => sum + (p.adminShare || p.amount * 0.4), 0);
    const adminBookEarnings = totalBookRevenue; // 100% of book sales go to admin
    const totalAdminEarnings = adminCourseEarnings + adminBookEarnings;
    
    // Educator earnings: 60% from courses only
    const totalEducatorEarnings = coursePayments.reduce((sum, p) => sum + (p.educatorShare || p.amount * 0.6), 0);

    // Get additional stats
    const totalCoursesSold = coursePayments.length;
    const totalBooksSold = bookSales.reduce((sum, sale) => sum + sale.quantity, 0);

    res.json({
      success: true,
      data: {
        courseSales,
        bookSales,
        summary: {
          totalCourseRevenue,
          totalBookRevenue,
          totalRevenue: totalCourseRevenue + totalBookRevenue,
          totalAdminEarnings,
          totalEducatorEarnings,
          totalCoursesSold,
          totalBooksSold,
          totalTransactions: payments.length
        }
      }
    });
  } catch (error) {
    console.error('Sales summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales summary' });
  }
};

// Get educator earnings
export const getEducatorEarnings = async (req, res) => {
  try {
    const { educatorId } = req.params;

    // 1) Payments already tagged with metadata.educatorId (new flow)
    const taggedPayments = await Payment.find({
      'metadata.educatorId': educatorId,
      status: 'completed',
      type: 'course'
    })
      .populate('studentId', 'name email')
      .populate('itemId', 'title')
      .sort({ createdAt: -1 });

    // 2) Fallback: payments for courses where this educator is instructor (legacy flow)
    const educatorCourses = await Course.find({ instructor: educatorId }).select('_id title');
    const courseIds = educatorCourses.map(c => c._id);

    let fallbackPayments = [];
    if (courseIds.length) {
      fallbackPayments = await Payment.find({
        itemId: { $in: courseIds },
        status: 'completed',
        type: 'course'
      })
        .populate('studentId', 'name email')
        .populate('itemId', 'title')
        .sort({ createdAt: -1 });
    }

    // Merge without double counting (by _id)
    const seen = new Set(taggedPayments.map(p => p._id.toString()));
    const mergedPayments = [...taggedPayments];
    for (const p of fallbackPayments) {
      if (!seen.has(p._id.toString())) mergedPayments.push(p);
    }

    // Compute totals safely (fallback to 60% if educatorShare missing)
    const totalEarnings = mergedPayments.reduce((sum, p) => {
      const share = typeof p.educatorShare === 'number' && !isNaN(p.educatorShare)
        ? p.educatorShare
        : Math.round((p.amount * 0.6) * 100) / 100;
      return sum + share;
    }, 0);

    res.json({
      success: true,
      data: {
        payments: mergedPayments,
        totalEarnings,
        totalSales: mergedPayments.length
      }
    });
  } catch (error) {
    console.error('Educator earnings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch educator earnings' });
  }
};

// Get student purchases
export const getStudentPurchases = async (req, res) => {
  try {
    const { studentId } = req.params;

    const payments = await Payment.find({ 
      studentId,
      status: 'completed'
    })
    .populate('itemId')
    .sort({ createdAt: -1 });

    const coursePayments = payments.filter(p => p.type === 'course');
    const bookPayments = payments.filter(p => p.type === 'book');

    // Get book purchases with shipping info
    const bookPurchases = await BookPurchase.find({ 
      studentId,
      paymentId: { $in: bookPayments.map(p => p._id) }
    }).populate('bookId');

    res.json({
      success: true,
      data: {
        courses: coursePayments,
        books: bookPurchases,
        totalSpent: payments.reduce((sum, p) => sum + p.amount, 0)
      }
    });
  } catch (error) {
    console.error('Student purchases error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student purchases' });
  }
};
