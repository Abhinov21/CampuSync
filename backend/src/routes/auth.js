const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword, generateToken, verifyToken } = require('../utils/auth');

const router = express.Router();
const prisma = new PrismaClient();

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

// POST /auth/register - Create new user account
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, name, rollNumber, employeeId, department, year } = req.body;

    // Validate required fields
    if (!email || !password || !role || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: email, password, role, name',
        error: 'MISSING_FIELDS',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists',
        error: 'DUPLICATE_EMAIL',
        timestamp: new Date().toISOString(),
      });
    }

    // Role-specific validation
    if (role === 'STUDENT') {
      if (!rollNumber || !department || !year) {
        return res.status(400).json({
          status: 'error',
          message: 'Students require: rollNumber, department, year',
          error: 'MISSING_STUDENT_FIELDS',
          timestamp: new Date().toISOString(),
        });
      }
    } else if (role === 'PROFESSOR') {
      if (!employeeId || !department) {
        return res.status(400).json({
          status: 'error',
          message: 'Professors require: employeeId, department',
          error: 'MISSING_PROFESSOR_FIELDS',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Convert year to integer for STUDENT role
    let yearInt = null;
    if (role === 'STUDENT' && year) {
      yearInt = parseInt(year, 10);
      if (isNaN(yearInt)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid year value. Must be a number.',
          error: 'INVALID_YEAR',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Create user and profile in transaction
    let user, profile;

    if (role === 'STUDENT') {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'STUDENT',
        },
      });

      profile = await prisma.student.create({
        data: {
          userId: user.id,
          name,
          rollNumber,
          department,
          year: yearInt,
        },
      });
    } else if (role === 'PROFESSOR') {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'PROFESSOR',
        },
      });

      profile = await prisma.professor.create({
        data: {
          userId: user.id,
          name,
          employeeId,
          department,
        },
      });
    } else if (role === 'ADMIN') {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      profile = await prisma.admin.create({
        data: {
          userId: user.id,
          name,
        },
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: profile || null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /auth/login - Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password required',
        error: 'MISSING_CREDENTIALS',
        timestamp: new Date().toISOString(),
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Fetch user profile based on role
    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await prisma.student.findUnique({
        where: { userId: user.id },
      });
    } else if (user.role === 'PROFESSOR') {
      profile = await prisma.professor.findUnique({
        where: { userId: user.id },
      });
    } else if (user.role === 'ADMIN') {
      profile = await prisma.admin.findUnique({
        where: { userId: user.id },
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: profile || null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /auth/me - Get current user info (requires token)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        error: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch profile
    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await prisma.student.findUnique({
        where: { userId: user.id },
      });
    } else if (user.role === 'PROFESSOR') {
      profile = await prisma.professor.findUnique({
        where: { userId: user.id },
      });
    } else if (user.role === 'ADMIN') {
      profile = await prisma.admin.findUnique({
        where: { userId: user.id },
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'User retrieved',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: profile || null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;