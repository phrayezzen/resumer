import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Session, Candidate } from '@/types';
import { formatPageRange, downloadBlob } from '@/lib/utils';

// PDF Export
export function exportToPDF(session: Session): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);

    for (const line of lines) {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    }
    yPosition += 5;
  };

  // Title page
  addText('Candidate Ranking Report', 24, true);
  addText(`Generated: ${new Date().toLocaleDateString()}`, 12);
  addText(`Total Candidates: ${session.candidates.length}`, 12);
  addText('', 12);

  // Job Description Summary
  addText('Job Description:', 14, true);
  addText(session.jobDescription.slice(0, 500) + (session.jobDescription.length > 500 ? '...' : ''), 10);

  doc.addPage();
  yPosition = margin;

  // Summary table
  addText('Top Candidates Summary', 18, true);
  addText('', 12);

  const topCandidates = session.candidates.slice(0, 15);

  for (let i = 0; i < topCandidates.length; i++) {
    const candidate = topCandidates[i];
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }

    addText(`${i + 1}. ${candidate.name}`, 14, true);
    addText(`   Score: ${candidate.overallScore}/100 | Skills: ${candidate.scores.skillsMatch} | Exp: ${candidate.scores.experience}`, 10);
    addText(`   Pages: ${formatPageRange(candidate.pageRange.start, candidate.pageRange.end)}`, 10);
    addText(`   ${candidate.aiSummary}`, 10);
    yPosition += 5;
  }

  // Detailed candidate pages
  for (const candidate of session.candidates) {
    doc.addPage();
    yPosition = margin;

    addText(candidate.name, 18, true);
    if (candidate.email) {
      addText(candidate.email, 10);
    }
    addText(`Pages: ${formatPageRange(candidate.pageRange.start, candidate.pageRange.end)}`, 10);
    addText('', 12);

    // Scores
    addText('Scores:', 14, true);
    addText(`Overall: ${candidate.overallScore}/100`, 12);
    addText(`Skills Match: ${candidate.scores.skillsMatch} | Experience: ${candidate.scores.experience}`, 10);
    addText(`Education: ${candidate.scores.education} | Culture Fit: ${candidate.scores.cultureFit}`, 10);
    if (candidate.gpa) {
      addText(`GPA: ${candidate.gpa}`, 10);
    }
    addText('', 12);

    // Key Skills
    if (candidate.keySkills.length > 0) {
      addText('Key Skills:', 14, true);
      addText(candidate.keySkills.join(', '), 10);
      addText('', 12);
    }

    // Pros
    if (candidate.pros.length > 0) {
      addText('Strengths:', 14, true);
      for (const pro of candidate.pros) {
        addText(`• ${pro}`, 10);
      }
      addText('', 12);
    }

    // Cons
    if (candidate.cons.length > 0) {
      addText('Areas of Concern:', 14, true);
      for (const con of candidate.cons) {
        addText(`• ${con}`, 10);
      }
      addText('', 12);
    }

    // Summary
    addText('AI Summary:', 14, true);
    addText(candidate.aiSummary, 10);

    // User notes
    if (candidate.userNotes) {
      addText('', 12);
      addText('Reviewer Notes:', 14, true);
      addText(candidate.userNotes, 10);
    }
  }

  // Download
  const blob = doc.output('blob');
  downloadBlob(blob, `candidate-report-${session.id}.pdf`);
}

// Excel Export
export function exportToExcel(session: Session): void {
  const data = session.candidates.map((c, i) => ({
    'Rank': i + 1,
    'Name': c.name,
    'Email': c.email || '',
    'Overall Score': c.overallScore,
    'Skills Match': c.scores.skillsMatch,
    'Experience': c.scores.experience,
    'Education': c.scores.education,
    'Culture Fit': c.scores.cultureFit,
    'GPA': c.gpa || '',
    'Key Skills': c.keySkills.join(', '),
    'Pros': c.pros.join('; '),
    'Cons': c.cons.join('; '),
    'AI Summary': c.aiSummary,
    'User Score': c.userScore || '',
    'User Notes': c.userNotes || '',
    'Is Top Pick': c.isTopPick ? 'Yes' : 'No',
    'Page Start': c.pageRange.start,
    'Page End': c.pageRange.end
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // Rank
    { wch: 25 },  // Name
    { wch: 30 },  // Email
    { wch: 12 },  // Overall Score
    { wch: 12 },  // Skills Match
    { wch: 12 },  // Experience
    { wch: 12 },  // Education
    { wch: 12 },  // Culture Fit
    { wch: 8 },   // GPA
    { wch: 40 },  // Key Skills
    { wch: 50 },  // Pros
    { wch: 50 },  // Cons
    { wch: 60 },  // AI Summary
    { wch: 12 },  // User Score
    { wch: 40 },  // User Notes
    { wch: 10 },  // Is Top Pick
    { wch: 10 },  // Page Start
    { wch: 10 },  // Page End
  ];

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `candidate-report-${session.id}.xlsx`);
}

// CSV Export
export function exportToCSV(session: Session): void {
  const headers = [
    'Rank',
    'Name',
    'Email',
    'Overall Score',
    'Skills Match',
    'Experience',
    'Education',
    'Culture Fit',
    'GPA',
    'Key Skills',
    'Page Start',
    'Page End',
    'Is Top Pick'
  ];

  const rows = session.candidates.map((c, i) => [
    i + 1,
    `"${c.name.replace(/"/g, '""')}"`,
    c.email || '',
    c.overallScore,
    c.scores.skillsMatch,
    c.scores.experience,
    c.scores.education,
    c.scores.cultureFit,
    c.gpa || '',
    `"${c.keySkills.join(', ').replace(/"/g, '""')}"`,
    c.pageRange.start,
    c.pageRange.end,
    c.isTopPick ? 'Yes' : 'No'
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `candidate-report-${session.id}.csv`);
}
