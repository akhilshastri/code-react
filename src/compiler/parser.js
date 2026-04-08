import { TokenType } from './lexer';

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(offset = 0) {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  advance() {
    const t = this.tokens[this.pos];
    if (t.type !== TokenType.EOF) this.pos++;
    return t;
  }

  check(type, value) {
    const t = this.peek();
    if (t.type !== type) return false;
    if (value !== undefined && t.value !== value) return false;
    return true;
  }

  match(type, value) {
    if (this.check(type, value)) return this.advance();
    return null;
  }

  expect(type, value) {
    if (this.check(type, value)) return this.advance();
    const t = this.peek();
    const expected = value !== undefined ? `'${value}'` : type;
    throw new Error(`Parse error at line ${t.line}: expected ${expected} but got '${t.value}'`);
  }

  // --- Top Level ---

  parse() {
    const body = [];
    while (!this.check(TokenType.EOF)) {
      body.push(this.parseStatement());
    }
    return { type: 'Program', body };
  }

  // --- Statements ---

  parseStatement() {
    // skip stray semicolons
    while (this.match(TokenType.PUNCTUATION, ';')) {}

    const t = this.peek();
    if (t.type === TokenType.EOF) return null;

    if (t.type === TokenType.KEYWORD) {
      switch (t.value) {
        case 'let': case 'const': case 'var': return this.parseVarDecl();
        case 'if':       return this.parseIfStmt();
        case 'while':    return this.parseWhileStmt();
        case 'for':      return this.parseForStmt();
        case 'function': return this.parseFunctionDecl();
        case 'return':   return this.parseReturnStmt();
        case 'break':    this.advance(); this.match(TokenType.PUNCTUATION, ';'); return { type: 'BreakStatement' };
        case 'continue': this.advance(); this.match(TokenType.PUNCTUATION, ';'); return { type: 'ContinueStatement' };
        default: break;
      }
    }

    if (this.check(TokenType.PUNCTUATION, '{')) return this.parseBlock();

    const expr = this.parseExpr();
    this.match(TokenType.PUNCTUATION, ';');
    return { type: 'ExpressionStatement', expression: expr };
  }

  parseVarDecl(consumeSemi = true) {
    const kind = this.advance().value;
    const declarations = [];
    do {
      const id = this.expect(TokenType.IDENTIFIER);
      let init = null;
      if (this.match(TokenType.OPERATOR, '=')) {
        init = this.parseExpr();
      }
      declarations.push({
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: id.value },
        init,
      });
    } while (this.match(TokenType.PUNCTUATION, ','));
    if (consumeSemi) this.match(TokenType.PUNCTUATION, ';');
    return { type: 'VariableDeclaration', kind, declarations };
  }

  parseIfStmt() {
    this.expect(TokenType.KEYWORD, 'if');
    this.expect(TokenType.PUNCTUATION, '(');
    const test = this.parseExpr();
    this.expect(TokenType.PUNCTUATION, ')');
    const consequent = this.parseStatement();
    let alternate = null;
    if (this.match(TokenType.KEYWORD, 'else')) {
      alternate = this.parseStatement();
    }
    return { type: 'IfStatement', test, consequent, alternate };
  }

  parseWhileStmt() {
    this.expect(TokenType.KEYWORD, 'while');
    this.expect(TokenType.PUNCTUATION, '(');
    const test = this.parseExpr();
    this.expect(TokenType.PUNCTUATION, ')');
    const body = this.parseStatement();
    return { type: 'WhileStatement', test, body };
  }

  parseForStmt() {
    this.expect(TokenType.KEYWORD, 'for');
    this.expect(TokenType.PUNCTUATION, '(');

    let init = null;
    if (!this.check(TokenType.PUNCTUATION, ';')) {
      const kw = this.peek().value;
      if (kw === 'let' || kw === 'const' || kw === 'var') {
        init = this.parseVarDecl(false);
        this.expect(TokenType.PUNCTUATION, ';');
      } else {
        init = this.parseExpr();
        this.expect(TokenType.PUNCTUATION, ';');
      }
    } else {
      this.expect(TokenType.PUNCTUATION, ';');
    }

    let test = null;
    if (!this.check(TokenType.PUNCTUATION, ';')) test = this.parseExpr();
    this.expect(TokenType.PUNCTUATION, ';');

    let update = null;
    if (!this.check(TokenType.PUNCTUATION, ')')) update = this.parseExpr();
    this.expect(TokenType.PUNCTUATION, ')');

    const body = this.parseStatement();
    return { type: 'ForStatement', init, test, update, body };
  }

  parseFunctionDecl() {
    this.expect(TokenType.KEYWORD, 'function');
    const id = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.PUNCTUATION, '(');
    const params = this.parseParams();
    this.expect(TokenType.PUNCTUATION, ')');
    const body = this.parseBlock();
    return { type: 'FunctionDeclaration', id: { type: 'Identifier', name: id.value }, params, body };
  }

  parseReturnStmt() {
    this.expect(TokenType.KEYWORD, 'return');
    let argument = null;
    if (!this.check(TokenType.PUNCTUATION, ';') &&
        !this.check(TokenType.PUNCTUATION, '}') &&
        !this.check(TokenType.EOF)) {
      argument = this.parseExpr();
    }
    this.match(TokenType.PUNCTUATION, ';');
    return { type: 'ReturnStatement', argument };
  }

  parseBlock() {
    this.expect(TokenType.PUNCTUATION, '{');
    const body = [];
    while (!this.check(TokenType.PUNCTUATION, '}') && !this.check(TokenType.EOF)) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    this.expect(TokenType.PUNCTUATION, '}');
    return { type: 'BlockStatement', body };
  }

  parseParams() {
    const params = [];
    while (!this.check(TokenType.PUNCTUATION, ')') && !this.check(TokenType.EOF)) {
      const p = this.expect(TokenType.IDENTIFIER);
      params.push({ type: 'Identifier', name: p.value });
      if (!this.match(TokenType.PUNCTUATION, ',')) break;
    }
    return params;
  }

  // --- Expressions (precedence climbing) ---

  parseExpr() { return this.parseAssign(); }

  parseAssign() {
    const left = this.parseOr();
    const assignOps = ['=', '+=', '-=', '*=', '/=', '%='];
    const op = this.peek();
    if (op.type === TokenType.OPERATOR && assignOps.includes(op.value)) {
      this.advance();
      const right = this.parseAssign();
      return { type: 'AssignmentExpression', operator: op.value, left, right };
    }
    return left;
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.check(TokenType.OPERATOR, '||')) {
      const op = this.advance().value;
      left = { type: 'LogicalExpression', operator: op, left, right: this.parseAnd() };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseEquality();
    while (this.check(TokenType.OPERATOR, '&&')) {
      const op = this.advance().value;
      left = { type: 'LogicalExpression', operator: op, left, right: this.parseEquality() };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseCompare();
    while (['==', '!=', '===', '!=='].some(op => this.check(TokenType.OPERATOR, op))) {
      const op = this.advance().value;
      left = { type: 'BinaryExpression', operator: op, left, right: this.parseCompare() };
    }
    return left;
  }

  parseCompare() {
    let left = this.parseAddSub();
    while (['<', '>', '<=', '>='].some(op => this.check(TokenType.OPERATOR, op))) {
      const op = this.advance().value;
      left = { type: 'BinaryExpression', operator: op, left, right: this.parseAddSub() };
    }
    return left;
  }

  parseAddSub() {
    let left = this.parseMulDiv();
    while (this.check(TokenType.OPERATOR, '+') || this.check(TokenType.OPERATOR, '-')) {
      const op = this.advance().value;
      left = { type: 'BinaryExpression', operator: op, left, right: this.parseMulDiv() };
    }
    return left;
  }

  parseMulDiv() {
    let left = this.parseUnary();
    while (['*', '/', '%', '**'].some(op => this.check(TokenType.OPERATOR, op))) {
      const op = this.advance().value;
      left = { type: 'BinaryExpression', operator: op, left, right: this.parseUnary() };
    }
    return left;
  }

  parseUnary() {
    if (this.check(TokenType.OPERATOR, '++') || this.check(TokenType.OPERATOR, '--')) {
      const op = this.advance().value;
      const arg = this.parsePostfix();
      return { type: 'UpdateExpression', operator: op, argument: arg, prefix: true };
    }
    if (this.check(TokenType.OPERATOR, '!') ||
        this.check(TokenType.OPERATOR, '-') ||
        this.check(TokenType.OPERATOR, '+')) {
      const op = this.advance().value;
      return { type: 'UnaryExpression', operator: op, operand: this.parseUnary() };
    }
    if (this.check(TokenType.KEYWORD, 'typeof')) {
      this.advance();
      return { type: 'TypeofExpression', operand: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();
    while (true) {
      if (this.match(TokenType.PUNCTUATION, '.')) {
        const prop = this.expect(TokenType.IDENTIFIER);
        expr = { type: 'MemberExpression', object: expr, property: { type: 'Identifier', name: prop.value }, computed: false };
      } else if (this.match(TokenType.PUNCTUATION, '[')) {
        const prop = this.parseExpr();
        this.expect(TokenType.PUNCTUATION, ']');
        expr = { type: 'MemberExpression', object: expr, property: prop, computed: true };
      } else if (this.match(TokenType.PUNCTUATION, '(')) {
        const args = this.parseArgs();
        this.expect(TokenType.PUNCTUATION, ')');
        expr = { type: 'CallExpression', callee: expr, arguments: args };
      } else if (this.check(TokenType.OPERATOR, '++') || this.check(TokenType.OPERATOR, '--')) {
        const op = this.advance().value;
        expr = { type: 'UpdateExpression', operator: op, argument: expr, prefix: false };
      } else {
        break;
      }
    }
    return expr;
  }

  parseArgs() {
    const args = [];
    while (!this.check(TokenType.PUNCTUATION, ')') && !this.check(TokenType.EOF)) {
      args.push(this.parseExpr());
      if (!this.match(TokenType.PUNCTUATION, ',')) break;
    }
    return args;
  }

  parsePrimary() {
    const t = this.peek();

    if (t.type === TokenType.NUMBER) { this.advance(); return { type: 'Literal', value: t.value, kind: 'number' }; }
    if (t.type === TokenType.STRING) { this.advance(); return { type: 'Literal', value: t.value, kind: 'string' }; }
    if (t.type === TokenType.BOOLEAN) { this.advance(); return { type: 'Literal', value: t.value, kind: 'boolean' }; }
    if (t.type === TokenType.NULL) { this.advance(); return { type: 'Literal', value: null, kind: 'null' }; }
    if (t.type === TokenType.UNDEFINED) { this.advance(); return { type: 'Literal', value: undefined, kind: 'undefined' }; }

    // Identifier or arrow function: x => ...
    if (t.type === TokenType.IDENTIFIER) {
      this.advance();
      if (this.check(TokenType.OPERATOR, '=>')) {
        this.advance();
        return this.buildArrowFn([{ type: 'Identifier', name: t.value }]);
      }
      return { type: 'Identifier', name: t.value };
    }

    // Grouped expression or arrow function: (a, b) => ...
    if (t.type === TokenType.PUNCTUATION && t.value === '(') {
      if (this.isArrowFn()) {
        this.advance(); // consume '('
        const params = this.parseParams();
        this.expect(TokenType.PUNCTUATION, ')');
        this.expect(TokenType.OPERATOR, '=>');
        return this.buildArrowFn(params, true);
      }
      this.advance();
      const expr = this.parseExpr();
      this.expect(TokenType.PUNCTUATION, ')');
      return expr;
    }

    if (t.type === TokenType.PUNCTUATION && t.value === '[') return this.parseArrayLit();
    if (t.type === TokenType.PUNCTUATION && t.value === '{') return this.parseObjectLit();

    // Function expression
    if (t.type === TokenType.KEYWORD && t.value === 'function') {
      this.advance();
      let id = null;
      if (this.check(TokenType.IDENTIFIER)) id = { type: 'Identifier', name: this.advance().value };
      this.expect(TokenType.PUNCTUATION, '(');
      const params = this.parseParams();
      this.expect(TokenType.PUNCTUATION, ')');
      const body = this.parseBlock();
      return { type: 'FunctionExpression', id, params, body };
    }

    throw new Error(`Parse error at line ${t.line}: unexpected token '${t.value}'`);
  }

  // Look-ahead: is the next ( ... ) => an arrow function?
  isArrowFn() {
    let depth = 0;
    let p = this.pos;
    while (p < this.tokens.length) {
      const tok = this.tokens[p];
      if (tok.type === TokenType.PUNCTUATION && tok.value === '(') depth++;
      else if (tok.type === TokenType.PUNCTUATION && tok.value === ')') {
        depth--;
        if (depth === 0) {
          const next = this.tokens[p + 1];
          return next && next.type === TokenType.OPERATOR && next.value === '=>';
        }
      }
      p++;
    }
    return false;
  }

  // Build arrow function body (already consumed params and =>)
  buildArrowFn(params, alreadyConsumedArrow = false) {
    if (!alreadyConsumedArrow) {
      // arrow => already consumed by caller in the single-param path
    }
    if (this.check(TokenType.PUNCTUATION, '{')) {
      return { type: 'FunctionExpression', id: null, params, body: this.parseBlock() };
    }
    const expr = this.parseAssign();
    return {
      type: 'FunctionExpression',
      id: null,
      params,
      body: { type: 'BlockStatement', body: [{ type: 'ReturnStatement', argument: expr }] },
    };
  }

  parseArrayLit() {
    this.expect(TokenType.PUNCTUATION, '[');
    const elements = [];
    while (!this.check(TokenType.PUNCTUATION, ']') && !this.check(TokenType.EOF)) {
      if (this.check(TokenType.PUNCTUATION, ',')) { elements.push(null); this.advance(); }
      else { elements.push(this.parseExpr()); this.match(TokenType.PUNCTUATION, ','); }
    }
    this.expect(TokenType.PUNCTUATION, ']');
    return { type: 'ArrayExpression', elements };
  }

  parseObjectLit() {
    this.expect(TokenType.PUNCTUATION, '{');
    const properties = [];
    while (!this.check(TokenType.PUNCTUATION, '}') && !this.check(TokenType.EOF)) {
      let key;
      if (this.peek().type === TokenType.IDENTIFIER || this.peek().type === TokenType.STRING) {
        key = this.advance().value;
      } else if (this.peek().type === TokenType.NUMBER) {
        key = String(this.advance().value);
      } else {
        throw new Error(`Parse error at line ${this.peek().line}: expected object key`);
      }
      this.expect(TokenType.PUNCTUATION, ':');
      const value = this.parseExpr();
      properties.push({ key, value });
      this.match(TokenType.PUNCTUATION, ',');
    }
    this.expect(TokenType.PUNCTUATION, '}');
    return { type: 'ObjectExpression', properties };
  }
}

export function parse(tokens) {
  return new Parser(tokens).parse();
}
