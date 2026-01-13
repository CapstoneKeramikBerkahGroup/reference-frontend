import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, RotateCw, Highlighter } from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Gunakan Worker Lokal agar stabil
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const PDFViewer = ({ draftId, fileUrl, onTextSelect, activeHighlight }) => {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.2); 
  const [rotation, setRotation] = useState(0);
  const [selection, setSelection] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  
  const pageRefs = useRef({});

  // Load PDF from base64 API to completely bypass IDM
  useEffect(() => {
    // Prioritize draftId over fileUrl
    if (!draftId && !fileUrl) return;
    
    const loadPdfFromBase64 = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Use base64 endpoint if draftId provided
        const apiUrl = draftId 
          ? `http://localhost:8000/api/drafts/base64/${draftId}`
          : fileUrl.startsWith('http') 
            ? fileUrl 
            : `http://localhost:8000${fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Failed to load PDF');
        
        // If response is JSON with base64 data
        const data = await response.json();
        if (data.data) {
          // Convert base64 to blob
          const binaryString = atob(data.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          setPdfBlob(blob);
        } else {
          // Fallback: response is blob
          const blob = await response.blob();
          setPdfBlob(blob);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
        setPdfBlob(null);
      }
    };
    
    loadPdfFromBase64();
  }, [draftId, fileUrl]);

  // PDF.js options
  const pdfOptions = React.useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
  }), []);

  // 1. LOGIKA SCROLL OTOMATIS (JUMP) - IMPROVED
  useEffect(() => {
    if (activeHighlight?.page_number) {
      console.log('🎯 Jumping to highlight:', {
        page: activeHighlight.page_number,
        text: activeHighlight.quoted_text?.substring(0, 50) + '...'
      });
      
      const pageEl = pageRefs.current[activeHighlight.page_number];
      if (pageEl) {
        // Smooth scroll ke halaman
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Efek visual border kuning berkedip lebih lama dan jelas
        pageEl.classList.add('ring-4', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-slate-200');
        setTimeout(() => {
          pageEl.classList.remove('ring-4', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-slate-200');
        }, 3000); // Durasi 3 detik agar lebih terlihat
      }
    }
  }, [activeHighlight]);

  // 2. LOGIKA STABILO (HIGHLIGHTER) - ULTRA STRICT: Prevent false positives
  const makeTextRenderer = useCallback(
    (pageNumber) => (textItem) => {
      // Jika tidak ada highlight aktif atau teks kutipan kosong, return teks biasa
      if (!activeHighlight || !activeHighlight.quoted_text) {
        return textItem.str;
      }

      // CRITICAL: Hanya highlight di halaman yang sesuai
      if (activeHighlight.page_number && activeHighlight.page_number !== pageNumber) {
        return textItem.str;
      }

      // Normalisasi string untuk matching yang lebih akurat
      const cleanPdfText = textItem.str.replace(/\s+/g, ' ').trim();
      const cleanQuote = activeHighlight.quoted_text.replace(/\s+/g, ' ').trim();
      
      // Skip jika teks terlalu pendek (hindari match palsu pada kata umum)
      if (cleanPdfText.length < 4) {
        return textItem.str;
      }
      
      // ULTRA STRICT MATCHING: Case-insensitive substring match only
      const lowerPdfText = cleanPdfText.toLowerCase();
      const lowerQuote = cleanQuote.toLowerCase();
      
      // ONLY highlight if PDF text is EXACTLY contained in the quoted text
      // This prevents accidental highlighting of similar words on different lines
      const shouldHighlight = lowerQuote.includes(lowerPdfText);

      if (shouldHighlight) {
        // DEBUG LOG (remove after testing)
        console.log('✨ Highlighting text:', cleanPdfText);
        
        // Word-like Yellow Highlight - Classic and comfortable
        return `<mark style="background-color: #ffff99; color: #000; padding: 2px 0; font-weight: normal; border-radius: 0;">${textItem.str}</mark>`;
      }

      return textItem.str;
    },
    [activeHighlight] // Re-create function jika highlight berubah
  );

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // 3. LOGIKA SELEKSI TEKS - IMPROVED with validation
  useEffect(() => {
    const handleMouseUp = (e) => {
      // Delay slightly to let selection complete
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel.toString().trim();
        
        // Debug logging
        if (text.length > 0) {
          console.log('📝 Text selected:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        }
        
        if (text.length > 0) {
          let node = sel.anchorNode;
          let pageNum = null;
          
          // Cari nomor halaman dari atribut data-page-number
          while (node && node !== document.body) {
            if (node.getAttribute && node.getAttribute('data-page-number')) {
              pageNum = parseInt(node.getAttribute('data-page-number'));
              break;
            }
            node = node.parentNode;
          }

          if (pageNum) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            console.log('✅ Selection valid on page:', pageNum);
            
            setSelection({
              text,
              page: pageNum,
              x: rect.left + rect.width / 2,
              y: rect.top - 50 
            });
          }
        } else {
          setSelection(null);
        }
      }, 10);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleQuoteClick = (e) => {
    e.stopPropagation();
    if (selection && onTextSelect) {
      onTextSelect(selection.text, selection.page);
      // KEEP selection visible - DON'T clear it
      // window.getSelection().removeAllRanges(); // REMOVED
      setSelection(null); // Only hide the button
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-200 relative overflow-hidden">
      
      {/* Floating Button - IMPROVED */}
      {selection && (
        <div 
          className="fixed z-[50] animate-in zoom-in-95 fade-in duration-200"
          style={{ top: selection.y, left: selection.x, transform: 'translateX(-50%)' }}
        >
          <Button 
            size="sm" 
            onClick={handleQuoteClick} 
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-2xl rounded-full h-10 px-5 gap-2 font-semibold border-2 border-yellow-300 hover:scale-105 transition-transform"
          >
            <Highlighter className="w-4 h-4 animate-pulse" /> 
            Kutip Teks Ini
          </Button>
          {/* Tooltip arrow */}
          <div className="w-3 h-3 bg-yellow-500 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-yellow-300"></div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white shadow-md z-10 shrink-0">
        <div className="text-xs font-mono text-slate-300">
           {numPages} Hal | {Math.round(scale * 100)}%
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.6, s - 0.2))} className="text-white hover:bg-slate-700"><ZoomOut className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setScale(1.0)} className="text-white hover:bg-slate-700"><Maximize className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="text-white hover:bg-slate-700"><ZoomIn className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setRotation(r => (r + 90) % 360)} className="text-white hover:bg-slate-700"><RotateCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* PDF Area */}
      <div className="flex-1 overflow-auto p-8 custom-scrollbar flex justify-center bg-slate-200/50">
        {!pdfBlob ? (
          <div className="mt-20 text-slate-500">Memuat PDF...</div>
        ) : (
          <Document
            file={pdfBlob}
            onLoadSuccess={onDocumentLoadSuccess}
            options={pdfOptions}
            className="flex flex-col items-center"
            loading={<div className="mt-20 text-slate-500">Memproses PDF...</div>}
            error={<div className="mt-20 text-red-500">Gagal memuat PDF. Periksa koneksi atau file.</div>}
          >
          {Array.from(new Array(numPages), (el, index) => {
            const pageNum = index + 1;
            return (
              <div 
                key={`page_${pageNum}`} 
                ref={el => pageRefs.current[pageNum] = el}
                className="mb-6 relative shadow-lg pdf-page-container"
                data-page-number={pageNum}
                style={{ 
                  position: 'relative',
                  display: 'inline-block'
                }}
              >
                 <Page 
                   pageNumber={pageNum} 
                   scale={scale} 
                   rotate={rotation}
                   className="bg-white pdf-page"
                   renderTextLayer={true}
                   renderAnnotationLayer={true}
                   customTextRenderer={makeTextRenderer(pageNum)} // PASS PAGE NUMBER untuk filtering
                 />
                 <div className="absolute top-2 -right-8 text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded shadow-sm">
                   {pageNum}
                 </div>
              </div>
            );
          })}
          </Document>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;