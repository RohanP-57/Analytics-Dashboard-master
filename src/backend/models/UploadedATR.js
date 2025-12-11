const database = require('../utils/databaseHybrid');

class UploadedATRModel {
  async createATRDocument(atrData) {
    const { 
      serial_no,
      site_name, 
      date_time, 
      video_link, 
      atr_link, 
      file_name, 
      department, 
      uploaded_by, 
      file_size,
      comment
    } = atrData;

    try {
      const result = await database.run(
        `INSERT INTO uploaded_atr 
         (serial_no, site_name, date_time, video_link, atr_link, file_name, department, uploaded_by, file_size, comment) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [serial_no, site_name, date_time, video_link, atr_link, file_name, department, uploaded_by, file_size, comment || null]
      );

      return {
        id: result.id,
        serial_no,
        site_name,
        date_time,
        video_link,
        atr_link,
        file_name,
        department,
        uploaded_by,
        file_size,
        comment: comment || null,
        upload_date: new Date().toISOString()
      };
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async getAllATRDocuments() {
    try {
      const documents = await database.all(
        `SELECT ua.id, ua.serial_no, ua.site_name, ua.date_time, ua.video_link, 
                ua.atr_link, ua.file_name, ua.department, ua.uploaded_by, 
                ua.upload_date, ua.file_size, ua.comment,
                u.username as uploaded_by_name 
         FROM uploaded_atr ua 
         LEFT JOIN "user" u ON ua.uploaded_by = u.id 
         ORDER BY ua.date_time DESC`
      );
      return documents;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async getATRDocumentsBySite(siteName) {
    try {
      const documents = await database.all(
        `SELECT ua.id, ua.serial_no, ua.site_name, ua.date_time, ua.video_link, 
                ua.atr_link, ua.file_name, ua.department, ua.uploaded_by, 
                ua.upload_date, ua.file_size, ua.comment,
                u.username as uploaded_by_name 
         FROM uploaded_atr ua 
         LEFT JOIN "user" u ON ua.uploaded_by = u.id 
         WHERE ua.site_name = ? 
         ORDER BY ua.date_time DESC`,
        [siteName]
      );
      return documents;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async getATRDocumentsByDateRange(startDate, endDate) {
    try {
      const documents = await database.all(
        `SELECT ua.id, ua.serial_no, ua.site_name, ua.date_time, ua.video_link, 
                ua.atr_link, ua.file_name, ua.department, ua.uploaded_by, 
                ua.upload_date, ua.file_size, ua.comment,
                u.username as uploaded_by_name 
         FROM uploaded_atr ua 
         LEFT JOIN "user" u ON ua.uploaded_by = u.id 
         WHERE ua.date_time BETWEEN ? AND ? 
         ORDER BY ua.date_time DESC`,
        [startDate, endDate]
      );
      return documents;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async searchATRDocuments(searchTerm) {
    try {
      const documents = await database.all(
        `SELECT ua.id, ua.serial_no, ua.site_name, ua.date_time, ua.video_link, 
                ua.atr_link, ua.file_name, ua.department, ua.uploaded_by, 
                ua.upload_date, ua.file_size, ua.comment,
                u.username as uploaded_by_name 
         FROM uploaded_atr ua 
         LEFT JOIN "user" u ON ua.uploaded_by = u.id 
         WHERE ua.site_name LIKE ? OR ua.file_name LIKE ? OR ua.comment LIKE ?
         ORDER BY ua.date_time DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return documents;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async getATRDocumentById(id) {
    try {
      const document = await database.get(
        `SELECT ua.id, ua.serial_no, ua.site_name, ua.date_time, ua.video_link, 
                ua.atr_link, ua.file_name, ua.department, ua.uploaded_by, 
                ua.upload_date, ua.file_size, ua.comment,
                u.username as uploaded_by_name 
         FROM uploaded_atr ua 
         LEFT JOIN "user" u ON ua.uploaded_by = u.id 
         WHERE ua.id = ?`,
        [id]
      );
      return document;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async updateATRDocument(id, updateData) {
    const { site_name, date_time, video_link, atr_link, file_name, comment } = updateData;
    
    try {
      const result = await database.run(
        `UPDATE uploaded_atr 
         SET site_name = ?, date_time = ?, video_link = ?, atr_link = ?, 
             file_name = ?, comment = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [site_name, date_time, video_link, atr_link, file_name, comment, id]
      );
      return result.changes > 0;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async deleteATRDocument(id) {
    try {
      const result = await database.run(
        'DELETE FROM uploaded_atr WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async deleteATRDocumentByUser(id, userId) {
    try {
      const result = await database.run(
        'DELETE FROM uploaded_atr WHERE id = ? AND uploaded_by = ?',
        [id, userId]
      );
      return result.changes > 0;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async getNextSerialNumber() {
    try {
      const result = await database.get(
        'SELECT MAX(serial_no) as max_serial FROM uploaded_atr'
      );
      return (result?.max_serial || 0) + 1;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }
}

module.exports = new UploadedATRModel();