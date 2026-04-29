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
          // Get attendance sessions with 65% threshold check
          const attendanceRecords = await prisma.attendanceSession.findMany({
            where: {
              studentId: student.id,
              session: { courseId: enrollment.courseId },
              sessionStatus: { in: ['ACTIVE', 'ENDED'] },
            },
            include: { session: true },
          });

          // Total sessions = count of attendance records for this student in this course
          const totalSessions = attendanceRecords.length;

          // Count attended sessions (apply 65% threshold)
          let attendedSessions = 0;
          attendanceRecords.forEach((att) => {
            // Calculate session duration
            let sessionDuration = 0;
            if (att.session.scheduledStartTime && att.session.scheduledEndTime) {
              try {
                sessionDuration = Math.floor(
                  (new Date(att.session.scheduledEndTime) - new Date(att.session.scheduledStartTime)) /
                    1000
                );
              } catch (e) {
                sessionDuration = 0;
              }
            }

            // Calculate 65% threshold
            const attendanceThreshold = sessionDuration > 0 ? Math.ceil(sessionDuration * 0.65) : 0;

            // Determine if student attended using same logic as attendance endpoint
            let isAttended = false;
            if (att.sessionStatus === 'ACTIVE') {
              // ACTIVE sessions: consider present if they joined (have a record)
              isAttended = true;
            } else if (att.sessionStatus === 'ENDED') {
              // ENDED sessions: apply 65% threshold
              isAttended = sessionDuration > 0 && att.totalDurationSeconds >= attendanceThreshold;
            }

            if (isAttended) {
              attendedSessions++;
            }
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

/**
 * GET /api/students
 * Get all registered students (Professor can view this)
 */
router.get('/admin/students-list', authenticateToken, authorizeRole(['PROFESSOR', 'ADMIN']), async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        enrollments: {
          include: { course: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.user.email,
      rollNumber: student.rollNumber,
      department: student.department,
      year: student.year,
      enrolledCourses: student.enrollments.length,
      courses: student.enrollments.map((e) => ({
        id: e.course.id,
        name: e.course.name,
        code: e.course.code,
      })),
    }));

    res.status(200).json({
      status: 'success',
      message: 'Students fetched',
      students: formattedStudents,
      total: formattedStudents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /admin/students-list:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch students',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/courses/:courseId/students
 * Get all students enrolled in a specific course (Professor can view)
 */
router.get('/:courseId/students', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course exists and user is the professor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { professor: true },
    });

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found',
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user is the professor of this course
    if (req.user.userId !== course.professor.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only the course professor can view enrolled students',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          include: { user: true },
        },
      },
      orderBy: { student: { name: 'asc' } },
    });

    const students = enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      name: enrollment.student.name,
      email: enrollment.student.user.email,
      rollNumber: enrollment.student.rollNumber,
      department: enrollment.student.department,
      year: enrollment.student.year,
      enrolledAt: enrollment.enrolledAt,
    }));

    res.status(200).json({
      status: 'success',
      message: 'Course students fetched',
      courseId,
      courseName: course.name,
      students,
      total: students.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /courses/:courseId/students:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch course students',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/courses/:courseId/enroll
 * Add a student to a course (Professor action)
 */
router.post('/:courseId/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Student ID is required',
        error: 'MISSING_FIELDS',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify course exists and user is the professor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { professor: true },
    });

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found',
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user is the professor of this course
    if (req.user.userId !== course.professor.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only the course professor can enroll students',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found',
        error: 'STUDENT_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return res.status(409).json({
        status: 'error',
        message: 'Student is already enrolled in this course',
        error: 'ALREADY_ENROLLED',
        timestamp: new Date().toISOString(),
      });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
      },
      include: {
        student: { include: { user: true } },
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Student enrolled successfully',
      enrollment: {
        id: enrollment.id,
        studentName: enrollment.student.name,
        email: enrollment.student.user.email,
        courseId,
        courseName: course.name,
        enrolledAt: enrollment.enrolledAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /courses/:courseId/enroll:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to enroll student',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/courses/:courseId/students/:studentId
 * Remove a student from a course (Professor action)
 */
router.delete('/:courseId/students/:studentId', authenticateToken, async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Verify course exists and user is the professor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { professor: true },
    });

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found',
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user is the professor of this course
    if (req.user.userId !== course.professor.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only the course professor can remove students',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    // Find and delete enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      include: { student: { include: { user: true } } },
    });

    if (!enrollment) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not enrolled in this course',
        error: 'NOT_ENROLLED',
        timestamp: new Date().toISOString(),
      });
    }

    await prisma.enrollment.delete({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Student removed from course',
      data: {
        studentName: enrollment.student.name,
        email: enrollment.student.user.email,
        courseId,
        courseName: course.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in DELETE /courses/:courseId/students/:studentId:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove student',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
