import React from 'react';
import { ExternalLink, Scale, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { getLegalDocument } from './legalContent';
import './legal.css';

export function LegalBody({ type }) {
  const document = getLegalDocument(type);
  return (
    <article className="legal-document">
      <header className="legal-document__intro">
        <span><Scale size={16} /> Documento institucional</span>
        <h1>{document.title}</h1>
        <p>{document.summary}</p>
        <div><strong>Versão {document.version}</strong><small>Atualizado em {document.updatedAt}</small></div>
      </header>
      <div className="legal-document__notice"><ShieldCheck size={19} /><p>Leia este documento em conjunto com os demais avisos legais do Sistema. Em caso de divergência, prevalecem a legislação e as normas aplicáveis à atividade notarial.</p></div>
      <div className="legal-document__sections">
        {document.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
            {section.links && <div className="legal-links">{section.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ExternalLink size={14} /></a>)}</div>}
          </section>
        ))}
      </div>
      <footer className="legal-document__end">Cartório Santiago · 1º Tabelionato de Notas de Manacapuru/AM</footer>
    </article>
  );
}

export default function LegalDocument({ type, isOpen, onClose }) {
  const document = getLegalDocument(type);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={document.title} size="lg" footer={<Button variant="primary" onClick={onClose}>Fechar documento</Button>}>
      <div className="legal-modal-scroll"><LegalBody type={type} /></div>
    </Modal>
  );
}
