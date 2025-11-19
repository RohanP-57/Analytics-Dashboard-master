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

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for development)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Analytics-Dashboard-master
```

### 2. Start the Application
```bash
docker-compose up -d
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### 4. Default Login
- **Username**: admin
- **Password**: admin123

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
│   │   │   └── upload.js       # File upload
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

## 🗄️ Database Schema

### **Sites Table**
```sql
CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Features Table**
```sql
CREATE TABLE features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);
```

### **Video Links Table**
```sql
CREATE TABLE video_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  feature_id TEXT,
  site_id INTEGER,
  create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (feature_id) REFERENCES features(name)
);
```

### **Violations Table**
```sql
CREATE TABLE violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  location TEXT,
  drone_id TEXT,
  date TEXT,
  timestamp TEXT,
  confidence REAL,
  additional_data TEXT
);
```

## 🔧 Technical Implementation Details

### **Container Communication**
- **Frontend Proxy**: Configured to route API calls to backend container
- **Docker Networking**: Containers communicate via internal Docker network
- **Port Mapping**: Frontend (3000), Backend (5000) exposed to host

### **Form Validation System**
- **Client-Side**: Real-time validation with error messages
- **Server-Side**: Comprehensive input validation and sanitization
- **Required Fields**: Site and Feature selection mandatory for video links
- **URL Validation**: Proper URL format checking for video links

### **Role-Based UI Rendering**
- **Conditional Rendering**: UI elements shown/hidden based on user role
- **Consistent Messaging**: Different descriptions for admin vs regular users
- **Security**: Admin-only actions completely hidden from regular users

## 🔄 Updates & Maintenance

Regular maintenance tasks:
- Update dependencies
- Review security vulnerabilities
- Backup database regularly
- Monitor application performance
- Update documentation as needed