import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LegalBody } from '../components/legal/LegalDocument';
import { LEGAL_DOCUMENTS } from '../components/legal/legalContent';
import '../components/legal/legal.css';

export default function LegalPage({ type }) {
  return (
    <main className="legal-page">
      <nav className="legal-page__top" aria-label="Documentos legais">
        <Link to="/"><ArrowLeft size={16} /> Voltar</Link>
        <div className="legal-page__tabs">
          {Object.values(LEGAL_DOCUMENTS).map((document) => (
            <Link key={document.slug} className={type === document.slug ? 'active' : ''} to={`/${document.slug}`}>{document.shortTitle}</Link>
          ))}
        </div>
      </nav>
      <div className="legal-page__card"><LegalBody type={type} /></div>
    </main>
  );
}
