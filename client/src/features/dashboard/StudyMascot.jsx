import { BookOpen, Lightbulb, Sparkles } from 'lucide-react';

export default function StudyMascot({ className = '' }) {
  return <div className={`study-mascot ${className}`} aria-hidden="true">
    <span className="mascot-orbit mascot-orbit-one" />
    <span className="mascot-orbit mascot-orbit-two" />
    <span className="mascot-twinkle mascot-twinkle-one"><Sparkles size={19} /></span>
    <span className="mascot-twinkle mascot-twinkle-two"><Sparkles size={13} /></span>
    <span className="mascot-bulb"><Lightbulb size={24} /></span>
    <div className="mascot-bot">
      <span className="mascot-cap"><i /><b /></span>
      <span className="mascot-ear mascot-ear-left" />
      <span className="mascot-ear mascot-ear-right" />
      <span className="mascot-head"><i /><i /><b /></span>
      <span className="mascot-neck" />
      <span className="mascot-body"><i /><i /><BookOpen size={32} /></span>
      <span className="mascot-arm mascot-arm-left" />
      <span className="mascot-arm mascot-arm-right" />
    </div>
    <span className="mascot-book"><i /><i /><i /></span>
  </div>;
}
