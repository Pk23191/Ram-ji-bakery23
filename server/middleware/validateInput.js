// Input validation and sanitization middleware
// No external dependencies - uses built-in JavaScript

// Basic HTML/script tag removal (prevent XSS)
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  // Remove HTML tags
  let sanitized = str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=
  
  // Trim and limit length
  return sanitized.trim().substring(0, 500);
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate price (must be positive number)
function isValidPrice(price) {
  const num = Number(price);
  return !isNaN(num) && num > 0 && num <= 999999;
}

// Validate discount (0-90%)
function isValidDiscount(discount) {
  const num = Number(discount);
  return !isNaN(num) && num >= 0 && num <= 90;
}

// Validate product name
function isValidProductName(name) {
  return typeof name === 'string' && name.trim().length >= 3 && name.trim().length <= 100;
}

// Middleware to validate product inputs
function validateProductInput(req, res, next) {
  try {
    const { name, price, discountPercent, category, description } = req.body;

    // Validate name
    if (name && !isValidProductName(name)) {
      return res.status(400).json({
        message: 'Product name must be 3-100 characters'
      });
    }

    // Validate price
    if (price && !isValidPrice(price)) {
      return res.status(400).json({
        message: 'Product price must be a positive number (1-999999)'
      });
    }

    // Validate discount
    if (discountPercent !== undefined && discountPercent !== '' && !isValidDiscount(discountPercent)) {
      return res.status(400).json({
        message: 'Discount must be between 0-90%'
      });
    }

    // Sanitize string fields
    if (name) req.body.name = sanitizeString(name);
    if (description) req.body.description = sanitizeString(description);
    if (category) req.body.category = sanitizeString(category);

    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid input format' });
  }
}

module.exports = {
  sanitizeString,
  isValidEmail,
  isValidPrice,
  isValidDiscount,
  isValidProductName,
  validateProductInput
};
