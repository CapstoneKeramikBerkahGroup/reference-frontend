# Reference Management System - Frontend

Modern React-based frontend with full mobile responsiveness for the Reference Management System capstone project.

## 🚀 Features

### ✅ Authentication
- Login with email & password
- Register as Mahasiswa (Student) or Dosen (Lecturer)
- JWT-based authentication
- Protected routes with role-based access
- Profile management with specialization selection

### 📱 Responsive Design
- **Mobile-First Approach** - Optimized for all screen sizes
- **Hamburger Menu** - Collapsible navigation for mobile/tablet
- **Compact Lists** - Space-efficient mobile card layouts
- **Adaptive Components** - Tabs, filters, and cards adjust to viewport
- **Touch-Friendly** - Proper button sizes and spacing for mobile

### ✅ Document Management
- Upload documents (PDF/DOCX) with drag & drop
- Multi-source filtering (All, Manual Upload, Mendeley, Zotero)
- Download & Delete documents
- Search by title/filename
- Upload progress indicator
- Document detail view with metadata

### 🔗 Integration Services
- **Mendeley Integration**
  - OAuth2 connect/disconnect workflow
  - Automatic library sync
  - Document import from Mendeley library
  - Token refresh handling
  
- **Zotero Integration**
  - API key configuration via popup dialog
  - Library sync with progress tracking
  - AI-powered document analysis
  - Batch import from Zotero collections

### 🤖 NLP Features (AI-Powered)
- **Keyword Extraction** - Extract important keywords (Indonesian support)
- **Text Summarization** - Generate extractive summaries
- **Reference Extraction** - Detect and validate citations
- **Research Gap Analysis** - Quick access from dashboard
- **Background Processing** - Async document processing

### 👥 Pembimbingan System (For Students)
- Browse available lecturers by specialization
- Send guidance requests with personal messages
- Track request status (pending/accepted/rejected)
- View active guidance relationships
- Cancel pending requests

### 📊 Reference Management
- View all extracted references from documents
- Filter by document and validation status
- Compact mobile list view
- Dosen validation workflow with notes
- Status tracking (pending/validated/rejected)

### 🕸️ Visualization
- **Interactive Graph** - Document similarity network (Cytoscape.js)
- **Similarity Threshold** - Adjustable connections
- **Zoom Controls** - Interactive exploration
- **Node Details** - Click to view document info

### 🌐 Internationalization
- Bilingual support (Indonesian/English)
- Language switcher in navbar
- Context-based translations

## 📦 Tech Stack

- **Framework**: React 18.2.0 with Vite 5.0.8
- **UI Library**: Shadcn UI (Radix UI primitives)
- **Styling**: Tailwind CSS v3
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Visualization**: Cytoscape.js
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **Date Utilities**: date-fns
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast)
- **i18n**: react-i18next

## 🛠️ Quick Start

```bash
npm install
npm run dev
```

App runs on: http://localhost:3000
Backend API: http://localhost:8000

## 📂 Structure

```
frontend/
├── public/
│   ├── images/          # Logo and static images
│   └── robots.txt
├── src/
│   ├── components/      # Reusable components
│   │   ├── ui/          # Shadcn UI components
│   │   ├── Navbar.jsx   # Responsive navigation
│   │   ├── Footer.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── ErrorBoundary.jsx
│   ├── contexts/        # React contexts
│   │   ├── AuthContext.jsx    # Authentication
│   │   └── LanguageContext.jsx # i18n
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx      # Main dashboard with integrations
│   │   ├── Documents.jsx      # Document list with filters
│   │   ├── DocumentDetail.jsx # Document details & NLP
│   │   ├── MahasiswaReferensi.jsx # Reference management
│   │   ├── PilihPembimbing.jsx    # Guidance request system
│   │   ├── DosenPembimbingSaya.jsx # Active guidance relationships
│   │   ├── DosenRequestBimbingan.jsx # Dosen request management
│   │   └── Visualization.jsx  # Graph visualization
│   ├── services/        # API services
│   │   ├── api.js       # Axios instance
│   │   ├── authAPI.js   # Authentication endpoints
│   │   ├── documentsAPI.js
│   │   ├── integrationAPI.js # Mendeley/Zotero
│   │   ├── mahasiswaAPI.js
│   │   └── dosenAPI.js
│   ├── utils/           # Utility functions
│   ├── locales/         # i18n translations
│   │   ├── en.json
│   │   └── id.json
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── components.json      # Shadcn UI config
├── tailwind.config.js   # Tailwind configuration
├── vite.config.js       # Vite configuration
└── package.json
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register/mahasiswa` - Student registration
- `POST /api/auth/register/dosen` - Lecturer registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update user profile

### Documents
- `GET /api/documents/` - Get all documents (with source filter)
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/{id}` - Get document details
- `GET /api/documents/{id}/download` - Download document
- `DELETE /api/documents/{id}` - Delete document

### Integration
- `GET /api/integration/mendeley/auth-url` - Get Mendeley OAuth URL
- `POST /api/integration/mendeley/callback` - Handle OAuth callback
- `POST /api/integration/mendeley/disconnect` - Disconnect Mendeley
- `POST /api/integration/mendeley/refresh` - Refresh Mendeley token
- `POST /api/integration/mendeley/sync` - Sync Mendeley library
- `POST /api/integration/zotero/configure` - Configure Zotero
- `POST /api/integration/zotero/sync` - Sync Zotero library
- `POST /api/integration/zotero/analyze/{id}` - Analyze Zotero document

### NLP Processing
- `POST /api/nlp/extract-keywords` - Extract keywords
- `POST /api/nlp/summarize` - Generate summary
- `POST /api/nlp/process/{id}` - Process document
- `GET /api/nlp/status/{id}` - Check processing status

### References
- `GET /api/mahasiswa/references` - Get student's references
- `GET /api/mahasiswa/references/summary` - Get reference statistics

### Pembimbingan
- `GET /api/dosen/available-dosen` - Get available lecturers
- `POST /api/pembimbing/request` - Send guidance request
- `GET /api/pembimbing/my-requests` - Get student's requests
- `DELETE /api/pembimbing/request/{id}` - Cancel request
- `GET /api/pembimbing/incoming-requests` - Get dosen's requests
- `PUT /api/pembimbing/request/{id}/respond` - Accept/reject request

### Visualization
- `GET /api/visualization/graph` - Get document similarity graph
- `GET /api/visualization/similarity/{id}` - Get similar documents

## 🎯 Pages

### For Students (Mahasiswa)
- `/login` - Login page
- `/register` - Registration form
- `/dashboard` - Main dashboard with quick actions
  - Upload documents
  - Mendeley integration card
  - Zotero integration card
  - Research gap analysis
  - Recent documents
- `/dashboard/documents` - Document list with source filters
- `/dashboard/documents/:id` - Document details & NLP tools
- `/mahasiswa/referensi` - Reference management with validation status
- `/mahasiswa/pilih-pembimbing` - Browse and request guidance
- `/mahasiswa/dosen-pembimbing` - Active guidance relationship
- `/visualization` - Document similarity graph

### For Lecturers (Dosen)
- `/dosen/dashboard` - Dosen dashboard
- `/dosen/request-bimbingan` - Manage guidance requests
  - Pending requests
  - Request history
  - Active students
- `/dosen/pembimbing-saya` - View guided students
- `/dosen/pending-referensi` - Validate student references
- `/dosen/mahasiswa/:id/dokumen` - View student documents
- `/dosen/dokumen/:id` - Document details

### Shared Pages
- `/profile` - User profile management
- `/settings` - Application settings
- `/visualization` - Interactive graph

## 🚀 Production Build

```bash
npm run build
npm run preview
```

Build output will be in `dist/` directory.

## 📱 Mobile Responsive Breakpoints

```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small devices (tablets) */
md: 768px   /* Medium devices (small laptops) */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices */
```

## 🎨 Key Features Implementation

### Responsive Design Strategy
- **Mobile First**: Base styles for mobile, enhanced for larger screens
- **Hamburger Menu**: Collapsible drawer navigation for mobile/tablet
- **Adaptive Cards**: Switch between card grid (desktop) and list (mobile)
- **Compact Components**: Reduced padding, smaller fonts, optimized spacing
- **Touch Targets**: Minimum 44px touch areas for mobile usability

### Integration Workflows
- **Mendeley**: Full OAuth2 flow with PKCE, token refresh, library sync
- **Zotero**: API key configuration, collection browsing, document import
- **Duplicate Prevention**: Check for existing documents before import
- **Progress Tracking**: Real-time sync status with toast notifications

### State Management
- **AuthContext**: Global authentication state with user profile
- **LanguageContext**: i18n language switching
- **Local State**: Component-level state with useState/useEffect
- **API Caching**: Avoid redundant requests with proper data fetching

## 🔧 Environment Variables

Create `.env` file in root:

```env
VITE_API_URL=http://localhost:8000
VITE_MENDELEY_CLIENT_ID=your-mendeley-client-id
```

## 🐛 Troubleshooting

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Error
- Check backend is running on port 8000
- Verify VITE_API_URL in .env
- Check CORS settings in backend

### Mendeley OAuth Not Working
- Verify MENDELEY_CLIENT_ID in .env
- Check redirect URI matches Mendeley app settings
- Ensure backend has correct CLIENT_SECRET

## 📝 License

MIT License - Telkom University Capstone Project 2025

## 👥 Contributors

- Dhimmas Parikesit (1202223217) - Full Stack Development
- Alisha Deanova Oemar (1202223105) - Frontend & UI/UX
- Balqis Eka Nurfadisyah (1202220223) - Backend & Integration

## 📞 Support

For issues and questions, please contact: dhimmas@student.telkomuniversity.ac.id
