User (1) ──────── (1) Student/Professor
  │
  └──────────────────┐
                     │
Course (many) ←──── Professor (1)
  │
  ├──── Enrollment ────→ Student (many)
  │
  └──── Session (many)
          │
          ├──→ Classroom (1)
          │
          └──→ Attendance (many) ──→ Student (1)