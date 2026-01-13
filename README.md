# Reference Management System - Frontend

**Refero Frontend** - Modern, responsive React application for academic reference management with AI-powered features, built for students and lecturers.

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Shadcn UI](https://img.shields.io/badge/Shadcn%20UI-Latest-000000?logo=shadcnui)](https://ui.shadcn.com/)

## ✨ Features Overview

### 🔐 **Authentication & User Management**
- **Secure Login/Register** - JWT-based authentication
- **Dual Role Support** - Separate flows for Students (Mahasiswa) & Lecturers (Dosen)
- **Profile Management** - Edit profile with specialization selection
- **Protected Routes** - Role-based access control
- **Auto Token Refresh** - Seamless session management

### 📱 **Responsive Design (Mobile-First)**
- **Adaptive Navigation** - Hamburger menu for mobile/tablet
- **Compact Card Layouts** - Optimized for small screens
- **Touch-Friendly UI** - Proper spacing and button sizes
- **Responsive Tables** - Transform to cards on mobile
- **Flexible Grids** - Auto-adjust columns based on viewport
- **Breakpoint Support** - sm, md, lg, xl with Tailwind CSS

### 📄 **Document Management**
- **Multi-Format Upload** - PDF, DOCX with drag & drop
- **Source Filtering** - Filter by Manual, Mendeley, Zotero
- **Real-time Search** - Search by title or filename
- **Upload Progress** - Visual progress indicator
- **Document Details** - Comprehensive metadata view
- **Download & Delete** - Full CRUD operations
- **Tag Management** - Organize with tags
- **Batch Operations** - Select multiple documents

### 🔗 **Integration Services**

#### Mendeley Integration
- OAuth2 secure connection flow
- One-click library synchronization
- Automatic document import with metadata
- Connection status indicator
- Token refresh handling
- Disconnect option

#### Zotero Integration
- API key configuration via dialog
- Library and collection sync
- AI-powered document analysis
- Batch import with progress tracking
- Connection management

### 🤖 **AI-Powered NLP Features**
- **Keyword Extraction**
  - Indonesian language support
  - Top-K configurable extraction
  - Visual tag display
  
- **Text Summarization**
  - Extractive summarization
  - Adjustable length
  - Quick preview generation
  
- **Reference Extraction**
  - Automatic citation detection
  - Multiple citation styles
  - Validation status tracking
  
- **Research Gap Analysis**
  - AI-powered gap identification
  - Quick access from dashboard
  - Literature coverage insights

- **Background Processing**
  - Async document processing
  - Real-time status updates
  - Progress notifications

### 👥 **Pembimbingan (Guidance) System**

#### For Students
- **Browse Lecturers** - Filter by specialization
- **Send Requests** - Include personal message
- **Track Status** - Pending/Accepted/Rejected
- **View Active Pembimbing** - See your guidance relationship
- **Cancel Requests** - Cancel pending requests
- **Request History** - View all past requests

#### For Lecturers
- **Incoming Requests** - Review student requests
- **Accept/Reject** - Respond with notes
- **View Students** - Manage guided students
- **Request History** - Track all interactions
- **Student Documents** - Access student's work

### ✅ **Reference Validation System**
- **View References** - See all extracted citations
- **Filter Options** - By document, status, validation
- **Dosen Validation** - Approve/reject with notes
- **Status Tracking** - Pending/Validated/Rejected
- **Compact Mobile View** - Optimized for small screens
- **Validation History** - Track all validations

### 🕸️ **Interactive Visualization**
- **Document Graph** - Cytoscape.js-powered network
- **Similarity Threshold** - Adjustable connection strength
- **Zoom Controls** - Interactive exploration
- **Node Details** - Click to view document info
- **Layout Options** - Multiple graph layouts
- **Export Options** - Save graph as image

### 🌐 **Internationalization (i18n)**
- **Bilingual Support** - Indonesian (Bahasa) & English
- **Language Switcher** - Easy toggle in navbar
- **Context-Based Translation** - Smart text adaptation
- **Persistent Preference** - Remembers language choice

## 🛠️ Tech Stack

### Core Framework
- **React** 18.2.0 - UI library
- **Vite** 5.0.8 - Build tool & dev server
- **React Router** v6 - Client-side routing
- **React Context API** - State management

### UI & Styling
- **Tailwind CSS** 3.x - Utility-first CSS
- **Shadcn UI** - Beautiful component library (Radix UI primitives)
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **clsx** + **tailwind-merge** - Class name utilities

### Data & API
- **Axios** 1.12.2 - HTTP client
- **TanStack Query** 5.90.11 - Server state management
- **date-fns** 4.1.0 - Date utilities

### Visualization
- **Cytoscape.js** 3.33.1 - Graph visualization
- **cytoscape-cola** 2.5.1 - Force-directed layout

### Internationalization
- **i18next** 25.7.4 - i18n framework
- **react-i18next** - React bindings

### UI Components
- **@radix-ui/*** - Accessible component primitives
  - Dialog, Dropdown, Select, Tabs, Toast
  - Avatar, Checkbox, Switch, Slider
  - And many more...

### Additional Libraries
- **Sonner** - Toast notifications
- **cmdk** - Command palette
- **embla-carousel-react** - Carousel component
- **input-otp** - OTP input

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:8000

### Installation

```bash
# Clone repository
git clone https://github.com/CapstoneKeramikBerkahGroup/reference-backend.git
cd reference-backend/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Application will be available at: **http://localhost:3000**

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

Build output will be in `dist/` directory.

## 📁 Project Structure

```
frontend/
├── public/                      # Static assets
│   ├── images/                 # Logos and images
│   │   └── logo.png
│   ├── pdf.worker.min.mjs     # PDF.js worker
│   └── robots.txt
│
├── src/
│   ├── assets/                 # Images, fonts, etc.
│   │
│   ├── components/             # Reusable components
│   │   ├── ui/                # Shadcn UI components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── input.jsx
│   │   │   ├── select.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── toast.jsx
│   │   │   └── ... (30+ components)
│   │   │
│   │   ├── Navbar.jsx         # Responsive navigation
│   │   ├── Footer.jsx         # Footer component
│   │   ├── ProtectedRoute.jsx # Route protection
│   │   └── ErrorBoundary.jsx  # Error handling
│   │
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.jsx    # Authentication state
│   │   └── LanguageContext.jsx # i18n state
│   │
│   ├── pages/                  # Page components
│   │   ├── Login.jsx                    # Login page
│   │   ├── Register.jsx                 # Registration
│   │   ├── Dashboard.jsx                # Main dashboard
│   │   ├── Documents.jsx                # Document list
│   │   ├── DocumentDetail.jsx           # Document details
│   │   ├── MahasiswaReferensi.jsx       # Reference management
│   │   ├── PilihPembimbing.jsx          # Lecturer selection
│   │   ├── DosenPembimbingSaya.jsx      # My guidance
│   │   ├── DosenRequestBimbingan.jsx    # Dosen requests
│   │   ├── DosenPendingReferensi.jsx    # Validate refs
│   │   ├── Visualization.jsx            # Graph view
│   │   └── Profile.jsx                  # User profile
│   │
│   ├── services/               # API service layer
│   │   ├── api.js             # Axios instance + interceptors
│   │   ├── authAPI.js         # Auth endpoints
│   │   ├── documentsAPI.js    # Document endpoints
│   │   ├── integrationAPI.js  # Mendeley/Zotero
│   │   ├── mahasiswaAPI.js    # Student endpoints
│   │   ├── dosenAPI.js        # Lecturer endpoints
│   │   └── visualizationAPI.js # Graph endpoints
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.js         # Auth hook
│   │   └── useDebounce.js     # Debounce hook
│   │
│   ├── utils/                  # Utility functions
│   │   ├── formatDate.js      # Date formatting
│   │   └── errorHandler.js    # Error handling
│   │
│   ├── locales/                # i18n translation files
│   │   ├── en.json            # English translations
│   │   └── id.json            # Indonesian translations
│   │
│   ├── lib/                    # Library configurations
│   │   └── utils.js           # Utility functions (cn, etc.)
│   │
│   ├── App.jsx                 # Main App component
│   ├── App.css                 # App-specific styles
│   ├── main.jsx                # Application entry point
│   ├── index.css               # Global styles + Tailwind
│   └── i18n.js                 # i18n configuration
│
├── components.json              # Shadcn UI config
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS config
├── vite.config.js              # Vite configuration
├── jsconfig.json               # JavaScript config
├── eslint.config.js            # ESLint configuration
├── package.json                # Dependencies
└── README.md
```

## 🔌 API Integration

All API calls are managed through service files in `src/services/`:

### Authentication API (`authAPI.js`)
```javascript
- login(credentials)              // Login user
- registerMahasiswa(data)         // Register student
- registerDosen(data)             // Register lecturer
- getCurrentUser()                // Get current user info
- updateProfile(data)             // Update user profile
```

### Documents API (`documentsAPI.js`)
```javascript
- getAllDocuments(sourceFilter)   // Get all documents
- getDocumentById(id)             // Get single document
- uploadDocument(formData)        // Upload new document
- downloadDocument(id)            // Download document
- deleteDocument(id)              // Delete document
- searchDocuments(query)          // Search documents
```

### Integration API (`integrationAPI.js`)
```javascript
// Mendeley
- getMendeleyAuthUrl()            // Get OAuth URL
- mendeleyCallback(code)          // Handle OAuth callback
- syncMendeleyLibrary()           // Sync library
- disconnectMendeley()            // Disconnect account
- refreshMendeleyToken()          // Refresh access token

// Zotero
- configureZotero(apiKey, libraryId) // Configure Zotero
- syncZoteroLibrary()             // Sync library
- analyzeZoteroDocument(id)       // AI analyze document
```

### NLP API (`documentsAPI.js`)
```javascript
- extractKeywords(docId, topK, lang) // Extract keywords
- generateSummary(docId, maxLen)     // Generate summary
- extractReferences(docId)           // Extract references
- processDocument(docId)             // Background process
- getProcessingStatus(docId)         // Check status
```

### Mahasiswa API (`mahasiswaAPI.js`)
```javascript
- getReferences(filters)          // Get my references
- getReferencesSummary()          // Get statistics
- getAvailableDosen(filters)      // Browse lecturers
- sendGuidanceRequest(data)       // Send request
- getMyRequests()                 // Get my requests
- cancelRequest(id)               // Cancel request
- getMyPembimbing()               // Get active pembimbing
```

### Dosen API (`dosenAPI.js`)
```javascript
- getIncomingRequests()           // Get pending requests
- respondToRequest(id, response)  // Accept/reject
- getGuidedStudents()             // Get my students
- getPendingReferences()          // Get refs to validate
- validateReference(id, data)     // Validate reference
- getStudentDocuments(studentId)  // View student docs
```

### Visualization API (`visualizationAPI.js`)
```javascript
- getDocumentGraph(minSimilarity) // Get graph data
- getSimilarDocuments(docId)      // Get similar docs
```

## 📱 Responsive Breakpoints

Tailwind CSS breakpoints used throughout the application:

```javascript
// tailwind.config.js
screens: {
  'sm': '640px',    // Small devices (tablets)
  'md': '768px',    // Medium devices (small laptops)
  'lg': '1024px',   // Large devices (desktops)
  'xl': '1280px',   // Extra large devices
  '2xl': '1536px'   // 2X large devices
}
```

### Example Responsive Usage
```jsx
{/* Mobile: Stack, Desktop: Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  
{/* Mobile: Hidden, Desktop: Visible */}
<div className="hidden lg:block">

{/* Responsive text size */}
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

## 🎨 Styling & Theming

### Tailwind Configuration
- Custom color palette defined in `tailwind.config.js`
- Dark mode support (class-based)
- Custom spacing and typography
- Animation utilities

### Shadcn UI Theming
Components follow a consistent design system:
- Primary, secondary, accent colors
- Border radius and shadows
- Typography scale
- Focus states

### Custom CSS Variables
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... more variables */
}
```

## 🌍 Internationalization

### Supported Languages
- **Indonesian (Bahasa Indonesia)** - `id`
- **English** - `en`

### Translation Files
Located in `src/locales/`:
- `id.json` - Indonesian translations
- `en.json` - English translations

### Usage Example
```jsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <p>{t('dashboard.description')}</p>
    </div>
  );
}
```

### Language Switcher
Users can toggle language via navbar dropdown or settings.

## 🎯 Key Pages & Features

### For Students (Mahasiswa)

#### Dashboard (`/dashboard`)
- Quick upload card
- Integration status cards (Mendeley, Zotero)
- Recent documents
- Quick action buttons
- Research gap analysis link

#### Documents (`/dashboard/documents`)
- Document grid/list view
- Source filter tabs (All, Manual, Mendeley, Zotero)
- Search functionality
- Upload modal
- Document actions (view, download, delete)

#### Document Detail (`/dashboard/documents/:id`)
- Full document metadata
- NLP action buttons
  - Extract keywords
  - Generate summary
  - Extract references
- Processing status
- Download/delete options

#### My References (`/mahasiswa/referensi`)
- All extracted references
- Filter by document
- Filter by validation status
- Compact mobile cards
- Validation status badges

#### Choose Pembimbing (`/mahasiswa/pilih-pembimbing`)
- Browse available lecturers
- Filter by specialization
- Lecturer profile cards
- Send request modal
- View pending requests

#### My Pembimbing (`/mahasiswa/dosen-pembimbing`)
- Active guidance relationship
- Pembimbing details
- Contact information
- Request history

### For Lecturers (Dosen)

#### Dosen Dashboard (`/dosen/dashboard`)
- Pending request count
- Guided student count
- Quick action cards
- Recent activities

#### Guidance Requests (`/dosen/request-bimbingan`)
- Tabs: Pending, Accepted, Rejected
- Request cards with student info
- Accept/reject buttons
- Add notes when responding
- Request history

#### Validate References (`/dosen/pending-referensi`)
- Pending references from students
- Document context
- Validate/reject with notes
- Batch validation (planned)

#### Student Documents (`/dosen/mahasiswa/:id/dokumen`)
- View specific student's documents
- Access document details
- Monitor student progress

### Shared Pages

#### Visualization (`/visualization`)
- Interactive Cytoscape.js graph
- Similarity threshold slider
- Zoom controls
- Node click for details
- Layout options
- Export graph (planned)

#### Profile (`/profile`)
- Edit personal information
- Change specialization (Dosen)
- Update password
- Avatar upload

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# Application
VITE_APP_NAME=Refero
VITE_APP_VERSION=1.0.0

# Feature Flags (optional)
VITE_ENABLE_MENDELEY=true
VITE_ENABLE_ZOTERO=true
VITE_ENABLE_VISUALIZATION=true
```

### Vite Configuration

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

## 🚀 Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Output will be in dist/
```

### Preview Production Build

```bash
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Production deployment
netlify deploy --prod
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/refero-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test DocumentCard.test.jsx
```

## 🐛 Troubleshooting

### Common Issues

**Vite not starting**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API connection errors**
```bash
# Check backend is running
# Verify VITE_API_URL in .env
# Check CORS settings on backend
```

**Build errors**
```bash
# Update dependencies
npm update

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

**Styling not working**
```bash
# Rebuild Tailwind CSS
npx tailwindcss -i ./src/index.css -o ./dist/output.css
```

## 📖 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [React Router Docs](https://reactrouter.com/)
- [Cytoscape.js Documentation](https://js.cytoscape.org/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Use functional components with hooks
- Follow ESLint configuration
- Write meaningful component names
- Add JSDoc comments for complex functions
- Keep components small and focused
- Use TypeScript for new features (migration planned)

## 📄 License

This project is part of a capstone project at Telkom University.

## 👥 Team

**Capstone Keramik Berkah Group**
- Frontend Development
- UI/UX Design
- Integration Testing

## 🙏 Acknowledgments

- React team for an amazing framework
- Shadcn for beautiful UI components
- Tailwind CSS team
- Vercel for Vite
- Open source community

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact: dhimmas@student.telkomuniversity.ac.id

---

**Refero Frontend** - Beautiful, responsive, and powerful interface for academic reference management 🎨✨

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
