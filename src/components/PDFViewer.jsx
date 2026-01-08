import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, RotateCw, Highlighter } from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Gunakan Worker Lokal agar stabil
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const PDFViewer = ({ fileUrl, onTextSelect, activeHighlight }) => {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.2); 
  const [rotation, setRotation] = useState(0);
  const [selection, setSelection] = useState(null);
  
  const pageRefs = useRef({});

  // 1. LOGIKA SCROLL OTOMATIS (JUMP)
  useEffect(() => {
    if (activeHighlight?.page_number) {
      const pageEl = pageRefs.current[activeHighlight.page_number];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Efek visual border berkedip
        pageEl.classList.add('ring-4', 'ring-yellow-400');
        setTimeout(() => pageEl.classList.remove('ring-4', 'ring-yellow-400'), 2000);
      }
    }
  }, [activeHighlight]);

  // 2. LOGIKA STABILO (HIGHLIGHTER)
  const makeTextRenderer = useCallback(
    (textItem) => {
      // Jika tidak ada highlight aktif atau teks kutipan kosong, return teks biasa
      if (!activeHighlight || !activeHighlight.quoted_text) {
        return textItem.str;
      }

      // Normalisasi string (hapus spasi ganda/newline agar matching lebih akurat)
      const cleanPdfText = textItem.str.replace(/\s+/g, ' ').trim();
      const cleanQuote = activeHighlight.quoted_text.replace(/\s+/g, ' ').trim();

      // Cek apakah teks di PDF ini adalah bagian dari teks yang dikutip
      // Kita pakai includes() sederhana. Jika cocok, bungkus dengan <mark>
      if (cleanQuote.includes(cleanPdfText) && cleanPdfText.length > 5) {
        return `<mark style="background-color: #fde047; color: black; padding: 2px;">${textItem.str}</mark>`;
      }

      return textItem.str;
    },
    [activeHighlight] // Re-create function jika highlight berubah
  );

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // 3. LOGIKA SELEKSI TEKS
  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      const text = sel.toString().trim();
      
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
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleQuoteClick = (e) => {
    e.stopPropagation();
    if (selection && onTextSelect) {
      onTextSelect(selection.text, selection.page);
      window.getSelection().removeAllRanges();
      setSelection(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-200 relative overflow-hidden">
      
      {/* Floating Button */}
      {selection && (
        <div 
          className="fixed z-[50] animate-in zoom-in duration-200"
          style={{ top: selection.y, left: selection.x, transform: 'translateX(-50%)' }}
        >
          <Button size="sm" onClick={handleQuoteClick} className="bg-slate-900 text-white shadow-xl rounded-full h-9 px-4 gap-2">
            <Highlighter className="w-4 h-4 text-yellow-400" /> Kutip Teks Ini
          </Button>
          <div className="w-3 h-3 bg-slate-900 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2"></div>
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
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
          loading={<div className="mt-20 text-slate-500">Memuat PDF...</div>}
        >
          {Array.from(new Array(numPages), (el, index) => {
            const pageNum = index + 1;
            return (
              <div 
                key={`page_${pageNum}`} 
                ref={el => pageRefs.current[pageNum] = el}
                className="mb-6 relative shadow-lg"
                data-page-number={pageNum}
              >
                 <Page 
                   pageNumber={pageNum} 
                   scale={scale} 
                   rotate={rotation}
                   className="bg-white"
                   renderTextLayer={true}
                   renderAnnotationLayer={true}
                   customTextRenderer={makeTextRenderer} // AKTIFKAN FITUR STABILO
                 />
                 <div className="absolute top-2 -right-8 text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded shadow-sm">
                   {pageNum}
                 </div>
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;