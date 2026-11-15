import cellImage from './assets/celula-realista.webp';
import { useEffect, useRef, useState } from 'react';

const ORGANELLES = [
  { id: 'nucleus', name: 'Núcleo', description: 'Alberga el ADN y coordina la expresión genética y otras funciones celulares.', x: 455, y: 180 },
  { id: 'mitochondrion', name: 'Mitocondria', description: 'Produce ATP mediante la respiración celular.', x: 235, y: 504 },
  { id: 'golgi', name: 'Aparato de Golgi', description: 'Modifica, clasifica y distribuye proteínas y lípidos.', x: 716, y: 422 },
  { id: 'er', name: 'Retículo endoplasmático', description: 'Participa en la síntesis de proteínas y lípidos.', x: 276, y: 345 },
  { id: 'lysosome', name: 'Lisosoma', description: 'Degrada y recicla materiales mediante enzimas digestivas.', x: 528, y: 524 },
  { id: 'membrane', name: 'Membrana celular', description: 'Delimita la célula y regula el intercambio con el entorno.', x: 839, y: 154 },
];

const PARTICLES = Array.from({ length: 34 }, (_, i) => ({
  x: 180 + (i * 97) % 565,
  y: 146 + (i * 71) % 345,
  r: 1.5 + (i % 3),
  delay: (i % 11) * -0.6,
}));

function Mitochondrion({ x, y, rotate = 0, scale = 1 }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} className="mitochondrion">
    <ellipse rx="64" ry="29" fill="#9d452f" opacity=".28" transform="translate(3 6)" />
    <ellipse rx="62" ry="28" fill="url(#mitoOuter)" stroke="#f9a56b" strokeWidth="4" />
    <ellipse rx="54" ry="21" fill="url(#mitoInner)" stroke="#ffd09b" strokeWidth="1.6" />
    <path d="M-42 -13 C-49 3 -27 3 -33 17 M-17 -17 C-27 0 -5 1 -13 18 M9 -18 C-1 -2 23 0 12 18 M34 -15 C21 -1 49 3 36 15" fill="none" stroke="#ac4c35" strokeWidth="6" strokeLinecap="round" />
    <path d="M-42 -13 C-49 3 -27 3 -33 17 M-17 -17 C-27 0 -5 1 -13 18 M9 -18 C-1 -2 23 0 12 18 M34 -15 C21 -1 49 3 36 15" fill="none" stroke="#ffca91" strokeWidth="2" strokeLinecap="round" />
  </g>;
}

function CellIllustration({ solved, selected, onTarget, svgRef }) {
  return <svg ref={svgRef} className="cell-svg realistic-cell" viewBox="0 0 900 700" role="group" aria-label="Célula animal semirrealista con seis marcadores interactivos">
    <defs>
      <radialGradient id="markerFill"><stop stopColor="#233c64" stopOpacity=".96"/><stop offset="1" stopColor="#071a30" stopOpacity=".92"/></radialGradient>
      <filter id="markerShadow"><feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000" floodOpacity=".7"/></filter>
    </defs>
    <image href={cellImage} x="0" y="0" width="900" height="700" preserveAspectRatio="none" />
    {ORGANELLES.map(o => {
      const done = !!solved[o.id];
      return <g key={o.id} className={`target ${done ? 'target-done' : ''} ${selected ? 'target-active' : ''}`}
        role="button" tabIndex={0} aria-label={`Señalar ${o.name}`} aria-disabled={done}
        onClick={() => onTarget(o.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTarget(o.id); } }}>
        <circle cx={o.x} cy={o.y} r="32" fill="transparent" />
        <circle cx={o.x} cy={o.y} r="21" fill={done ? '#0d6b59' : 'url(#markerFill)'} stroke={done ? '#6df2c8' : '#e6efff'} strokeWidth="2.5" strokeDasharray={done ? 'none' : '5 5'} filter="url(#markerShadow)" />
        <circle cx={o.x} cy={o.y} r="5" fill={done ? '#91ffda' : '#fff'} />
        {done && <text x={o.x} y={o.y + 6} textAnchor="middle" fontSize="19" fontWeight="bold" fill="white">✓</text>}
      </g>;
    })}
  </svg>;
}

export default function App() {
  const [solved, setSolved] = useState({});
  const [selected, setSelected] = useState(null);
  const [drag, setDrag] = useState(null);
  const [feedback, setFeedback] = useState({ type: 'info', text: 'Arrastra una etiqueta a su punto o selecciónala y pulsa el punto correspondiente.' });
  const [mistakes, setMistakes] = useState(0);
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const count = Object.keys(solved).length;
  const complete = count === ORGANELLES.length;

  function checkAnswer(labelId, targetId) {
    if (!labelId || solved[labelId] || solved[targetId]) return;
    const item = ORGANELLES.find(o => o.id === labelId);
    if (labelId === targetId) {
      setSolved(prev => ({ ...prev, [labelId]: true }));
      setFeedback({ type: 'success', text: `${item.name}: ${item.description}` });
      setSelected(null);
    } else {
      setMistakes(prev => prev + 1);
      setFeedback({ type: 'error', text: `Esa no es la ubicación de ${item.name}. Inténtalo de nuevo.` });
    }
  }

  useEffect(() => {
    if (!drag) return;
    const onMove = e => { dragRef.current = { x: e.clientX, y: e.clientY }; setDrag(d => d ? { ...d, x: e.clientX, y: e.clientY } : null); };
    const onUp = e => {
      const svg = svgRef.current;
      if (svg) {
        const point = svg.createSVGPoint();
        point.x = e.clientX; point.y = e.clientY;
        const matrix = svg.getScreenCTM();
        if (matrix) {
          const local = point.matrixTransform(matrix.inverse());
          const closest = ORGANELLES.map(o => ({ id: o.id, distance: Math.hypot(local.x - o.x, local.y - o.y) })).sort((a, b) => a.distance - b.distance)[0];
          if (closest.distance < 48) checkAnswer(drag.id, closest.id);
        }
      }
      setDrag(null);
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); };
  }, [drag?.id, solved]);

  function reset() { setSolved({}); setSelected(null); setMistakes(0); setDrag(null); setFeedback({ type: 'info', text: 'Actividad reiniciada. Identifica las seis estructuras celulares.' }); }

  return <div className="site">
    <header className="topbar"><div className="brand"><div className="brand-icon">✳</div><div><strong>Ana Laura<span> Pano Sánchez</span></strong><small>Actividad 4 Unidad 3</small></div></div><div className="top-label"><span className="live-dot"/>Actividad: Ficha Técnica</div></header>
    <main className="main">
      <section className="intro"><div className="eyebrow">EXPLORA · APRENDE · IDENTIFICA</div><h1>Explora el interior <em>de la célula.</em></h1><p>Un laboratorio visual para descubrir las estructuras que hacen posible la vida. Identifica cada orgánulo en el modelo interactivo.</p></section>
      <div className="workspace">
        <section className="visual-panel"><div className="panel-head"><div><span className="section-number">01 / MODELO CELULAR</span><h2>Célula eucariota animal</h2></div><span className="model-tag"><span className="live-dot"/> MODELO INTERACTIVO</span></div>
          <div className="cell-stage"><div className="grid-glow"/><CellIllustration solved={solved} selected={selected} onTarget={id => checkAnswer(selected, id)} svgRef={svgRef}/><span className="stage-caption">ILUSTRACIÓN DIGITAL· NO A ESCALA</span></div>
          <div className="stage-footer"><span><i className="legend-dot"/> Puntos de identificación</span><span>Selecciona una etiqueta y después su ubicación</span></div>
        </section>
        <aside className="side-panel"><div className="side-heading"><span className="section-number">02 / ACTIVIDAD</span><h2>Identifica las partes</h2><p>Arrastra cada etiqueta hacia el marcador correspondiente.</p></div>
          <div className="progress-block"><div className="progress-line"><strong>Tu progreso</strong><span>{count} de {ORGANELLES.length}</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${count / ORGANELLES.length * 100}%` }}/></div></div>
          <div className="labels-list">{ORGANELLES.map((o, i) => <button key={o.id} className={`label-card ${selected === o.id ? 'selected' : ''} ${solved[o.id] ? 'solved' : ''}`} disabled={!!solved[o.id]} onClick={() => setSelected(o.id)} onPointerDown={e => { if (solved[o.id] || e.button !== 0) return; setSelected(o.id); setDrag({ id: o.id, x: e.clientX, y: e.clientY }); }}><span className="label-index">{String(i + 1).padStart(2, '0')}</span><span className="label-text">{o.name}</span><span className="label-status">{solved[o.id] ? '✓' : '⠿'}</span></button>)}</div>
          <div className={`feedback ${feedback.type}`} aria-live="polite"><span className="feedback-icon">{feedback.type === 'success' ? '✓' : feedback.type === 'error' ? '!' : 'i'}</span><p>{complete ? `¡Actividad completada! Identificaste los seis orgánulos con ${mistakes} ${mistakes === 1 ? 'error' : 'errores'}.` : feedback.text}</p></div>
          <div className="side-bottom"><div className="stats"><div><strong>{count}</strong><span>Aciertos</span></div><div><strong>{mistakes}</strong><span>Errores</span></div><div><strong>{Math.round(count / ORGANELLES.length * 100)}%</strong><span>Completado</span></div></div><button className="reset-button" onClick={reset}>↻ &nbsp; Reiniciar actividad</button></div>
        </aside>
      </div>
      <footer className="page-footer"><span>ATLAS CELULAR · APRENDIZAJE INTERACTIVO</span><span>Representación artística educativa · No es una micrografía</span></footer>
    </main>
    {drag && <div className="drag-ghost" style={{ left: drag.x + 16, top: drag.y - 20 }}>{ORGANELLES.find(o => o.id === drag.id)?.name}</div>}
  </div>;
}
