const bcrypt=require('bcrypt');
const jwt = require('jsonwebtoken');

//no times to hash
const SALT_ROUNDS = 10

async function hashPassword(password) {
    try{
        const hashedPwd = await bcrypt.hash(password,SALT_ROUNDS);
        return hashedPwd;
    }
    catch(error){
        throw new Error('Error hashing password: '+error.message);
    }
}

async function comparePassword(password, hashedPassword) {
    try{

        const isMatch = await bcrypt.compare(password,hashedPassword);
        return isMatch;
    }
    catch(error){
        throw new Error('Error comparing password: '+error.message);
    }
}


function generateToken(payload){
    try{
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
        );
        return token;
    }
    catch(error){
        throw new Error('Error generating token: '+error.message);
    }
}

function verifyToken(token){
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch(error){
        throw new Error('Invalid or expired token: '+error.message);
    }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'No token provided',
      error: 'MISSING_TOKEN',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token',
      error: 'INVALID_TOKEN',
      timestamp: new Date().toISOString(),
    });
  }
};

// Middleware to authorize specific roles
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'No user information',
        error: 'UNAUTHORIZED',
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

// Middleware to authorize admin
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'No user information',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required',
      error: 'FORBIDDEN',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    authenticateToken,
    authorizeRole,
    authorizeAdmin
};