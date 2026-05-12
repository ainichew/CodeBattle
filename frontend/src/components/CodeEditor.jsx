import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, Decoration } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';

// Effect to set highlighted line numbers (1-indexed)
const setHighlightEffect = StateEffect.define();

// StateField holding line decorations
const highlightField = StateField.define({
  create() { return Decoration.none; },
  update(value, tr) {
    value = value.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setHighlightEffect)) {
        const decos = [];
        for (const lineNum of e.value) {
          if (lineNum >= 1 && lineNum <= tr.state.doc.lines) {
            decos.push(
              Decoration.line({ class: 'cm-changed-line' })
                .range(tr.state.doc.line(lineNum).from)
            );
          }
        }
        value = Decoration.none.update({ add: decos, sort: true });
      }
    }
    return value;
  },
  provide: f => EditorView.decorations.from(f),
});

export default function CodeEditor({
  initialCode = { html: '', css: '', js: '' },
  readOnly = false,
  onCodeChange,
  externalActiveTab,
  onTabChange,
  changedLines = [],
}) {
  const [activeTab, setActiveTab] = useState('html');
  const [code, setCode] = useState(initialCode);
  const viewRef = useRef(null);
  const clearTimerRef = useRef(null);

  useEffect(() => {
    if (readOnly) setCode(initialCode);
  }, [initialCode, readOnly]);

  useEffect(() => {
    if (readOnly && externalActiveTab) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab, readOnly]);

  const applyHighlights = (lines) => {
    if (!viewRef.current || !readOnly) return;
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    viewRef.current.dispatch({ effects: setHighlightEffect.of(lines) });

    if (lines.length > 0) {
      setTimeout(() => {
        if (!viewRef.current) return;
        const lineNum = lines[0];
        if (lineNum >= 1 && lineNum <= viewRef.current.state.doc.lines) {
          const line = viewRef.current.state.doc.line(lineNum);
          viewRef.current.dispatch({
            effects: EditorView.scrollIntoView(line.from, { y: 'center', yMargin: 20 })
          });
        }
      }, 50);
    }

    clearTimerRef.current = setTimeout(() => {
      viewRef.current?.dispatch({ effects: setHighlightEffect.of([]) });
    }, 1800);
  };

  // Apply line highlights and auto-scroll when changedLines updates
  useEffect(() => {
    applyHighlights(changedLines);
    return () => { if (clearTimerRef.current) clearTimeout(clearTimerRef.current); };
  }, [changedLines, readOnly]);

  const handleChange = (value) => {
    if (readOnly) return;
    const newCode = { ...code, [activeTab]: value };
    setCode(newCode);
    if (onCodeChange) onCodeChange(newCode);
  };

  const getExtension = () => {
    const base = [EditorView.lineWrapping, highlightField];
    switch (activeTab) {
      case 'css': return [...base, css()];
      case 'js':  return [...base, javascript()];
      default:    return [...base, html()];
    }
  };

  return (
    <div className="flex-col" style={{ height: '100%' }}>
      <div className="flex-row gap-2 mb-2">
        {['html', 'css', 'js'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : ''}`}
            onClick={() => {
              if (!readOnly) {
                setActiveTab(tab);
                if (onTabChange) onTabChange(tab);
              }
            }}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, border: '1px solid var(--panel-border)', borderRadius: '8px', minHeight: 0 }}>
        <CodeMirror
          value={code[activeTab]}
          height="100%"
          extensions={getExtension()}
          theme="dark"
          onChange={handleChange}
          readOnly={readOnly}
          style={{ height: '100%' }}
          onCreateEditor={(view) => { 
            viewRef.current = view; 
            applyHighlights(changedLines);
          }}
        />
      </div>
    </div>
  );
}
