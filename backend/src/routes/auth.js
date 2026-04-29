/**
 * Authentication Routes
 * POST /auth/login - User login
 * POST /auth/register - User registration
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

/**
 * POST /auth/login
 * Login user with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
        error: 'MISSING_FIELDS',
        timestamp: new Date().toISOString(),
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        professor: true,
        admin: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString(),
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
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

    // Build user response based on role
    let userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    if (user.student) {
      userResponse = {
        ...userResponse,
        name: user.student.name,
        rollNumber: user.student.rollNumber,
        department: user.student.department,
        year: user.student.year,
      };
    } else if (user.professor) {
      userResponse = {
        ...userResponse,
        name: user.professor.name,
        employeeId: user.professor.employeeId,
        department: user.professor.department,
      };
    } else if (user.admin) {
      userResponse = {
        ...userResponse,
        name: user.admin.name,
      };
    }

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: userResponse,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /auth/login:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /auth/register
 * Register new user (student, professor, or admin)
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role,
      department,
      rollNumber,
      year,
      employeeId,
    } = req.body;

    // Validate input
    if (!email || !password || !name || !role || !department) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, name, role, and department are required',
        error: 'MISSING_FIELDS',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate role
    if (!['STUDENT', 'PROFESSOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be STUDENT, PROFESSOR, or ADMIN',
        error: 'INVALID_ROLE',
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
        error: 'USER_EXISTS',
        timestamp: new Date().toISOString(),
      });
    }

    // Role-specific validation
    if (role === 'STUDENT') {
      if (!rollNumber || !year) {
        return res.status(400).json({
          status: 'error',
          message: 'Roll number and year are required for students',
          error: 'MISSING_FIELDS',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if roll number already exists
      const existingStudent = await prisma.student.findUnique({
        where: { rollNumber },
      });

      if (existingStudent) {
        return res.status(409).json({
          status: 'error',
          message: 'Roll number already registered',
          error: 'ROLL_NUMBER_EXISTS',
          timestamp: new Date().toISOString(),
        });
      }
    } else if (role === 'PROFESSOR') {
      if (!employeeId) {
        return res.status(400).json({
          status: 'error',
          message: 'Employee ID is required for professors',
          error: 'MISSING_FIELDS',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if employee ID already exists
      const existingProfessor = await prisma.professor.findUnique({
        where: { employeeId },
      });

      if (existingProfessor) {
        return res.status(409).json({
          status: 'error',
          message: 'Employee ID already registered',
          error: 'EMPLOYEE_ID_EXISTS',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and role-specific profile in transaction
    let userResponse;

    if (role === 'STUDENT') {
      const result = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          student: {
            create: {
              name,
              rollNumber,
              department,
              year: parseInt(year),
            },
          },
        },
        include: {
          student: true,
        },
      });

      userResponse = {
        id: result.id,
        email: result.email,
        role: result.role,
        name: result.student.name,
        rollNumber: result.student.rollNumber,
        department: result.student.department,
        year: result.student.year,
      };
    } else if (role === 'PROFESSOR') {
      const result = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          professor: {
            create: {
              name,
              employeeId,
              department,
            },
          },
        },
        include: {
          professor: true,
        },
      });

      userResponse = {
        id: result.id,
        email: result.email,
        role: result.role,
        name: result.professor.name,
        employeeId: result.professor.employeeId,
        department: result.professor.department,
      };
    } else if (role === 'ADMIN') {
      const result = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          admin: {
            create: {
              name,
            },
          },
        },
        include: {
          admin: true,
        },
      });

      userResponse = {
        id: result.id,
        email: result.email,
        role: result.role,
        name: result.admin.name,
      };
    }

    // Generate token
    const token = generateToken({
      userId: userResponse.id,
      email: userResponse.email,
      role: userResponse.role,
    });

    console.log(`✅ New user registered: ${email} (${role})`);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        token,
        user: userResponse,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /auth/register:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
