const database = require('../utils/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserModel {
  async createUser(userData) {
    const { username, email, password } = userData;

    // Check if user already exists
    const existingUser = await database.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      const result = await database.run(
        'INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
        [username, email, hashedPassword, 'user', new Date().toISOString()]
      );

      return {
        id: result.id,
        username,
        email,
        role: 'user',
        created_at: new Date().toISOString()
      };
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async authenticateUser(email, password, selectedRole = null) {
    try {
      let user = null;
      let userType = null;

      // If role is specified, search only in that specific table
      if (selectedRole === 'admin') {
        user = await database.get(
          'SELECT *, "admin" as user_type FROM admin WHERE email = ?',
          [email]
        );
        userType = user ? 'admin' : null;
      } else if (selectedRole === 'user') {
        user = await database.get(
          'SELECT *, "user" as user_type FROM user WHERE email = ?',
          [email]
        );
        userType = user ? 'user' : null;
      } else {
        // Fallback: search all tables if no role specified (backward compatibility)
        user = await database.get(
          'SELECT *, "admin" as user_type FROM admin WHERE email = ?',
          [email]
        );

        if (user) {
          userType = 'admin';
        } else {
          user = await database.get(
            'SELECT *, "user" as user_type FROM user WHERE email = ?',
            [email]
          );

          if (user) {
            userType = 'user';
          } else {
            user = await database.get(
              'SELECT *, role as user_type FROM users WHERE email = ?',
              [email]
            );

            if (user) {
              userType = user.role || 'user';
            }
          }
        }
      }

      if (!user) {
        if (selectedRole) {
          throw new Error(`No ${selectedRole} account found with this email`);
        } else {
          throw new Error('Invalid email or password');
        }
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Determine role and permissions based on table
      let role = userType;
      let permissions = 'basic';
      let department = null;
      let fullName = user.full_name || user.username;

      if (userType === 'admin') {
        role = 'admin';
        permissions = user.permissions || 'all';
      } else if (userType === 'user') {
        role = 'user';
        permissions = user.access_level || 'basic';
        department = user.department;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username,
          role: role,
          userType: userType,
          permissions: permissions,
          department: department
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: fullName,
          role: role,
          userType: userType,
          permissions: permissions,
          department: department,
          accessLevel: user.access_level || 'basic'
        },
        token
      };
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async getUserById(userId, userType = null) {
    try {
      let user = null;

      if (userType === 'admin') {
        user = await database.get(
          'SELECT id, username, email, full_name, permissions, created_at, "admin" as user_type FROM admin WHERE id = ?',
          [userId]
        );
      } else if (userType === 'user') {
        user = await database.get(
          'SELECT id, username, email, full_name, department, access_level, created_at, "user" as user_type FROM user WHERE id = ?',
          [userId]
        );
      } else {
        // Check all tables if userType not specified
        user = await database.get(
          'SELECT id, username, email, full_name, permissions, created_at, "admin" as user_type FROM admin WHERE id = ?',
          [userId]
        );

        if (!user) {
          user = await database.get(
            'SELECT id, username, email, full_name, department, access_level, created_at, "user" as user_type FROM user WHERE id = ?',
            [userId]
          );
        }

        if (!user) {
          user = await database.get(
            'SELECT id, username, email, role, created_at, role as user_type FROM users WHERE id = ?',
            [userId]
          );
        }
      }

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name || user.username,
        role: user.user_type === 'admin' ? 'admin' : 'user',
        userType: user.user_type,
        permissions: user.permissions || user.access_level || 'basic',
        department: user.department || null,
        created_at: user.created_at
      };
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async updateUser(userId, updateData) {
    const { username, email } = updateData;

    try {
      await database.run(
        'UPDATE users SET username = ?, email = ?, updated_at = ? WHERE id = ?',
        [username, email, new Date().toISOString(), userId]
      );

      return await this.getUserById(userId);
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }
}

module.exports = new UserModel();