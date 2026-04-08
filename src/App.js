import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import { tokenize } from './compiler/lexer';
import { parse } from './compiler/parser';
import { interpret } from './compiler/interpreter';

const SAMPLE_CODE = `// Welcome to the JavaScript Compiler!
// Press Ctrl+Enter or click ▶ Run to execute.

// ── Functions ──────────────────────────────────
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i <= 8; i++) {
  console.log("fib(" + i + ") = " + fibonacci(i));
}

// ── Arrays & higher-order functions ────────────
const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const evens   = nums.filter(n => n % 2 === 0);
const doubled = evens.map(n => n * 2);
const total   = doubled.reduce((acc, n) => acc + n, 0);
console.log("Evens doubled and summed:", total);

// ── Objects ────────────────────────────────────
const person = { name: "Alice", age: 30 };
console.log("Name:", person.name, "| Age:", person.age);

// ── String methods ─────────────────────────────
const msg = "  Hello, World!  ";
console.log(msg.trim().toUpperCase());
console.log("Repeat: " + "JS ".repeat(3));
`;

const EXAMPLES = [
  {
    label: 'Fibonacci',
    code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
for (let i = 0; i <= 10; i++) {
  console.log("fib(" + i + ") =", fibonacci(i));
}`,
  },
  {
    label: 'Bubble Sort',
    code: `function bubbleSort(arr) {
  const a = arr.slice();
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        const tmp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = tmp;
      }
    }
  }
  return a;
}

const unsorted = [64, 34, 25, 12, 22, 11, 90];
console.log("Before:", unsorted.join(", "));
console.log("After: ", bubbleSort(unsorted).join(", "));`,
  },
  {
    label: 'FizzBuzz',
    code: `for (let i = 1; i <= 20; i++) {
  if (i % 15 === 0) console.log("FizzBuzz");
  else if (i % 3 === 0) console.log("Fizz");
  else if (i % 5 === 0) console.log("Buzz");
  else console.log(i);
}`,
  },
  {
    label: 'Closures',
    code: `function makeCounter(start) {
  let count = start || 0;
  return function() {
    count += 1;
    return count;
  };
}

const counter = makeCounter(0);
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3`,
  },
  {
    label: 'Array Methods',
    code: `const students = [
  { name: "Alice", grade: 92 },
  { name: "Bob",   grade: 85 },
  { name: "Carol", grade: 78 },
  { name: "Dave",  grade: 95 },
];

const passing = students.filter(s => s.grade >= 80);
const names   = passing.map(s => s.name);
const avg     = students.reduce((sum, s) => sum + s.grade, 0) / students.length;

console.log("Passing:", names.join(", "));
console.log("Class average:", avg);`,
  },
];

function tokenTypeColor(type) {
  const map = {
    KEYWORD: '#569cd6', NUMBER: '#b5cea8', STRING: '#ce9178',
    BOOLEAN: '#569cd6', NULL: '#569cd6', UNDEFINED: '#569cd6',
    IDENTIFIER: '#9cdcfe', OPERATOR: '#d4d4d4', PUNCTUATION: '#888',
    EOF: '#555',
  };
  return map[type] || '#d4d4d4';
}

export default function App() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [output, setOutput] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [ast, setAst] = useState(null);
  const [activeTab, setActiveTab] = useState('output');
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const lineNumsRef = useRef(null);
  const editorRef = useRef(null);

  const runCode = useCallback(() => {
    setRunning(true);
    setError(null);
    const lines = [];
    try {
      const toks = tokenize(code);
      setTokens(toks);
      const tree = parse(toks);
      setAst(tree);
      interpret(tree, (line) => lines.push(line));
    } catch (e) {
      setError(e.message);
    } finally {
      setOutput(lines);
      setRunning(false);
      setActiveTab('output');
    }
  }, [code]);

  const clearAll = () => {
    setOutput([]);
    setTokens([]);
    setAst(null);
    setError(null);
  };

  // Ctrl+Enter to run
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
    // Tab → indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = code.substring(0, start) + '  ' + code.substring(end);
      setCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  };

  // Sync line-number scroll with textarea
  const handleScroll = (e) => {
    if (lineNumsRef.current) lineNumsRef.current.scrollTop = e.target.scrollTop;
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────── */}
      <header className="header">
        <div className="header-left">
          <span className="js-badge">JS</span>
          <h1>JavaScript Compiler</h1>
        </div>
        <div className="header-right">
          <select
            className="example-select"
            defaultValue=""
            onChange={(e) => {
              const ex = EXAMPLES.find(x => x.label === e.target.value);
              if (ex) setCode(ex.code);
              e.target.value = '';
            }}
          >
            <option value="" disabled>Examples…</option>
            {EXAMPLES.map(ex => (
              <option key={ex.label} value={ex.label}>{ex.label}</option>
            ))}
          </select>
          <button className="btn btn-clear" onClick={clearAll}>Clear</button>
          <button className="btn btn-run" onClick={runCode} disabled={running}>
            {running ? '⏳' : '▶'} Run
          </button>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────── */}
      <div className="workspace">
        {/* Editor pane */}
        <div className="pane editor-pane">
          <div className="pane-title">
            <span>editor.js</span>
            <span className="hint">Ctrl+Enter to run</span>
          </div>
          <div className="editor-scroll-area">
            <div className="line-numbers" ref={lineNumsRef}>
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="ln">{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={editorRef}
              className="editor"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        </div>

        {/* Output pane */}
        <div className="pane output-pane">
          <div className="pane-title tabs-bar">
            {['output', 'tokens', 'ast'].map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
                {tab === 'tokens' && tokens.length > 0 && (
                  <span className="badge">{tokens.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="panel-body">
            {/* Output tab */}
            {activeTab === 'output' && (
              <div className="output-view">
                {!error && output.length === 0 && (
                  <div className="empty-msg">Press ▶ Run to execute your code</div>
                )}
                {error && (
                  <div className="error-block">
                    <span className="error-icon">✗</span> {error}
                  </div>
                )}
                {output.map((line, i) => (
                  <div key={i} className="out-line">
                    <span className="prompt">&gt;</span> {line}
                  </div>
                ))}
              </div>
            )}

            {/* Tokens tab */}
            {activeTab === 'tokens' && (
              <div className="tokens-view">
                {tokens.length === 0
                  ? <div className="empty-msg">Run code to see tokens</div>
                  : (
                    <table className="token-table">
                      <thead>
                        <tr>
                          <th>#</th><th>Type</th><th>Value</th><th>Loc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokens.map((tok, i) => (
                          <tr key={i}>
                            <td className="idx">{i}</td>
                            <td style={{ color: tokenTypeColor(tok.type) }}>{tok.type}</td>
                            <td className="tok-val">{JSON.stringify(tok.value)}</td>
                            <td className="tok-loc">{tok.line}:{tok.col}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            )}

            {/* AST tab */}
            {activeTab === 'ast' && (
              <div className="ast-view">
                {!ast
                  ? <div className="empty-msg">Run code to see the AST</div>
                  : <pre className="ast-pre">{JSON.stringify(ast, null, 2)}</pre>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
