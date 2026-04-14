/**
 * Courses Routes
 * GET /api/courses - Get enrolled courses (Student)
 * GET /api/courses/my-courses - Get taught courses (Professor)
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = require('../utils/auth').authenticateToken;
const authorizeRole = require('../utils/auth').authorizeRole;

/**
 * GET /api/courses
 * Get courses for logged-in user (Student/Professor)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let courses = [];

    if (role === 'STUDENT') {
      // Get enrolled courses
      const student = await prisma.student.findUnique({
        where: { userId },
      });

      if (!student) {
        return res.status(404).json({
          status: 'error',
          message: 'Student profile not found',
          error: 'STUDENT_NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id },
        include: {
          course: { include: { professor: { include: { user: true } } } },
        },
      });

      // Calculate attendance for each course
      courses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const totalSessions = await prisma.session.count({
            where: { courseId: enrollment.courseId },
          });

          const attendedSessions = await prisma.attendanceSession.count({
            where: {
              studentId: student.id,
              session: { courseId: enrollment.courseId },
              sessionStatus: 'ENDED',
            },
          });

          const attendancePercentage =
            totalSessions > 0
              ? Math.round((attendedSessions / totalSessions) * 100 * 100) / 100
              : 0;

          return {
            id: enrollment.courseId,
            code: enrollment.course.code,
            name: enrollment.course.name,
            credits: enrollment.course.credits,
            semester: enrollment.course.semester,
            professor: {
              id: enrollment.course.professor.id,
              name: enrollment.course.professor.user.email.split('@')[0],
            },
            enrollmentStatus: 'ACTIVE',
            totalSessions,
            attendedSessions,
            attendancePercentage,
          };
        })
      );
    } else if (role === 'PROFESSOR') {
      // Get taught courses
      const professor = await prisma.professor.findUnique({
        where: { userId },
      });

      if (!professor) {
        return res.status(404).json({
          status: 'error',
          message: 'Professor profile not found',
          error: 'PROFESSOR_NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
      }

      const taughtCourses = await prisma.course.findMany({
        where: { professorId: professor.id },
      });

      courses = await Promise.all(
        taughtCourses.map(async (course) => {
          const enrolledStudents = await prisma.enrollment.count({
            where: { courseId: course.id },
          });

          const totalSessions = await prisma.session.count({
            where: { courseId: course.id },
          });

          return {
            id: course.id,
            code: course.code,
            name: course.name,
            credits: course.credits,
            semester: course.semester,
            enrolledStudents,
            totalSessions,
          };
        })
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Courses fetched',
      data: {
        courses,
        total: courses.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /courses:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch courses',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/courses/my-courses
 * Get taught courses for professor (Deprecated in favor of GET /courses)
 */
router.get('/my-courses', authenticateToken, authorizeRole(['PROFESSOR']), async (req, res) => {
  try {
    const userId = req.user.userId;

    const professor = await prisma.professor.findUnique({
      where: { userId },
    });

    if (!professor) {
      return res.status(404).json({
        status: 'error',
        message: 'Professor profile not found',
        error: 'PROFESSOR_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    const courses = await prisma.course.findMany({
      where: { professorId: professor.id },
    });

    const formattedCourses = await Promise.all(
      courses.map(async (course) => {
        const enrolledStudents = await prisma.enrollment.count({
          where: { courseId: course.id },
        });

        const totalSessions = await prisma.session.count({
          where: { courseId: course.id },
        });

        return {
          id: course.id,
          code: course.code,
          name: course.name,
          credits: course.credits,
          semester: course.semester,
          enrolledStudents,
          totalSessions,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      message: 'Courses fetched',
      data: {
        courses: formattedCourses,
        total: formattedCourses.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /courses/my-courses:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch courses',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/courses
 * Create a new course (Professor only)
 */
router.post('/', authenticateToken, authorizeRole(['PROFESSOR']), async (req, res) => {
  try {
    const { name, code, description, credits, semester } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!name || !code) {
      return res.status(400).json({
        status: 'error',
        message: 'Course name and code are required',
        error: 'MISSING_FIELDS',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify professor exists
    const professor = await prisma.professor.findUnique({
      where: { userId },
    });

    if (!professor) {
      return res.status(404).json({
        status: 'error',
        message: 'Professor profile not found',
        error: 'PROFESSOR_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if course code already exists for this professor
    const existingCourse = await prisma.course.findFirst({
      where: {
        code,
        professorId: professor.id,
      },
    });

    if (existingCourse) {
      return res.status(409).json({
        status: 'error',
        message: 'Course with this code already exists',
        error: 'COURSE_EXISTS',
        timestamp: new Date().toISOString(),
      });
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        name,
        code,
        description: description || '',
        credits: parseInt(credits) || 3,
        semester: semester || 'Spring 2024',
        professorId: professor.id,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Course created successfully',
      data: {
        id: course.id,
        name: course.name,
        code: course.code,
        description: course.description,
        credits: course.credits,
        semester: course.semester,
        enrolledStudents: 0,
        totalSessions: 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /courses:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create course',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/courses/:courseId
 * Get a specific course by ID
 */
router.get('/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        professor: { include: { user: true } },
      },
    });

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found',
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Get additional stats
    const enrolledStudents = await prisma.enrollment.count({
      where: { courseId },
    });

    const totalSessions = await prisma.session.count({
      where: { courseId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Course fetched',
      data: {
        id: course.id,
        name: course.name,
        code: course.code,
        description: course.description,
        credits: course.credits,
        semester: course.semester,
        professor: {
          id: course.professor.id,
          name: course.professor.user.email.split('@')[0],
          email: course.professor.user.email,
        },
        enrolledStudents,
        totalSessions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /courses/:courseId:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch course',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
