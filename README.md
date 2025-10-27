# Reference Management System - Frontend

Modern React-based frontend for the Reference Management System capstone project.

## 🚀 Features

### ✅ Authentication
- Login with email & password
- Register as Mahasiswa (Student) or Dosen (Lecturer)
- JWT-based authentication
- Protected routes

### ✅ Document Management
- Upload documents (PDF/DOCX)
- Download & Delete documents
- Search by title/filename
- Upload progress indicator

### ✅ NLP Features (AI-Powered)
- **Keyword Extraction** - Extract important keywords
- **Text Summarization** - Generate automatic summaries
- **Reference Extraction** - Extract citations
- **Background Processing** - Async document processing

### ✅ Visualization
- **Interactive Graph** - Document similarity network (Cytoscape.js)
- **Similarity Threshold** - Adjustable connections
- **Zoom Controls** - Interactive exploration

## 📦 Tech Stack

- React 18 + Vite
- Material-UI (MUI)
- React Router v6
- Axios
- Cytoscape.js
- date-fns

## 🛠️ Quick Start

```bash
npm install
npm run dev
```

App runs on: http://localhost:3000
Backend API: http://localhost:8000

## 📂 Structure

```
src/
├── components/     # Reusable components
├── contexts/       # React contexts (Auth)
├── pages/          # Page components
├── services/       # API services
└── utils/          # Utilities
```

## 🔐 API Endpoints

- `/api/auth/*` - Authentication
- `/api/documents/*` - Document CRUD
- `/api/nlp/*` - NLP processing
- `/api/visualization/*` - Graph data

## 🎯 Pages

- `/login` - Login page
- `/register` - Registration (Mahasiswa/Dosen)
- `/dashboard` - Document list & upload
- `/documents/:id` - Document details & NLP
- `/visualization` - Similarity graph

## 🚀 Production Build

```bash
npm run build
npm run preview
```

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
