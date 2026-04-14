#!/usr/bin/env node

/**
 * Real Device Registration Script
 * Registers a physical MQTT wristband device with its MAC address
 * Usage: node register-device.js <device_mac> <student_id>
 * Example: node register-device.js "00:70:07:25:B6:88" 1
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registerDevice(deviceMac, studentId) {
  console.log(`\n📱 Device Registration Script`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Device MAC: ${deviceMac}`);
  console.log(`Student ID: ${studentId}`);
  console.log(`${'='.repeat(50)}\n`);

  try {
    // Step 1: Verify student exists
    console.log(`🔍 Checking if student exists...`);
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      console.error(`❌ Error: Student with ID ${studentId} not found`);
      console.log(`\n💡 Tip: Run 'npm run db:seed' to create test students first`);
      process.exit(1);
    }

    console.log(`✅ Found student: ${student.name} (${student.rollNumber})`);
    console.log(`   Email: ${student.user.email}`);
    console.log(`   Department: ${student.department}`);

    // Step 2: Check if device already exists
    console.log(`\n🔍 Checking if device already registered...`);
    const existingDevice = await prisma.device.findUnique({
      where: { deviceId: deviceMac },
    });

    if (existingDevice) {
      if (existingDevice.studentId === studentId) {
        console.log(`✅ Device already bound to this student`);
        console.log(`   Device Status: ${existingDevice.deviceStatus}`);
        console.log(`   Battery Level: ${existingDevice.batteryLevel}%`);
        console.log(`   Last Ping: ${existingDevice.lastPingAt || 'Never'}`);
      } else {
        console.warn(`⚠️  Device already bound to different student`);
        console.log(`   Current Student: ${existingDevice.studentId}`);
        console.log(`   Requested Student: ${studentId}`);
        console.log(`\n   Updating binding...`);

        const updatedDevice = await prisma.device.update({
          where: { deviceId: deviceMac },
          data: {
            studentId: studentId,
            deviceStatus: 'ACTIVE',
            batteryLevel: 100,
          },
        });

        console.log(`✅ Device reassigned successfully`);
        console.log(`   Device ID: ${updatedDevice.deviceId}`);
        console.log(`   Student ID: ${updatedDevice.studentId}`);
        console.log(`   Status: ${updatedDevice.deviceStatus}`);
      }
    } else {
      // Step 3: Create new device
      console.log(`✅ Device not in database, creating new entry...`);

      const newDevice = await prisma.device.create({
        data: {
          deviceId: deviceMac,
          studentId: studentId,
          deviceStatus: 'ACTIVE',
          batteryLevel: 100,
          lastPingAt: null,
          assignedAt: new Date(),
        },
        include: { student: true },
      });

      console.log(`\n✅ Device registered successfully!`);
      console.log(`   Device ID: ${newDevice.deviceId}`);
      console.log(`   Student: ${newDevice.student.name}`);
      console.log(`   Status: ${newDevice.deviceStatus}`);
      console.log(`   Battery: ${newDevice.batteryLevel}%`);
      console.log(`   Assigned At: ${newDevice.assignedAt}`);
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Registration complete!`);
    console.log(`📨 Ready to receive MQTT events from device`);
    console.log(`${'='.repeat(50)}\n`);

  } catch (error) {
    console.error(`\n❌ Error during registration:`, error.message);
    if (error.code === 'P1000') {
      console.log(`\n⚠️  Database connection failed`);
      console.log(`   Make sure your PostgreSQL/Supabase is running`);
      console.log(`   Check your DATABASE_URL in .env`);
    } else if (error.code === 'P2025') {
      console.log(`\n⚠️  Resource not found in database`);
      console.log(`   Make sure the student exists`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`Usage: node register-device.js <device_mac> <student_id_or_uuid>`);
  console.log(`\nExamples:`);
  console.log(`  node register-device.js "00:70:07:25:B6:88" <student_uuid>`);
  console.log(`  node register-device.js "00:70:07:25:B6:88" "02ab45fe-0db5-433d-bc44-cfc9e32ef0a6"`);
  console.log(`\nNote: Run 'npm run db:seed' first to create test students`);
  console.log(`      Run 'node -e "const {PrismaClient} = require(....)' to list students`);
  process.exit(1);
}

const deviceMac = args[0];
const studentId = args[1];

// Validate that studentId is a non-empty string
if (typeof studentId !== 'string' || studentId.trim() === '') {
  console.error(`❌ Error: Student ID must be a valid string (UUID)`);
  process.exit(1);
}

registerDevice(deviceMac, studentId).catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
