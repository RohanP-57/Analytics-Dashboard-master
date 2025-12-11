const database = require('../utils/databaseHybrid');

class InferredReportsModel {
  async createDocument(documentData) {
    const { 
      filename, 
      cloudinary_url, 
      cloudinary_public_id, 
      department, 
      uploaded_by, 
      file_size,
      comment,
      hyperlink
    } = documentData;

    try {
      const result = await database.run(
        `INSERT INTO inferred_reports 
         (filename, cloudinary_url, cloudinary_public_id, department, uploaded_by, file_size, upload_date, comment, hyperlink) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [filename, cloudinary_url, cloudinary_public_id, department, uploaded_by, file_size, new Date().toISOString(), comment || null, hyperlink || null]
      );

      return {
        id: result.id,
        filename,
        cloudinary_url,
        department,
        uploaded_by,
        file_size,
        upload_date: new Date().toISOString(),
        comment: comment || null,
        hyperlink: hyperlink || null
      };
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async getDocumentsByDepartment(department) {
    try {
      // Try with new columns first
      try {
        const documents = await database.all(
          `SELECT ir.id, ir.filename, ir.cloudinary_url, ir.cloudinary_public_id, 
                  ir.department, ir.uploaded_by, ir.file_size, ir.upload_date,
                  ir.comment, ir.ai_report_url, ir.ai_report_public_id, ir.hyperlink,
                  u.username as uploaded_by_name 
           FROM inferred_reports ir 
           LEFT JOIN "user" u ON ir.uploaded_by = u.id 
           WHERE ir.department = ? 
           ORDER BY ir.upload_date DESC`,
          [department]
        );
        return documents;
      } catch (columnError) {
        // If new columns don't exist, fall back to old query
        console.log('⚠️ New columns not found, using fallback query');
        const documents = await database.all(
          `SELECT ir.id, ir.filename, ir.cloudinary_url, ir.cloudinary_public_id, 
                  ir.department, ir.uploaded_by, ir.file_size, ir.upload_date,
                  u.username as uploaded_by_name 
           FROM inferred_reports ir 
           LEFT JOIN "user" u ON ir.uploaded_by = u.id 
           WHERE ir.department = ? 
           ORDER BY ir.upload_date DESC`,
          [department]
        );
        // Add null values for missing columns
        return documents.map(doc => ({
          ...doc,
          comment: null,
          ai_report_url: null,
          ai_report_public_id: null,
          hyperlink: null
        }));
      }
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async getAllDocuments() {
    try {
      // Try with new columns first
      try {
        const documents = await database.all(
          `SELECT ir.id, ir.filename, ir.cloudinary_url, ir.cloudinary_public_id, 
                  ir.department, ir.uploaded_by, ir.file_size, ir.upload_date,
                  ir.comment, ir.ai_report_url, ir.ai_report_public_id, ir.hyperlink,
                  u.username as uploaded_by_name 
           FROM inferred_reports ir 
           LEFT JOIN "user" u ON ir.uploaded_by = u.id 
           ORDER BY ir.upload_date DESC`
        );
        return documents;
      } catch (columnError) {
        // If new columns don't exist, fall back to old query
        console.log('⚠️ New columns not found, using fallback query');
        const documents = await database.all(
          `SELECT ir.id, ir.filename, ir.cloudinary_url, ir.cloudinary_public_id, 
                  ir.department, ir.uploaded_by, ir.file_size, ir.upload_date,
                  u.username as uploaded_by_name 
           FROM inferred_reports ir 
           LEFT JOIN "user" u ON ir.uploaded_by = u.id 
           ORDER BY ir.upload_date DESC`
        );
        // Add null values for missing columns
        return documents.map(doc => ({
          ...doc,
          comment: null,
          ai_report_url: null,
          ai_report_public_id: null,
          hyperlink: null
        }));
      }
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async getDocumentById(id) {
    try {
      // Try with new columns first
      try {
        const document = await database.get(
          `SELECT ir.id, ir.filename, ir.cloudinary_url, ir.cloudinary_public_id, 
                  ir.department, ir.uploaded_by, ir.file_size, ir.upload_date,
                  ir.comment, ir.ai_report_url, ir.ai_report_public_id, ir.hyperlink,
                  u.username as uploaded_by_name 
           FROM inferred_reports ir 
           LEFT JOIN "user" u ON ir.uploaded_by = u.id 
           WHERE ir.id = ?`,
          [id]
        );
        return document;
      } catch (columnError) {
        // If new columns don't exist, fall back to old query
        console.log('⚠️ New columns not found, using fallback query');
        const document = await database.get(
          `SELECT ir.id, ir.filename, ir.cloudinary_url, ir.cloudinary_public_id, 
                  ir.department, ir.uploaded_by, ir.file_size, ir.upload_date,
                  u.username as uploaded_by_name 
           FROM inferred_reports ir 
           LEFT JOIN "user" u ON ir.uploaded_by = u.id 
           WHERE ir.id = ?`,
          [id]
        );
        // Add null values for missing columns
        if (document) {
          return {
            ...document,
            comment: null,
            ai_report_url: null,
            ai_report_public_id: null,
            hyperlink: null
          };
        }
        return document;
      }
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async deleteDocument(id) {
    try {
      const result = await database.run(
        'DELETE FROM inferred_reports WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async deleteDocumentByUser(id, userId) {
    try {
      const result = await database.run(
        'DELETE FROM inferred_reports WHERE id = ? AND uploaded_by = ?',
        [id, userId]
      );
      return result.changes > 0;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async updateComment(id, comment) {
    try {
      const result = await database.run(
        'UPDATE inferred_reports SET comment = ? WHERE id = ?',
        [comment, id]
      );
      return result.changes > 0;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async updateHyperlink(id, hyperlink) {
    try {
      const result = await database.run(
        'UPDATE inferred_reports SET hyperlink = ? WHERE id = ?',
        [hyperlink, id]
      );
      return result.changes > 0;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  async updateAiReport(id, aiReportUrl, aiReportPublicId) {
    try {
      const result = await database.run(
        'UPDATE inferred_reports SET ai_report_url = ?, ai_report_public_id = ? WHERE id = ?',
        [aiReportUrl, aiReportPublicId, id]
      );
      return result.changes > 0;
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }
}

module.exports = new InferredReportsModel();