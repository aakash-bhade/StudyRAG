import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Brain, Check,
  ChevronDown, Clock3, FileText, Globe2, GraduationCap, Layers3,
  Menu, MessageCircle, Network, Play, ShieldCheck, Sparkles, X,
} from 'lucide-react';

const features = [
  { icon: MessageCircle, tint: 'blue', title: 'Ask your sources', text: 'StudyRAG is being built to answer from your PDFs, notes, and saved web pages—with references to the material they came from.' },
  { icon: Brain, tint: 'purple', title: 'Learn actively', text: 'Turn material into practice questions, flashcards, and approachable explanations that help ideas stick.' },
  { icon: Layers3, tint: 'orange', title: 'Keep work in one place', text: 'Organize documents, notes, conversations, and assignments in a workspace built around your knowledge.' },
];

const questions = [
  ['What is StudyRAG?', 'StudyRAG is a workspace for understanding your own documents and notes. Its AI features are designed to use your selected sources and show references when they inform an answer.'],
  ['Which materials can I use?', 'The initial product plan includes PDFs, text documents, notes, and permitted website sources. Supported formats will be shown clearly as each feature is implemented.'],
  ['Can I use it without an AI provider?', 'Yes. Document organization and other implemented non-AI workflows are intended to remain available. AI actions will explain when a provider is not configured or has reached its quota.'],
];

function Brand({ compact = false }) {
  return <a className={`brand ${compact ? 'brand-compact' : ''}`} href="#home" aria-label="StudyRAG home">
    <span className="brand-mark"><GraduationCap size={compact ? 27 : 32} strokeWidth={2.4} /></span>
    <span>Study<span>RAG</span></span>
  </a>;
}

function DashboardPreview() {
  return <div className="preview-wrap" aria-label="Illustration of the StudyRAG workspace">
    <div className="browser-frame">
      <div className="browser-top">
        <div className="traffic-lights"><i /><i /><i /></div>
        <div className="browser-address"><span className="lock-dot" /> studyrag.app</div>
        <div className="browser-actions"><span>↗</span><span>＋</span><span>▢</span></div>
      </div>
      <div className="preview-app">
        <aside className="preview-sidebar">
          <Brand compact />
          <div className="preview-nav active"><MessageCircle size={16} /> AI Chat</div>
          <div className="preview-nav"><FileText size={16} /> My Documents</div>
          <div className="preview-nav"><Globe2 size={16} /> Website Sources</div>
          <div className="preview-nav"><Clock3 size={16} /> Recent Conversations</div>
          <div className="preview-nav"><Layers3 size={16} /> My Notes</div>
          <div className="preview-sidebar-tip"><Sparkles size={17} /><span>Learn smarter<br />with your sources</span><ArrowRight size={15} /></div>
        </aside>
        <div className="preview-main">
          <div className="preview-avatar">A</div>
          <div className="assistant-art" aria-hidden="true">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="source-float source-pdf"><FileText size={20} /><small>PDF</small></div>
            <div className="source-float source-web"><Globe2 size={27} /></div>
            <div className="source-float source-note"><BookOpen size={22} /></div>
            <div className="bot"><span className="bot-antenna" /><span className="bot-face"><i /><i /><b /></span><span className="bot-body" /></div>
          </div>
          <h3>Hello! How can I help you today?</h3>
          <p>Ask about your study materials and see the sources behind the answer.</p>
          <div className="preview-input"><Sparkles size={17} /><span>Ask a question about your sources...</span><span className="send-arrow"><ArrowRight size={16} /></span></div>
          <div className="preview-caption"><ShieldCheck size={13} /> Your sources stay in your workspace</div>
        </div>
      </div>
    </div>
    <div className="preview-badge"><span className="badge-spark"><Sparkles size={16} /></span><span><b>Answers with context</b><small>Built around your materials</small></span><span className="badge-check"><Check size={16} /></span></div>
  </div>;
}

function DemoDialog({ onClose }) {
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="demo-dialog" role="dialog" aria-modal="true" aria-labelledby="demo-title">
      <button className="dialog-close" onClick={onClose} aria-label="Close preview"><X size={20} /></button>
      <div className="dialog-icon"><Sparkles size={23} /></div>
      <p className="eyebrow">A workspace built around your material</p>
      <h2 id="demo-title">From your sources to a clearer answer.</h2>
      <p className="dialog-copy">Add a document or note, ask a question, and StudyRAG is designed to bring relevant passages into the conversation—with source references you can check.</p>
      <div className="dialog-steps"><span><FileText size={17} /> Add material</span><ArrowRight size={16} /><span><MessageCircle size={17} /> Ask a question</span><ArrowRight size={16} /><span><ShieldCheck size={17} /> Check sources</span></div>
      <button className="button button-primary dialog-done" onClick={onClose}>Got it <Check size={16} /></button>
    </section>
  </div>;
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return <>
    <header className="site-header" id="home">
      <nav className="navbar" aria-label="Main navigation">
        <Brand />
        <button className="mobile-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          <a className="nav-link selected" href="#home" onClick={closeMenu}>Home</a>
          <a className="nav-link" href="#features" onClick={closeMenu}>Features</a>
          <a className="nav-link" href="#how-it-works" onClick={closeMenu}>How it works</a>
          <a className="nav-link" href="#about" onClick={closeMenu}>About</a>
          <a className="nav-link" href="#faqs" onClick={closeMenu}>FAQs</a>
          <div className="mobile-auth-links"><Link to="/login" onClick={closeMenu}>Log in</Link><Link to="/signup" onClick={closeMenu}>Create account <ArrowRight size={15} /></Link></div>
        </div>
        <div className="nav-account-actions"><Link className="nav-login" to="/login">Log in</Link><Link className="button button-primary nav-cta" to="/signup">Get started <ArrowRight size={16} /></Link></div>
      </nav>
    </header>
    <main>
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-cloud cloud-left" /><div className="hero-cloud cloud-right" /><div className="hero-halo" />
        <div className="hero-content">
          <div className="powered-pill"><Sparkles size={15} fill="currentColor" /> Thoughtful learning, powered by your sources</div>
          <h1 id="hero-heading">Your Personal<br /><span>AI Learning</span> Assistant</h1>
          <p className="hero-description">Upload PDFs, notes and websites. Ask questions, generate MCQs, create smart notes and complete assignments with intelligent AI assistance powered by RAG.</p>
          <div className="hero-actions"><a className="button button-primary button-large" href="#features">Explore StudyRAG <ArrowRight size={17} /></a><button className="button button-secondary button-large" onClick={() => setDemoOpen(true)}><span className="play-icon"><Play size={12} fill="currentColor" /></span> See how it works</button></div>
          <p className="hero-note"><ShieldCheck size={14} /> Answers designed to stay grounded in the sources you choose</p>
        </div>
        <DashboardPreview />
      </section>
      <section className="trust-strip" aria-label="Designed for different kinds of work"><span>One workspace for the way you learn and work</span><div><span><GraduationCap size={17} /> Students</span><span><BookOpen size={16} /> Educators</span><span><Layers3 size={16} /> Teams</span><span><Brain size={16} /> Curious minds</span></div></section>
      <section className="section features-section" id="features"><div className="section-heading"><p className="eyebrow"><Sparkles size={14} /> YOUR KNOWLEDGE, IN MOTION</p><h2>A little more clarity.<br /><span>A lot more momentum.</span></h2><p>Bring your learning materials together and make them easier to explore, understand, and put to work.</p></div><div className="feature-grid">{features.map(({ icon: Icon, tint, title, text }, index) => <article className={`feature-card feature-${tint}`} key={title}><div className="feature-topline"><span className="feature-icon"><Icon size={22} /></span><span className="feature-number">0{index + 1}</span></div><h3>{title}</h3><p>{text}</p><a href="#how-it-works" className="text-link">Explore the workflow <ArrowUpRight size={15} /></a></article>)}</div></section>
      <section className="how-section" id="how-it-works"><div className="how-inner"><div className="how-copy"><p className="eyebrow"><Network size={15} /> A SIMPLE FLOW</p><h2>Start with what<br />you already know.</h2><p>StudyRAG connects your chosen materials to the questions you want to answer. You stay in control of what goes into each conversation.</p><a href="#faqs" className="button button-light">Learn about StudyRAG <ArrowRight size={16} /></a></div><div className="steps-list"><article className="step"><span className="step-index">01</span><div className="step-icon"><FileText size={21} /></div><div><h3>Bring in your material</h3><p>Add documents, notes, or a website you’re allowed to use.</p></div><Check className="step-check" size={17} /></article><article className="step"><span className="step-index">02</span><div className="step-icon"><MessageCircle size={21} /></div><div><h3>Explore with a question</h3><p>Ask for an explanation, a summary, or practice questions.</p></div><Check className="step-check" size={17} /></article><article className="step"><span className="step-index">03</span><div className="step-icon"><BookOpen size={21} /></div><div><h3>Follow the references</h3><p>Review the source context behind an answer and keep learning.</p></div><Check className="step-check" size={17} /></article></div></div></section>
      <section className="about-section section" id="about"><div className="about-mark"><span className="about-orbit orbit-a" /><span className="about-orbit orbit-b" /><div className="about-center"><GraduationCap size={42} /></div><span className="about-float float-a"><Sparkles size={18} /></span><span className="about-float float-b"><BookOpen size={18} /></span><span className="about-float float-c"><Globe2 size={18} /></span></div><div className="about-copy"><p className="eyebrow">ONE PLATFORM, MANY POSSIBILITIES</p><h2>Make room for<br /><span>better questions.</span></h2><p>Whether you’re studying a new topic, preparing a lesson, or finding your way through team documents, StudyRAG is being built to help you connect information with the work in front of you.</p><div className="about-points"><span><Check size={16} /> Your sources stay in context</span><span><Check size={16} /> Clear references to explore</span><span><Check size={16} /> Designed for learning and work</span></div></div></section>
      <section className="faq-section section" id="faqs"><div className="faq-intro"><p className="eyebrow">GOOD TO KNOW</p><h2>Questions, meet<br /><span>clear answers.</span></h2><p>A few details about the way StudyRAG is designed.</p><a href="#home" className="faq-back">Back to the top <ArrowDown size={15} /></a></div><div className="faq-list">{questions.map(([question, answer], index) => <article className={`faq-item ${openFaq === index ? 'faq-open' : ''}`} key={question}><button aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{question}</span><ChevronDown size={19} /></button>{openFaq === index && <p>{answer}</p>}</article>)}</div></section>
      <section className="closing-cta"><div className="closing-glow" /><div className="closing-content"><span className="closing-icon"><Sparkles size={22} /></span><p className="eyebrow">YOUR NEXT IDEA STARTS HERE</p><h2>Learn with a little more<br />confidence.</h2><p>See how your own sources can become a more useful learning workspace.</p><a href="#features" className="button button-primary button-large">Explore the features <ArrowRight size={17} /></a></div></section>
    </main>
    <footer className="footer"><div className="footer-main"><Brand /><p>A thoughtful space for learning, knowledge, and the questions that connect them.</p><a className="footer-top" href="#home">Back to top <ArrowUpRight size={15} /></a></div><div className="footer-bottom"><span>© 2026 StudyRAG</span><span>Built around your sources. Designed for your next question.</span><a href="#faqs">FAQs</a></div></footer>
    {demoOpen && <DemoDialog onClose={() => setDemoOpen(false)} />}
  </>;
}
