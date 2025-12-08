# Analytics Dashboard

A comprehensive drone analytics dashboard for mining operations with violation detection, site management, and video link organization.

## 🚀 Features

### 📊 **Analytics & Monitoring**
- **Real-time Dashboard**: KPIs, charts, and violation statistics
- **Interactive Map View**: Geospatial violation visualization with custom markers
- **Data Table**: Searchable, filterable violation records with pagination
- **Time Series Analysis**: Violation trends over time

### 🏢 **Site Management**
- **Dynamic Site Creation**: Add/edit/delete mining sites
- **Site Validation**: Prevent duplicate site names
- **Video Link Integration**: Track video links per site
- **Default Sites**: Pre-loaded with BNK Mines, Dhori, Kathara, Bukaro

### 🎯 **Feature Management**
- **JSON Upload**: Bulk feature import from violation data
- **Feature Synchronization**: Auto-sync features from uploaded data
- **Feature Statistics**: Track violations per feature type
- **Dynamic Feature Loading**: Real-time feature updates

### 📹 **Video Links System**
- **Organized Video Management**: Link videos to specific features and sites
- **Required Field Validation**: Both site and feature selection are mandatory
- **Feature Integration**: Dynamic loading of all features from the features tab
- **Site Integration**: Dynamic site selection with admin-only "Add Site" functionality
- **Search & Filter**: Find videos by feature, site, or title
- **YouTube Integration**: Automatic thumbnail generation for YouTube videos
- **Role-Based Access**: Admin-only creation/editing, read-only for regular users

### 🔐 **Authentication & Security**
- **Role-based Access**: Admin and user roles
- **Protected Routes**: Secure access to sensitive operations
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs

### 📤 **Data Upload & Processing**
- **JSON Data Import**: Upload violation data in JSON format
- **File Upload**: Support for various file formats
- **Data Validation**: Comprehensive validation of uploaded data
- **Real-time Processing**: Immediate data processing and visualization

### 📄 **ATR Document Management System**
- **Department-Based Organization**: Upload ATR (Accident/Incident Report) PDFs organized by department
- **Admin Enhancement Features**: Comprehensive admin controls with department filtering
- **Cloudinary Integration**: Secure cloud storage with department-based folder structure
- **Role-Based Access**: Department isolation for users, cross-department access for admins
- **Admin Features**:
  - 👑 Admin badge and visual indicators
  - 🔍 Department filter dropdown (All Departments, E&T, Security, Operation, Survey, Safety)
  - 🎨 Color-coded department badges for easy identification
  - 🔐 Enhanced permissions (view/delete across all departments)
- **User Features**:
  - 📤 Drag-and-drop PDF upload to department folders
  - 👁️ View department-specific documents only
  - 🗑️ Delete own uploads with confirmation
  - 🔒 Department isolation and security

## 🛠 Tech Stack

### **Frontend**
- **React 18**: Modern React with hooks and functional components
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Leaflet**: Interactive maps with custom markers
- **Lucide React**: Modern icon library
- **React Hot Toast**: Beautiful notifications
- **Axios**: HTTP client for API calls

### **Backend**
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **SQLite**: Lightweight database
- **Express Validator**: Input validation middleware
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Morgan**: HTTP request logger

### **Infrastructure**
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy (production ready)


## 📁 Project Structure

```
Analytics-Dashboard-master/
├── src/
│   ├── backend/                 # Node.js backend
│   │   ├── routes/             # API routes
│   │   │   ├── analytics.js    # Analytics endpoints
│   │   │   ├── auth.js         # Authentication
│   │   │   ├── features.js     # Feature management
│   │   │   ├── sites.js        # Site management
│   │   │   ├── videoLinks.js   # Video link management
│   │   │   ├── violations.js   # Violation data
│   │   │   ├── upload.js       # File upload
│   │   │   └── atr.js          # ATR document management
│   │   ├── utils/              # Utilities
│   │   │   ├── database.js     # Database connection
│   │   │   └── featureSync.js  # Feature synchronization
│   │   ├── middleware/         # Express middleware
│   │   └── server.js           # Main server file
│   └── frontend/               # React frontend
│       ├── src/
│       │   ├── components/     # Reusable components
│       │   ├── pages/          # Page components
│       │   │   ├── Dashboard.js
│       │   │   ├── Features.js
│       │   │   ├── Sites.js
│       │   │   ├── VideoLinks.js
│       │   │   ├── MapView.js
│       │   │   └── TableView.js
│       │   ├── contexts/       # React contexts
│       │   └── services/       # API services
├── docker-compose.yml          # Docker configuration
└── README.md                   # This file
```

## 🔧 API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### **Analytics**
- `GET /api/analytics/kpis` - Key performance indicators
- `GET /api/analytics/charts/pie` - Pie chart data
- `GET /api/analytics/charts/timeseries` - Time series data
- `GET /api/analytics/charts/drones` - Drone statistics

### **Features**
- `GET /api/features` - Get all features
- `GET /api/features/stats` - Feature statistics
- `POST /api/features` - Create new feature

### **Sites**
- `GET /api/sites` - Get all sites
- `POST /api/sites` - Create new site
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site

### **Video Links**
- `GET /api/video-links` - Get all video links
- `GET /api/video-links/stats/summary` - Get video link statistics
- `POST /api/video-links` - Create video link (Admin only)
- `PUT /api/video-links/:id` - Update video link (Admin only)
- `DELETE /api/video-links/:id` - Delete video link (Admin only)

### **Violations**
- `GET /api/violations` - Get violations with filters
- `GET /api/violations/map` - Get map data
- `GET /api/violations/search/:term` - Search violations

### **Upload**
- `POST /api/upload/json` - Upload JSON data
- `POST /api/upload/report` - Upload file

### **ATR Documents**
- `GET /api/atr/list` - Get ATR documents (filtered by department for users, all for admin)
- `GET /api/atr/list?department=<dept>` - Filter documents by department (admin only)
- `POST /api/atr/upload` - Upload ATR PDF document
- `GET /api/atr/view/:id` - View/download ATR document
- `DELETE /api/atr/:id` - Delete ATR document (own uploads or admin)

## 🎯 Key Features Explained

### **Site Management System**
The site management system allows administrators to:
- Add new mining sites dynamically
- Edit existing site information
- Delete sites (only if no video links are associated)
- View video link counts per site
- Validate site names to prevent duplicates

### **Feature Integration**
Features are automatically synchronized from uploaded violation data:
- JSON uploads create new features automatically
- Video links can only reference existing features
- Features are displayed with violation counts
- Real-time synchronization between features and video links

### **Video Links Organization**
Video links connect features to sites with additional metadata:
- Title and description for each video
- URL validation and storage
- Feature and site validation
- Search and filter capabilities
- Admin-only creation and management

### **Role-Based Access Control**
- **Admin Users**: Full access to all features including:
  - Site management
  - Data upload
  - User management
  - Video link creation
- **Regular Users**: Read-only access to:
  - Dashboard analytics
  - Map and table views
  - Feature browsing

## 🔒 Security Features

- **Input Validation**: All inputs are validated on both client and server
- **SQL Injection Prevention**: Parameterized queries throughout
- **XSS Protection**: Helmet middleware for security headers
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Authentication**: JWT-based authentication system
- **Role-based Authorization**: Different access levels for different user types

## 🚀 Deployment

### Development
```bash
# Start in development mode
docker-compose up

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend
```

### Production
For production deployment, consider:
- Using environment variables for sensitive data
- Setting up SSL/TLS certificates
- Configuring a reverse proxy (Nginx)
- Setting up database backups
- Implementing monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Check Docker logs for errors
- Ensure all containers are running

## 🔄 Updates & Maintenance

Regular maintenance tasks:
- Update dependencies
- Review security vulnerabilities
- Backup database regularly
- Monitor application performance
- Update documentation as needed