#!/usr/bin/env node

/**
 * One-time user setup script for PostgreSQL
 * Run this ONCE after PostgreSQL is connected
 * 
 * Usage: node scripts/setupUsers.js
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function setupUsers() {
  console.log('🚀 Starting user setup for PostgreSQL...');
  
  // Check if DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found. Make sure PostgreSQL is connected.');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    client.release();
    
    let createdCount = 0;
    let errors = [];
    
    // Admin users
    const adminUsers = [
      {
        username: 'Admin',
        email: 'admin1@ccl.com',
        password: 'Aerovania_grhns@2002',
        full_name: 'Aerovania Master',
        permissions: 'all'
      },
      {
        username: 'Admin',
        email: 'superadmin1@ccl.com', 
        password: 'Super_Aerovania_grhns@2002',
        full_name: 'Super Aerovania Master',
        permissions: 'all'
      }
    ];
    
    // Department users
    const departmentUsers = [
      {
        username: 'et_department',
        email: 'et@ccl.com',
        password: 'deptet123',
        full_name: 'E&T Department User',
        department: 'E&T Department',
        access_level: 'basic'
      },
      {
        username: 'security_department',
        email: 'security@ccl.com',
        password: 'deptsecurity123',
        full_name: 'Security Department User',
        department: 'Security Department',
        access_level: 'basic'
      },
      {
        username: 'operation_department',
        email: 'operation@ccl.com',
        password: 'deptoperation123',
        full_name: 'Operation Department User',
        department: 'Operation Department',
        access_level: 'basic'
      },
      {
        username: 'survey_department',
        email: 'survey@ccl.com',
        password: 'deptsurvey123',
        full_name: 'Survey Department User',
        department: 'Survey Department',
        access_level: 'basic'
      },
      {
        username: 'safety_department',
        email: 'safety@ccl.com',
        password: 'deptsafety123',
        full_name: 'Safety Department User',
        department: 'Safety Department',
        access_level: 'basic'
      }
    ];
    
    console.log('🔄 Creating admin users...');
    
    // Create admin users
    for (const admin of adminUsers) {
      try {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await pool.query(
          'INSERT INTO admin (username, email, password_hash, full_name, permissions, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [admin.username, admin.email, hashedPassword, admin.full_name, admin.permissions, new Date().toISOString()]
        );
        createdCount++;
        console.log(`✅ Created admin: ${admin.email}`);
      } catch (err) {
        if (err.message.includes('duplicate key')) {
          console.log(`⚠️ Admin ${admin.email} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to create admin ${admin.email}:`, err.message);
          errors.push(`Admin ${admin.email}: ${err.message}`);
        }
      }
    }
    
    console.log('🔄 Creating department users...');
    
    // Create department users
    for (const user of departmentUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query(
          'INSERT INTO "user" (username, email, password_hash, full_name, department, access_level, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [user.username, user.email, hashedPassword, user.full_name, user.department, user.access_level, new Date().toISOString()]
        );
        createdCount++;
        console.log(`✅ Created user: ${user.email} (${user.department})`);
      } catch (err) {
        if (err.message.includes('duplicate key')) {
          console.log(`⚠️ User ${user.email} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to create user ${user.email}:`, err.message);
          errors.push(`User ${user.email}: ${err.message}`);
        }
      }
    }
    
    console.log('\n🎉 User setup completed!');
    console.log(`📊 Created: ${createdCount} users`);
    console.log(`❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n🔑 Login credentials:');
    console.log('📋 Admin accounts:');
    console.log('  - admin1@ccl.com / Aerovania_grhns@2002');
    console.log('  - superadmin1@ccl.com / Super_Aerovania_grhns@2002');
    console.log('\n📋 Department accounts:');
    console.log('  - et@ccl.com / deptet123 (E&T Department)');
    console.log('  - security@ccl.com / deptsecurity123 (Security Department)');
    console.log('  - operation@ccl.com / deptoperation123 (Operation Department)');
    console.log('  - survey@ccl.com / deptsurvey123 (Survey Department)');
    console.log('  - safety@ccl.com / deptsafety123 (Safety Department)');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

// Run the setup
setupUsers().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});