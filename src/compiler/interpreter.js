// Signals for control flow
class ReturnSignal { constructor(v) { this.value = v; } }
class BreakSignal {}
class ContinueSignal {}

// Wraps user-defined functions so we can distinguish from native JS functions
class JSFunction {
  constructor(node, closure) {
    this.node = node;
    this.closure = closure;
  }
}

// Lexical environment (scope)
class Env {
  constructor(parent = null) {
    this.vars = Object.create(null);
    this.parent = parent;
  }
  define(name, value) { this.vars[name] = value; }
  get(name) {
    if (name in this.vars) return this.vars[name];
    if (this.parent) return this.parent.get(name);
    throw new Error(`ReferenceError: ${name} is not defined`);
  }
  set(name, value) {
    if (name in this.vars) { this.vars[name] = value; return value; }
    if (this.parent) return this.parent.set(name, value);
    throw new Error(`ReferenceError: ${name} is not defined`);
  }
}

class Interpreter {
  constructor(onOutput) {
    this.onOutput = onOutput || (() => {});
    this.callDepth = 0;
    this.globalEnv = new Env();
    this.setupGlobals();
  }

  // Helpers
  repr(v) {
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (v instanceof JSFunction) return '[Function]';
    if (typeof v === 'function') return '[Function (native)]';
    if (Array.isArray(v)) return '[' + v.map(x => this.repr(x)).join(', ') + ']';
    if (typeof v === 'object') {
      const pairs = Object.entries(v).map(([k, val]) => `${k}: ${this.repr(val)}`);
      return '{ ' + pairs.join(', ') + ' }';
    }
    return String(v);
  }

  setupGlobals() {
    const G = this.globalEnv;

    G.define('console', {
      log:   (...a) => this.onOutput(a.map(x => this.repr(x)).join(' ')),
      error: (...a) => this.onOutput('[Error] ' + a.map(x => this.repr(x)).join(' ')),
      warn:  (...a) => this.onOutput('[Warn] '  + a.map(x => this.repr(x)).join(' ')),
    });

    G.define('Math', {
      PI: Math.PI, E: Math.E,
      abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round,
      sqrt: Math.sqrt, pow: Math.pow, max: Math.max, min: Math.min,
      log: Math.log, log2: Math.log2, log10: Math.log10,
      sin: Math.sin, cos: Math.cos, tan: Math.tan,
      random: Math.random, trunc: Math.trunc, sign: Math.sign,
    });

    G.define('Number',     v => Number(v));
    G.define('String',     v => String(v));
    G.define('Boolean',    v => Boolean(v));
    G.define('parseInt',   parseInt);
    G.define('parseFloat', parseFloat);
    G.define('isNaN',      isNaN);
    G.define('isFinite',   isFinite);

    G.define('Array', { isArray: Array.isArray });

    G.define('Object', {
      keys:    Object.keys,
      values:  Object.values,
      entries: Object.entries,
      assign:  Object.assign,
    });

    G.define('JSON', {
      stringify: JSON.stringify,
      parse:     JSON.parse,
    });
  }

  // --- Evaluate ---

  eval(node, env) {
    if (!node) return undefined;
    switch (node.type) {
      case 'Program':           return this.evalProgram(node, env);
      case 'VariableDeclaration': return this.evalVarDecl(node, env);
      case 'FunctionDeclaration': return this.evalFuncDecl(node, env);
      case 'ExpressionStatement': return this.eval(node.expression, env);
      case 'BlockStatement':    return this.evalBlock(node, new Env(env));
      case 'IfStatement':       return this.evalIf(node, env);
      case 'WhileStatement':    return this.evalWhile(node, env);
      case 'ForStatement':      return this.evalFor(node, env);
      case 'ReturnStatement': {
        const v = node.argument ? this.eval(node.argument, env) : undefined;
        throw new ReturnSignal(v);
      }
      case 'BreakStatement':    throw new BreakSignal();
      case 'ContinueStatement': throw new ContinueSignal();
      case 'Literal':           return node.value;
      case 'Identifier':        return env.get(node.name);
      case 'BinaryExpression':  return this.evalBinary(node, env);
      case 'LogicalExpression': return this.evalLogical(node, env);
      case 'UnaryExpression':   return this.evalUnary(node, env);
      case 'AssignmentExpression': return this.evalAssign(node, env);
      case 'UpdateExpression':  return this.evalUpdate(node, env);
      case 'CallExpression':    return this.evalCall(node, env);
      case 'MemberExpression':  return this.evalMember(node, env);
      case 'ArrayExpression':   return node.elements.map(el => el ? this.eval(el, env) : undefined);
      case 'ObjectExpression': {
        const obj = {};
        for (const p of node.properties) obj[p.key] = this.eval(p.value, env);
        return obj;
      }
      case 'FunctionExpression': return new JSFunction(node, env);
      case 'TypeofExpression': {
        try {
          const v = this.eval(node.operand, env);
          return typeof v === 'object' && v instanceof JSFunction ? 'function' : typeof v;
        } catch (e) {
          if (e.message && e.message.includes('not defined')) return 'undefined';
          throw e;
        }
      }
      default: throw new Error(`Unknown AST node: ${node.type}`);
    }
  }

  evalProgram(node, env) {
    const g = env || this.globalEnv;
    for (const stmt of node.body) {
      if (stmt) this.eval(stmt, g);
    }
  }

  evalVarDecl(node, env) {
    for (const d of node.declarations) {
      env.define(d.id.name, d.init ? this.eval(d.init, env) : undefined);
    }
  }

  evalFuncDecl(node, env) {
    env.define(node.id.name, new JSFunction(node, env));
  }

  evalBlock(node, env) {
    for (const stmt of node.body) {
      if (stmt) this.eval(stmt, env);
    }
  }

  evalIf(node, env) {
    if (this.eval(node.test, env)) {
      this.eval(node.consequent, env);
    } else if (node.alternate) {
      this.eval(node.alternate, env);
    }
  }

  evalWhile(node, env) {
    while (this.eval(node.test, env)) {
      try { this.eval(node.body, env); }
      catch (e) {
        if (e instanceof BreakSignal) break;
        if (e instanceof ContinueSignal) continue;
        throw e;
      }
    }
  }

  evalFor(node, env) {
    const forEnv = new Env(env);
    if (node.init) this.eval(node.init, forEnv);
    while (true) {
      if (node.test && !this.eval(node.test, forEnv)) break;
      try { this.eval(node.body, forEnv); }
      catch (e) {
        if (e instanceof BreakSignal) break;
        if (e instanceof ContinueSignal) { if (node.update) this.eval(node.update, forEnv); continue; }
        throw e;
      }
      if (node.update) this.eval(node.update, forEnv);
    }
  }

  evalBinary(node, env) {
    const L = this.eval(node.left, env);
    const R = this.eval(node.right, env);
    switch (node.operator) {
      case '+':   return L + R;
      case '-':   return L - R;
      case '*':   return L * R;
      case '/':   return L / R;
      case '%':   return L % R;
      case '**':  return L ** R;
      case '==':  return L == R;   // eslint-disable-line eqeqeq
      case '!=':  return L != R;   // eslint-disable-line eqeqeq
      case '===': return L === R;
      case '!==': return L !== R;
      case '<':   return L < R;
      case '>':   return L > R;
      case '<=':  return L <= R;
      case '>=':  return L >= R;
      default: throw new Error(`Unknown operator: ${node.operator}`);
    }
  }

  evalLogical(node, env) {
    const L = this.eval(node.left, env);
    if (node.operator === '&&') return L ? this.eval(node.right, env) : L;
    if (node.operator === '||') return L ? L : this.eval(node.right, env);
  }

  evalUnary(node, env) {
    const v = this.eval(node.operand, env);
    switch (node.operator) {
      case '-': return -v;
      case '+': return +v;
      case '!': return !v;
      default: throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  evalAssign(node, env) {
    const rhs = this.eval(node.right, env);
    const applyOp = (cur) => {
      switch (node.operator) {
        case '=':  return rhs;
        case '+=': return cur + rhs;
        case '-=': return cur - rhs;
        case '*=': return cur * rhs;
        case '/=': return cur / rhs;
        case '%=': return cur % rhs;
        default: throw new Error(`Unknown assignment op: ${node.operator}`);
      }
    };
    if (node.left.type === 'Identifier') {
      const v = applyOp(node.operator !== '=' ? env.get(node.left.name) : undefined);
      env.set(node.left.name, v);
      return v;
    }
    if (node.left.type === 'MemberExpression') {
      const obj = this.eval(node.left.object, env);
      const prop = node.left.computed
        ? this.eval(node.left.property, env)
        : node.left.property.name;
      const v = applyOp(obj[prop]);
      obj[prop] = v;
      return v;
    }
    throw new Error('Invalid assignment target');
  }

  evalUpdate(node, env) {
    const getSet = (get, set) => {
      const cur = get();
      const next = node.operator === '++' ? cur + 1 : cur - 1;
      set(next);
      return node.prefix ? next : cur;
    };
    if (node.argument.type === 'Identifier') {
      const name = node.argument.name;
      return getSet(() => env.get(name), v => env.set(name, v));
    }
    if (node.argument.type === 'MemberExpression') {
      const obj = this.eval(node.argument.object, env);
      const prop = node.argument.computed
        ? this.eval(node.argument.property, env)
        : node.argument.property.name;
      return getSet(() => obj[prop], v => { obj[prop] = v; });
    }
    throw new Error('Invalid update target');
  }

  evalCall(node, env) {
    let fn, thisVal = null;
    if (node.callee.type === 'MemberExpression') {
      thisVal = this.eval(node.callee.object, env);
      const prop = node.callee.computed
        ? this.eval(node.callee.property, env)
        : node.callee.property.name;
      fn = this.resolveMember(thisVal, prop);
    } else {
      fn = this.eval(node.callee, env);
    }
    const args = node.arguments.map(a => this.eval(a, env));
    return this.callFn(fn, args, thisVal, node);
  }

  callFn(fn, args, thisVal, callNode) {
    if (fn instanceof JSFunction) {
      if (this.callDepth > 500) throw new Error('Maximum call stack size exceeded');
      this.callDepth++;
      const fnEnv = new Env(fn.closure);
      const params = fn.node.params || [];
      for (let i = 0; i < params.length; i++) fnEnv.define(params[i].name, args[i]);
      try {
        this.eval(fn.node.body, fnEnv);
      } catch (e) {
        if (e instanceof ReturnSignal) { this.callDepth--; return e.value; }
        this.callDepth--;
        throw e;
      }
      this.callDepth--;
      return undefined;
    }
    if (typeof fn === 'function') {
      return fn.apply(thisVal, args);
    }
    const name = callNode && callNode.callee.type === 'Identifier' ? callNode.callee.name : '(unknown)';
    throw new Error(`TypeError: ${name} is not a function`);
  }

  evalMember(node, env) {
    const obj = this.eval(node.object, env);
    const prop = node.computed
      ? this.eval(node.property, env)
      : node.property.name;
    return this.resolveMember(obj, prop);
  }

  resolveMember(obj, prop) {
    if (obj === null || obj === undefined) {
      throw new Error(`TypeError: Cannot read property '${prop}' of ${obj}`);
    }

    // String methods
    if (typeof obj === 'string') {
      if (prop === 'length') return obj.length;
      const strMethods = {
        toUpperCase: () => obj.toUpperCase(),
        toLowerCase: () => obj.toLowerCase(),
        trim:        () => obj.trim(),
        trimStart:   () => obj.trimStart(),
        trimEnd:     () => obj.trimEnd(),
        split:       sep  => obj.split(sep),
        join:        sep  => obj.join(sep),  // won't normally apply to string but harmless
        indexOf:     s    => obj.indexOf(s),
        lastIndexOf: s    => obj.lastIndexOf(s),
        includes:    s    => obj.includes(s),
        startsWith:  s    => obj.startsWith(s),
        endsWith:    s    => obj.endsWith(s),
        slice:       (s,e)=> obj.slice(s, e),
        substring:   (s,e)=> obj.substring(s, e),
        replace:     (s,r) => obj.replace(s, r),
        replaceAll:  (s,r) => obj.replaceAll(s, r),
        charAt:      i    => obj.charAt(i),
        charCodeAt:  i    => obj.charCodeAt(i),
        repeat:      n    => obj.repeat(n),
        padStart:    (l,p)=> obj.padStart(l, p),
        padEnd:      (l,p)=> obj.padEnd(l, p),
        at:          i    => obj.at(i),
      };
      if (prop in strMethods) return strMethods[prop];
      return obj[prop];
    }

    // Array methods
    if (Array.isArray(obj)) {
      if (prop === 'length') return obj.length;
      const I = this; // interpreter reference
      const wrapCallback = (fn) => (typeof fn === 'function')
        ? fn
        : (...a) => I.callFn(fn, a, null, null);
      const arrMethods = {
        push:      (...a)  => obj.push(...a),
        pop:       ()      => obj.pop(),
        shift:     ()      => obj.shift(),
        unshift:   (...a)  => obj.unshift(...a),
        splice:    (...a)  => obj.splice(...a),
        slice:     (s,e)   => obj.slice(s, e),
        indexOf:   v       => obj.indexOf(v),
        lastIndexOf:v      => obj.lastIndexOf(v),
        includes:  v       => obj.includes(v),
        join:      sep     => obj.join(sep),
        reverse:   ()      => obj.reverse(),
        flat:      d       => obj.flat(d),
        fill:      (v,s,e) => obj.fill(v, s, e),
        concat:    (...a)  => obj.concat(...a),
        toString:  ()      => obj.toString(),
        at:        i       => obj.at(i),
        sort:    fn => fn ? obj.sort((a,b) => I.callFn(fn, [a,b], null, null)) : obj.sort(),
        map:     fn => obj.map((el,i,a) => I.callFn(fn, [el, i, a], null, null)),
        filter:  fn => obj.filter((el,i,a) => I.callFn(fn, [el, i, a], null, null)),
        find:    fn => obj.find((el,i,a) => I.callFn(fn, [el, i, a], null, null)),
        findIndex:fn=> obj.findIndex((el,i,a) => I.callFn(fn, [el, i, a], null, null)),
        some:    fn => obj.some((el,i,a) => I.callFn(fn, [el, i, a], null, null)),
        every:   fn => obj.every((el,i,a) => I.callFn(fn, [el, i, a], null, null)),
        forEach: fn => { obj.forEach((el,i,a) => I.callFn(fn, [el, i, a], null, null)); return undefined; },
        flatMap: fn => obj.flatMap((el,i,a) => I.callFn(fn, [el, i, a], null, null)),
        reduce:  (fn, init) => init !== undefined
          ? obj.reduce((acc,el,i,a) => I.callFn(fn, [acc,el,i,a], null, null), init)
          : obj.reduce((acc,el,i,a) => I.callFn(fn, [acc,el,i,a], null, null)),
        reduceRight: (fn, init) => init !== undefined
          ? obj.reduceRight((acc,el,i,a) => I.callFn(fn, [acc,el,i,a], null, null), init)
          : obj.reduceRight((acc,el,i,a) => I.callFn(fn, [acc,el,i,a], null, null)),
      };
      if (prop in arrMethods) return arrMethods[prop];
      return obj[prop];
    }

    // Plain object / native object
    const v = obj[prop];
    if (typeof v === 'function') return v.bind(obj);
    return v;
  }
}

export function interpret(ast, onOutput) {
  const interp = new Interpreter(onOutput);
  interp.eval(ast, interp.globalEnv);
}
