export const TokenType = {
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  BOOLEAN: 'BOOLEAN',
  NULL: 'NULL',
  UNDEFINED: 'UNDEFINED',
  IDENTIFIER: 'IDENTIFIER',
  KEYWORD: 'KEYWORD',
  OPERATOR: 'OPERATOR',
  PUNCTUATION: 'PUNCTUATION',
  EOF: 'EOF',
};

const KEYWORDS = new Set([
  'let', 'const', 'var', 'if', 'else', 'while', 'for', 'function',
  'return', 'break', 'continue', 'new', 'typeof',
]);

export function tokenize(source) {
  const tokens = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  const peek = (offset = 0) => source[pos + offset];

  const advance = () => {
    const ch = source[pos++];
    if (ch === '\n') { line++; col = 1; } else { col++; }
    return ch;
  };

  const error = (msg) => {
    throw new Error(`Lexer error at ${line}:${col}: ${msg}`);
  };

  while (pos < source.length) {
    // Skip whitespace
    while (pos < source.length && /\s/.test(peek())) advance();
    if (pos >= source.length) break;

    const startLine = line;
    const startCol = col;
    const ch = peek();

    // Line comment
    if (ch === '/' && peek(1) === '/') {
      while (pos < source.length && peek() !== '\n') advance();
      continue;
    }

    // Block comment
    if (ch === '/' && peek(1) === '*') {
      advance(); advance();
      while (pos < source.length && !(peek() === '*' && peek(1) === '/')) advance();
      if (pos >= source.length) error('Unterminated block comment');
      advance(); advance();
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(peek(1)))) {
      let num = '';
      while (pos < source.length && /[0-9.]/.test(peek())) num += advance();
      tokens.push({ type: TokenType.NUMBER, value: parseFloat(num), line: startLine, col: startCol });
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      advance();
      let str = '';
      while (pos < source.length && peek() !== ch) {
        if (peek() === '\\') {
          advance();
          const esc = advance();
          const escMap = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', "'": "'", '`': '`' };
          str += (esc in escMap) ? escMap[esc] : ('\\' + esc);
        } else {
          str += advance();
        }
      }
      if (pos >= source.length) error('Unterminated string');
      advance();
      tokens.push({ type: TokenType.STRING, value: str, line: startLine, col: startCol });
      continue;
    }

    // Template literals (interpolation treated as plain text for simplicity)
    if (ch === '`') {
      advance();
      let str = '';
      while (pos < source.length && peek() !== '`') {
        if (peek() === '\\') { advance(); str += advance(); }
        else str += advance();
      }
      if (pos >= source.length) error('Unterminated template literal');
      advance();
      tokens.push({ type: TokenType.STRING, value: str, line: startLine, col: startCol });
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(ch)) {
      let name = '';
      while (pos < source.length && /[a-zA-Z0-9_$]/.test(peek())) name += advance();

      if (name === 'true' || name === 'false') {
        tokens.push({ type: TokenType.BOOLEAN, value: name === 'true', line: startLine, col: startCol });
      } else if (name === 'null') {
        tokens.push({ type: TokenType.NULL, value: null, line: startLine, col: startCol });
      } else if (name === 'undefined') {
        tokens.push({ type: TokenType.UNDEFINED, value: undefined, line: startLine, col: startCol });
      } else if (KEYWORDS.has(name)) {
        tokens.push({ type: TokenType.KEYWORD, value: name, line: startLine, col: startCol });
      } else {
        tokens.push({ type: TokenType.IDENTIFIER, value: name, line: startLine, col: startCol });
      }
      continue;
    }

    // 3-char operators
    const three = source.slice(pos, pos + 3);
    if (three === '===' || three === '!==') {
      advance(); advance(); advance();
      tokens.push({ type: TokenType.OPERATOR, value: three, line: startLine, col: startCol });
      continue;
    }

    // 2-char operators
    const two = source.slice(pos, pos + 2);
    if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '=>', '**'].includes(two)) {
      advance(); advance();
      tokens.push({ type: TokenType.OPERATOR, value: two, line: startLine, col: startCol });
      continue;
    }

    // Single-char operators
    if ('+-*/%=<>!'.includes(ch)) {
      advance();
      tokens.push({ type: TokenType.OPERATOR, value: ch, line: startLine, col: startCol });
      continue;
    }

    // Punctuation
    if ('{}()[];,.:'.includes(ch)) {
      advance();
      tokens.push({ type: TokenType.PUNCTUATION, value: ch, line: startLine, col: startCol });
      continue;
    }

    error(`Unexpected character '${ch}'`);
  }

  tokens.push({ type: TokenType.EOF, value: null, line, col });
  return tokens;
}
