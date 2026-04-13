# 🔑 Test Credentials - CampuSync

**Generated:** 14 April 2026 (Day 0)  
**Environment:** Development  
**Seeded By:** Database seed script

---

## Overview

These credentials are pre-populated in the database for testing during development. **Do NOT use for production.**

---

## Student Accounts

| Email | Password | Roll Number | Name | Department |
|-------|----------|-------------|------|------------|
| `student1@campusync.com` | `student123` | 2024001 | Arjun Sharma | CS |
| `student2@campusync.com` | `student123` | 2024002 | Priya Verma | CS |
| `student3@campusync.com` | `student123` | 2024003 | Rohan Patel | ECE |
| `student4@campusync.com` | `student123` | 2024004 | Ananya Singh | CS |
| `student5@campusync.com` | `student123` | 2024005 | Vikram Gupta | ECE |

---

## Professor Accounts

| Email | Password | Employee ID | Name | Department |
|-------|----------|-------------|------|------------|
| `prof1@campusync.com` | `prof123` | EMP001 | Dr. Rahul Sharma | CS |
| `prof2@campusync.com` | `prof123` | EMP002 | Dr. Meera Patel | ECE |
| `prof3@campusync.com` | `prof123` | EMP003 | Dr. Arun Kumar | CS |

---

## Admin Accounts

| Email | Password | Name | Status |
|-------|----------|------|--------|
| `admin@campusync.com` | `admin123` | Admin User | Active |

---

## Test Courses

| Code | Name | Credits | Semester | Professor |
|------|------|---------|----------|-----------|
| CS101 | Data Structures | 3 | 4 | Dr. Rahul Sharma |
| CS102 | Algorithms | 3 | 4 | Dr. Rahul Sharma |
| ECE201 | Digital Systems | 4 | 4 | Dr. Meera Patel |
| CS103 | Database Systems | 3 | 4 | Dr. Arun Kumar |

---

## Test Devices

| Device ID | Bound Student | Status | Battery |
|-----------|---------------|--------|---------|
| `WRISTBAND_001` | student1 (Arjun) | ACTIVE | 85% |
| `WRISTBAND_002` | student2 (Priya) | ACTIVE | 78% |
| `WRISTBAND_003` | student3 (Rohan) | ACTIVE | 92% |
| `WRISTBAND_004` | student4 (Ananya) | ACTIVE | 65% |
| `WRISTBAND_005` | student5 (Vikram) | INACTIVE | 15% |

---

## Test Sessions

Pre-created test sessions for development:

| Session ID | Course | Professor | Start Time | Status |
|-----------|--------|-----------|-----------|--------|
| `sess-001` | CS101 | Dr. Sharma | 2026-04-14 10:00:00 | ACTIVE |
| `sess-002` | CS102 | Dr. Sharma | 2026-04-13 14:00:00 | ENDED |
| `sess-003` | ECE201 | Dr. Patel | 2026-04-14 11:30:00 | SCHEDULED |

---

## How to Use

### During Development

1. **Backend Testing with Postman:**
   ```bash
   # Login as student
   POST /auth/login
   {
     "email": "student1@campusync.com",
     "password": "student123"
   }
   ```

2. **Frontend Testing:**
   - Use browser console to test API calls
   - Login with credentials above
   - Verify token stored in localStorage

3. **MQTT Simulation:**
   ```javascript
   // Publish test MQTT event (from MQTT client)
   Topic: fingerprint/match
   Payload: {
     "device_id": "WRISTBAND_001",
     "event_type": "AUTH",
     "fingerprint_value": 0.985,
     "confidence": 98.5
   }
   ```

### Production Preparation

**Before deploying to production:**

1. Remove all test users from database
2. Disable seed script
3. Create production admin account
4. Update all credentials in environment files

---

## Seed Script Location

```
backend/prisma/seed.js
```

To re-seed the database:

```bash
cd backend
npx prisma db seed
```

This will:
- Clear existing data
- Create test users
- Create test courses
- Create enrollments
- Create test devices
- Create test sessions

---

## Notes

- All test passwords are simple (student123, prof123) for development
- In production, use strong random passwords
- Test users have all permissions for development
- Device IDs are simulated (not real hardware IDs)
- Test data can be extended by modifying seed script

---

## Troubleshooting

**Q: Credentials not working after deployment?**  
A: Re-run seed script: `npx prisma db seed`

**Q: Want to add more test users?**  
A: Edit `backend/prisma/seed.js` and add users in the array

**Q: Can I use these credentials in production?**  
A: NO - Replace with real credentials before going live

