#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests Prisma connectivity to Supabase
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  console.log('🧪 Testing Database Connection...\n');

  try {
    console.log('1️⃣  Connecting to database...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    console.log('   Query result:', result);

    console.log('\n2️⃣  Checking tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log('✅ Found tables:', tables.length);
    tables.forEach((t, i) => console.log(`   ${i + 1}. ${t.table_name}`));

    console.log('\n3️⃣  Checking User table...');
    const userCount = await prisma.user.count();
    console.log(`✅ Users in database: ${userCount}`);

    console.log('\n4️⃣  Testing Prisma models...');
    const student = await prisma.student.count();
    console.log(`✅ Students: ${student}`);
    
    const professor = await prisma.professor.count();
    console.log(`✅ Professors: ${professor}`);

    console.log('\n✨ All database tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database Error:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Details:', error.meta || 'None');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
