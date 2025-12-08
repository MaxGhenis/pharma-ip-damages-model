import React from 'react';
import { ReportContent, ReportSection } from '../utils/reportGenerator';

interface ReportViewProps {
  report: ReportContent;
  onClose: () => void;
  onPrint: () => void;
}

export function ReportView({ report, onClose, onPrint }: ReportViewProps) {
  return (
    <div className="report-overlay">
      <div className="report-container">
        {/* Header - hidden when printing */}
        <div className="report-header no-print">
          <button
            onClick={onClose}
            className="report-close-btn"
          >
            ← Back to Calculator
          </button>
          <button
            onClick={onPrint}
            className="report-print-btn"
          >
            Print / Save PDF
          </button>
        </div>

        {/* Report Content */}
        <div className="report-content" id="report-printable">
          {/* Title Page */}
          <div className="report-title-page">
            <h1 className="report-title">{report.title}</h1>
            <p className="report-date">Generated: {report.date}</p>
            <div className="report-logo">IP DAMAGES ANALYSIS</div>
          </div>

          {/* Table of Contents */}
          <div className="report-toc no-print">
            <h2>Contents</h2>
            <ul>
              {report.sections.map((section, idx) => (
                <li key={idx}>
                  <a href={`#section-${idx}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          {report.sections.map((section, idx) => (
            <ReportSectionView key={idx} section={section} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportSectionView({ section, index }: { section: ReportSection; index: number }) {
  return (
    <div className="report-section" id={`section-${index}`}>
      <h2 className="report-section-title">{section.title}</h2>
      <div className="report-section-content">
        {section.type === 'table' ? (
          <ReportTable section={section} />
        ) : (
          <ReportText content={section.content} />
        )}
      </div>
    </div>
  );
}

function ReportTable({ section }: { section: ReportSection }) {
  const data = section.data as { headers: string[]; rows: string[][] } | undefined;
  if (!data) return <ReportText content={section.content} />;

  return (
    <table className="report-table">
      <thead>
        <tr>
          {data.headers.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReportText({ content }: { content: string }) {
  // Convert markdown-like formatting to HTML
  const formatted = content
    .split('\n\n')
    .map((para, i) => {
      // Bold text
      let html = para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (html.startsWith('•')) {
        return `<li key="${i}">${html.substring(1).trim()}</li>`;
      }
      // Numbered lists
      if (/^\d+\./.test(html)) {
        return `<li key="${i}">${html.replace(/^\d+\.\s*/, '')}</li>`;
      }
      return `<p key="${i}">${html}</p>`;
    })
    .join('');

  // Wrap list items
  const withLists = formatted
    .replace(/(<li[^>]*>.*?<\/li>)+/g, '<ul>$&</ul>')
    .replace(/<\/li><li/g, '</li><li');

  return <div dangerouslySetInnerHTML={{ __html: withLists }} />;
}
