import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { Lightbulb, GraduationCap, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GapAnalysisTable = ({ data, synthesis }) => {
  const { language } = useLanguage(); 
  const navigate = useNavigate();

  // --- 1. Helper: Format Sitasi Akademik (INI YANG HILANG SEBELUMNYA) ---
  const formatCitation = (authorString, yearString) => {
    // Validasi Input Dasar
    if (!authorString || authorString === 'Unknown Author' || authorString === 'Unknown') {
        return 'Unknown Author';
    }

    let cleanAuthor = authorString.trim();

    // Deteksi et al. / dkk.
    const hasEtAl = /et al/i.test(cleanAuthor);
    const hasDkk = /dkk/i.test(cleanAuthor);
    const isMany = hasEtAl || hasDkk || cleanAuthor.includes(';');

    // Bersihkan Nama
    let mainName = cleanAuthor
        .replace(/(\s+et\s+al\.?)|(\s+dkk\.?)/gi, '')
        .replace(/[;,]+$/, '')
        .trim();

    // Ambil nama belakang jika ada koma (Lastname, Firstname)
    if (mainName.includes(',')) {
        mainName = mainName.split(',')[0].trim();
    } else {
        // Ambil kata terakhir jika format "Firstname Lastname"
        const parts = mainName.split(' ');
        if (parts.length > 1) {
             mainName = parts[parts.length - 1]; 
        }
    }

    // Tentukan Suffix
    let suffix = '';
    if (isMany) {
        suffix = language === 'id' ? ' dkk.' : ' et al.';
    }

    // Format Tahun
    let cleanYear = 'n.d.';
    if (yearString && yearString !== 'n.d.') {
        const yearMatch = yearString.toString().match(/\d{4}/);
        if (yearMatch) {
            cleanYear = yearMatch[0];
        }
    }

    return (
        <span className="font-semibold whitespace-nowrap text-blue-900">
            {mainName}{suffix} <span className="text-slate-500 font-normal">({cleanYear})</span>
        </span>
    );
  };

  // --- 2. Helper: Rich Text Parser (Bold & Newline) ---
  const renderRichText = (text) => {
    if (!text) return "-";
    const lines = text.split(/<br\s*\/?>|\n/);
    
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={idx} className="block mb-2 last:mb-0">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </span>
      );
    });
  };

  const t = {
    title: language === 'id' ? 'Matriks Penelitian Terdahulu' : 'State of the Art Matrix',
    analyzed: language === 'id' ? 'Dokumen Dianalisis' : 'Documents Analyzed',
    headers: {
        no: 'No',
        author: language === 'id' ? 'Penulis (Tahun)' : 'Author (Year)',
        method: language === 'id' ? 'Metode / Tech / Framework' : 'Method / Tech / Framework',
        strength: language === 'id' ? 'Kekuatan (Strengths)' : 'Strengths',
        gap: language === 'id' ? 'Kekurangan (Gaps)' : 'Gaps / Limitations',
    },
    synthesis: {
        title: language === 'id' ? 'Sintesis Celah Penelitian (Research Gap)' : 'Research Gap Synthesis',
    },
    zoteroHint: language === 'id' ? 'Hubungkan Zotero' : 'Connect Zotero'
  };

  if (!data || data.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed animate-in fade-in">
            <p>Data analisis kosong atau gagal dimuat.</p>
        </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* BAGIAN 1: TABEL MATRIKS */}
      <Card className="border shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            {t.title}
            <Badge variant="secondary" className="text-xs font-normal ml-auto sm:ml-2">
              {data.length} {t.analyzed}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 hover:bg-slate-100">
                <TableHead className="w-[50px] font-bold text-slate-700 text-center">{t.headers.no}</TableHead>
                <TableHead className="min-w-[200px] font-bold text-slate-700">{t.headers.author}</TableHead>
                <TableHead className="min-w-[200px] font-bold text-slate-700">{t.headers.method}</TableHead>
                <TableHead className="min-w-[220px] font-bold text-green-700">{t.headers.strength}</TableHead>
                <TableHead className="min-w-[220px] font-bold text-red-700">{t.headers.gap}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => {
                // MAPPING DATA YANG ROBUST
                const strengthContent = row.strength || row.strengths || row.result || "-";
                const limitationContent = row.limitation || row.limitations || row.gap || row.weakness || "-";

                return (
                <TableRow key={index} className="hover:bg-slate-50 align-top group transition-colors">
                  <TableCell className="font-medium text-center text-slate-500 pt-4">
                    {index + 1}
                  </TableCell>
                  
                  {/* KOLOM PENULIS */}
                  <TableCell className="pt-4 align-top">
                    <div className="text-blue-900 font-semibold text-sm mb-1">
                        {row.display_author || formatCitation(row.author, row.year)}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 leading-tight cursor-help" title={row.title}>
                        {row.title}
                    </div>

                    {/* HINT ZOTERO */}
                    {((!row.display_author || row.display_author.includes('Unknown')) && (!row.author || row.author === 'Unknown Author')) && (
                        <Button 
                            variant="link" 
                            className="h-auto p-0 text-[10px] text-orange-600 mt-2 flex items-center gap-1"
                            onClick={() => navigate('/settings')}
                        >
                            <Link2 className="w-3 h-3" />
                            {t.zoteroHint}
                        </Button>
                    )}
                  </TableCell>
                  
                  {/* METHOD */}
                  <TableCell className="text-sm text-slate-600 leading-relaxed pt-4 align-top">
                    <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                        Technology / Method
                    </Badge>
                    <div className="font-medium">
                        {row.method || "-"}
                    </div>
                  </TableCell>
                  
                  {/* STRENGTH */}
                  <TableCell className="text-sm text-slate-700 bg-green-50/40 border-l-2 border-green-200 pt-4 align-top">
                    {strengthContent}
                  </TableCell>
                  
                  {/* LIMITATION */}
                  <TableCell className="text-sm text-slate-700 bg-red-50/40 border-l-2 border-red-200 italic pt-4 align-top">
                    "{limitationContent}"
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* BAGIAN 2: SINTESIS */}
      <Card className="border-l-4 border-l-blue-600 shadow-md bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="pt-6">
          <h3 className="text-md font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            {t.synthesis.title}
          </h3>
          
          <div className="text-slate-700 text-sm leading-relaxed text-justify">
            {typeof synthesis === 'string' ? (
                renderRichText(synthesis)
            ) : (
                <>
                    <div className="mb-4">
                        <strong className="text-blue-800 block mb-2 text-base">Gap Utama:</strong>
                        {renderRichText(synthesis?.gap)}
                    </div>
                    
                    <div>
                        <strong className="text-green-800 block mb-2 text-base">Rekomendasi:</strong>
                        {renderRichText(synthesis?.recommendation)}
                    </div>
                </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GapAnalysisTable;