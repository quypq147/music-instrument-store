"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/shimmer/index.js
var require_shimmer = __commonJS({
  "node_modules/shimmer/index.js"(exports2, module2) {
    "use strict";
    function isFunction(funktion) {
      return typeof funktion === "function";
    }
    var logger = console.error.bind(console);
    function defineProperty(obj, name, value) {
      var enumerable = !!obj[name] && obj.propertyIsEnumerable(name);
      Object.defineProperty(obj, name, {
        configurable: true,
        enumerable,
        writable: true,
        value
      });
    }
    function shimmer(options) {
      if (options && options.logger) {
        if (!isFunction(options.logger)) logger("new logger isn't a function, not replacing");
        else logger = options.logger;
      }
    }
    function wrap(nodule, name, wrapper) {
      if (!nodule || !nodule[name]) {
        logger("no original function " + name + " to wrap");
        return;
      }
      if (!wrapper) {
        logger("no wrapper function");
        logger(new Error().stack);
        return;
      }
      if (!isFunction(nodule[name]) || !isFunction(wrapper)) {
        logger("original object and wrapper must be functions");
        return;
      }
      var original = nodule[name];
      var wrapped = wrapper(original, name);
      defineProperty(wrapped, "__original", original);
      defineProperty(wrapped, "__unwrap", function() {
        if (nodule[name] === wrapped) defineProperty(nodule, name, original);
      });
      defineProperty(wrapped, "__wrapped", true);
      defineProperty(nodule, name, wrapped);
      return wrapped;
    }
    function massWrap(nodules, names, wrapper) {
      if (!nodules) {
        logger("must provide one or more modules to patch");
        logger(new Error().stack);
        return;
      } else if (!Array.isArray(nodules)) {
        nodules = [nodules];
      }
      if (!(names && Array.isArray(names))) {
        logger("must provide one or more functions to wrap on modules");
        return;
      }
      nodules.forEach(function(nodule) {
        names.forEach(function(name) {
          wrap(nodule, name, wrapper);
        });
      });
    }
    function unwrap(nodule, name) {
      if (!nodule || !nodule[name]) {
        logger("no function to unwrap.");
        logger(new Error().stack);
        return;
      }
      if (!nodule[name].__unwrap) {
        logger("no original to unwrap to -- has " + name + " already been unwrapped?");
      } else {
        return nodule[name].__unwrap();
      }
    }
    function massUnwrap(nodules, names) {
      if (!nodules) {
        logger("must provide one or more modules to patch");
        logger(new Error().stack);
        return;
      } else if (!Array.isArray(nodules)) {
        nodules = [nodules];
      }
      if (!(names && Array.isArray(names))) {
        logger("must provide one or more functions to unwrap on modules");
        return;
      }
      nodules.forEach(function(nodule) {
        names.forEach(function(name) {
          unwrap(nodule, name);
        });
      });
    }
    shimmer.wrap = wrap;
    shimmer.massWrap = massWrap;
    shimmer.unwrap = unwrap;
    shimmer.massUnwrap = massUnwrap;
    module2.exports = shimmer;
  }
});

// node_modules/emitter-listener/listener.js
var require_listener = __commonJS({
  "node_modules/emitter-listener/listener.js"(exports2, module2) {
    "use strict";
    var shimmer = require_shimmer();
    var wrap = shimmer.wrap;
    var unwrap = shimmer.unwrap;
    var SYMBOL = "wrap@before";
    function defineProperty(obj, name, value) {
      var enumerable = !!obj[name] && obj.propertyIsEnumerable(name);
      Object.defineProperty(obj, name, {
        configurable: true,
        enumerable,
        writable: true,
        value
      });
    }
    function _process(self, listeners) {
      var l = listeners.length;
      for (var p = 0; p < l; p++) {
        var listener = listeners[p];
        var before = self[SYMBOL];
        if (typeof before === "function") {
          before(listener);
        } else if (Array.isArray(before)) {
          var length = before.length;
          for (var i = 0; i < length; i++) before[i](listener);
        }
      }
    }
    function _listeners(self, event) {
      var listeners;
      listeners = self._events && self._events[event];
      if (!Array.isArray(listeners)) {
        if (listeners) {
          listeners = [listeners];
        } else {
          listeners = [];
        }
      }
      return listeners;
    }
    function _findAndProcess(self, event, before) {
      var after = _listeners(self, event);
      var unprocessed = after.filter(function(fn) {
        return before.indexOf(fn) === -1;
      });
      if (unprocessed.length > 0) _process(self, unprocessed);
    }
    function _wrap(unwrapped, visit) {
      if (!unwrapped) return;
      var wrapped = unwrapped;
      if (typeof unwrapped === "function") {
        wrapped = visit(unwrapped);
      } else if (Array.isArray(unwrapped)) {
        wrapped = [];
        for (var i = 0; i < unwrapped.length; i++) {
          wrapped[i] = visit(unwrapped[i]);
        }
      }
      return wrapped;
    }
    module2.exports = function wrapEmitter(emitter, onAddListener, onEmit) {
      if (!emitter || !emitter.on || !emitter.addListener || !emitter.removeListener || !emitter.emit) {
        throw new Error("can only wrap real EEs");
      }
      if (!onAddListener) throw new Error("must have function to run on listener addition");
      if (!onEmit) throw new Error("must have function to wrap listeners when emitting");
      function adding(on) {
        return function added(event, listener) {
          var existing = _listeners(this, event).slice();
          try {
            var returned = on.call(this, event, listener);
            _findAndProcess(this, event, existing);
            return returned;
          } finally {
            if (!this.on.__wrapped) wrap(this, "on", adding);
            if (!this.addListener.__wrapped) wrap(this, "addListener", adding);
          }
        };
      }
      function emitting(emit) {
        return function emitted(event) {
          if (!this._events || !this._events[event]) return emit.apply(this, arguments);
          var unwrapped = this._events[event];
          function remover(removeListener) {
            return function removed() {
              this._events[event] = unwrapped;
              try {
                return removeListener.apply(this, arguments);
              } finally {
                unwrapped = this._events[event];
                this._events[event] = _wrap(unwrapped, onEmit);
              }
            };
          }
          wrap(this, "removeListener", remover);
          try {
            this._events[event] = _wrap(unwrapped, onEmit);
            return emit.apply(this, arguments);
          } finally {
            unwrap(this, "removeListener");
            this._events[event] = unwrapped;
          }
        };
      }
      if (!emitter[SYMBOL]) {
        defineProperty(emitter, SYMBOL, onAddListener);
      } else if (typeof emitter[SYMBOL] === "function") {
        defineProperty(emitter, SYMBOL, [emitter[SYMBOL], onAddListener]);
      } else if (Array.isArray(emitter[SYMBOL])) {
        emitter[SYMBOL].push(onAddListener);
      }
      if (!emitter.__wrapped) {
        wrap(emitter, "addListener", adding);
        wrap(emitter, "on", adding);
        wrap(emitter, "emit", emitting);
        defineProperty(emitter, "__unwrap", function() {
          unwrap(emitter, "addListener");
          unwrap(emitter, "on");
          unwrap(emitter, "emit");
          delete emitter[SYMBOL];
          delete emitter.__wrapped;
        });
        defineProperty(emitter, "__wrapped", true);
      }
    };
  }
});

// node_modules/cls-hooked/context.js
var require_context = __commonJS({
  "node_modules/cls-hooked/context.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var assert = require("assert");
    var wrapEmitter = require_listener();
    var async_hooks = require("async_hooks");
    var CONTEXTS_SYMBOL = "cls@contexts";
    var ERROR_SYMBOL = "error@context";
    var DEBUG_CLS_HOOKED = process.env.DEBUG_CLS_HOOKED;
    var currentUid = -1;
    module2.exports = {
      getNamespace,
      createNamespace,
      destroyNamespace,
      reset,
      ERROR_SYMBOL
    };
    function Namespace(name) {
      this.name = name;
      this.active = null;
      this._set = [];
      this.id = null;
      this._contexts = /* @__PURE__ */ new Map();
      this._indent = 0;
    }
    Namespace.prototype.set = function set(key, value) {
      if (!this.active) {
        throw new Error("No context available. ns.run() or ns.bind() must be called first.");
      }
      this.active[key] = value;
      if (DEBUG_CLS_HOOKED) {
        const indentStr = " ".repeat(this._indent < 0 ? 0 : this._indent);
        debug2(indentStr + "CONTEXT-SET KEY:" + key + "=" + value + " in ns:" + this.name + " currentUid:" + currentUid + " active:" + util.inspect(this.active, { showHidden: true, depth: 2, colors: true }));
      }
      return value;
    };
    Namespace.prototype.get = function get(key) {
      if (!this.active) {
        if (DEBUG_CLS_HOOKED) {
          const asyncHooksCurrentId = async_hooks.currentId();
          const triggerId = async_hooks.triggerAsyncId();
          const indentStr = " ".repeat(this._indent < 0 ? 0 : this._indent);
          debug2(`${indentStr}CONTEXT-GETTING KEY NO ACTIVE NS: (${this.name}) ${key}=undefined currentUid:${currentUid} asyncHooksCurrentId:${asyncHooksCurrentId} triggerId:${triggerId} len:${this._set.length}`);
        }
        return void 0;
      }
      if (DEBUG_CLS_HOOKED) {
        const asyncHooksCurrentId = async_hooks.executionAsyncId();
        const triggerId = async_hooks.triggerAsyncId();
        const indentStr = " ".repeat(this._indent < 0 ? 0 : this._indent);
        debug2(indentStr + "CONTEXT-GETTING KEY:" + key + "=" + this.active[key] + " (" + this.name + ") currentUid:" + currentUid + " active:" + util.inspect(this.active, { showHidden: true, depth: 2, colors: true }));
        debug2(`${indentStr}CONTEXT-GETTING KEY: (${this.name}) ${key}=${this.active[key]} currentUid:${currentUid} asyncHooksCurrentId:${asyncHooksCurrentId} triggerId:${triggerId} len:${this._set.length} active:${util.inspect(this.active)}`);
      }
      return this.active[key];
    };
    Namespace.prototype.createContext = function createContext() {
      let context = Object.create(this.active ? this.active : Object.prototype);
      context._ns_name = this.name;
      context.id = currentUid;
      if (DEBUG_CLS_HOOKED) {
        const asyncHooksCurrentId = async_hooks.executionAsyncId();
        const triggerId = async_hooks.triggerAsyncId();
        const indentStr = " ".repeat(this._indent < 0 ? 0 : this._indent);
        debug2(`${indentStr}CONTEXT-CREATED Context: (${this.name}) currentUid:${currentUid} asyncHooksCurrentId:${asyncHooksCurrentId} triggerId:${triggerId} len:${this._set.length} context:${util.inspect(context, { showHidden: true, depth: 2, colors: true })}`);
      }
      return context;
    };
    Namespace.prototype.run = function run(fn) {
      let context = this.createContext();
      this.enter(context);
      try {
        if (DEBUG_CLS_HOOKED) {
          const triggerId = async_hooks.triggerAsyncId();
          const asyncHooksCurrentId = async_hooks.executionAsyncId();
          const indentStr = " ".repeat(this._indent < 0 ? 0 : this._indent);
          debug2(`${indentStr}CONTEXT-RUN BEGIN: (${this.name}) currentUid:${currentUid} triggerId:${triggerId} asyncHooksCurrentId:${asyncHooksCurrentId} len:${this._set.length} context:${util.inspect(context)}`);
        }
        fn(context);
        return context;
      } catch (exception) {
        if (exception) {
          exception[ERROR_SYMBOL] = context;
        }
        throw exception;
      } finally {
        if (DEBUG_CLS_HOOKED) {
          const triggerId = async_hooks.triggerAsyncId();
          const asyncHooksCurrentId = async_hooks.executionAsyncId();
          const indentStr = " ".repeat(this._indent < 0 ? 0 : this._indent);
          debug2(`${indentStr}CONTEXT-RUN END: (${this.name}) currentUid:${currentUid} triggerId:${triggerId} asyncHooksCurrentId:${asyncHooksCurrentId} len:${this._set.length} ${util.inspect(context)}`);
        }
        this.exit(context);
      }
    };
    Namespace.prototype.runAndReturn = function runAndReturn(fn) {
      let value;
      this.run(function(context) {
        value = fn(context);
      });
      return value;
    };
    Namespace.prototype.runPromise = function runPromise(fn) {
      let context = this.createContext();
      this.enter(context);
      let promise = fn(context);
      if (!promise || !promise.then || !promise.catch) {
        throw new Error("fn must return a promise.");
      }
      if (DEBUG_CLS_HOOKED) {
        debug2("CONTEXT-runPromise BEFORE: (" + this.name + ") currentUid:" + currentUid + " len:" + this._set.length + " " + util.inspect(context));
      }
      return promise.then((result) => {
        if (DEBUG_CLS_HOOKED) {
          debug2("CONTEXT-runPromise AFTER then: (" + this.name + ") currentUid:" + currentUid + " len:" + this._set.length + " " + util.inspect(context));
        }
        this.exit(context);
        return result;
      }).catch((err) => {
        err[ERROR_SYMBOL] = context;
        if (DEBUG_CLS_HOOKED) {
          debug2("CONTEXT-runPromise AFTER catch: (" + this.name + ") currentUid:" + currentUid + " len:" + this._set.length + " " + util.inspect(context));
        }
        this.exit(context);
        throw err;
      });
    };
    Namespace.prototype.bind = function bindFactory(fn, context) {
      if (!context) {
        if (!this.active) {
          context = this.createContext();
        } else {
          context = this.active;
        }
      }
      let self = this;
      return function clsBind() {
        self.enter(context);
        try {
          return fn.apply(this, arguments);
        } catch (exception) {
          if (exception) {
            exception[ERROR_SYMBOL] = context;
          }
          throw exception;
        } finally {
          self.exit(context);
        }
      };
    };
    Namespace.prototype.enter = function enter(context) {
      assert.ok(context, "context must be provided for entering");
      if (DEBUG_CLS_HOOKED) {
        const asyncHooksCurrentId = async_hooks.executionAsyncId();
        const triggerId = async_hooks.triggerAsyncId();
        const indentStr = " ".repeat(this._indent < 0 ? 0 : this._indent);
        debug2(`${indentStr}CONTEXT-ENTER: (${this.name}) currentUid:${currentUid} triggerId:${triggerId} asyncHooksCurrentId:${asyncHooksCurrentId} len:${this._set.length} ${util.inspect(context)}`);
      }
      this._set.push(this.active);
      this.active = context;
    };
    Namespace.prototype.exit = function exit(context) {
      assert.ok(context, "context must be provided for exiting");
      if (DEBUG_CLS_HOOKED) {
        const asyncHooksCurrentId = async_hooks.executionAsyncId();
        const triggerId = async_hooks.triggerAsyncId();
        const indentStr = " ".repeat(this._indent < 0 ? 0 : this._indent);
        debug2(`${indentStr}CONTEXT-EXIT: (${this.name}) currentUid:${currentUid} triggerId:${triggerId} asyncHooksCurrentId:${asyncHooksCurrentId} len:${this._set.length} ${util.inspect(context)}`);
      }
      if (this.active === context) {
        assert.ok(this._set.length, "can't remove top context");
        this.active = this._set.pop();
        return;
      }
      let index = this._set.lastIndexOf(context);
      if (index < 0) {
        if (DEBUG_CLS_HOOKED) {
          debug2("??ERROR?? context exiting but not entered - ignoring: " + util.inspect(context));
        }
        assert.ok(index >= 0, "context not currently entered; can't exit. \n" + util.inspect(this) + "\n" + util.inspect(context));
      } else {
        assert.ok(index, "can't remove top context");
        this._set.splice(index, 1);
      }
    };
    Namespace.prototype.bindEmitter = function bindEmitter(emitter) {
      assert.ok(emitter.on && emitter.addListener && emitter.emit, "can only bind real EEs");
      let namespace = this;
      let thisSymbol = "context@" + this.name;
      function attach(listener) {
        if (!listener) {
          return;
        }
        if (!listener[CONTEXTS_SYMBOL]) {
          listener[CONTEXTS_SYMBOL] = /* @__PURE__ */ Object.create(null);
        }
        listener[CONTEXTS_SYMBOL][thisSymbol] = {
          namespace,
          context: namespace.active
        };
      }
      function bind(unwrapped) {
        if (!(unwrapped && unwrapped[CONTEXTS_SYMBOL])) {
          return unwrapped;
        }
        let wrapped = unwrapped;
        let unwrappedContexts = unwrapped[CONTEXTS_SYMBOL];
        Object.keys(unwrappedContexts).forEach(function(name) {
          let thunk = unwrappedContexts[name];
          wrapped = thunk.namespace.bind(wrapped, thunk.context);
        });
        return wrapped;
      }
      wrapEmitter(emitter, attach, bind);
    };
    Namespace.prototype.fromException = function fromException(exception) {
      return exception[ERROR_SYMBOL];
    };
    function getNamespace(name) {
      return process.namespaces[name];
    }
    function createNamespace(name) {
      assert.ok(name, "namespace must be given a name.");
      if (DEBUG_CLS_HOOKED) {
        debug2(`NS-CREATING NAMESPACE (${name})`);
      }
      let namespace = new Namespace(name);
      namespace.id = currentUid;
      const hook = async_hooks.createHook({
        init(asyncId, type, triggerId, resource) {
          currentUid = async_hooks.executionAsyncId();
          if (namespace.active) {
            namespace._contexts.set(asyncId, namespace.active);
            if (DEBUG_CLS_HOOKED) {
              const indentStr = " ".repeat(namespace._indent < 0 ? 0 : namespace._indent);
              debug2(`${indentStr}INIT [${type}] (${name}) asyncId:${asyncId} currentUid:${currentUid} triggerId:${triggerId} active:${util.inspect(namespace.active, { showHidden: true, depth: 2, colors: true })} resource:${resource}`);
            }
          } else if (currentUid === 0) {
            const triggerId2 = async_hooks.triggerAsyncId();
            const triggerIdContext = namespace._contexts.get(triggerId2);
            if (triggerIdContext) {
              namespace._contexts.set(asyncId, triggerIdContext);
              if (DEBUG_CLS_HOOKED) {
                const indentStr = " ".repeat(namespace._indent < 0 ? 0 : namespace._indent);
                debug2(`${indentStr}INIT USING CONTEXT FROM TRIGGERID [${type}] (${name}) asyncId:${asyncId} currentUid:${currentUid} triggerId:${triggerId2} active:${util.inspect(namespace.active, { showHidden: true, depth: 2, colors: true })} resource:${resource}`);
              }
            } else if (DEBUG_CLS_HOOKED) {
              const indentStr = " ".repeat(namespace._indent < 0 ? 0 : namespace._indent);
              debug2(`${indentStr}INIT MISSING CONTEXT [${type}] (${name}) asyncId:${asyncId} currentUid:${currentUid} triggerId:${triggerId2} active:${util.inspect(namespace.active, { showHidden: true, depth: 2, colors: true })} resource:${resource}`);
            }
          }
          if (DEBUG_CLS_HOOKED && type === "PROMISE") {
            debug2(util.inspect(resource, { showHidden: true }));
            const parentId = resource.parentId;
            const indentStr = " ".repeat(namespace._indent < 0 ? 0 : namespace._indent);
            debug2(`${indentStr}INIT RESOURCE-PROMISE [${type}] (${name}) parentId:${parentId} asyncId:${asyncId} currentUid:${currentUid} triggerId:${triggerId} active:${util.inspect(namespace.active, { showHidden: true, depth: 2, colors: true })} resource:${resource}`);
          }
        },
        before(asyncId) {
          currentUid = async_hooks.executionAsyncId();
          let context;
          context = namespace._contexts.get(asyncId) || namespace._contexts.get(currentUid);
          if (context) {
            if (DEBUG_CLS_HOOKED) {
              const triggerId = async_hooks.triggerAsyncId();
              const indentStr = " ".repeat(namespace._indent < 0 ? 0 : namespace._indent);
              debug2(`${indentStr}BEFORE (${name}) asyncId:${asyncId} currentUid:${currentUid} triggerId:${triggerId} active:${util.inspect(namespace.active, { showHidden: true, depth: 2, colors: true })} context:${util.inspect(context)}`);
              namespace._indent += 2;
            }
            namespace.enter(context);
          } else if (DEBUG_CLS_HOOKED) {
            const triggerId = async_hooks.triggerAsyncId();
            const indentStr = " ".repeat(namespace._indent < 0 ? 0 : namespace._indent);
            debug2(`${indentStr}BEFORE MISSING CONTEXT (${name}) asyncId:${asyncId} currentUid:${currentUid} triggerId:${triggerId} active:${util.inspect(namespace.active, { showHidden: true, depth: 2, colors: true })} namespace._contexts:${util.inspect(namespace._contexts, { showHidden: true, depth: 2, colors: true })}`);
            namespace._indent += 2;
          }
        },
        after(asyncId) {
          currentUid = async_hooks.executionAsyncId();
          let context;
          context = namespace._contexts.get(asyncId) || namespace._contexts.get(currentUid);
          if (context) {
            if (DEBUG_CLS_HOOKED) {
              const triggerId = async_hooks.triggerAsyncId();
              namespace._indent -= 2;
              const indentStr = " ".repeat(namespace._indent < 0 ? 0 : namespace._indent);
              debug2(`${indentStr}AFTER (${name}) asyncId:${asyncId} currentUid:${currentUid} triggerId:${triggerId} active:${util.inspect(namespace.active, { showHidden: true, depth: 2, colors: true })} context:${util.inspect(context)}`);
            }
            namespace.exit(context);
          } else if (DEBUG_CLS_HOOKED) {
            const triggerId = async_hooks.triggerAsyncId();
            namespace._indent -= 2;
            const indentStr = " ".repeat(namespace._indent < 0 ? 0 : namespace._indent);
            debug2(`${indentStr}AFTER MISSING CONTEXT (${name}) asyncId:${asyncId} currentUid:${currentUid} triggerId:${triggerId} active:${util.inspect(namespace.active, { showHidden: true, depth: 2, colors: true })} context:${util.inspect(context)}`);
          }
        },
        destroy(asyncId) {
          currentUid = async_hooks.executionAsyncId();
          if (DEBUG_CLS_HOOKED) {
            const triggerId = async_hooks.triggerAsyncId();
            const indentStr = " ".repeat(namespace._indent < 0 ? 0 : namespace._indent);
            debug2(`${indentStr}DESTROY (${name}) currentUid:${currentUid} asyncId:${asyncId} triggerId:${triggerId} active:${util.inspect(namespace.active, { showHidden: true, depth: 2, colors: true })} context:${util.inspect(namespace._contexts.get(currentUid))}`);
          }
          namespace._contexts.delete(asyncId);
        }
      });
      hook.enable();
      process.namespaces[name] = namespace;
      return namespace;
    }
    function destroyNamespace(name) {
      let namespace = getNamespace(name);
      assert.ok(namespace, `can't delete nonexistent namespace! "` + name + '"');
      assert.ok(namespace.id, "don't assign to process.namespaces directly! " + util.inspect(namespace));
      process.namespaces[name] = null;
    }
    function reset() {
      if (process.namespaces) {
        Object.keys(process.namespaces).forEach(function(name) {
          destroyNamespace(name);
        });
      }
      process.namespaces = /* @__PURE__ */ Object.create(null);
    }
    process.namespaces = {};
    function debug2(...args) {
      if (DEBUG_CLS_HOOKED) {
        process._rawDebug(`${util.format(...args)}`);
      }
    }
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/logger.js
var require_logger = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/logger.js"(exports2, module2) {
    "use strict";
    var validLogLevels = ["debug", "info", "warn", "error", "silent"];
    var defaultLogLevel = validLogLevels.indexOf("error");
    var logLevel = calculateLogLevel(process.env.AWS_XRAY_DEBUG_MODE ? "debug" : process.env.AWS_XRAY_LOG_LEVEL);
    var logger = {
      error: createLoggerForLevel("error"),
      info: createLoggerForLevel("info"),
      warn: createLoggerForLevel("warn"),
      debug: createLoggerForLevel("debug")
    };
    function createLoggerForLevel(level) {
      var loggerLevel = validLogLevels.indexOf(level);
      var consoleMethod = console[level] || console.log || (() => {
      });
      if (loggerLevel >= logLevel) {
        return (message, meta) => {
          if (message || meta) {
            consoleMethod(formatLogMessage(level, message, meta));
          }
        };
      } else {
        return () => {
        };
      }
    }
    function calculateLogLevel(level) {
      if (level) {
        var normalisedLevel = level.toLowerCase();
        var index = validLogLevels.indexOf(normalisedLevel);
        return index >= 0 ? index : defaultLogLevel;
      }
      return defaultLogLevel;
    }
    function createTimestamp(date) {
      var tzo = -date.getTimezoneOffset(), dif = tzo >= 0 ? "+" : "-", pad = function(num) {
        var norm = Math.floor(Math.abs(num));
        return (norm < 10 ? "0" : "") + norm;
      };
      return new Date(date.getTime() + tzo * 60 * 1e3).toISOString().replace(/T/, " ").replace(/Z/, " ") + dif + pad(tzo / 60) + ":" + pad(tzo % 60);
    }
    function isLambdaFunction() {
      return process.env.LAMBDA_TASK_ROOT !== void 0;
    }
    function formatLogMessage(level, message, meta) {
      var messageParts = [];
      if (!isLambdaFunction()) {
        messageParts.push(createTimestamp(/* @__PURE__ */ new Date()));
        messageParts.push(`[${level.toUpperCase()}]`);
      }
      if (message) {
        messageParts.push(message);
      }
      var logString = messageParts.join(" ");
      var metaDataString = formatMetaData(meta);
      return [logString, metaDataString].filter((str) => str.length > 0).join("\n  ");
    }
    function formatMetaData(meta) {
      if (!meta) {
        return "";
      }
      return typeof meta === "string" ? meta : JSON.stringify(meta);
    }
    var logging = {
      setLogger: function setLogger(logObj) {
        logger = logObj;
      },
      getLogger: function getLogger() {
        return logger;
      }
    };
    module2.exports = logging;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/attributes/captured_exception.js
var require_captured_exception = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/attributes/captured_exception.js"(exports2, module2) {
    "use strict";
    var crypto = require("crypto");
    function CapturedException(err, remote) {
      this.init(err, remote);
    }
    CapturedException.prototype.init = function init(err, remote) {
      var e = typeof err === "string" || err instanceof String ? { message: err, name: "" } : err;
      this.message = e.message;
      this.type = e.name;
      this.stack = [];
      this.remote = !!remote;
      this.id = crypto.randomBytes(8).toString("hex");
      if (e.stack) {
        var stack = e.stack.split("\n");
        stack.shift();
        stack.forEach((stackline) => {
          var line = stackline.trim().replace(/\(|\)/g, "");
          line = line.substring(line.indexOf(" ") + 1);
          var label = line.lastIndexOf(" ") >= 0 ? line.slice(0, line.lastIndexOf(" ")) : null;
          var path = Array.isArray(label) && !label.length ? line : line.slice(line.lastIndexOf(" ") + 1);
          path = path.split(":");
          var entry = {
            path: path[0],
            line: parseInt(path[1]),
            label: label || "anonymous"
          };
          this.stack.push(entry);
        }, this);
      }
    };
    module2.exports = CapturedException;
  }
});

// node_modules/atomic-batcher/index.js
var require_atomic_batcher = __commonJS({
  "node_modules/atomic-batcher/index.js"(exports2, module2) {
    module2.exports = batcher;
    function batcher(run) {
      var running = false;
      var pendingBatch = null;
      var pendingCallbacks = null;
      var callbacks = null;
      return append;
      function done(err) {
        if (callbacks) callAll(callbacks, err);
        running = false;
        callbacks = pendingCallbacks;
        var nextBatch = pendingBatch;
        pendingBatch = null;
        pendingCallbacks = null;
        if (!nextBatch || !nextBatch.length) {
          if (!callbacks || !callbacks.length) {
            callbacks = null;
            return;
          }
          if (!nextBatch) nextBatch = [];
        }
        running = true;
        run(nextBatch, done);
      }
      function append(val, cb) {
        if (running) {
          if (!pendingBatch) {
            pendingBatch = [];
            pendingCallbacks = [];
          }
          pushAll(pendingBatch, val);
          if (cb) pendingCallbacks.push(cb);
        } else {
          if (cb) callbacks = [cb];
          running = true;
          run(Array.isArray(val) ? val : [val], done);
        }
      }
    }
    function pushAll(list, val) {
      if (Array.isArray(val)) pushArray(list, val);
      else list.push(val);
    }
    function pushArray(list, val) {
      for (var i = 0; i < val.length; i++) list.push(val[i]);
    }
    function callAll(list, err) {
      for (var i = 0; i < list.length; i++) list[i](err);
    }
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/daemon_config.js
var require_daemon_config = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/daemon_config.js"(exports2, module2) {
    "use strict";
    var logger = require_logger();
    var DaemonConfig = {
      udp_ip: "127.0.0.1",
      udp_port: 2e3,
      tcp_ip: "127.0.0.1",
      tcp_port: 2e3,
      setDaemonAddress: function setDaemonAddress(address) {
        if (!process.env.AWS_XRAY_DAEMON_ADDRESS) {
          processAddress(address);
          logger.getLogger().info("Configured daemon address to " + address + ".");
        } else {
          logger.getLogger().warn("Ignoring call to setDaemonAddress as AWS_XRAY_DAEMON_ADDRESS is set. The current daemon address will not be changed.");
        }
      }
    };
    var processAddress = function processAddress2(address) {
      if (address.indexOf(":") === -1) {
        throw new Error("Invalid Daemon Address. You must specify an ip and port.");
      } else {
        var splitAddress = address.split(" ");
        if (splitAddress.length === 1) {
          if (address.indexOf("udp") > -1 || address.indexOf("tcp") > -1) {
            throw new Error("Invalid Daemon Address. You must specify both tcp and udp addresses.");
          }
          var addr = address.split(":");
          if (!addr[0]) {
            throw new Error("Invalid Daemon Address. You must specify an ip.");
          }
          DaemonConfig.udp_ip = addr[0];
          DaemonConfig.tcp_ip = addr[0];
          DaemonConfig.udp_port = addr[1];
          DaemonConfig.tcp_port = addr[1];
        } else if (splitAddress.length === 2) {
          var part_1 = splitAddress[0].split(":");
          var part_2 = splitAddress[1].split(":");
          var addr_map = {};
          addr_map[part_1[0]] = part_1;
          addr_map[part_2[0]] = part_2;
          DaemonConfig.udp_ip = addr_map["udp"][1];
          DaemonConfig.udp_port = parseInt(addr_map["udp"][2]);
          DaemonConfig.tcp_ip = addr_map["tcp"][1];
          DaemonConfig.tcp_port = parseInt(addr_map["tcp"][2]);
          if (!DaemonConfig.udp_port || !DaemonConfig.tcp_port) {
            throw new Error("Invalid Daemon Address. You must specify port number.");
          }
        }
      }
    };
    if (process.env.AWS_XRAY_DAEMON_ADDRESS) {
      processAddress(process.env.AWS_XRAY_DAEMON_ADDRESS);
    }
    module2.exports = DaemonConfig;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segment_emitter.js
var require_segment_emitter = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segment_emitter.js"(exports2, module2) {
    "use strict";
    var dgram = require("dgram");
    var batcher = require_atomic_batcher();
    var logger = require_logger();
    var PROTOCOL_HEADER = '{"format":"json","version":1}';
    var PROTOCOL_DELIMITER = "\n";
    function batchSendData(ops, callback) {
      var client = dgram.createSocket("udp4");
      executeSendData(client, ops, 0, function() {
        try {
          client.close();
        } finally {
          callback();
        }
      });
    }
    function executeSendData(client, ops, index, callback) {
      if (index >= ops.length) {
        callback();
        return;
      }
      sendMessage(client, ops[index], function() {
        executeSendData(client, ops, index + 1, callback);
      });
    }
    function sendMessage(client, data, batchCallback) {
      var msg = data.msg;
      var offset = data.offset;
      var length = data.length;
      var port = data.port;
      var address = data.address;
      var callback = data.callback;
      client.send(msg, offset, length, port, address, function(err) {
        try {
          callback(err);
        } finally {
          batchCallback();
        }
      });
    }
    function BatchingTemporarySocket() {
      this.batchSend = batcher(batchSendData);
    }
    BatchingTemporarySocket.prototype.send = function(msg, offset, length, port, address, callback) {
      var work = {
        msg,
        offset,
        length,
        port,
        address,
        callback
      };
      this.batchSend(work);
    };
    var SegmentEmitter = {
      daemonConfig: require_daemon_config(),
      /**
       * Returns the formatted segment JSON string.
       * @param {Segment} segment - The segment to format.
       */
      format: function format(segment) {
        return PROTOCOL_HEADER + PROTOCOL_DELIMITER + segment.toString();
      },
      /**
       * Creates a UDP socket connection and send the formatted segment.
       * @param {Segment} segment - The segment to send to the daemon.
       */
      send: function send(segment) {
        if (!this.socket) {
          if (this.useBatchingTemporarySocket) {
            this.socket = new BatchingTemporarySocket();
          } else {
            this.socket = dgram.createSocket("udp4").unref();
          }
        }
        var client = this.socket;
        var formatted = segment.format();
        var data = PROTOCOL_HEADER + PROTOCOL_DELIMITER + formatted;
        var message = Buffer.from(data);
        var short = '{"trace_id:"' + segment.trace_id + '","id":"' + segment.id + '"}';
        var type = segment.type === "subsegment" ? "Subsegment" : "Segment";
        client.send(message, 0, message.length, this.daemonConfig.udp_port, this.daemonConfig.udp_ip, function(err) {
          if (err) {
            if (err.code === "EMSGSIZE") {
              logger.getLogger().error(type + " too large to send: " + short + " (" + message.length + " bytes).");
            } else {
              logger.getLogger().error("Error occured sending segment: ", err);
            }
          } else {
            logger.getLogger().debug(type + ' sent: {"trace_id:"' + segment.trace_id + '","id":"' + segment.id + '"}');
            logger.getLogger().debug("UDP message sent: " + segment);
          }
        });
      },
      /**
       * Configures the address and/or port the daemon is expected to be on.
       * @param {string} address - Address of the daemon the segments should be sent to. Should be formatted as an IPv4 address.
       * @module SegmentEmitter
       * @function setDaemonAddress
       */
      setDaemonAddress: function setDaemonAddress(address) {
        this.daemonConfig.setDaemonAddress(address);
      },
      /**
       * Get the UDP IP the emitter is configured to.
       * @module SegmentEmitter
       * @function getIp
       */
      getIp: function getIp() {
        return this.daemonConfig.udp_ip;
      },
      /**
       * Get the UDP port the emitter is configured to.
       * @module SegmentEmitter
       * @function getPort
       */
      getPort: function getPort() {
        return this.daemonConfig.udp_port;
      },
      /**
       * Forces the segment emitter to create a new socket on send, and close it on complete.
       * @module SegmentEmitter
       * @function disableReusableSocket
       */
      disableReusableSocket: function() {
        this.useBatchingTemporarySocket = true;
      }
    };
    module2.exports = SegmentEmitter;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/attributes/trace_id.js
var require_trace_id = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/attributes/trace_id.js"(exports2, module2) {
    "use strict";
    var crypto = require("crypto");
    var logger = require_logger();
    var TraceID = class _TraceID {
      /**
       * Constructs a new trace ID using the current time.
       * @param {string} [tsHex] - time stamp to use for trace ID in hexadecimal format
       * @param {string} [numberhex] - string of hexadecimal characters for random portion of Trace ID
       * @constructor
       */
      constructor(tsHex, numberhex) {
        this.version = 1;
        this.timestamp = tsHex || Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3).toString(16);
        this.id = numberhex || crypto.randomBytes(12).toString("hex");
      }
      /**
       * @returns {TraceID} - a hardcoded trace ID using zeroed timestamp and random ID
       */
      static Invalid() {
        return new _TraceID("00000000", "000000000000000000000000");
      }
      /**
       * Constructs a new trace ID from provided string. If no string is provided or the provided string is invalid,
       * log an error but a new trace ID still returned. This can be used as a trace ID string validator.
       * @param {string} [rawID] - string to create a Trace ID object from.
       */
      static FromString(rawID) {
        const DELIMITER = "-";
        var traceID = new _TraceID();
        var version, timestamp;
        if (!rawID || typeof rawID !== "string") {
          logger.getLogger().error("Empty or non-string trace ID provided");
          return traceID;
        }
        const parts = rawID.trim().split(DELIMITER);
        if (parts.length !== 3) {
          logger.getLogger().error("Unrecognized trace ID format");
          return traceID;
        }
        version = parseInt(parts[0]);
        if (isNaN(version) || version < 1) {
          logger.getLogger().error("Trace ID version must be positive integer");
          return traceID;
        }
        timestamp = parseInt(parts[1], 16).toString(16);
        if (timestamp === "NaN") {
          logger.getLogger().error("Trace ID timestamp must be a hex-encoded value");
          return traceID;
        } else {
          timestamp = timestamp.padStart(8, "0");
        }
        traceID.version = version;
        traceID.timestamp = timestamp;
        traceID.id = parts[2];
        return traceID;
      }
      /**
       * Returns a string representation of the trace ID.
       * @returns {string} - stringified trace ID, e.g. 1-57fbe041-2c7ad569f5d6ff149137be86
       */
      toString() {
        return `${this.version.toString()}-${this.timestamp}-${this.id}`;
      }
    };
    module2.exports = TraceID;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/utils.js
var require_utils = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/utils.js"(exports2, module2) {
    "use strict";
    var crypto = require("crypto");
    var logger = require_logger();
    var TraceID = require_trace_id();
    var utils = {
      /**
       * Checks a HTTP response code, where 4xx are 'error' and 5xx are 'fault'.
       * @param {string} status - the HTTP response status code.
       * @returns [string] - 'error', 'fault' or nothing on no match
       * @alias module:utils.getCauseTypeFromHttpStatus
       */
      getCauseTypeFromHttpStatus: function getCauseTypeFromHttpStatus(status) {
        var stat = status.toString();
        if (stat.match(/^[4][0-9]{2}$/) !== null) {
          return "error";
        } else if (stat.match(/^[5][0-9]{2}$/) !== null) {
          return "fault";
        }
      },
      /**
       * Removes the query string parameters from a given http request path
       * as it may contain sensitive information
       *
       * Related issue: https://github.com/aws/aws-xray-sdk-node/issues/246
       *
       * Node documentation: https://nodejs.org/api/http.html#http_http_request_url_options_callback
       *
       * @param {string} path - options.path in a http.request callback
       * @returns [string] - removes query string element from path
       * @alias module:utils.stripQueryStringFromPath
       */
      stripQueryStringFromPath: function stripQueryStringFromPath(path) {
        return path ? path.split("?")[0] : "";
      },
      /**
       * Performs a case-insensitive wildcard match against two strings. This method works with pseduo-regex chars; specifically ? and * are supported.
       *   An asterisk (*) represents any combination of characters
       *   A question mark (?) represents any single character
       *
       * @param {string} pattern - the regex-like pattern to be compared against.
       * @param {string} text - the string to compare against the pattern.
       * @returns boolean
       * @alias module:utils.wildcardMatch
       */
      wildcardMatch: function wildcardMatch(pattern, text) {
        if (pattern === void 0 || text === void 0) {
          return false;
        }
        if (pattern.length === 1 && pattern.charAt(0) === "*") {
          return true;
        }
        var patternLength = pattern.length;
        var textLength = text.length;
        var indexOfGlob = pattern.indexOf("*");
        pattern = pattern.toLowerCase();
        text = text.toLowerCase();
        if (indexOfGlob === -1 || indexOfGlob === patternLength - 1) {
          var match = function simpleWildcardMatch() {
            var j2 = 0;
            for (var i2 = 0; i2 < patternLength; i2++) {
              var patternChar2 = pattern.charAt(i2);
              if (patternChar2 === "*") {
                return true;
              } else if (patternChar2 === "?") {
                if (j2 === textLength) {
                  return false;
                }
                j2++;
              } else {
                if (j2 >= textLength || patternChar2 != text.charAt(j2)) {
                  return false;
                }
                j2++;
              }
            }
            return j2 === textLength;
          };
          return match();
        }
        var matchArray = [];
        matchArray[0] = true;
        for (var j = 0; j < patternLength; j++) {
          var i;
          var patternChar = pattern.charAt(j);
          if (patternChar != "*") {
            for (i = textLength - 1; i >= 0; i--) {
              matchArray[i + 1] = !!matchArray[i] && (patternChar === "?" || patternChar === text.charAt(i));
            }
          } else {
            i = 0;
            while (i <= textLength && !matchArray[i]) {
              i++;
            }
            for (i; i <= textLength; i++) {
              matchArray[i] = true;
            }
          }
          matchArray[0] = matchArray[0] && patternChar === "*";
        }
        return matchArray[textLength];
      },
      LambdaUtils: {
        validTraceData: function(xAmznTraceId) {
          var valid = false;
          if (xAmznTraceId) {
            var data = utils.processTraceData(xAmznTraceId);
            valid = !!(data && data.root && data.parent && data.sampled);
          }
          return valid;
        },
        /**
         * Populates trace ID, parent ID, and sampled decision of given segment. Will always populate valid values,
         * even if xAmznTraceId contains missing or invalid values. This ensures downstream services receive valid
         * headers.
         * @param {Segment} segment - Facade segment to be populated
         * @param {String} xAmznTraceId - Raw Trace Header to supply trace data
         * @returns {Boolean} - true if required fields are present and Trace ID is valid, false otherwise
         */
        populateTraceData: function(segment, xAmznTraceId) {
          logger.getLogger().debug("Lambda trace data found: " + xAmznTraceId);
          let traceData = utils.processTraceData(xAmznTraceId);
          var valid = false;
          if (!traceData) {
            traceData = {};
            logger.getLogger().error("_X_AMZN_TRACE_ID is empty or has an invalid format");
          } else if (traceData.root && !traceData.parent && !traceData.sampled) {
            segment.noOp = true;
            valid = true;
          } else if (!traceData.root || !traceData.parent || !traceData.sampled) {
            logger.getLogger().error("_X_AMZN_TRACE_ID is missing required information");
          } else {
            valid = true;
          }
          segment.trace_id = TraceID.FromString(traceData.root).toString();
          segment.id = traceData.parent || crypto.randomBytes(8).toString("hex");
          if (traceData.root && segment.trace_id !== traceData.root) {
            logger.getLogger().error("_X_AMZN_TRACE_ID contains invalid trace ID");
            valid = false;
          }
          if (!parseInt(traceData.sampled)) {
            segment.notTraced = true;
          } else {
            delete segment.notTraced;
          }
          if (traceData.data) {
            segment.additionalTraceData = traceData.data;
          }
          logger.getLogger().debug("Segment started: " + JSON.stringify(traceData));
          return valid;
        }
      },
      /**
       * Splits out the data from the trace id format.  Used by the middleware.
       * @param {String} traceData - The additional trace data (typically in req.headers.x-amzn-trace-id).
       * @returns {object}
       * @alias module:mw_utils.processTraceData
       */
      processTraceData: function processTraceData(traceData) {
        var amznTraceData = {};
        var data = {};
        var reservedKeywords = ["root", "parent", "sampled", "self"];
        var remainingBytes = 256;
        if (!(typeof traceData === "string" && traceData)) {
          return amznTraceData;
        }
        traceData.split(";").forEach(function(header) {
          if (!header) {
            return;
          }
          var pair = header.split("=");
          if (pair[0] && pair[1]) {
            let key = pair[0].trim();
            let value = pair[1].trim();
            let lowerCaseKey = key.toLowerCase();
            let reserved = reservedKeywords.indexOf(lowerCaseKey) !== -1;
            if (reserved) {
              amznTraceData[lowerCaseKey] = value;
            } else if (!reserved && remainingBytes - (lowerCaseKey.length + value.length) >= 0) {
              data[key] = value;
              remainingBytes -= key.length + value.length;
            }
          }
        });
        amznTraceData["data"] = data;
        return amznTraceData;
      },
      /**
       * Makes a shallow copy of an object without given keys - keeps prototype
       * @param {Object} obj - The object to copy
       * @param {string[]} [keys=[]] - The keys that won't be copied
       * @param {boolean} [preservePrototype=false] - If true also copy prototype properties
       * @returns {}
       */
      objectWithoutProperties: function objectWithoutProperties(obj, keys, preservePrototype) {
        keys = Array.isArray(keys) ? keys : [];
        preservePrototype = typeof preservePrototype === "boolean" ? preservePrototype : false;
        var target = preservePrototype ? Object.create(Object.getPrototypeOf(obj)) : {};
        for (var property in obj) {
          if (keys.indexOf(property) >= 0) {
            continue;
          }
          if (!Object.prototype.hasOwnProperty.call(obj, property)) {
            continue;
          }
          target[property] = obj[property];
        }
        return target;
      },
      /**
       * Safely gets an integer from a string or number
       * @param {String | Number} - input to cast to integer
       * @returns {Number} - Integer representation of input, or 0 if input is not castable to int
       */
      safeParseInt: (val) => {
        if (!val || isNaN(val)) {
          return 0;
        }
        return parseInt(val);
      }
    };
    module2.exports = utils;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/segment_utils.js
var require_segment_utils = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/segment_utils.js"(exports2, module2) {
    "use strict";
    var { safeParseInt } = require_utils();
    var logger = require_logger();
    var DEFAULT_STREAMING_THRESHOLD = 100;
    var utils = {
      streamingThreshold: DEFAULT_STREAMING_THRESHOLD,
      getCurrentTime: function getCurrentTime() {
        return Date.now() / 1e3;
      },
      setOrigin: function setOrigin(origin) {
        this.origin = origin;
      },
      setPluginData: function setPluginData(pluginData) {
        this.pluginData = pluginData;
      },
      setSDKData: function setSDKData(sdkData) {
        this.sdkData = sdkData;
      },
      setServiceData: function setServiceData(serviceData) {
        this.serviceData = serviceData;
      },
      /**
       * Overrides the default streaming threshold (100).
       * The threshold represents the maximum number of subsegments on a single segment before
       * the SDK beings to send the completed subsegments out of band of the main segment.
       * Reduce this threshold if you see the 'Segment too large to send' error.
       * @param {number} threshold - The new threshold to use.
       * @memberof AWSXRay
       */
      setStreamingThreshold: function setStreamingThreshold(threshold) {
        if (isFinite(threshold) && threshold >= 0) {
          utils.streamingThreshold = threshold;
          logger.getLogger().debug("Subsegment streaming threshold set to: " + threshold);
        } else {
          logger.getLogger().error("Invalid threshold: " + threshold + ". Must be a whole number >= 0.");
        }
      },
      getStreamingThreshold: function getStreamingThreshold() {
        return utils.streamingThreshold;
      },
      /**
       * Parses an HTTP response object to return an X-Ray compliant HTTP response object.
       * @param {http.ServerResponse} res
       * @returns {Object} - X-Ray response object to be added to (sub)segment
       */
      getHttpResponseData: (res) => {
        const ret = {};
        if (!res) {
          return ret;
        }
        const status = safeParseInt(res.statusCode);
        if (status !== 0) {
          ret.status = status;
        }
        if (res.headers && res.headers["content-length"]) {
          ret.content_length = safeParseInt(res.headers["content-length"]);
        }
        return ret;
      },
      getJsonStringifyReplacer: () => (_, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      }
    };
    module2.exports = utils;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/attributes/remote_request_data.js
var require_remote_request_data = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/attributes/remote_request_data.js"(exports2, module2) {
    "use strict";
    var { getHttpResponseData } = require_segment_utils();
    var { stripQueryStringFromPath } = require_utils();
    function RemoteRequestData(req, res, downstreamXRayEnabled) {
      this.init(req, res, downstreamXRayEnabled);
    }
    RemoteRequestData.prototype.init = function init(req, res, downstreamXRayEnabled) {
      this.request = {
        url: req.agent && req.agent.protocol ? req.agent.protocol + "//" + (req.host || req.getHeader("host")) + stripQueryStringFromPath(req.path) : "",
        method: req.method || ""
      };
      if (downstreamXRayEnabled) {
        this.request.traced = true;
      }
      if (res) {
        this.response = getHttpResponseData(res);
      }
    };
    module2.exports = RemoteRequestData;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/attributes/subsegment.js
var require_subsegment = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/attributes/subsegment.js"(exports2, module2) {
    "use strict";
    var crypto = require("crypto");
    var CapturedException = require_captured_exception();
    var RemoteRequestData = require_remote_request_data();
    var SegmentEmitter = require_segment_emitter();
    var SegmentUtils = require_segment_utils();
    var Utils = require_utils();
    var logger = require_logger();
    function Subsegment(name) {
      this.init(name);
    }
    Subsegment.prototype.init = function init(name) {
      if (typeof name != "string") {
        throw new Error("Subsegment name must be of type string.");
      }
      this.id = crypto.randomBytes(8).toString("hex");
      this.name = name;
      this.start_time = SegmentUtils.getCurrentTime();
      this.in_progress = true;
      this.counter = 0;
      this.notTraced = false;
    };
    Subsegment.prototype.addNewSubsegment = function addNewSubsegment(name) {
      const subsegment = new Subsegment(name);
      this.addSubsegment(subsegment);
      return subsegment;
    };
    Subsegment.prototype.addSubsegmentWithoutSampling = function addSubsegmentWithoutSampling(subsegment) {
      this.addSubsegment(subsegment);
      subsegment.notTraced = true;
    };
    Subsegment.prototype.addNewSubsegmentWithoutSampling = function addNewSubsegmentWithoutSampling(name) {
      const subsegment = new Subsegment(name);
      this.addSubsegment(subsegment);
      subsegment.notTraced = true;
      return subsegment;
    };
    Subsegment.prototype.addSubsegment = function(subsegment) {
      if (!(subsegment instanceof Subsegment)) {
        throw new Error("Failed to add subsegment:" + subsegment + ' to subsegment "' + this.name + '".  Not a subsegment.');
      }
      if (this.subsegments === void 0) {
        this.subsegments = [];
      }
      subsegment.segment = this.segment;
      subsegment.parent = this;
      subsegment.notTraced = subsegment.parent.notTraced;
      subsegment.noOp = subsegment.parent.noOp;
      if (subsegment.end_time === void 0) {
        this.incrementCounter(subsegment.counter);
      }
      this.subsegments.push(subsegment);
    };
    Subsegment.prototype.removeSubsegment = function removeSubsegment(subsegment) {
      if (!(subsegment instanceof Subsegment)) {
        throw new Error("Failed to remove subsegment:" + subsegment + ' from subsegment "' + this.name + '".  Not a subsegment.');
      }
      if (this.subsegments !== void 0) {
        var index = this.subsegments.indexOf(subsegment);
        if (index >= 0) {
          this.subsegments.splice(index, 1);
        }
      }
    };
    Subsegment.prototype.addAttribute = function addAttribute(name, data) {
      this[name] = data;
    };
    Subsegment.prototype.addPrecursorId = function(id) {
      if (typeof id !== "string") {
        logger.getLogger().error("Failed to add id:" + id + " to subsegment " + this.name + ".  Precursor Ids must be of type string.");
      }
      if (this.precursor_ids === void 0) {
        this.precursor_ids = [];
      }
      this.precursor_ids.push(id);
    };
    Subsegment.prototype.addAnnotation = function(key, value) {
      if (typeof value !== "boolean" && typeof value !== "string" && !isFinite(value)) {
        logger.getLogger().error("Failed to add annotation key: " + key + " value: " + value + " to subsegment " + this.name + ". Value must be of type string, number or boolean.");
        return;
      }
      if (typeof key !== "string") {
        logger.getLogger().error("Failed to add annotation key: " + key + " value: " + value + " to subsegment " + this.name + ". Key must be of type string.");
        return;
      }
      if (this.annotations === void 0) {
        this.annotations = {};
      }
      this.annotations[key] = value;
    };
    Subsegment.prototype.addMetadata = function(key, value, namespace) {
      if (typeof key !== "string") {
        logger.getLogger().error("Failed to add metadata key: " + key + " value: " + value + " to subsegment " + this.name + ". Key must be of type string.");
        return;
      }
      if (namespace && typeof namespace !== "string") {
        logger.getLogger().error("Failed to add metadata key: " + key + " value: " + value + " to subsegment " + this.name + ". Namespace must be of type string.");
        return;
      }
      var ns = namespace || "default";
      if (!this.metadata) {
        this.metadata = {};
      }
      if (!this.metadata[ns]) {
        this.metadata[ns] = {};
      }
      if (ns !== "__proto__") {
        this.metadata[ns][key] = value !== null && value !== void 0 ? value : "";
      }
    };
    Subsegment.prototype.addSqlData = function addSqlData(sqlData) {
      this.sql = sqlData;
    };
    Subsegment.prototype.addError = function addError(err, remote) {
      if (err == null || typeof err !== "object" && typeof err !== "string") {
        logger.getLogger().error("Failed to add error:" + err + ' to subsegment "' + this.name + '".  Not an object or string literal.');
        return;
      }
      this.addFaultFlag();
      if (this.segment && this.segment.exception) {
        if (err === this.segment.exception.ex) {
          this.fault = true;
          this.cause = { id: this.segment.exception.cause, exceptions: [] };
          return;
        }
        delete this.segment.exception;
      }
      if (this.segment) {
        this.segment.exception = {
          ex: err,
          cause: this.id
        };
      } else {
      }
      if (this.cause === void 0) {
        this.cause = {
          working_directory: process.cwd(),
          exceptions: []
        };
      }
      this.cause.exceptions.unshift(new CapturedException(err, remote));
    };
    Subsegment.prototype.addRemoteRequestData = function addRemoteRequestData(req, res, downstreamXRayEnabled) {
      this.http = new RemoteRequestData(req, res, downstreamXRayEnabled);
      if ("traced" in this.http.request) {
        this.traced = this.http.request.traced;
        delete this.http.request.traced;
      }
    };
    Subsegment.prototype.addFaultFlag = function addFaultFlag() {
      this.fault = true;
    };
    Subsegment.prototype.addErrorFlag = function addErrorFlag() {
      this.error = true;
    };
    Subsegment.prototype.addThrottleFlag = function addThrottleFlag() {
      this.throttle = true;
    };
    Subsegment.prototype.close = function close(err, remote) {
      var root = this.segment;
      this.end_time = SegmentUtils.getCurrentTime();
      delete this.in_progress;
      if (err) {
        this.addError(err, remote);
      }
      if (this.parent) {
        this.parent.decrementCounter();
      }
      if (root && root.counter > SegmentUtils.getStreamingThreshold()) {
        if (this.streamSubsegments() && this.parent) {
          this.parent.removeSubsegment(this);
        }
      }
    };
    Subsegment.prototype.incrementCounter = function incrementCounter(additional) {
      this.counter = additional ? this.counter + additional + 1 : this.counter + 1;
      if (this.parent) {
        this.parent.incrementCounter(additional);
      }
    };
    Subsegment.prototype.decrementCounter = function decrementCounter() {
      this.counter--;
      if (this.parent) {
        this.parent.decrementCounter();
      }
    };
    Subsegment.prototype.isClosed = function isClosed() {
      return !this.in_progress;
    };
    Subsegment.prototype.flush = function flush() {
      if (!this.parent || !this.segment) {
        logger.getLogger().error("Failed to flush subsegment: " + this.name + ". Subsegment must be added to a segment chain to flush.");
        return;
      }
      if (this.segment.trace_id) {
        if (this.segment.notTraced !== true && !this.notTraced) {
          SegmentEmitter.send(this);
        } else {
          logger.getLogger().debug("Ignoring flush on subsegment " + this.id + ". Associated segment is marked as not sampled.");
        }
      } else {
        logger.getLogger().debug("Ignoring flush on subsegment " + this.id + ". Associated segment is missing a trace ID.");
      }
    };
    Subsegment.prototype.streamSubsegments = function streamSubsegments() {
      if (this.isClosed() && this.counter <= 0) {
        this.flush();
        return true;
      } else if (this.subsegments && this.subsegments.length > 0) {
        var open = [];
        this.subsegments.forEach(function(child) {
          if (!child.streamSubsegments()) {
            open.push(child);
          }
        });
        this.subsegments = open;
      }
    };
    Subsegment.prototype.format = function format() {
      this.type = "subsegment";
      if (this.parent) {
        this.parent_id = this.parent.id;
      }
      if (this.segment) {
        this.trace_id = this.segment.trace_id;
      }
      return this.serialize();
    };
    Subsegment.prototype.toString = function toString() {
      return this.serialize();
    };
    Subsegment.prototype.toJSON = function toJSON() {
      var ignore = ["segment", "parent", "counter"];
      if (this.subsegments == null || this.subsegments.length === 0) {
        ignore.push("subsegments");
      }
      var thisCopy = Utils.objectWithoutProperties(this, ignore, false);
      return thisCopy;
    };
    Subsegment.prototype.serialize = function serialize(object) {
      return JSON.stringify(object !== null && object !== void 0 ? object : this, SegmentUtils.getJsonStringifyReplacer());
    };
    module2.exports = Subsegment;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/segment.js
var require_segment = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/segment.js"(exports2, module2) {
    "use strict";
    var crypto = require("crypto");
    var CapturedException = require_captured_exception();
    var SegmentEmitter = require_segment_emitter();
    var SegmentUtils = require_segment_utils();
    var Subsegment = require_subsegment();
    var TraceID = require_trace_id();
    var Utils = require_utils();
    var logger = require_logger();
    function Segment(name, rootId, parentId) {
      this.init(name, rootId, parentId);
    }
    Segment.prototype.init = function init(name, rootId, parentId) {
      if (typeof name != "string") {
        throw new Error("Segment name must be of type string.");
      }
      var traceId;
      if (rootId && typeof rootId == "string") {
        traceId = TraceID.FromString(rootId);
      } else {
        traceId = new TraceID();
      }
      var id = crypto.randomBytes(8).toString("hex");
      var startTime = SegmentUtils.getCurrentTime();
      this.trace_id = traceId.toString();
      this.id = id;
      this.start_time = startTime;
      this.name = name || "";
      this.in_progress = true;
      this.counter = 0;
      if (parentId) {
        this.parent_id = parentId;
      }
      if (SegmentUtils.serviceData) {
        this.setServiceData(SegmentUtils.serviceData);
      }
      if (SegmentUtils.pluginData) {
        this.addPluginData(SegmentUtils.pluginData);
      }
      if (SegmentUtils.origin) {
        this.origin = SegmentUtils.origin;
      }
      if (SegmentUtils.sdkData) {
        this.setSDKData(SegmentUtils.sdkData);
      }
    };
    Segment.prototype.addIncomingRequestData = function addIncomingRequestData(data) {
      this.http = data;
    };
    Segment.prototype.addAnnotation = function addAnnotation(key, value) {
      if (typeof value !== "boolean" && typeof value !== "string" && !isFinite(value)) {
        logger.getLogger().error("Failed to add annotation key: " + key + " value: " + value + " to subsegment " + this.name + ". Value must be of type string, number or boolean.");
        return;
      }
      if (typeof key !== "string") {
        logger.getLogger().error("Failed to add annotation key: " + key + " value: " + value + " to subsegment " + this.name + ". Key must be of type string.");
        return;
      }
      if (this.annotations === void 0) {
        this.annotations = {};
      }
      this.annotations[key] = value;
    };
    Segment.prototype.setUser = function(user) {
      if (typeof user !== "string") {
        logger.getLogger().error("Set user: " + user + " failed. User IDs must be of type string.");
      }
      this.user = user;
    };
    Segment.prototype.addMetadata = function(key, value, namespace) {
      if (typeof key !== "string") {
        logger.getLogger().error("Failed to add metadata key: " + key + " value: " + value + " to segment " + this.name + ". Key must be of type string.");
        return;
      }
      if (namespace && typeof namespace !== "string") {
        logger.getLogger().error("Failed to add metadata key: " + key + " value: " + value + " to segment " + this.name + ". Namespace must be of type string.");
        return;
      }
      var ns = namespace || "default";
      if (!this.metadata) {
        this.metadata = {};
      }
      if (!this.metadata[ns]) {
        this.metadata[ns] = {};
      }
      if (ns !== "__proto__") {
        this.metadata[ns][key] = value !== null && value !== void 0 ? value : "";
      }
    };
    Segment.prototype.setSDKData = function setSDKData(data) {
      if (!data) {
        logger.getLogger().error("Add SDK data: " + data + " failed.Must not be empty.");
        return;
      }
      if (!this.aws) {
        this.aws = {};
      }
      this.aws.xray = data;
    };
    Segment.prototype.setMatchedSamplingRule = function setMatchedSamplingRule(ruleName) {
      if (this.aws) {
        this.aws = JSON.parse(JSON.stringify(this.aws));
      }
      if (this.aws && this.aws["xray"]) {
        this.aws.xray["rule_name"] = ruleName;
      } else {
        this.aws = { xray: { "rule_name": ruleName } };
      }
    };
    Segment.prototype.setServiceData = function setServiceData(data) {
      if (!data) {
        logger.getLogger().error("Add service data: " + data + " failed.Must not be empty.");
        return;
      }
      this.service = data;
    };
    Segment.prototype.addPluginData = function addPluginData(data) {
      if (this.aws === void 0) {
        this.aws = {};
      }
      Object.assign(this.aws, data);
    };
    Segment.prototype.addNewSubsegment = function addNewSubsegment(name) {
      var subsegment = new Subsegment(name);
      this.addSubsegment(subsegment);
      return subsegment;
    };
    Segment.prototype.addSubsegmentWithoutSampling = function addSubsegmentWithoutSampling(subsegment) {
      this.addSubsegment(subsegment);
      subsegment.notTraced = true;
    };
    Segment.prototype.addNewSubsegmentWithoutSampling = function addNewSubsegmentWithoutSampling(name) {
      const subsegment = new Subsegment(name);
      this.addSubsegment(subsegment);
      subsegment.notTraced = true;
      return subsegment;
    };
    Segment.prototype.addSubsegment = function addSubsegment(subsegment) {
      if (!(subsegment instanceof Subsegment)) {
        throw new Error("Cannot add subsegment: " + subsegment + ". Not a subsegment.");
      }
      if (this.subsegments === void 0) {
        this.subsegments = [];
      }
      subsegment.segment = this;
      subsegment.parent = this;
      subsegment.notTraced = subsegment.parent.notTraced;
      subsegment.noOp = subsegment.parent.noOp;
      this.subsegments.push(subsegment);
      if (!subsegment.end_time) {
        this.incrementCounter(subsegment.counter);
      }
    };
    Segment.prototype.removeSubsegment = function removeSubsegment(subsegment) {
      if (!(subsegment instanceof Subsegment)) {
        throw new Error("Failed to remove subsegment:" + subsegment + ' from subsegment "' + this.name + '".  Not a subsegment.');
      }
      if (this.subsegments !== void 0) {
        var index = this.subsegments.indexOf(subsegment);
        if (index >= 0) {
          this.subsegments.splice(index, 1);
        }
      }
    };
    Segment.prototype.addError = function addError(err, remote) {
      if (err == null || typeof err !== "object" && typeof err !== "string") {
        logger.getLogger().error("Failed to add error:" + err + ' to subsegment "' + this.name + '".  Not an object or string literal.');
        return;
      }
      this.addFaultFlag();
      if (this.exception) {
        if (err === this.exception.ex) {
          this.cause = { id: this.exception.cause };
          delete this.exception;
          return;
        }
        delete this.exception;
      }
      if (this.cause === void 0) {
        this.cause = {
          working_directory: process.cwd(),
          exceptions: []
        };
      }
      this.cause.exceptions.push(new CapturedException(err, remote));
    };
    Segment.prototype.addFaultFlag = function addFaultFlag() {
      this.fault = true;
    };
    Segment.prototype.addErrorFlag = function addErrorFlag() {
      this.error = true;
    };
    Segment.prototype.addThrottleFlag = function addThrottleFlag() {
      this.throttle = true;
    };
    Segment.prototype.isClosed = function isClosed() {
      return !this.in_progress;
    };
    Segment.prototype.incrementCounter = function incrementCounter(additional) {
      this.counter = additional ? this.counter + additional + 1 : this.counter + 1;
      if (this.counter > SegmentUtils.streamingThreshold && this.subsegments && this.subsegments.length > 0) {
        var open = [];
        this.subsegments.forEach(function(child) {
          if (!child.streamSubsegments()) {
            open.push(child);
          }
        });
        this.subsegments = open;
      }
    };
    Segment.prototype.decrementCounter = function decrementCounter() {
      this.counter--;
      if (this.counter <= 0 && this.isClosed()) {
        this.flush();
      }
    };
    Segment.prototype.close = function(err, remote) {
      if (!this.end_time) {
        this.end_time = SegmentUtils.getCurrentTime();
      }
      if (err !== void 0) {
        this.addError(err, remote);
      }
      delete this.in_progress;
      delete this.exception;
      if (this.counter <= 0) {
        this.flush();
      }
    };
    Segment.prototype.flush = function flush() {
      if (this.notTraced !== true) {
        delete this.exception;
        var thisCopy = Utils.objectWithoutProperties(this, ["counter", "notTraced"], true);
        SegmentEmitter.send(thisCopy);
      }
    };
    Segment.prototype.format = function format() {
      var ignore = ["segment", "parent", "counter"];
      if (this.subsegments == null || this.subsegments.length === 0) {
        ignore.push("subsegments");
      }
      var thisCopy = Utils.objectWithoutProperties(this, ignore, false);
      return this.serialize(thisCopy);
    };
    Segment.prototype.toString = function toString() {
      return this.serialize();
    };
    Segment.prototype.serialize = function serialize(object) {
      return JSON.stringify(object !== null && object !== void 0 ? object : this, SegmentUtils.getJsonStringifyReplacer());
    };
    module2.exports = Segment;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/context_utils.js
var require_context_utils = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/context_utils.js"(exports2, module2) {
    "use strict";
    var cls = require_context();
    var logger = require_logger();
    var Segment = require_segment();
    var Subsegment = require_subsegment();
    var cls_mode = true;
    var NAMESPACE = "AWSXRay";
    var SEGMENT = "segment";
    var contextOverride = false;
    var contextUtils = {
      CONTEXT_MISSING_STRATEGY: {
        RUNTIME_ERROR: {
          contextMissing: function contextMissingRuntimeError(message) {
            throw new Error(message);
          }
        },
        LOG_ERROR: {
          contextMissing: function contextMissingLogError(message) {
            var err = new Error(message);
            logger.getLogger().error(err.stack);
          }
        },
        IGNORE_ERROR: {
          contextMissing: function contextMissingIgnoreError() {
          }
        }
      },
      contextMissingStrategy: {},
      /**
       * Resolves the segment or subsegment given manual mode and params on the call required.
       * @param [Segment|Subsegment] segment - The segment manually provided via params.XraySegment, if provided.
       * @returns {Segment|Subsegment}
       * @alias module:context_utils.resolveManualSegmentParams
       */
      resolveManualSegmentParams: function resolveManualSegmentParams(params) {
        if (params && !contextUtils.isAutomaticMode()) {
          var xraySegment = params.XRaySegment || params.XraySegment;
          var segment = params.Segment;
          var found = null;
          if (xraySegment && (xraySegment instanceof Segment || xraySegment instanceof Subsegment)) {
            found = xraySegment;
            delete params.XRaySegment;
            delete params.XraySegment;
          } else if (segment && (segment instanceof Segment || segment instanceof Subsegment)) {
            found = segment;
            delete params.Segment;
          }
          return found;
        }
      },
      /**
       * Gets current CLS namespace for X-Ray SDK or creates one if absent.
       * @returns {Namespace}
       * @alias module:context_utils.getNamespace
       */
      getNamespace: function getNamespace() {
        return cls.getNamespace(NAMESPACE) || cls.createNamespace(NAMESPACE);
      },
      /**
       * Resolves the segment or subsegment given manual or automatic mode.
       * @param [Segment|Subsegment] segment - The segment manually provided, if provided.
       * @returns {Segment|Subsegment}
       * @alias module:context_utils.resolveSegment
       */
      resolveSegment: function resolveSegment(segment) {
        if (cls_mode) {
          return this.getSegment();
        } else if (segment && !cls_mode) {
          return segment;
        } else if (!segment && !cls_mode) {
          contextUtils.contextMissingStrategy.contextMissing("No sub/segment specified. A sub/segment must be provided for manual mode.");
        }
      },
      /**
       * Returns the current segment or subsegment.  For use with in automatic mode only.
       * @returns {Segment|Subsegment}
       * @alias module:context_utils.getSegment
       */
      getSegment: function getSegment() {
        if (cls_mode) {
          var segment = contextUtils.getNamespace(NAMESPACE).get(SEGMENT);
          if (!segment) {
            contextUtils.contextMissingStrategy.contextMissing("Failed to get the current sub/segment from the context.");
          } else if (segment instanceof Segment && process.env.LAMBDA_TASK_ROOT && segment.facade == true) {
            segment.resolveLambdaTraceData();
          }
          return segment;
        } else {
          contextUtils.contextMissingStrategy.contextMissing("Cannot get sub/segment from context. Not supported in manual mode.");
        }
      },
      /**
       * Sets the current segment or subsegment.  For use with in automatic mode only.
       * @param [Segment|Subsegment] segment - The sub/segment to set.
       * @returns {Segment|Subsegment}
       * @alias module:context_utils.setSegment
       */
      setSegment: function setSegment(segment) {
        if (cls_mode) {
          if (!contextUtils.getNamespace(NAMESPACE).set(SEGMENT, segment)) {
            logger.getLogger().warn("Failed to set the current sub/segment on the context.");
          }
        } else {
          contextUtils.contextMissingStrategy.contextMissing("Cannot set sub/segment on context. Not supported in manual mode.");
        }
      },
      /**
       * Returns true if in automatic mode, otherwise false.
       * @returns {Segment|Subsegment}
       * @alias module:context_utils.isAutomaticMode
       */
      isAutomaticMode: function isAutomaticMode() {
        return cls_mode;
      },
      /**
       * Enables automatic mode. Automatic mode uses 'cls-hooked'.
       * @see https://github.com/jeff-lewis/cls-hooked
       * @alias module:context_utils.enableAutomaticMode
       */
      enableAutomaticMode: function enableAutomaticMode() {
        cls_mode = true;
        contextUtils.getNamespace(NAMESPACE);
        logger.getLogger().debug("Overriding AWS X-Ray SDK mode. Set to automatic mode.");
      },
      /**
       * Disables automatic mode. Current segment or subsegment then must be passed manually
       * via the parent optional on captureFunc, captureAsyncFunc etc.
       * @alias module:context_utils.enableManualMode
       */
      enableManualMode: function enableManualMode() {
        cls_mode = false;
        if (cls.getNamespace(NAMESPACE)) {
          cls.destroyNamespace(NAMESPACE);
        }
        logger.getLogger().debug("Overriding AWS X-Ray SDK mode. Set to manual mode.");
      },
      /**
       * Sets the context missing strategy if no context missing strategy is set using the environment variable with
       * key AWS_XRAY_CONTEXT_MISSING. The context missing strategy's contextMissing function will be called whenever
       * trace context is not found.
       * @param {string|function} strategy - The strategy to set. Valid string values are 'LOG_ERROR' and 'RUNTIME_ERROR'.
       *                                     Alternatively, a custom function can be supplied, which takes a error message string.
       */
      setContextMissingStrategy: function setContextMissingStrategy(strategy) {
        if (!contextOverride) {
          if (typeof strategy === "string") {
            var lookupStrategy = contextUtils.CONTEXT_MISSING_STRATEGY[strategy.toUpperCase()];
            if (lookupStrategy) {
              contextUtils.contextMissingStrategy.contextMissing = lookupStrategy.contextMissing;
              if (process.env.AWS_XRAY_CONTEXT_MISSING) {
                logger.getLogger().debug("AWS_XRAY_CONTEXT_MISSING is set. Configured context missing strategy to " + process.env.AWS_XRAY_CONTEXT_MISSING + ".");
              } else {
                logger.getLogger().debug("Configured context missing strategy to: " + strategy);
              }
            } else {
              throw new Error("Invalid context missing strategy: " + strategy + ". Valid values are " + Object.keys(contextUtils.CONTEXT_MISSING_STRATEGY) + ".");
            }
          } else if (typeof strategy === "function") {
            contextUtils.contextMissingStrategy.contextMissing = strategy;
            logger.getLogger().info("Configured custom context missing strategy to function: " + strategy.name);
          } else {
            throw new Error("Context missing strategy must be either a string or a custom function.");
          }
        } else {
          logger.getLogger().warn("Ignoring call to setContextMissingStrategy as AWS_XRAY_CONTEXT_MISSING is set. The current context missing strategy will not be changed.");
        }
      }
    };
    if (process.env.AWS_XRAY_MANUAL_MODE) {
      cls_mode = false;
      logger.getLogger().debug("Starting the AWS X-Ray SDK in manual mode.");
    } else {
      cls.createNamespace(NAMESPACE);
      logger.getLogger().debug("Starting the AWS X-Ray SDK in automatic mode (default).");
    }
    if (process.env.AWS_XRAY_CONTEXT_MISSING) {
      contextUtils.setContextMissingStrategy(process.env.AWS_XRAY_CONTEXT_MISSING);
      contextOverride = true;
    } else {
      contextUtils.contextMissingStrategy.contextMissing = contextUtils.CONTEXT_MISSING_STRATEGY.LOG_ERROR.contextMissing;
      logger.getLogger().debug("Using default context missing strategy: LOG_ERROR");
    }
    module2.exports = contextUtils;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/incoming_request_data.js
var require_incoming_request_data = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/incoming_request_data.js"(exports2, module2) {
    "use strict";
    var { getHttpResponseData } = require_segment_utils();
    function IncomingRequestData(req) {
      this.init(req);
    }
    IncomingRequestData.prototype.init = function init(req) {
      var forwarded = !!req.headers["x-forwarded-for"];
      var url;
      if (req.connection) {
        url = (req.connection.secure || req.connection.encrypted ? "https://" : "http://") + ((req.headers["host"] || "") + (req.url || ""));
      }
      this.request = {
        method: req.method || "",
        user_agent: req.headers["user-agent"] || "",
        client_ip: getClientIp(req) || "",
        url: url || ""
      };
      if (forwarded) {
        this.request.x_forwarded_for = forwarded;
      }
    };
    var getClientIp = function getClientIp2(req) {
      var clientIp;
      if (req.headers["x-forwarded-for"]) {
        clientIp = (req.headers["x-forwarded-for"] || "").split(",")[0];
      } else if (req.connection && req.connection.remoteAddress) {
        clientIp = req.connection.remoteAddress;
      } else if (req.socket && req.socket.remoteAddress) {
        clientIp = req.socket.remoteAddress;
      } else if (req.connection && req.connection.socket && req.connection.socket.remoteAddress) {
        clientIp = req.connection.socket.remoteAddress;
      }
      return clientIp;
    };
    IncomingRequestData.prototype.close = function close(res) {
      this.response = getHttpResponseData(res);
    };
    module2.exports = IncomingRequestData;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/local_reservoir.js
var require_local_reservoir = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/local_reservoir.js"(exports2, module2) {
    "use strict";
    function LocalReservoir(fixedTarget, fallbackRate) {
      this.init(fixedTarget, fallbackRate);
    }
    LocalReservoir.prototype.init = function init(fixedTarget, fallbackRate) {
      this.usedThisSecond = 0;
      if (typeof fixedTarget === "number" && fixedTarget % 1 === 0 && fixedTarget >= 0) {
        this.fixedTarget = fixedTarget;
      } else {
        throw new Error('Error in sampling file. Rule attribute "fixed_target" must be a non-negative integer.');
      }
      if (typeof fallbackRate === "number" && fallbackRate >= 0 && fallbackRate <= 1) {
        this.fallbackRate = fallbackRate;
      } else {
        throw new Error('Error in sampling file. Rule attribute "rate" must be a number between 0 and 1 inclusive.');
      }
    };
    LocalReservoir.prototype.isSampled = function isSampled() {
      var now = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3);
      if (now !== this.thisSecond) {
        this.usedThisSecond = 0;
        this.thisSecond = now;
      }
      if (this.usedThisSecond >= this.fixedTarget) {
        return Math.random() < this.fallbackRate;
      }
      this.usedThisSecond++;
      return true;
    };
    module2.exports = LocalReservoir;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/resources/default_sampling_rules.json
var require_default_sampling_rules = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/resources/default_sampling_rules.json"(exports2, module2) {
    module2.exports = {
      default: {
        fixed_target: 1,
        rate: 0.05
      },
      version: 2
    };
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/local_sampler.js
var require_local_sampler = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/local_sampler.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var LocalReservoir = require_local_reservoir();
    var Utils = require_utils();
    var defaultRules = require_default_sampling_rules();
    var logger = require_logger();
    var LocalSampler = {
      /**
       * Makes a sample decision based on the sample request.
       * @param {object} sampleRequest - Contains information for rules matching.
       * @module LocalSampler
       * @function shouldSample
       */
      shouldSample: function shouldSample(sampleRequest) {
        var host = sampleRequest.host;
        var httpMethod = sampleRequest.httpMethod;
        var urlPath = sampleRequest.urlPath;
        var formatted = "{ http_method: " + httpMethod + ", host: " + host + ", url_path: " + urlPath + " }";
        var matched;
        this.rules.some(function(rule) {
          if (rule.default || (host == null || Utils.wildcardMatch(rule.host, host) && (httpMethod == null || Utils.wildcardMatch(rule.http_method, httpMethod)) && (urlPath == null || Utils.wildcardMatch(rule.url_path, urlPath)))) {
            matched = rule.reservoir;
            logger.getLogger().debug("Local sampling rule match found for " + formatted + ". Matched " + (rule.default ? "default" : "{ http_method: " + rule.http_method + ", host: " + rule.host + ", url_path: " + rule.url_path + " }") + ". Using fixed_target: " + matched.fixedTarget + " and rate: " + matched.fallbackRate + ".");
            return true;
          }
        });
        if (matched) {
          return matched.isSampled();
        } else {
          logger.getLogger().debug("No sampling rule matched for " + formatted);
          return false;
        }
      },
      /**
       * Set local rules for making sampling decisions.
       * @module LocalSampler
       * @function setLocalRules
       */
      setLocalRules: function setLocalRules(source) {
        if (source) {
          if (typeof source === "string") {
            logger.getLogger().info("Using custom sampling rules file: " + source);
            this.rules = loadRulesConfig(JSON.parse(fs.readFileSync(source, "utf8")));
          } else {
            logger.getLogger().info("Using custom sampling rules source.");
            this.rules = loadRulesConfig(source);
          }
        } else {
          this.rules = parseRulesConfig(defaultRules);
        }
      }
    };
    var loadRulesConfig = function loadRulesConfig2(config) {
      if (!config.version) {
        throw new Error('Error in sampling file. Missing "version" attribute.');
      }
      if (config.version === 1 || config.version === 2) {
        return parseRulesConfig(config);
      } else {
        throw new Error('Error in sampling file. Unknown version "' + config.version + '".');
      }
    };
    var parseRulesConfig = function parseRulesConfig2(config) {
      var defaultRule;
      var rules = [];
      if (config.default) {
        var missing = [];
        for (var key in config.default) {
          if (key !== "fixed_target" && key !== "rate") {
            throw new Error("Error in sampling file. Invalid attribute for default: " + key + '. Valid attributes for default are "fixed_target" and "rate".');
          } else if (typeof config.default[key] !== "number") {
            throw new Error("Error in sampling file. Default " + key + " must be a number.");
          }
        }
        if (typeof config.default.fixed_target === "undefined") {
          missing.push("fixed_target");
        }
        if (typeof config.default.rate === "undefined") {
          missing.push("rate");
        }
        if (missing.length !== 0) {
          throw new Error("Error in sampling file. Missing required attributes for default: " + missing + ".");
        }
        defaultRule = { default: true, reservoir: new LocalReservoir(config.default.fixed_target, config.default.rate) };
      } else {
        throw new Error('Error in sampling file. Expecting "default" object to be defined with attributes "fixed_target" and "rate".');
      }
      if (Array.isArray(config.rules)) {
        config.rules.forEach(function(rawRule) {
          var params = {};
          var required;
          if (config.version === 2) {
            required = { host: 1, http_method: 1, url_path: 1, fixed_target: 1, rate: 1 };
          }
          if (config.version === 1) {
            required = { service_name: 1, http_method: 1, url_path: 1, fixed_target: 1, rate: 1 };
          }
          for (var key2 in rawRule) {
            var value = rawRule[key2];
            if (!required[key2] && key2 != "description") {
              throw new Error("Error in sampling file. Rule " + JSON.stringify(rawRule) + " has invalid attribute: " + key2 + ".");
            } else if (key2 != "description" && !value && value !== 0) {
              throw new Error("Error in sampling file. Rule " + JSON.stringify(rawRule) + ' attribute "' + key2 + '" has invalid value: ' + value + ".");
            } else {
              if (config.version === 2) {
                params[key2] = value;
              }
              if (config.version === 1 && key2 === "service_name") {
                params["host"] = value;
              } else {
                params[key2] = value;
              }
              delete required[key2];
            }
          }
          if (Object.keys(required).length !== 0 && required.constructor === Object) {
            throw new Error("Error in sampling file. Rule " + JSON.stringify(rawRule) + " is missing required attributes: " + Object.keys(required) + ".");
          }
          var rule = params;
          rule.reservoir = new LocalReservoir(rawRule.fixed_target, rawRule.rate);
          rules.push(rule);
        });
      }
      rules.push(defaultRule);
      return rules;
    };
    LocalSampler.setLocalRules();
    module2.exports = LocalSampler;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/reservoir.js
var require_reservoir = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/reservoir.js"(exports2, module2) {
    "use strict";
    function Reservoir() {
      this.init();
    }
    Reservoir.prototype.init = function init() {
      this.quota = null;
      this.TTL = null;
      this.takenThisSec = 0;
      this.borrowedThisSec = 0;
      this.reportInterval = 1;
      this.reportElapsed = 0;
    };
    Reservoir.prototype.borrowOrTake = function borrowOrTake(now, canBorrow) {
      this.adjustThisSec(now);
      if (this.quota >= 0 && this.TTL >= now) {
        if (this.takenThisSec >= this.quota) {
          return false;
        }
        this.takenThisSec++;
        return "take";
      }
      if (canBorrow) {
        if (this.borrowedThisSec >= 1) {
          return false;
        }
        this.borrowedThisSec++;
        return "borrow";
      }
    };
    Reservoir.prototype.adjustThisSec = function adjustThisSec(now) {
      if (now !== this.thisSec) {
        this.takenThisSec = 0;
        this.borrowedThisSec = 0;
        this.thisSec = now;
      }
    };
    Reservoir.prototype.loadNewQuota = function loadNewQuota(quota, TTL, interval) {
      if (quota) {
        this.quota = quota;
      }
      if (TTL) {
        this.TTL = TTL;
      }
      if (interval) {
        this.reportInterval = interval / 10;
      }
    };
    Reservoir.prototype.timeToReport = function timeToReport() {
      if (this.reportElapsed + 1 >= this.reportInterval) {
        this.reportElapsed = 0;
        return true;
      } else {
        this.reportElapsed += 1;
        return false;
      }
    };
    module2.exports = Reservoir;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/sampling_rule.js
var require_sampling_rule = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/sampling_rule.js"(exports2, module2) {
    "use strict";
    var Utils = require_utils();
    var Reservoir = require_reservoir();
    function SamplingRule(name, priority, rate, reservoirSize, host, httpMethod, urlPath, serviceName, serviceType) {
      this.init(name, priority, rate, reservoirSize, host, httpMethod, urlPath, serviceName, serviceType);
    }
    SamplingRule.prototype.init = function init(name, priority, rate, reservoirSize, host, httpMethod, urlPath, serviceName, serviceType) {
      this.name = name;
      this.priority = priority;
      this.rate = rate;
      this.host = host;
      this.httpMethod = httpMethod;
      this.urlPath = urlPath;
      this.serviceName = serviceName;
      this.serviceType = serviceType;
      this.reservoir = new Reservoir();
      this.borrow = !!reservoirSize;
      this.resetStatistics();
    };
    SamplingRule.prototype.match = function match(sampleRequest) {
      var host = sampleRequest.host;
      var httpMethod = sampleRequest.httpMethod;
      var serviceName = sampleRequest.serviceName;
      var urlPath = sampleRequest.urlPath;
      var serviceType = sampleRequest.serviceType;
      return this.isDefault() || (!host || Utils.wildcardMatch(this.host, host)) && (!httpMethod || Utils.wildcardMatch(this.httpMethod, httpMethod)) && (!serviceName || Utils.wildcardMatch(this.serviceName, serviceName)) && (!urlPath || Utils.wildcardMatch(this.urlPath, urlPath)) && (!serviceType || Utils.wildcardMatch(this.serviceType, serviceType));
    };
    SamplingRule.prototype.snapshotStatistics = function snapshotStatistics() {
      var statistics = {
        requestCount: this.requestCount,
        borrowCount: this.borrowCount,
        sampledCount: this.sampledCount
      };
      this.resetStatistics();
      return statistics;
    };
    SamplingRule.prototype.merge = function merge(rule) {
      this.reservoir = rule.reservoir;
      this.requestCount = rule.requestCount;
      this.borrowCount = rule.borrowCount;
      this.sampledCount = rule.sampledCount;
      rule = null;
    };
    SamplingRule.prototype.isDefault = function isDefault() {
      return this.name === "Default";
    };
    SamplingRule.prototype.incrementRequestCount = function incrementRequestCount() {
      this.requestCount++;
    };
    SamplingRule.prototype.incrementBorrowCount = function incrementBorrowCount() {
      this.borrowCount++;
    };
    SamplingRule.prototype.incrementSampledCount = function incrementSampledCount() {
      this.sampledCount++;
    };
    SamplingRule.prototype.setRate = function setRate(rate) {
      this.rate = rate;
    };
    SamplingRule.prototype.getRate = function getRate() {
      return this.rate;
    };
    SamplingRule.prototype.getName = function getName() {
      return this.name;
    };
    SamplingRule.prototype.getPriority = function getPriority() {
      return this.priority;
    };
    SamplingRule.prototype.getReservoir = function getReservoir() {
      return this.reservoir;
    };
    SamplingRule.prototype.resetStatistics = function resetStatistics() {
      this.requestCount = 0;
      this.borrowCount = 0;
      this.sampledCount = 0;
    };
    SamplingRule.prototype.canBorrow = function canBorrow() {
      return this.borrow;
    };
    SamplingRule.prototype.everMatched = function everMatched() {
      return this.requestCount > 0;
    };
    SamplingRule.prototype.timeToReport = function timeToReport() {
      return this.reservoir.timeToReport();
    };
    module2.exports = SamplingRule;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/service_connector.js
var require_service_connector = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/service_connector.js"(exports2, module2) {
    "use strict";
    var crypto = require("crypto");
    var logger = require_logger();
    var SamplingRule = require_sampling_rule();
    var DaemonConfig = require_daemon_config();
    var util = require("util");
    var http = require("http");
    var ServiceConnector = {
      // client_id is a 12 byte cryptographically secure random hex
      // identifying the SDK instance and is generated during SDK initialization/
      // This is required when reporting sampling to X-Ray back-end.
      clientId: crypto.randomBytes(12).toString("hex"),
      samplingRulesPath: "/GetSamplingRules",
      samplingTargetsPath: "/SamplingTargets",
      logger,
      httpClient: http,
      fetchSamplingRules: function fetchSamplingRules(callback) {
        const body = "{}";
        const options = getOptions(this.samplingRulesPath, body.length);
        const httpReq = this.httpClient.__request ? this.httpClient.__request : this.httpClient.request;
        const req = httpReq(options, (res) => {
          var data = "";
          res.on("data", (d) => {
            data += d;
          });
          res.on("error", (error) => {
            callback(error);
          });
          res.on("end", () => {
            var dataObj;
            try {
              dataObj = JSON.parse(data);
            } catch (err) {
              callback(err);
              return;
            }
            if (!dataObj) {
              callback(new Error("AWS X-Ray GetSamplingRules API returned empty response"));
              return;
            }
            var newRules = assembleRules(dataObj);
            callback(null, newRules);
          });
        });
        req.on("error", () => {
          callback(new Error(`Failed to connect to X-Ray daemon at ${options.hostname}:${options.port} to get sampling rules.`));
        });
        req.write(body);
        req.end();
      },
      fetchTargets: function fetchTargets(rules, callback) {
        const body = JSON.stringify(constructStatisticsDocs(rules));
        const options = getOptions(this.samplingTargetsPath, body.length);
        const httpReq = this.httpClient.__request ? this.httpClient.__request : this.httpClient.request;
        const req = httpReq(options, (res) => {
          var data = "";
          res.on("data", (d) => {
            data += d;
          });
          res.on("error", (error) => {
            callback(error);
          });
          res.on("end", () => {
            var dataObj;
            try {
              dataObj = JSON.parse(data);
            } catch (err) {
              callback(err);
              return;
            }
            if (!dataObj || typeof dataObj["LastRuleModification"] != "number") {
              callback(new Error("AWS X-Ray SamplingTargets API returned invalid response"));
              return;
            }
            var targetsMapping = assembleTargets(dataObj);
            var ruleFreshness = dateToEpoch(dataObj["LastRuleModification"]);
            callback(null, targetsMapping, ruleFreshness);
          });
        });
        req.on("error", () => {
          callback(new Error(`Failed to connect to X-Ray daemon at ${options.hostname}:${options.port} to get sampling targets.`));
        });
        req.write(body);
        req.end();
      }
    };
    var constructStatisticsDocs = function constructStatisticsDocs2(rules) {
      var documents = [];
      var now = Math.floor((/* @__PURE__ */ new Date()).getTime() / 1e3);
      rules.forEach(function(rule) {
        var statistics = rule.snapshotStatistics();
        var doc = {
          "RuleName": rule.getName(),
          "ClientID": ServiceConnector.clientId,
          "RequestCount": statistics.requestCount,
          "BorrowCount": statistics.borrowCount,
          "SampledCount": statistics.sampledCount,
          "Timestamp": now
        };
        documents.push(doc);
      });
      return { SamplingStatisticsDocuments: documents };
    };
    var assembleRules = function assembleRules2(data) {
      var newRules = [];
      var ruleList = data["SamplingRuleRecords"] || [];
      ruleList.forEach(function(ruleRecord) {
        ruleRecord = ruleRecord["SamplingRule"];
        if (isRuleValid(ruleRecord)) {
          var newRule = new SamplingRule(ruleRecord["RuleName"], ruleRecord["Priority"], ruleRecord["FixedRate"], ruleRecord["ReservoirSize"], ruleRecord["Host"], ruleRecord["HTTPMethod"], ruleRecord["URLPath"], ruleRecord["ServiceName"], ruleRecord["ServiceType"]);
          newRules.push(newRule);
        }
      });
      return newRules;
    };
    var assembleTargets = function assembleTargets2(data) {
      var docs = data["SamplingTargetDocuments"] || [];
      var targetsMapping = {};
      docs.forEach(function(doc) {
        var newTarget = {
          rate: doc["FixedRate"],
          quota: doc["ReservoirQuota"],
          TTL: dateToEpoch(doc["ReservoirQuotaTTL"]),
          interval: doc["Interval"]
        };
        targetsMapping[doc["RuleName"]] = newTarget;
      });
      return targetsMapping;
    };
    var isRuleValid = function isRuleValid2(record) {
      return record["Version"] === 1 && record["ResourceARN"] === "*" && record["Attributes"] && Object.keys(record["Attributes"]).length === 0 && record["ServiceType"] && record["RuleName"] && record["Priority"] && typeof record["FixedRate"] == "number";
    };
    var dateToEpoch = function dateToEpoch2(date) {
      return new Date(date).getTime() / 1e3;
    };
    var getOptions = function getOptions2(path, contentLength) {
      const options = {
        hostname: DaemonConfig.tcp_ip,
        port: DaemonConfig.tcp_port,
        method: "POST",
        path,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": contentLength,
          "Host": util.format("%s:%d", DaemonConfig.tcp_ip, DaemonConfig.tcp_port)
        }
      };
      return options;
    };
    module2.exports = ServiceConnector;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/rule_cache.js
var require_rule_cache = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/rule_cache.js"(exports2, module2) {
    "use strict";
    var TTL = 60 * 60;
    var RuleCache = {
      rules: [],
      lastUpdated: null,
      /**
       * Tries to find a valid rule that matches the sample request.
       * @param {object} sampleRequest - Contains information for rules matching.
       * @param {number} now - Current epoch in seconds.
       * @module RuleCache
       * @function getMatchedRule
       */
      getMatchedRule: function getMatchedRule(sampleRequest, now) {
        if (isExpired(now)) {
          return null;
        }
        var matchedRule;
        this.rules.forEach(function(rule) {
          if (!matchedRule && rule.match(sampleRequest)) {
            matchedRule = rule;
          }
          if (rule.isDefault() && !matchedRule) {
            matchedRule = rule;
          }
        });
        return matchedRule;
      },
      /**
       * Load rules fetched from X-Ray service in order sorted by priorities.
       * @param {object} rules - Newly fetched rules to load.
       * @module RuleCache
       * @function loadRules
       */
      loadRules: function loadRules(rules) {
        var oldRules = {};
        this.rules.forEach(function(rule) {
          oldRules[rule.getName()] = rule;
        });
        this.rules = rules;
        this.rules.forEach(function(rule) {
          var oldRule = oldRules[rule.getName()];
          if (oldRule) {
            rule.merge(oldRule);
          }
        });
        this.rules.sort(function(a, b) {
          var v = a.getPriority() - b.getPriority();
          if (v !== 0) {
            return v;
          }
          if (a.getName() > b.getName()) {
            return 1;
          } else {
            return -1;
          }
        });
      },
      /**
       * Load targets fetched from X-Ray service.
       * @param {object} targetsMapping - Newly fetched targets map with rule name as key.
       * @module RuleCache
       * @function loadTargets
       */
      loadTargets: function loadTargets(targetsMapping) {
        this.rules.forEach(function(rule) {
          var target = targetsMapping[rule.getName()];
          if (target) {
            rule.getReservoir().loadNewQuota(target.quota, target.TTL, target.interval);
            rule.setRate(target.rate);
          }
        });
      },
      getRules: function getRules() {
        return this.rules;
      },
      timestamp: function timestamp(now) {
        this.lastUpdated = now;
      },
      getLastUpdated: function getLastUpdated() {
        return this.lastUpdated;
      }
    };
    var isExpired = function isExpired2(now) {
      if (!RuleCache.getLastUpdated()) {
        return true;
      }
      return now > RuleCache.getLastUpdated() + TTL;
    };
    module2.exports = RuleCache;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/rule_poller.js
var require_rule_poller = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/rule_poller.js"(exports2, module2) {
    "use strict";
    var logger = require_logger();
    var ServiceConnector = require_service_connector();
    var ruleCache = require_rule_cache();
    var DEFAULT_INTERVAL = 5 * 60 * 1e3;
    var RulePoller = {
      start: function start() {
        if (this.poller) {
          clearInterval(this.poller);
        }
        refresh(false);
        this.poller = setInterval(refresh, DEFAULT_INTERVAL);
        this.poller.unref();
      }
    };
    var refresh = function refresh2(jitter) {
      jitter = typeof jitter === "undefined" ? true : jitter;
      if (jitter) {
        var delay = getJitter();
        setTimeout(refreshWithFirewall, delay);
      } else {
        refreshWithFirewall();
      }
    };
    var refreshWithFirewall = function refreshWithFirewall2() {
      try {
        refreshCache();
      } catch (e) {
        logger.getLogger().warn("Encountered unexpected exception when fetching sampling rules: " + e);
      }
    };
    var refreshCache = function refreshCache2() {
      var now = Math.floor((/* @__PURE__ */ new Date()).getTime() / 1e3);
      ServiceConnector.fetchSamplingRules(function(err, newRules) {
        if (err) {
          logger.getLogger().warn("Failed to retrieve sampling rules from X-Ray service:", err);
        } else if (newRules.length !== 0) {
          ruleCache.loadRules(newRules);
          ruleCache.timestamp(now);
          logger.getLogger().info("Successfully refreshed centralized sampling rule cache.");
        }
      });
    };
    var getJitter = function getJitter2() {
      return Math.random() * 5;
    };
    module2.exports = RulePoller;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/target_poller.js
var require_target_poller = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/target_poller.js"(exports2, module2) {
    "use strict";
    var rulePoller = require_rule_poller();
    var serviceConnector = require_service_connector();
    var ruleCache = require_rule_cache();
    var logger = require_logger();
    var DEFAULT_INTERVAL = 10 * 1e3;
    var TargetPoller = {
      interval: DEFAULT_INTERVAL,
      start: function start() {
        this.poller = setInterval(refreshWithFirewall, DEFAULT_INTERVAL + getJitter());
        this.poller.unref();
      }
    };
    var refreshWithFirewall = function refreshWithFirewall2() {
      try {
        refresh();
      } catch (e) {
        logger.getLogger().warn("Encountered unexpected exception when fetching sampling targets: " + e);
      }
    };
    var refresh = function refresh2() {
      var candidates = getCandidates();
      if (candidates && candidates.length > 0) {
        serviceConnector.fetchTargets(candidates, function(err, targetsMapping, ruleFreshness) {
          if (err) {
            logger.getLogger().warn("Failed to retrieve sampling targets from X-Ray service:", err);
            return;
          }
          ruleCache.loadTargets(targetsMapping);
          if (ruleFreshness > ruleCache.getLastUpdated()) {
            logger.getLogger().info("Performing out-of-band sampling rule polling to fetch updated rules.");
            rulePoller.start();
          }
          logger.getLogger().info("Successfully reported rule statistics to get new sampling quota.");
        });
      }
    };
    var getCandidates = function getCandidates2() {
      var rules = ruleCache.getRules();
      var candidates = [];
      rules.forEach(function(rule) {
        if (rule.everMatched() && rule.timeToReport()) {
          candidates.push(rule);
        }
      });
      return candidates;
    };
    var getJitter = function getJitter2() {
      return Math.random() / TargetPoller.interval;
    };
    module2.exports = TargetPoller;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/default_sampler.js
var require_default_sampler = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/sampling/default_sampler.js"(exports2, module2) {
    "use strict";
    var logger = require_logger();
    var util = require("util");
    var SegmentUtils = require_segment_utils();
    var DefaultSampler = {
      localSampler: require_local_sampler(),
      rulePoller: require_rule_poller(),
      targetPoller: require_target_poller(),
      ruleCache: require_rule_cache(),
      started: false,
      /**
       * Makes a sample decision based on the sample request.
       * @param {object} sampleRequest - Contains information for rules matching.
       * @module DefaultSampler
       * @function shouldSample
       */
      shouldSample: function shouldSample(sampleRequest) {
        try {
          if (!this.started) {
            this.start();
          }
          if (!sampleRequest.serviceType) {
            sampleRequest.serviceType = SegmentUtils.origin;
          }
          var now = Math.floor((/* @__PURE__ */ new Date()).getTime() / 1e3);
          var matchedRule = this.ruleCache.getMatchedRule(sampleRequest, now);
          if (matchedRule) {
            logger.getLogger().debug(util.format("Rule %s is matched.", matchedRule.getName()));
            return processMatchedRule(matchedRule, now);
          } else {
            logger.getLogger().info("No effective centralized sampling rule match. Fallback to local rules.");
            return this.localSampler.shouldSample(sampleRequest);
          }
        } catch (err) {
          logger.getLogger().error("Unhandled exception by the SDK during making sampling decisions: " + err);
        }
      },
      /**
       * Set local rules in case there is a need to fallback.
       * @module DefaultSampler
       * @function setLocalRules
       */
      setLocalRules: function setLocalRules(source) {
        this.localSampler.setLocalRules(source);
      },
      /**
       * Start the pollers to poll sampling rules and targets from X-Ray service.
       * @module DefaultSampler
       * @function start
       */
      start: function start() {
        if (!this.started) {
          this.rulePoller.start();
          this.targetPoller.start();
          this.started = true;
        }
      }
    };
    var processMatchedRule = function processMatchedRule2(rule, now) {
      rule.incrementRequestCount();
      var reservoir = rule.getReservoir();
      var sample = true;
      var decision = reservoir.borrowOrTake(now, rule.canBorrow());
      if (decision === "borrow") {
        rule.incrementBorrowCount();
      } else if (decision === "take") {
        rule.incrementSampledCount();
      } else if (Math.random() <= rule.getRate()) {
        rule.incrementSampledCount();
      } else {
        sample = false;
      }
      if (sample) {
        return rule.getName();
      } else {
        return false;
      }
    };
    module2.exports = DefaultSampler;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/middleware/mw_utils.js
var require_mw_utils = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/middleware/mw_utils.js"(exports2, module2) {
    "use strict";
    var Segment = require_segment();
    var IncomingRequestData = require_incoming_request_data();
    var logger = require_logger();
    var coreUtils = require_utils();
    var wildcardMatch = require_utils().wildcardMatch;
    var processTraceData = require_utils().processTraceData;
    var XRAY_HEADER = "x-amzn-trace-id";
    var overrideFlag = !!process.env.AWS_XRAY_TRACING_NAME;
    var utils = {
      defaultName: process.env.AWS_XRAY_TRACING_NAME,
      dynamicNaming: false,
      hostPattern: null,
      sampler: require_default_sampler(),
      /**
       * Enables dynamic naming for segments via the middleware. Use 'AWSXRay.middleware.enableDynamicNaming()'.
       * @param {string} [hostPattern] - The pattern to match the host header. See the README on dynamic and fixed naming modes.
       * @alias module:mw_utils.enableDynamicNaming
       */
      enableDynamicNaming: function(hostPattern) {
        this.dynamicNaming = true;
        if (hostPattern && typeof hostPattern !== "string") {
          throw new Error("Host pattern must be a string.");
        }
        this.hostPattern = hostPattern || null;
      },
      /**
       * Splits out the 'x-amzn-trace-id' header params from the incoming request.  Used by the middleware.
       * @param {http.IncomingMessage|https.IncomingMessage} req - The request object from the incoming call.
       * @returns {object}
       * @alias module:mw_utils.processHeaders
       */
      processHeaders: function processHeaders(req) {
        var amznTraceHeader = {};
        if (req && req.headers && req.headers[XRAY_HEADER]) {
          amznTraceHeader = processTraceData(req.headers[XRAY_HEADER]);
        }
        return amznTraceHeader;
      },
      /**
       * Resolves the name of the segment as determined by fixed or dynamic mode options. Used by the middleware.
       * @param {string} hostHeader - The string from the request.headers.host property.
       * @returns {string}
       * @alias module:mw_utils.resolveName
       */
      resolveName: function resolveName(hostHeader) {
        var name;
        if (this.dynamicNaming && hostHeader) {
          name = this.hostPattern ? wildcardMatch(this.hostPattern, hostHeader) ? hostHeader : this.defaultName : hostHeader;
        } else {
          name = this.defaultName;
        }
        return name;
      },
      /**
       * Resolves the sampling decision as determined by the values given and options set. Used by the middleware.
       * @param {object} amznTraceHeader - The object as returned by the processHeaders function.
       * @param {Segment} segment - The string from the request.headers.host property.
       * @param {http.ServerResponse|https.ServerResponse} res - The response object from the incoming call.
       * @returns {boolean}
       * @alias module:mw_utils.resolveSampling
       */
      resolveSampling: function resolveSampling(amznTraceHeader, segment, res) {
        var isSampled;
        if (amznTraceHeader.sampled === "1") {
          isSampled = true;
        } else if (amznTraceHeader.sampled === "0") {
          isSampled = false;
        } else {
          var sampleRequest = {
            host: res.req.headers.host,
            httpMethod: res.req.method,
            urlPath: res.req.url,
            serviceName: segment.name
          };
          isSampled = this.sampler.shouldSample(sampleRequest);
          if (isSampled instanceof String || typeof isSampled === "string") {
            segment.setMatchedSamplingRule(isSampled);
            isSampled = true;
          }
        }
        if (amznTraceHeader.sampled === "?" && res.header) {
          res.header(XRAY_HEADER, "Root=" + amznTraceHeader.root + ";Sampled=" + (isSampled ? "1" : "0"));
        }
        if (!isSampled) {
          segment.notTraced = true;
        }
      },
      /**
       * Sets the default name of created segments. Used with the middleware.
       * Can be overridden by the AWS_XRAY_TRACING_NAME environment variable.
       * @param {string} name - The default name for segments created in the middleware.
       * @alias module:mw_utils.setDefaultName
       */
      setDefaultName: function setDefaultName(name) {
        if (!overrideFlag) {
          this.defaultName = name;
        }
      },
      disableCentralizedSampling: function disableCentralizedSampling() {
        this.sampler = require_local_sampler();
      },
      /**
       * Overrides the default sampling rules file to specify at what rate to sample at for specific routes.
       * The base sampling rules file can be found at /lib/resources/default_sampling_rules.json
       * @param {string|Object} source - The path to the custom sampling rules file, or the source JSON object.
       * @memberof AWSXRay
       */
      setSamplingRules: function setSamplingRules(source) {
        if (!source || source instanceof String || !(typeof source === "string" || source instanceof Object)) {
          throw new Error("Please specify a path to the local sampling rules file, or supply an object containing the rules.");
        }
        this.sampler.setLocalRules(source);
      },
      /**
       * Logs a debug message including core request and segment information
       * @param {string} message - The message to be logged
       * @param {string} url - The request url being traced
       * @param {Segment} - The current segment
       */
      middlewareLog: function middlewareLog(message, url, segment) {
        logger.getLogger().debug(message + ": { url: " + url + ", name: " + segment.name + ", trace_id: " + segment.trace_id + ", id: " + segment.id + ", sampled: " + !segment.notTraced + " }");
      },
      /**
       * Traces the request/response cycle of an http.IncomingMessage / http.ServerResponse pair.
       * Resolves sampling rules, creates a segment, adds the core request / response data adding
       * throttling / error / fault flags based on the response status code.
       * @param {http.IncomingMessage} req - The incoming request.
       * @param {http.ServerResponse} res - The server response.
       * @returns {Segment}
       * @memberof AWSXRay
       */
      traceRequestResponseCycle: function traceRequestResponseCycle(req, res) {
        var amznTraceHeader = this.processHeaders(req);
        var name = this.resolveName(req.headers.host);
        var segment = new Segment(name, amznTraceHeader.root, amznTraceHeader.parent);
        if (!res.req) {
          res.req = req;
        }
        this.resolveSampling(amznTraceHeader, segment, res);
        segment.addIncomingRequestData(new IncomingRequestData(req));
        this.middlewareLog("Starting middleware segment", req.url, segment);
        var middlewareLog = this.middlewareLog;
        var didEnd = false;
        var endSegment = function() {
          if (didEnd) {
            return;
          }
          didEnd = true;
          if (res.statusCode === 429) {
            segment.addThrottleFlag();
          }
          const cause = coreUtils.getCauseTypeFromHttpStatus(res.statusCode);
          if (cause) {
            segment[cause] = true;
          }
          segment.http.close(res);
          segment.close();
          middlewareLog("Closed middleware segment successfully", req.url, segment);
        };
        res.on("finish", endSegment);
        res.on("close", endSegment);
        return segment;
      }
    };
    module2.exports = utils;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/env/aws_lambda.js
var require_aws_lambda = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/env/aws_lambda.js"(exports2, module2) {
    "use strict";
    var contextUtils = require_context_utils();
    var mwUtils = require_mw_utils();
    var LambdaUtils = require_utils().LambdaUtils;
    var Segment = require_segment();
    var SegmentEmitter = require_segment_emitter();
    var SegmentUtils = require_segment_utils();
    var logger = require_logger();
    var TraceID = require_trace_id();
    var xAmznTraceIdPrev = null;
    module2.exports.init = function init() {
      contextUtils.enableManualMode = function() {
        logger.getLogger().warn("AWS Lambda does not support AWS X-Ray manual mode.");
      };
      SegmentEmitter.disableReusableSocket();
      SegmentUtils.setStreamingThreshold(0);
      logger.getLogger().info("Disabling centralized sampling in Lambda environment.");
      mwUtils.disableCentralizedSampling();
      var namespace = contextUtils.getNamespace();
      namespace.enter(namespace.createContext());
      contextUtils.setSegment(facadeSegment());
    };
    var facadeSegment = function facadeSegment2() {
      var segment = new Segment("facade");
      var whitelistFcn = ["addNewSubsegment", "addSubsegment", "removeSubsegment", "toString", "addSubsegmentWithoutSampling", "addNewSubsegmentWithoutSampling"];
      var silentFcn = ["incrementCounter", "decrementCounter", "isClosed", "close", "format", "flush"];
      var xAmznTraceId = process.env._X_AMZN_TRACE_ID;
      for (var key in segment) {
        if (typeof segment[key] === "function" && whitelistFcn.indexOf(key) === -1) {
          if (silentFcn.indexOf(key) === -1) {
            segment[key] = /* @__PURE__ */ (function() {
              var func = key;
              return function facade() {
                logger.getLogger().warn('Function "' + func + '" cannot be called on an AWS Lambda segment. Please use a subsegment to record data.');
                return;
              };
            })();
          } else {
            segment[key] = function facade() {
              return;
            };
          }
        }
      }
      segment.trace_id = TraceID.Invalid().toString();
      segment.isClosed = function() {
        return true;
      };
      segment.in_progress = false;
      segment.counter = 1;
      segment.notTraced = true;
      segment.facade = true;
      segment.reset = function reset() {
        this.trace_id = TraceID.Invalid().toString();
        this.id = "00000000";
        delete this.subsegments;
        this.notTraced = true;
      };
      segment.resolveLambdaTraceData = function resolveLambdaTraceData() {
        var _a;
        const invokeStore = (_a = globalThis.awslambda) === null || _a === void 0 ? void 0 : _a.InvokeStore;
        const traceIdFromInvokeStore = invokeStore === null || invokeStore === void 0 ? void 0 : invokeStore.getXRayTraceId();
        const traceIdFromEnv = process.env._X_AMZN_TRACE_ID;
        var xAmznLambda = traceIdFromInvokeStore !== null && traceIdFromInvokeStore !== void 0 ? traceIdFromInvokeStore : traceIdFromEnv;
        if (xAmznLambda) {
          if (xAmznLambda != xAmznTraceIdPrev) {
            this.reset();
            if (LambdaUtils.populateTraceData(segment, xAmznLambda)) {
              xAmznTraceIdPrev = xAmznLambda;
            }
          }
        } else {
          this.reset();
          contextUtils.contextMissingStrategy.contextMissing("Missing AWS Lambda trace data for X-Ray. Ensure Active Tracing is enabled and no subsegments are created outside the function handler.");
        }
      };
      if (LambdaUtils.validTraceData(xAmznTraceId)) {
        if (LambdaUtils.populateTraceData(segment, xAmznTraceId)) {
          xAmznTraceIdPrev = xAmznTraceId;
        }
      }
      return segment;
    };
  }
});

// node_modules/aws-xray-sdk-core/package.json
var require_package = __commonJS({
  "node_modules/aws-xray-sdk-core/package.json"(exports2, module2) {
    module2.exports = {
      name: "aws-xray-sdk-core",
      version: "3.12.0",
      description: "AWS X-Ray SDK for Javascript",
      author: "Amazon Web Services",
      contributors: [
        "Sandra McMullen <mcmuls@amazon.com>",
        "William Armiros <armiros@amazon.com>",
        "Moritz Onken <onken@netcubed.de>"
      ],
      files: [
        "dist/lib/**/*",
        "LICENSE",
        "README.md"
      ],
      main: "dist/lib/index.js",
      types: "dist/lib/index.d.ts",
      engines: {
        node: ">= 14.x"
      },
      directories: {
        test: "test"
      },
      "//": "@types/cls-hooked is exposed in API so must be in dependencies, not devDependencies",
      dependencies: {
        "@aws-sdk/types": "^3.4.1",
        "@smithy/service-error-classification": "^2.0.4",
        "@types/cls-hooked": "^4.3.3",
        "atomic-batcher": "^1.0.2",
        "cls-hooked": "^4.2.2",
        semver: "^7.5.3"
      },
      devDependencies: {
        "@aws/lambda-invoke-store": "^0.2.0"
      },
      scripts: {
        prepare: "npm run compile",
        compile: "tsc && npm run copy-lib && npm run copy-test",
        "copy-lib": "find lib -type f \\( -name '*.d.ts' -o -name '*.json' \\) | xargs -I % ../../scripts/cp-with-structure.sh % dist",
        "copy-test": "find test -name '*.json' | xargs -I % ../../scripts/cp-with-structure.sh % dist",
        lint: "eslint .",
        "lint:fix": "eslint . --fix",
        test: "npm run compile && mocha --recursive ./dist/test/ -R spec && tsd && mocha --recursive ./dist/test_async/ -R spec",
        "test-d": "tsd",
        "test-async": "npm run compile && mocha --recursive ./dist/test_async/ -R spec",
        clean: "rm -rf dist && rm -rf node_modules",
        testcov: "nyc npm run test",
        reportcov: "nyc report --reporter=text-lcov > coverage.lcov"
      },
      keywords: [
        "amazon",
        "api",
        "aws",
        "core",
        "xray",
        "x-ray",
        "x ray"
      ],
      license: "Apache-2.0",
      repository: "https://github.com/aws/aws-xray-sdk-node/tree/master/packages/core",
      gitHead: "51831b9577e061cea36644a7e19f9cf0cc28fc8a"
    };
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/plugins/plugin.js
var require_plugin = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/plugins/plugin.js"(exports2, module2) {
    "use strict";
    var http = require("http");
    var Plugin = {
      METADATA_TIMEOUT: 1e3,
      /**
       * Asynchronously retrieves metadata from on-instance endpoint with an HTTP request using retries for
       * requests that time out.
       * @param {object} options - The HTTP options to make the request with
       * @param {function} callback - callback to plugin
       */
      getPluginMetadata: function(options, callback) {
        const METADATA_RETRY_TIMEOUT = 250;
        const METADATA_RETRIES = 5;
        var retries = METADATA_RETRIES;
        var getMetadata = function() {
          var httpReq = http.__request ? http.__request : http.request;
          var req = httpReq(options, function(res) {
            var body = "";
            res.on("data", function(chunk) {
              body += chunk;
            });
            res.on("end", function() {
              if (this.statusCode === 200 || this.statusCode === 300) {
                try {
                  body = JSON.parse(body);
                } catch (e) {
                  callback(e);
                  return;
                }
                callback(null, body);
              } else if (retries > 0 && Math.floor(this.statusCode / 100) === 5) {
                retries--;
                setTimeout(getMetadata, METADATA_RETRY_TIMEOUT);
              } else {
                callback(new Error(`Failed to retrieve metadata with options: ${options}`));
              }
            });
          });
          req.on("error", function(err) {
            callback(err);
          });
          req.on("timeout", function() {
            req.abort();
          });
          req.setTimeout(Plugin.METADATA_TIMEOUT);
          req.end();
        };
        getMetadata();
      }
    };
    module2.exports = Plugin;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/plugins/ec2_plugin.js
var require_ec2_plugin = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/plugins/ec2_plugin.js"(exports2, module2) {
    "use strict";
    var Plugin = require_plugin();
    var logger = require_logger();
    var http = require("http");
    var EC2Plugin = {
      /**
       * A function to get the instance data from the EC2 metadata service.
       * @param {function} callback - The callback for the plugin loader.
       */
      getData: function(callback) {
        const METADATA_PATH = "/latest/dynamic/instance-identity/document";
        function populateMetadata(token) {
          const options = getOptions(METADATA_PATH, "GET", token ? { "X-aws-ec2-metadata-token": token } : {});
          Plugin.getPluginMetadata(options, function(err, data) {
            if (err || !data) {
              logger.getLogger().error("Error loading EC2 plugin metadata: ", err ? err.toString() : "Could not retrieve data from IMDS.");
              callback();
              return;
            }
            const metadata = {
              ec2: {
                instance_id: data.instanceId,
                availability_zone: data.availabilityZone,
                instance_size: data.instanceType,
                ami_id: data.imageId
              }
            };
            callback(metadata);
          });
        }
        getToken(function(token) {
          if (token === null) {
            logger.getLogger().debug("EC2Plugin failed to get token from IMDSv2. Falling back to IMDSv1.");
          }
          populateMetadata(token);
        });
      },
      originName: "AWS::EC2::Instance"
    };
    function getToken(callback) {
      const httpReq = http.__request ? http.__request : http.request;
      const TTL = 60;
      const TOKEN_PATH = "/latest/api/token";
      const options = getOptions(TOKEN_PATH, "PUT", {
        "X-aws-ec2-metadata-token-ttl-seconds": TTL
      });
      let req = httpReq(options, function(res) {
        let body = "";
        res.on("data", function(chunk) {
          body += chunk;
        });
        res.on("end", function() {
          if (this.statusCode === 200 || this.statusCode === 300) {
            callback(body);
          } else {
            callback(null);
          }
        });
      });
      req.on("error", function() {
        callback(null);
      });
      req.on("timeout", function() {
        req.abort();
        callback(null);
      });
      req.setTimeout(Plugin.METADATA_TIMEOUT);
      req.end();
    }
    function getOptions(path, method, headers) {
      if (!method) {
        method = "GET";
      }
      if (!headers) {
        headers = {};
      }
      return {
        host: "169.254.169.254",
        path,
        method,
        headers
      };
    }
    module2.exports = EC2Plugin;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/plugins/ecs_plugin.js
var require_ecs_plugin = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/plugins/ecs_plugin.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var ECSPlugin = {
      /**
       * A function to get the instance data from the ECS instance.
       * @param {function} callback - The callback for the plugin loader.
       */
      getData: function(callback) {
        callback({ ecs: { container: os.hostname() } });
      },
      originName: "AWS::ECS::Container"
    };
    module2.exports = ECSPlugin;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/plugins/elastic_beanstalk_plugin.js
var require_elastic_beanstalk_plugin = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/plugins/elastic_beanstalk_plugin.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var logger = require_logger();
    var ENV_CONFIG_LOCATION = "/var/elasticbeanstalk/xray/environment.conf";
    var ElasticBeanstalkPlugin = {
      /**
       * A function to get data from the Elastic Beanstalk environment configuration file.
       * @param {function} callback - The callback for the plugin loader.
       */
      getData: function(callback) {
        fs.readFile(ENV_CONFIG_LOCATION, "utf8", function(err, rawData) {
          if (err) {
            logger.getLogger().error("Error loading Elastic Beanstalk plugin:", err.stack);
            callback();
          } else {
            var data = JSON.parse(rawData);
            var metadata = {
              elastic_beanstalk: {
                environment: data.environment_name,
                version_label: data.version_label,
                deployment_id: data.deployment_id
              }
            };
            callback(metadata);
          }
        });
      },
      originName: "AWS::ElasticBeanstalk::Environment"
    };
    module2.exports = ElasticBeanstalkPlugin;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/resources/aws_whitelist.json
var require_aws_whitelist = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/resources/aws_whitelist.json"(exports2, module2) {
    module2.exports = {
      services: {
        dynamodb: {
          operations: {
            batchGetItem: {
              request_descriptors: {
                RequestItems: {
                  get_keys: true,
                  rename_to: "table_names"
                }
              },
              response_parameters: [
                "ConsumedCapacity"
              ]
            },
            batchWriteItem: {
              request_descriptors: {
                RequestItems: {
                  get_keys: true,
                  rename_to: "table_names"
                }
              },
              response_parameters: [
                "ConsumedCapacity",
                "ItemCollectionMetrics"
              ]
            },
            createTable: {
              request_parameters: [
                "GlobalSecondaryIndexes",
                "LocalSecondaryIndexes",
                "ProvisionedThroughput",
                "TableName"
              ]
            },
            deleteItem: {
              request_parameters: [
                "TableName"
              ],
              response_parameters: [
                "ConsumedCapacity",
                "ItemCollectionMetrics"
              ]
            },
            deleteTable: {
              request_parameters: [
                "TableName"
              ]
            },
            describeTable: {
              request_parameters: [
                "TableName"
              ]
            },
            getItem: {
              request_parameters: [
                "ConsistentRead",
                "ProjectionExpression",
                "TableName"
              ],
              response_parameters: [
                "ConsumedCapacity"
              ]
            },
            listTables: {
              request_parameters: [
                "ExclusiveStartTableName",
                "Limit"
              ],
              response_descriptors: {
                TableNames: {
                  list: true,
                  get_count: true,
                  rename_to: "table_count"
                }
              }
            },
            putItem: {
              request_parameters: [
                "TableName"
              ],
              response_parameters: [
                "ConsumedCapacity",
                "ItemCollectionMetrics"
              ]
            },
            query: {
              request_parameters: [
                "AttributesToGet",
                "ConsistentRead",
                "IndexName",
                "Limit",
                "ProjectionExpression",
                "ScanIndexForward",
                "Select",
                "TableName"
              ],
              response_parameters: [
                "ConsumedCapacity"
              ]
            },
            scan: {
              request_parameters: [
                "AttributesToGet",
                "ConsistentRead",
                "IndexName",
                "Limit",
                "ProjectionExpression",
                "Segment",
                "Select",
                "TableName",
                "TotalSegments"
              ],
              response_parameters: [
                "ConsumedCapacity",
                "Count",
                "ScannedCount"
              ]
            },
            updateItem: {
              request_parameters: [
                "TableName"
              ],
              response_parameters: [
                "ConsumedCapacity",
                "ItemCollectionMetrics"
              ]
            },
            updateTable: {
              request_parameters: [
                "AttributeDefinitions",
                "GlobalSecondaryIndexUpdates",
                "ProvisionedThroughput",
                "TableName"
              ]
            }
          }
        },
        sqs: {
          operations: {
            addPermission: {
              request_parameters: [
                "Label",
                "QueueUrl"
              ]
            },
            changeMessageVisibility: {
              request_parameters: [
                "QueueUrl",
                "VisibilityTimeout"
              ]
            },
            changeMessageVisibilityBatch: {
              request_parameters: [
                "QueueUrl"
              ],
              response_parameters: [
                "Failed"
              ]
            },
            createQueue: {
              request_parameters: [
                "Attributes",
                "QueueName"
              ]
            },
            deleteMessage: {
              request_parameters: [
                "QueueUrl"
              ]
            },
            deleteMessageBatch: {
              request_parameters: [
                "QueueUrl"
              ],
              response_parameters: [
                "Failed"
              ]
            },
            deleteQueue: {
              request_parameters: [
                "QueueUrl"
              ]
            },
            getQueueAttributes: {
              request_parameters: [
                "QueueUrl"
              ],
              response_parameters: [
                "Attributes"
              ]
            },
            getQueueUrl: {
              request_parameters: [
                "QueueName",
                "QueueOwnerAWSAccountId"
              ],
              response_parameters: [
                "QueueUrl"
              ]
            },
            listDeadLetterSourceQueues: {
              request_parameters: [
                "QueueUrl"
              ],
              response_parameters: [
                "QueueUrls"
              ]
            },
            listQueues: {
              request_parameters: [
                "QueueNamePrefix"
              ],
              response_descriptors: {
                QueueUrls: {
                  list: true,
                  get_count: true,
                  rename_to: "queue_count"
                }
              }
            },
            purgeQueue: {
              request_parameters: [
                "QueueUrl"
              ]
            },
            receiveMessage: {
              request_parameters: [
                "AttributeNames",
                "MaxNumberOfMessages",
                "MessageAttributeNames",
                "QueueUrl",
                "VisibilityTimeout",
                "WaitTimeSeconds"
              ],
              response_descriptors: {
                Messages: {
                  list: true,
                  get_count: true,
                  rename_to: "message_count"
                }
              }
            },
            removePermission: {
              request_parameters: [
                "QueueUrl"
              ]
            },
            sendMessage: {
              request_parameters: [
                "DelaySeconds",
                "QueueUrl"
              ],
              request_descriptors: {
                MessageAttributes: {
                  get_keys: true,
                  rename_to: "message_attribute_names"
                }
              },
              response_parameters: [
                "MessageId"
              ]
            },
            sendMessageBatch: {
              request_parameters: [
                "QueueUrl"
              ],
              request_descriptors: {
                Entries: {
                  list: true,
                  get_count: true,
                  rename_to: "message_count"
                }
              },
              response_descriptors: {
                Failed: {
                  list: true,
                  get_count: true,
                  rename_to: "failed_count"
                },
                Successful: {
                  list: true,
                  get_count: true,
                  rename_to: "successful_count"
                }
              }
            },
            setQueueAttributes: {
              request_parameters: [
                "QueueUrl"
              ],
              request_descriptors: {
                Attributes: {
                  get_keys: true,
                  rename_to: "attribute_names"
                }
              }
            }
          }
        },
        sns: {
          operations: {
            publish: {
              request_parameters: [
                "TopicArn"
              ]
            },
            publishBatch: {
              request_parameters: [
                "TopicArn"
              ]
            }
          }
        },
        lambda: {
          operations: {
            invoke: {
              request_parameters: [
                "FunctionName",
                "InvocationType",
                "LogType",
                "Qualifier"
              ],
              response_parameters: [
                "FunctionError",
                "StatusCode"
              ]
            },
            invokeAsync: {
              request_parameters: [
                "FunctionName"
              ],
              response_parameters: [
                "Status"
              ]
            }
          }
        },
        s3: {
          operations: {
            abortMultipartUpload: {
              request_parameters: [
                "Key"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            completeMultipartUpload: {
              request_parameters: [
                "Key"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            copyObject: {
              request_parameters: [
                "CopySource",
                "Key"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            createBucket: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            createMultipartUpload: {
              request_parameters: [
                "Key"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucket: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucketAnalyticsConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucketCors: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucketEncryption: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucketInventoryConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucketLifecycle: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucketMetricsConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucketPolicy: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucketReplication: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucketTagging: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteBucketWebsite: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteObject: {
              request_parameters: [
                "Key",
                "VersionId"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteObjectTagging: {
              request_parameters: [
                "Key",
                "VersionId"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            deleteObjects: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketAccelerateConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketAcl: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketAnalyticsConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketCors: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketEncryption: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketInventoryConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketLifecycle: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketLifecycleConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketLocation: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketLogging: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketMetricsConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketNotification: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketNotificationConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketPolicy: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketReplication: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketRequestPayment: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketTagging: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketVersioning: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getBucketWebsite: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getObject: {
              request_parameters: [
                "Key",
                "VersionId"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getObjectAcl: {
              request_parameters: [
                "Key",
                "VersionId"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getObjectTagging: {
              request_parameters: [
                "Key",
                "VersionId"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            getObjectTorrent: {
              request_parameters: [
                "Key"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            headBucket: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            headObject: {
              request_parameters: [
                "Key",
                "VersionId"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            listBucketAnalyticsConfigurations: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            listBucketInventoryConfigurations: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            listBucketMetricsConfigurations: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            listMultipartUploads: {
              request_parameters: [
                "Prefix"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            listObjectVersions: {
              request_parameters: [
                "Prefix"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            listObjects: {
              request_parameters: [
                "Prefix"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            listObjectsV2: {
              request_parameters: [
                "Prefix"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            listParts: {
              request_parameters: [
                "Key"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketAccelerateConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketAcl: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketAnalyticsConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketCors: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketEncryption: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketInventoryConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketLifecycle: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketLifecycleConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketLogging: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketMetricsConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketNotification: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketNotificationConfiguration: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketPolicy: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketReplication: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketRequestPayment: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketTagging: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketVersioning: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putBucketWebsite: {
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putObject: {
              request_parameters: [
                "Key"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putObjectAcl: {
              request_parameters: [
                "Key",
                "VersionId"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            putObjectTagging: {
              request_parameters: [
                "Key",
                "VersionId"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            restoreObject: {
              request_parameters: [
                "Key",
                "VersionId"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            uploadPart: {
              request_parameters: [
                "Key"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            },
            uploadPartCopy: {
              request_parameters: [
                "CopySource",
                "Key"
              ],
              request_descriptors: {
                Bucket: {
                  rename_to: "bucket_name"
                }
              }
            }
          }
        },
        sagemakerruntime: {
          operations: {
            invokeEndpoint: {
              request_parameters: [
                "EndpointName"
              ]
            }
          }
        }
      }
    };
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/patchers/call_capturer.js
var require_call_capturer = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/patchers/call_capturer.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var logger = require_logger();
    var whitelist = require_aws_whitelist();
    var paramTypes = {
      REQ_DESC: "request_descriptors",
      REQ_PARAMS: "request_parameters",
      RES_DESC: "response_descriptors",
      RES_PARAMS: "response_parameters"
    };
    function CallCapturer(source) {
      this.init(source);
    }
    CallCapturer.prototype.init = function init(source) {
      if (source) {
        if (typeof source === "string") {
          logger.getLogger().info("Using custom AWS whitelist file: " + source);
          this.services = loadWhitelist(JSON.parse(fs.readFileSync(source, "utf8")));
        } else {
          logger.getLogger().info("Using custom AWS whitelist source.");
          this.services = loadWhitelist(source);
        }
      } else {
        this.services = whitelist.services;
      }
    };
    CallCapturer.prototype.append = function append(source) {
      var newServices = {};
      if (typeof source === "string") {
        logger.getLogger().info("Appending AWS whitelist with custom file: " + source);
        newServices = loadWhitelist(JSON.parse(fs.readFileSync(source, "utf8")));
      } else {
        logger.getLogger().info("Appending AWS whitelist with a custom source.");
        newServices = loadWhitelist(source);
      }
      for (var attribute in newServices) {
        this.services[attribute] = newServices[attribute];
      }
    };
    CallCapturer.prototype.capture = function capture(serviceName, response) {
      var operation = response.request.operation;
      var call = this.services[serviceName] !== void 0 ? this.services[serviceName].operations[operation] : null;
      if (call === null) {
        logger.getLogger().debug('Call "' + serviceName + "." + operation + '" is not whitelisted for additional data capturing. Ignoring.');
        return;
      }
      var dataCaptured = {};
      for (var paramType in call) {
        var params = call[paramType];
        if (paramType === paramTypes.REQ_PARAMS) {
          captureCallParams(params, response.request.params, dataCaptured);
        } else if (paramType === paramTypes.REQ_DESC) {
          captureDescriptors(params, response.request.params, dataCaptured);
        } else if (paramType === paramTypes.RES_PARAMS) {
          if (response.data) {
            captureCallParams(params, response.data, dataCaptured);
          }
        } else if (paramType === paramTypes.RES_DESC) {
          if (response.data) {
            captureDescriptors(params, response.data, dataCaptured);
          }
        } else {
          logger.getLogger().error('Unknown parameter type "' + paramType + '". Must be "request_descriptors", "response_descriptors", "request_parameters" or "response_parameters".');
        }
      }
      return dataCaptured;
    };
    function captureCallParams(params, call, data) {
      params.forEach(function(param) {
        if (typeof call[param] !== "undefined") {
          var formatted = toSnakeCase(param);
          this[formatted] = call[param];
        }
      }, data);
    }
    function captureDescriptors(descriptors, params, data) {
      for (var paramName in descriptors) {
        var attributes = descriptors[paramName];
        if (typeof params[paramName] !== "undefined") {
          var paramData;
          if (attributes.list && attributes.get_count) {
            paramData = params[paramName] ? params[paramName].length : 0;
          } else {
            paramData = attributes.get_keys === true ? Object.keys(params[paramName]) : params[paramName];
          }
          if (typeof attributes.rename_to === "string") {
            data[attributes.rename_to] = paramData;
          } else {
            var formatted = toSnakeCase(paramName);
            data[formatted] = paramData;
          }
        }
      }
    }
    function toSnakeCase(param) {
      if (param === "IPAddress") {
        return "ip_address";
      } else {
        return param.split(/(?=[A-Z])/).join("_").toLowerCase();
      }
    }
    function loadWhitelist(source) {
      var doc = source;
      if (doc.services === void 0) {
        throw new Error('Document formatting is incorrect. Expecting "services" param.');
      }
      return doc.services;
    }
    module2.exports = CallCapturer;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/segments/attributes/aws.js
var require_aws = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/segments/attributes/aws.js"(exports2, module2) {
    "use strict";
    var CallCapturer = require_call_capturer();
    var capturer = new CallCapturer();
    function Aws(res, serviceName) {
      this.init(res, serviceName);
    }
    Aws.prototype.init = function init(res, serviceName) {
      this.operation = formatOperation(res.request.operation) || "";
      if (res && res.request && res.request.httpRequest && res.request.httpRequest.region) {
        this.region = res.request.httpRequest.region;
      }
      if (res && res.requestId) {
        this.request_id = res.requestId;
      }
      this.retries = res.retryCount || 0;
      if (res.extendedRequestId && serviceName && serviceName.toLowerCase() === "s3") {
        this.id_2 = res.extendedRequestId;
      }
      if (serviceName) {
        this.addData(capturer.capture(serviceName.toLowerCase(), res));
      }
    };
    Aws.prototype.addData = function addData(data) {
      for (var attribute in data) {
        this[attribute] = data[attribute];
      }
    };
    var setAWSWhitelist = function setAWSWhitelist2(source) {
      if (!source || source instanceof String || !(typeof source === "string" || source instanceof Object)) {
        throw new Error("Please specify a path to the local whitelist file, or supply a whitelist source object.");
      }
      capturer = new CallCapturer(source);
    };
    var appendAWSWhitelist = function appendAWSWhitelist2(source) {
      if (!source || source instanceof String || !(typeof source === "string" || source instanceof Object)) {
        throw new Error("Please specify a path to the local whitelist file, or supply a whitelist source object.");
      }
      capturer.append(source);
    };
    function formatOperation(operation) {
      if (!operation) {
        return;
      }
      return operation.charAt(0).toUpperCase() + operation.slice(1);
    }
    module2.exports = Aws;
    module2.exports.appendAWSWhitelist = appendAWSWhitelist;
    module2.exports.setAWSWhitelist = setAWSWhitelist;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/capture.js
var require_capture = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/capture.js"(exports2, module2) {
    "use strict";
    var contextUtils = require_context_utils();
    var logger = require_logger();
    var captureFunc = function captureFunc2(name, fcn, parent) {
      validate(name, fcn);
      var current, executeFcn;
      var parentSeg = contextUtils.resolveSegment(parent);
      if (!parentSeg) {
        logger.getLogger().warn("Failed to capture function.");
        return fcn();
      }
      current = parentSeg.addNewSubsegment(name);
      executeFcn = captureFcn(fcn, current);
      try {
        const response = executeFcn(current);
        current.close();
        return response;
      } catch (e) {
        current.close(e);
        throw e;
      }
    };
    var captureAsyncFunc = function captureAsyncFunc2(name, fcn, parent) {
      validate(name, fcn);
      var current, executeFcn;
      var parentSeg = contextUtils.resolveSegment(parent);
      if (!parentSeg) {
        logger.getLogger().warn("Failed to capture async function.");
        return fcn();
      }
      current = parentSeg.addNewSubsegment(name);
      executeFcn = captureFcn(fcn, current);
      try {
        return executeFcn(current);
      } catch (e) {
        current.close(e);
        throw e;
      }
    };
    var captureCallbackFunc = function captureCallbackFunc2(name, fcn, parent) {
      validate(name, fcn);
      var base = contextUtils.resolveSegment(parent);
      if (!base) {
        logger.getLogger().warn("Failed to capture callback function.");
        return fcn;
      }
      base.incrementCounter();
      return function() {
        var parentSeg = contextUtils.resolveSegment(parent);
        var args = Array.prototype.slice.call(arguments);
        captureFunc(name, fcn.bind.apply(fcn, [null].concat(args)), parentSeg);
        base.decrementCounter();
      }.bind(this);
    };
    function captureFcn(fcn, current) {
      var executeFcn;
      if (contextUtils.isAutomaticMode()) {
        var session = contextUtils.getNamespace();
        var contextFcn = function() {
          var value;
          session.run(function() {
            contextUtils.setSegment(current);
            value = fcn(current);
          });
          return value;
        };
        executeFcn = contextFcn;
      } else {
        executeFcn = fcn;
      }
      return executeFcn;
    }
    function validate(name, fcn) {
      var error;
      if (!name || typeof name !== "string") {
        error = 'Param "name" must be a non-empty string.';
        logger.getLogger().error(error);
        throw new Error(error);
      } else if (typeof fcn !== "function") {
        error = 'Param "fcn" must be a function.';
        logger.getLogger().error(error);
        throw new Error(error);
      }
    }
    module2.exports.captureFunc = captureFunc;
    module2.exports.captureAsyncFunc = captureAsyncFunc;
    module2.exports.captureCallbackFunc = captureCallbackFunc;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/internal/constants.js"(exports2, module2) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module2.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/internal/debug.js"(exports2, module2) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module2.exports = debug;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/internal/re.js"(exports2, module2) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports2 = module2.exports = {};
    var re = exports2.re = [];
    var safeRe = exports2.safeRe = [];
    var src = exports2.src = [];
    var safeSrc = exports2.safeSrc = [];
    var t = exports2.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name, index, value);
      t[name] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports2.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports2.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports2.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/internal/parse-options.js"(exports2, module2) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module2.exports = parseOptions;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/internal/identifiers.js"(exports2, module2) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module2.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/classes/semver.js"(exports2, module2) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var isPrereleaseIdentifier = (prerelease, identifier) => {
      const identifiers = identifier.split(".");
      if (identifiers.length > prerelease.length) {
        return false;
      }
      for (let i = 0; i < identifiers.length; i++) {
        if (compareIdentifiers(prerelease[i], identifiers[i]) !== 0) {
          return false;
        }
      }
      return true;
    };
    var SemVer = class _SemVer {
      constructor(version, options) {
        options = parseOptions(options);
        if (version instanceof _SemVer) {
          if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier) {
            const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (isPrereleaseIdentifier(this.prerelease, identifier)) {
                const prereleaseBase = this.prerelease[identifier.split(".").length];
                if (isNaN(prereleaseBase)) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module2.exports = SemVer;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/parse.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = (version, options, throwErrors = false) => {
      if (version instanceof SemVer) {
        return version;
      }
      try {
        return new SemVer(version, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module2.exports = parse;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/valid.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var valid = (version, options) => {
      const v = parse(version, options);
      return v ? v.version : null;
    };
    module2.exports = valid;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/clean.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var clean = (version, options) => {
      const s = parse(version.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    };
    module2.exports = clean;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/inc.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var inc = (version, release, options, identifier, identifierBase) => {
      if (typeof options === "string") {
        identifierBase = identifier;
        identifier = options;
        options = void 0;
      }
      try {
        return new SemVer(
          version instanceof SemVer ? version.version : version,
          options
        ).inc(release, identifier, identifierBase).version;
      } catch (er) {
        return null;
      }
    };
    module2.exports = inc;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/diff.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var diff = (version1, version2) => {
      const v1 = parse(version1, null, true);
      const v2 = parse(version2, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (lowVersion.compareMain(highVersion) === 0) {
          if (lowVersion.minor && !lowVersion.patch) {
            return "minor";
          }
          return "patch";
        }
      }
      const prefix = highHasPre ? "pre" : "";
      if (v1.major !== v2.major) {
        return prefix + "major";
      }
      if (v1.minor !== v2.minor) {
        return prefix + "minor";
      }
      if (v1.patch !== v2.patch) {
        return prefix + "patch";
      }
      return "prerelease";
    };
    module2.exports = diff;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/major.js
var require_major = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/major.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module2.exports = major;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/minor.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module2.exports = minor;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/patch.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module2.exports = patch;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/prerelease.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var prerelease = (version, options) => {
      const parsed = parse(version, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module2.exports = prerelease;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/compare.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module2.exports = compare;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/rcompare.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var rcompare = (a, b, loose) => compare(b, a, loose);
    module2.exports = rcompare;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/compare-loose.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var compareLoose = (a, b) => compare(a, b, true);
    module2.exports = compareLoose;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/compare-build.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module2.exports = compareBuild;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/sort.js"(exports2, module2) {
    "use strict";
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module2.exports = sort;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/rsort.js"(exports2, module2) {
    "use strict";
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module2.exports = rsort;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/gt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module2.exports = gt;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/lt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module2.exports = lt;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/eq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module2.exports = eq;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/neq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module2.exports = neq;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/gte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module2.exports = gte;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/lte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module2.exports = lte;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/cmp.js"(exports2, module2) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module2.exports = cmp;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/coerce.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version, options) => {
      if (version instanceof SemVer) {
        return version;
      }
      if (typeof version === "number") {
        version = String(version);
      }
      if (typeof version !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module2.exports = coerce;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/truncate.js
var require_truncate = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/truncate.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var constants = require_constants();
    var SemVer = require_semver();
    var truncate = (version, truncation, options) => {
      if (!constants.RELEASE_TYPES.includes(truncation)) {
        return null;
      }
      const clonedVersion = cloneInputVersion(version, options);
      return clonedVersion && doTruncation(clonedVersion, truncation);
    };
    var cloneInputVersion = (version, options) => {
      const versionStringToParse = version instanceof SemVer ? version.version : version;
      return parse(versionStringToParse, options);
    };
    var doTruncation = (version, truncation) => {
      if (isPrerelease(truncation)) {
        return version.version;
      }
      version.prerelease = [];
      switch (truncation) {
        case "major":
          version.minor = 0;
          version.patch = 0;
          break;
        case "minor":
          version.patch = 0;
          break;
      }
      return version.format();
    };
    var isPrerelease = (type) => {
      return type.startsWith("pre");
    };
    module2.exports = truncate;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/internal/lrucache.js"(exports2, module2) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module2.exports = LRUCache;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/classes/range.js"(exports2, module2) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        range = range.replace(BUILDSTRIPRE, "");
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version) {
        if (!version) {
          return false;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module2.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      src,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var BUILDSTRIPRE = new RegExp(src[t.BUILD], "g");
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var invalidXRangeOrder = (M, m, p) => isX(M) && !isX(m) || isX(m) && p && !isX(p);
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        if (invalidXRangeOrder(M, m, p)) {
          return comp;
        }
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
          return false;
        }
      }
      if (version.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/classes/comparator.js"(exports2, module2) {
    "use strict";
    var ANY = /* @__PURE__ */ Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version) {
        debug("Comparator.test", version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
          return true;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module2.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/functions/satisfies.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var satisfies = (version, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version);
    };
    module2.exports = satisfies;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/to-comparators.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
    module2.exports = toComparators;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/max-satisfying.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions, range, options) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options);
          }
        }
      });
      return max;
    };
    module2.exports = maxSatisfying;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/min-satisfying.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions, range, options) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options);
          }
        }
      });
      return min;
    };
    module2.exports = minSatisfying;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/min-version.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer("0.0.0-0");
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case ">":
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case "":
            case ">=":
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case "<":
            case "<=":
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module2.exports = minVersion;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/valid.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var validRange = (range, options) => {
      try {
        return new Range(range, options).range || "*";
      } catch (er) {
        return null;
      }
    };
    module2.exports = validRange;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/outside.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version, range, hilo, options) => {
      version = new SemVer(version, options);
      range = new Range(range, options);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case ">":
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = ">";
          ecomp = ">=";
          break;
        case "<":
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = "<";
          ecomp = "<=";
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version, range, options)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator(">=0.0.0");
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module2.exports = outside;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/gtr.js"(exports2, module2) {
    "use strict";
    var outside = require_outside();
    var gtr = (version, range, options) => outside(version, range, ">", options);
    module2.exports = gtr;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/ltr.js"(exports2, module2) {
    "use strict";
    var outside = require_outside();
    var ltr = (version, range, options) => outside(version, range, "<", options);
    module2.exports = ltr;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/intersects.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var intersects = (r1, r2, options) => {
      r1 = new Range(r1, options);
      r2 = new Range(r2, options);
      return r1.intersects(r2, options);
    };
    module2.exports = intersects;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/simplify.js"(exports2, module2) {
    "use strict";
    var satisfies = require_satisfies();
    var compare = require_compare();
    module2.exports = (versions, range, options) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions.sort((a, b) => compare(a, b, options));
      for (const version of v) {
        const included = satisfies(version, range, options);
        if (included) {
          prev = version;
          if (!first) {
            first = version;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push("*");
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(" || ");
      const original = typeof range.raw === "string" ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/ranges/subset.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare = require_compare();
    var subset = (sub, dom, options = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options);
      dom = new Range(dom, options);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
    var minimumVersion = [new Comparator(">=0.0.0")];
    var simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === ">" || c.operator === ">=") {
          gt = higherGT(gt, c, options);
        } else if (c.operator === "<" || c.operator === "<=") {
          lt = lowerLT(lt, c, options);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
        hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
        if (gt) {
          if (needDomGTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
              needDomGTPre = false;
            }
          }
          if (c.operator === ">" || c.operator === ">=") {
            higher = higherGT(gt, c, options);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === ">=" && !c.test(gt.semver)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
              needDomLTPre = false;
            }
          }
          if (c.operator === "<" || c.operator === "<=") {
            lower = lowerLT(lt, c, options);
            if (lower === c && lower !== lt) {
              return false;
            }
          } else if (lt.operator === "<=" && !c.test(lt.semver)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
    };
    var lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
    };
    module2.exports = subset;
  }
});

// node_modules/aws-xray-sdk-core/node_modules/semver/index.js
var require_semver2 = __commonJS({
  "node_modules/aws-xray-sdk-core/node_modules/semver/index.js"(exports2, module2) {
    "use strict";
    var internalRe = require_re();
    var constants = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var truncate = require_truncate();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module2.exports = {
      parse,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      truncate,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers
    };
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/patchers/aws_p.js
var require_aws_p = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/patchers/aws_p.js"(exports2, module2) {
    "use strict";
    var semver = require_semver2();
    var Aws = require_aws();
    var contextUtils = require_context_utils();
    var Utils = require_utils();
    var logger = require_logger();
    var minVersion = "2.7.15";
    var throttledErrorDefault = function throttledErrorDefault2() {
      return false;
    };
    var captureAWS = function captureAWS2(awssdk) {
      if (!semver.gte(awssdk.VERSION, minVersion)) {
        throw new Error("AWS SDK version " + minVersion + " or greater required.");
      }
      for (var prop in awssdk) {
        if (awssdk[prop].serviceIdentifier) {
          var Service = awssdk[prop];
          Service.prototype.customizeRequests(captureAWSRequest);
        }
      }
      return awssdk;
    };
    var captureAWSClient = function captureAWSClient2(service) {
      service.customizeRequests(captureAWSRequest);
      return service;
    };
    function captureAWSRequest(req) {
      var parent = contextUtils.resolveSegment(contextUtils.resolveManualSegmentParams(req.params));
      if (!parent) {
        var output = this.serviceIdentifier + "." + req.operation;
        if (!contextUtils.isAutomaticMode()) {
          logger.getLogger().info("Call " + output + ' requires a segment object on the request params as "XRaySegment" for tracing in manual mode. Ignoring.');
        } else {
          logger.getLogger().info("Call " + output + " is missing the sub/segment context for automatic mode. Ignoring.");
        }
        return req;
      }
      var throttledError = this.throttledError || throttledErrorDefault;
      var stack = new Error().stack;
      let subsegment;
      if (parent.notTraced) {
        subsegment = parent.addNewSubsegmentWithoutSampling(this.serviceIdentifier);
      } else {
        subsegment = parent.addNewSubsegment(this.serviceIdentifier);
      }
      var traceId = parent.segment ? parent.segment.trace_id : parent.trace_id;
      const data = parent.segment ? parent.segment.additionalTraceData : parent.additionalTraceData;
      var buildListener = function(req2) {
        if (parent.noOp) {
          return;
        }
        let traceHeader = "Root=" + traceId + ";Parent=" + subsegment.id + ";Sampled=" + (subsegment.notTraced ? "0" : "1");
        if (data != null) {
          for (const [key, value] of Object.entries(data)) {
            traceHeader += ";" + key + "=" + value;
          }
        }
        req2.httpRequest.headers["X-Amzn-Trace-Id"] = traceHeader;
      };
      var completeListener = function(res) {
        subsegment.addAttribute("namespace", "aws");
        subsegment.addAttribute("aws", new Aws(res, subsegment.name));
        var httpRes = res.httpResponse;
        if (httpRes) {
          subsegment.addAttribute("http", new HttpResponse(httpRes));
          if (httpRes.statusCode === 429 || res.error && throttledError(res.error)) {
            subsegment.addThrottleFlag();
          }
        }
        if (res.error) {
          var err = { message: res.error.message, name: res.error.code, stack };
          if (httpRes && httpRes.statusCode) {
            if (Utils.getCauseTypeFromHttpStatus(httpRes.statusCode) == "error") {
              subsegment.addErrorFlag();
            }
            subsegment.close(err, true);
          } else {
            subsegment.close(err);
          }
        } else {
          if (httpRes && httpRes.statusCode) {
            var cause = Utils.getCauseTypeFromHttpStatus(httpRes.statusCode);
            if (cause) {
              subsegment[cause] = true;
            }
          }
          subsegment.close();
        }
      };
      req.on("beforePresign", function(req2) {
        parent.removeSubsegment(subsegment);
        parent.decrementCounter();
        req2.removeListener("build", buildListener);
        req2.removeListener("complete", completeListener);
      });
      req.on("build", buildListener).on("complete", completeListener);
      if (!req.__send) {
        req.__send = req.send;
        req.send = function(callback) {
          if (contextUtils.isAutomaticMode()) {
            var session = contextUtils.getNamespace();
            session.run(function() {
              contextUtils.setSegment(subsegment);
              req.__send(callback);
            });
          } else {
            req.__send(callback);
          }
        };
      }
    }
    function HttpResponse(res) {
      this.init(res);
    }
    HttpResponse.prototype.init = function init(res) {
      this.response = {
        status: res.statusCode || ""
      };
      if (res.headers && res.headers["content-length"]) {
        this.response.content_length = res.headers["content-length"];
      }
    };
    module2.exports.captureAWSClient = captureAWSClient;
    module2.exports.captureAWS = captureAWS;
  }
});

// node_modules/@smithy/service-error-classification/dist-cjs/index.js
var require_dist_cjs = __commonJS({
  "node_modules/@smithy/service-error-classification/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      isClockSkewCorrectedError: () => isClockSkewCorrectedError,
      isClockSkewError: () => isClockSkewError,
      isRetryableByTrait: () => isRetryableByTrait,
      isServerError: () => isServerError,
      isThrottlingError: () => isThrottlingError,
      isTransientError: () => isTransientError
    });
    module2.exports = __toCommonJS2(src_exports);
    var CLOCK_SKEW_ERROR_CODES = [
      "AuthFailure",
      "InvalidSignatureException",
      "RequestExpired",
      "RequestInTheFuture",
      "RequestTimeTooSkewed",
      "SignatureDoesNotMatch"
    ];
    var THROTTLING_ERROR_CODES = [
      "BandwidthLimitExceeded",
      "EC2ThrottledException",
      "LimitExceededException",
      "PriorRequestNotComplete",
      "ProvisionedThroughputExceededException",
      "RequestLimitExceeded",
      "RequestThrottled",
      "RequestThrottledException",
      "SlowDown",
      "ThrottledException",
      "Throttling",
      "ThrottlingException",
      "TooManyRequestsException",
      "TransactionInProgressException"
      // DynamoDB
    ];
    var TRANSIENT_ERROR_CODES = ["TimeoutError", "RequestTimeout", "RequestTimeoutException"];
    var TRANSIENT_ERROR_STATUS_CODES = [500, 502, 503, 504];
    var NODEJS_TIMEOUT_ERROR_CODES = ["ECONNRESET", "ECONNREFUSED", "EPIPE", "ETIMEDOUT"];
    var isRetryableByTrait = /* @__PURE__ */ __name((error) => error.$retryable !== void 0, "isRetryableByTrait");
    var isClockSkewError = /* @__PURE__ */ __name((error) => CLOCK_SKEW_ERROR_CODES.includes(error.name), "isClockSkewError");
    var isClockSkewCorrectedError = /* @__PURE__ */ __name((error) => {
      var _a;
      return (_a = error.$metadata) == null ? void 0 : _a.clockSkewCorrected;
    }, "isClockSkewCorrectedError");
    var isThrottlingError = /* @__PURE__ */ __name((error) => {
      var _a, _b;
      return ((_a = error.$metadata) == null ? void 0 : _a.httpStatusCode) === 429 || THROTTLING_ERROR_CODES.includes(error.name) || ((_b = error.$retryable) == null ? void 0 : _b.throttling) == true;
    }, "isThrottlingError");
    var isTransientError = /* @__PURE__ */ __name((error) => {
      var _a;
      return isClockSkewCorrectedError(error) || TRANSIENT_ERROR_CODES.includes(error.name) || NODEJS_TIMEOUT_ERROR_CODES.includes((error == null ? void 0 : error.code) || "") || TRANSIENT_ERROR_STATUS_CODES.includes(((_a = error.$metadata) == null ? void 0 : _a.httpStatusCode) || 0);
    }, "isTransientError");
    var isServerError = /* @__PURE__ */ __name((error) => {
      var _a;
      if (((_a = error.$metadata) == null ? void 0 : _a.httpStatusCode) !== void 0) {
        const statusCode = error.$metadata.httpStatusCode;
        if (500 <= statusCode && statusCode <= 599 && !isTransientError(error)) {
          return true;
        }
        return false;
      }
      return false;
    }, "isServerError");
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/patchers/aws3_p.js
var require_aws3_p = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/patchers/aws3_p.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.captureAWSClient = void 0;
    var service_error_classification_1 = require_dist_cjs();
    var aws_1 = __importDefault(require_aws());
    var querystring_1 = require("querystring");
    var subsegment_1 = __importDefault(require_subsegment());
    var contextUtils = require_context_utils();
    var logger = require_logger();
    var { safeParseInt } = require_utils();
    var utils_1 = require_utils();
    var XRAY_PLUGIN_NAME = "XRaySDKInstrumentation";
    var buildAttributesFromMetadata = async (service, operation, region, commandInput, res, error) => {
      var _a, _b, _c;
      const { extendedRequestId, requestId, httpStatusCode: statusCode, attempts } = ((_a = res === null || res === void 0 ? void 0 : res.output) === null || _a === void 0 ? void 0 : _a.$metadata) || (error === null || error === void 0 ? void 0 : error.$metadata);
      const aws = new aws_1.default({
        extendedRequestId,
        requestId,
        retryCount: attempts,
        data: res === null || res === void 0 ? void 0 : res.output,
        request: {
          operation,
          params: commandInput,
          httpRequest: {
            region,
            statusCode
          }
        }
      }, service);
      const http = {};
      if (statusCode) {
        http.response = {};
        http.response.status = statusCode;
      }
      if (((_b = res === null || res === void 0 ? void 0 : res.response) === null || _b === void 0 ? void 0 : _b.headers) && ((_c = res === null || res === void 0 ? void 0 : res.response) === null || _c === void 0 ? void 0 : _c.headers["content-length"]) !== void 0) {
        if (!http.response) {
          http.response = {};
        }
        http.response.content_length = safeParseInt(res.response.headers["content-length"]);
      }
      return [aws, http];
    };
    function addFlags(http, subsegment, err) {
      var _a, _b, _c;
      if (err && (0, service_error_classification_1.isThrottlingError)(err)) {
        subsegment.addThrottleFlag();
      } else if (safeParseInt((_a = http.response) === null || _a === void 0 ? void 0 : _a.status) === 429 || safeParseInt((_b = err === null || err === void 0 ? void 0 : err.$metadata) === null || _b === void 0 ? void 0 : _b.httpStatusCode) === 429) {
        subsegment.addThrottleFlag();
      }
      const cause = (0, utils_1.getCauseTypeFromHttpStatus)(safeParseInt((_c = http.response) === null || _c === void 0 ? void 0 : _c.status));
      if (cause === "fault") {
        subsegment.addFaultFlag();
      } else if (cause === "error") {
        subsegment.addErrorFlag();
      }
    }
    var getXRayMiddleware = (config, manualSegment) => (next, context) => async (args) => {
      var _a;
      const segment = contextUtils.isAutomaticMode() ? contextUtils.resolveSegment() : manualSegment;
      const { clientName, commandName } = context;
      const commandInput = (_a = args === null || args === void 0 ? void 0 : args.input) !== null && _a !== void 0 ? _a : {};
      const commandOperation = commandName.slice(0, -7);
      const operation = commandOperation.charAt(0).toLowerCase() + commandOperation.slice(1);
      const service = clientName.slice(0, -6);
      if (!segment) {
        const output = service + "." + operation;
        if (!contextUtils.isAutomaticMode()) {
          logger.getLogger().info("Call " + output + " requires a segment object passed to captureAWSv3Client for tracing in manual mode. Ignoring.");
        } else {
          logger.getLogger().info("Call " + output + " is missing the sub/segment context for automatic mode. Ignoring.");
        }
        return next(args);
      }
      let subsegment;
      if (segment.notTraced) {
        subsegment = segment.addNewSubsegmentWithoutSampling(service);
      } else {
        subsegment = segment.addNewSubsegment(service);
      }
      subsegment.addAttribute("namespace", "aws");
      const parent = segment instanceof subsegment_1.default ? segment.segment : segment;
      const data = parent.segment ? parent.segment.additionalTraceData : parent.additionalTraceData;
      let traceHeader = (0, querystring_1.stringify)({
        Root: parent.trace_id,
        Parent: subsegment.id,
        Sampled: subsegment.notTraced ? "0" : "1"
      }, ";");
      if (data != null) {
        for (const [key, value] of Object.entries(data)) {
          traceHeader += ";" + key + "=" + value;
        }
      }
      if (!segment.noOp) {
        args.request.headers["X-Amzn-Trace-Id"] = traceHeader;
      }
      let res;
      try {
        res = await next(args);
        if (!res) {
          throw new Error("Failed to get response from instrumented AWS Client.");
        }
        const [aws, http] = await buildAttributesFromMetadata(service, operation, await config.region(), commandInput, res, null);
        subsegment.addAttribute("aws", aws);
        subsegment.addAttribute("http", http);
        addFlags(http, subsegment);
        subsegment.close();
        return res;
      } catch (err) {
        if (err.$metadata) {
          const [aws, http] = await buildAttributesFromMetadata(service, operation, await config.region(), commandInput, null, err);
          subsegment.addAttribute("aws", aws);
          subsegment.addAttribute("http", http);
          addFlags(http, subsegment, err);
        }
        const errObj = { message: err.message, name: err.name, stack: err.stack || new Error().stack };
        subsegment.close(errObj, true);
        throw err;
      }
    };
    var xRayMiddlewareOptions = {
      name: XRAY_PLUGIN_NAME,
      step: "build"
    };
    var getXRayPlugin = (config, manualSegment) => ({
      applyToStack: (stack) => {
        stack.add(getXRayMiddleware(config, manualSegment), xRayMiddlewareOptions);
      }
    });
    function captureAWSClient(client, manualSegment) {
      client.middlewareStack.remove(XRAY_PLUGIN_NAME);
      client.middlewareStack.use(getXRayPlugin(client.config, manualSegment));
      return client;
    }
    exports2.captureAWSClient = captureAWSClient;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/patchers/http_p.js
var require_http_p = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/patchers/http_p.js"(exports2, module2) {
    "use strict";
    var url = require("url");
    var contextUtils = require_context_utils();
    var Utils = require_utils();
    var logger = require_logger();
    var events = require("events");
    var captureHTTPsGlobal = function captureHTTPsGlobal2(module3, downstreamXRayEnabled, subsegmentCallback) {
      if (!module3.__request) {
        enableCapture(module3, downstreamXRayEnabled, subsegmentCallback);
      }
    };
    var captureHTTPs = function captureHTTPs2(module3, downstreamXRayEnabled, subsegmentCallback) {
      if (module3.__request) {
        return module3;
      }
      var tracedModule = {};
      Object.keys(module3).forEach(function(val) {
        tracedModule[val] = module3[val];
      });
      enableCapture(tracedModule, downstreamXRayEnabled, subsegmentCallback);
      return tracedModule;
    };
    function enableCapture(module3, downstreamXRayEnabled, subsegmentCallback) {
      function captureOutgoingHTTPs(baseFunc, ...args) {
        let options;
        let callback;
        let hasUrl;
        let urlObj;
        let arg0 = args[0];
        if (typeof args[1] === "object") {
          hasUrl = true;
          urlObj = typeof arg0 === "string" ? new url.URL(arg0) : arg0;
          options = args[1], callback = args[2];
        } else {
          hasUrl = false;
          options = arg0;
          callback = args[1];
        }
        if (!options || options.headers && options.headers["X-Amzn-Trace-Id"]) {
          return baseFunc(...args);
        }
        if (typeof options === "string") {
          options = new url.URL(options);
        }
        if (!hasUrl) {
          urlObj = options;
        }
        const parent = contextUtils.resolveSegment(contextUtils.resolveManualSegmentParams(options));
        const hostname = options.hostname || options.host || urlObj.hostname || urlObj.host || "Unknown host";
        if (!parent) {
          let output = "[ host: " + hostname;
          output = options.method ? output + ", method: " + options.method : output;
          output += ", path: " + (urlObj.pathname || Utils.stripQueryStringFromPath(options.path)) + " ]";
          if (!contextUtils.isAutomaticMode()) {
            logger.getLogger().info("Options for request " + output + ' requires a segment object on the options params as "XRaySegment" for tracing in manual mode. Ignoring.');
          } else {
            logger.getLogger().info("Options for request " + output + " is missing the sub/segment context for automatic mode. Ignoring.");
          }
          return baseFunc(...args);
        }
        let subsegment;
        if (parent.notTraced) {
          subsegment = parent.addNewSubsegmentWithoutSampling(hostname);
        } else {
          subsegment = parent.addNewSubsegment(hostname);
        }
        const root = parent.segment ? parent.segment : parent;
        subsegment.namespace = "remote";
        if (!options.headers) {
          options.headers = {};
        }
        if (!parent.noOp) {
          options.headers["X-Amzn-Trace-Id"] = "Root=" + root.trace_id + ";Parent=" + subsegment.id + ";Sampled=" + (subsegment.notTraced ? "0" : "1");
        }
        const errorCapturer = function errorCapturer2(e) {
          if (subsegmentCallback) {
            subsegmentCallback(subsegment, this, null, e);
          }
          if (subsegment.http && subsegment.http.response) {
            if (Utils.getCauseTypeFromHttpStatus(subsegment.http.response.status) === "error") {
              subsegment.addErrorFlag();
            }
            subsegment.close(e, true);
          } else {
            const madeItToDownstream = e.code !== "ECONNREFUSED";
            subsegment.addRemoteRequestData(this, null, madeItToDownstream && downstreamXRayEnabled);
            subsegment.close(e);
          }
        };
        const optionsCopy = Utils.objectWithoutProperties(options, ["Segment"], true);
        let req = baseFunc(...hasUrl ? [arg0, optionsCopy] : [options], function(res) {
          res.on("end", function() {
            if (subsegmentCallback) {
              subsegmentCallback(subsegment, this.req, res);
            }
            if (res.statusCode === 429) {
              subsegment.addThrottleFlag();
            }
            const cause = Utils.getCauseTypeFromHttpStatus(res.statusCode);
            if (cause) {
              subsegment[cause] = true;
            }
            subsegment.addRemoteRequestData(res.req, res, !!downstreamXRayEnabled);
            subsegment.close();
          });
          if (typeof callback === "function") {
            if (contextUtils.isAutomaticMode()) {
              const session = contextUtils.getNamespace();
              session.run(function() {
                contextUtils.setSegment(subsegment);
                callback(res);
              });
            } else {
              callback(res);
            }
          } else if (res.req && res.req.listenerCount("response") === 0) {
            res.resume();
          }
        });
        req.on(events.errorMonitor || "error", errorCapturer);
        return req;
      }
      module3.__request = module3.request;
      function captureHTTPsRequest(...args) {
        return captureOutgoingHTTPs(module3.__request, ...args);
      }
      module3.__get = module3.get;
      function captureHTTPsGet(...args) {
        return captureOutgoingHTTPs(module3.__get, ...args);
      }
      Object.defineProperties(module3, {
        request: { value: captureHTTPsRequest, configurable: true, enumerable: true, writable: true },
        get: { value: captureHTTPsGet, configurable: true, enumerable: true, writable: true }
      });
    }
    module2.exports.captureHTTPsGlobal = captureHTTPsGlobal;
    module2.exports.captureHTTPs = captureHTTPs;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/patchers/promise_p.js
var require_promise_p = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/patchers/promise_p.js"(exports2, module2) {
    "use strict";
    var contextUtils = require_context_utils();
    var originalThen = /* @__PURE__ */ Symbol("original then");
    var originalCatch = /* @__PURE__ */ Symbol("original catch");
    function patchPromise(Promise2) {
      const then = Promise2.prototype.then;
      if (!then[originalThen]) {
        Promise2.prototype.then = function(onFulfilled, onRejected) {
          if (contextUtils.isAutomaticMode() && tryGetCurrentSegment()) {
            const ns = contextUtils.getNamespace();
            onFulfilled = onFulfilled && ns.bind(onFulfilled);
            onRejected = onRejected && ns.bind(onRejected);
          }
          return then.call(this, onFulfilled, onRejected);
        };
        Promise2.prototype.then[originalThen] = then;
      }
      const origCatch = Promise2.prototype.catch;
      if (origCatch && !origCatch[originalCatch]) {
        Promise2.prototype.catch = function(onRejected) {
          if (contextUtils.isAutomaticMode() && tryGetCurrentSegment()) {
            const ns = contextUtils.getNamespace();
            onRejected = onRejected && ns.bind(onRejected);
          }
          return origCatch.call(this, onRejected);
        };
        Promise2.prototype.catch[originalCatch] = origCatch;
      }
    }
    function unpatchPromise(Promise2) {
      const then = Promise2.prototype.then;
      if (then[originalThen]) {
        Promise2.prototype.then = then[originalThen];
      }
      const origCatch = Promise2.prototype.catch;
      if (origCatch && origCatch[originalCatch]) {
        Promise2.prototype.catch = origCatch[originalCatch];
      }
    }
    function tryGetCurrentSegment() {
      try {
        return contextUtils.getSegment();
      } catch (e) {
        return void 0;
      }
    }
    function capturePromise() {
      patchPromise(Promise);
    }
    function uncapturePromise() {
      unpatchPromise(Promise);
    }
    capturePromise.patchThirdPartyPromise = patchPromise;
    module2.exports.capturePromise = capturePromise;
    module2.exports.uncapturePromise = uncapturePromise;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/database/sql_data.js
var require_sql_data = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/database/sql_data.js"(exports2, module2) {
    "use strict";
    function SqlData(databaseVer, driverVer, user, url, queryType) {
      this.init(databaseVer, driverVer, user, url, queryType);
    }
    SqlData.prototype.init = function init(databaseVer, driverVer, user, url, queryType) {
      if (databaseVer) {
        this.database_version = databaseVer;
      }
      if (driverVer) {
        this.driver_version = driverVer;
      }
      if (queryType) {
        this.preparation = queryType;
      }
      this.url = url;
      this.user = user;
    };
    module2.exports = SqlData;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/aws-xray.js
var require_aws_xray = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/aws-xray.js"(exports2, module2) {
    "use strict";
    var contextUtils = require_context_utils();
    var logging = require_logger();
    var segmentUtils = require_segment_utils();
    var utils = require_utils();
    var LambdaEnv = require_aws_lambda();
    var pkginfo = {};
    try {
      pkginfo = require_package();
    } catch (err) {
      logging.getLogger().debug("Failed to load SDK data:", err);
    }
    var UNKNOWN = "unknown";
    var AWSXRay4 = {
      /**
       * @memberof AWSXRay
       * @type {object}
       * @namespace AWSXRay.plugins
       */
      plugins: {
        /**
         * Exposes the AWS EC2 plugin.
         * @memberof AWSXRay.plugins
         */
        EC2Plugin: require_ec2_plugin(),
        /**
         * Exposes the AWS ECS plugin.
         * @memberof AWSXRay.plugins
         */
        ECSPlugin: require_ecs_plugin(),
        /**
         * Exposes the AWS Elastic Beanstalk plugin.
         * @memberof AWSXRay.plugins
         */
        ElasticBeanstalkPlugin: require_elastic_beanstalk_plugin()
      },
      /**
       * Enables use of plugins to capture additional data for segments.
       * @param {Array} plugins - A configurable subset of AWSXRay.plugins.
       * @memberof AWSXRay
       * @see AWSXRay.plugins
       */
      config: function(plugins) {
        var pluginData = {};
        plugins.forEach(function(plugin) {
          plugin.getData(function(data) {
            if (data) {
              for (var attribute in data) {
                pluginData[attribute] = data[attribute];
              }
            }
          });
          segmentUtils.setOrigin(plugin.originName);
          segmentUtils.setPluginData(pluginData);
        });
      },
      /**
       * Overrides the default whitelisting file to specify what params to capture on each AWS Service call.
       * If a service or API is not listed, no additional data is captured.
       * The base whitelisting file can be found at /lib/resources/aws_whitelist.json
       * @param {string|Object} source - The path to the custom whitelist file, or a whitelist source JSON object.
       * @memberof AWSXRay
       */
      setAWSWhitelist: require_aws().setAWSWhitelist,
      /**
       * Appends to the current whitelisting file.
       * In the case of a duplicate service API listed, the new source will override the previous values.
       * @param {string|Object} source - The path to the custom whitelist file, or a whitelist source JSON object.
       * @memberof AWSXRay
       */
      appendAWSWhitelist: require_aws().appendAWSWhitelist,
      /**
       * Overrides the default streaming threshold (100).
       * The threshold represents the maximum number of subsegments on a single segment before
       * the SDK begins to send the completed subsegments out of band of the main segment.
       * Reduce this threshold if you see the 'Segment too large to send' error.
       * @param {number} threshold - The new threshold to use.
       * @memberof AWSXRay
       */
      setStreamingThreshold: segmentUtils.setStreamingThreshold,
      /**
       * Set your own logger for the SDK.
       * @param {Object} logger - A logger which responds to debug/info/warn/error calls.
       * @memberof AWSXRay
       */
      setLogger: logging.setLogger,
      /**
       * Gets the set logger for the SDK.
       * @memberof AWSXRay
       */
      getLogger: logging.getLogger,
      /**
       * Configures the address and port the daemon is expected to be on.
       * @param {string} address - Address of the daemon the segments should be sent to.  Expects 'x.x.x.x', ':yyyy' or 'x.x.x.x:yyyy' IPv4 formats.
       * @module DaemonConfig
       * @memberof AWSXRay
       * @function
       * @see module:DaemonConfig.setDaemonAddress
       */
      setDaemonAddress: require_daemon_config().setDaemonAddress,
      /**
       * @param {string} name - The name of the new subsegment.
       * @param {function} fcn - The function conext to wrap.
       * @param {Segment|Subsegment} [parent] - The parent for the new subsegment, for manual mode.
       * @memberof AWSXRay
       * @function
       * @see module:capture.captureFunc
       */
      captureFunc: require_capture().captureFunc,
      /**
       * @param {string} name - The name of the new subsegment.
       * @param {function} fcn - The function conext to wrap.
       * @param {Segment|Subsegment} [parent] - The parent for the new subsegment, for manual mode.
       * @memberof AWSXRay
       * @function
       * @see module:capture.captureAsyncFunc
       */
      captureAsyncFunc: require_capture().captureAsyncFunc,
      /**
       * @param {string} name - The name of the new subsegment.
       * @param {function} fcn - The function conext to wrap.
       * @param {Segment|Subsegment} [parent] - The parent for the new subsegment, for manual mode.
       * @memberof AWSXRay
       * @function
       * @see module:capture.captureCallbackFunc
       */
      captureCallbackFunc: require_capture().captureCallbackFunc,
      /**
       * @param {AWS} awssdk - The Javascript AWS SDK.
       * @memberof AWSXRay
       * @function
       * @see module:aws_p.captureAWS
       */
      captureAWS: require_aws_p().captureAWS,
      /**
       * @param {AWS.Service} service - An instance of a AWS service to wrap.
       * @memberof AWSXRay
       * @function
       * @see module:aws_p.captureAWSClient
       */
      captureAWSClient: require_aws_p().captureAWSClient,
      /**
       * @param {AWSv3.Service} service - An instance of a AWS SDK v3 service to wrap.
       * @param {Segment|Subsegment} segment - Optional segment for manual mode.
       * @memberof AWSXRay
       * @function
       * @see module:aws3_p.captureAWSClient
       */
      captureAWSv3Client: require_aws3_p().captureAWSClient,
      /**
       * @param {http|https} module - The built in Node.js HTTP or HTTPS module.
       * @memberof AWSXRay
       * @function
       * @returns {http|https}
       * @see module:http_p.captureHTTPs
       */
      captureHTTPs: require_http_p().captureHTTPs,
      /**
       * @param {http|https} module - The built in Node.js HTTP or HTTPS module.
       * @memberof AWSXRay
       * @function
       * @see module:http_p.captureHTTPsGlobal
       */
      captureHTTPsGlobal: require_http_p().captureHTTPsGlobal,
      /**
       * @memberof AWSXRay
       * @function
       * @see module:promise_p.capturePromise
       */
      capturePromise: require_promise_p().capturePromise,
      /**
       * Exposes various helper methods.
       * @memberof AWSXRay
       * @function
       * @see module:utils
       */
      utils,
      /**
       * @memberof AWSXRay
       * @type {object}
       * @namespace AWSXRay.database
       */
      database: {
        /**
         * Exposes the SqlData class.
         * @memberof AWSXRay.database
         * @see SqlData
         */
        SqlData: require_sql_data()
      },
      /**
       * Exposes the Middleware Utils class.
       * @memberof AWSXRay
       * @function
       * @see module:mw_utils
       */
      middleware: require_mw_utils(),
      /**
       * Gets the current namespace of the context.
       * Used for supporting functions that can be used in automatic mode.
       * @memberof AWSXRay
       * @function
       * @returns {Segment|Subsegment}
       * @see module:context_utils.getNamespace
       */
      getNamespace: contextUtils.getNamespace,
      /**
       * Resolves the current segment or subsegment, checks manual and automatic modes.
       * Used for supporting functions that can be used in both manual and automatic modes.
       * @memberof AWSXRay
       * @function
       * @returns {Segment|Subsegment}
       * @see module:context_utils.resolveSegment
       */
      resolveSegment: contextUtils.resolveSegment,
      /**
       * Resolves the segment or subsegment given manual mode and params on the call required.
       * @param [Segment|Subsegment] segment - The segment manually provided via params.XraySegment, if provided.
       * @memberof AWSXRay
       * @function
       * @returns {Segment|Subsegment}
       * @see module:context_utils.resolveManualSegmentParams
       */
      resolveManualSegmentParams: contextUtils.resolveManualSegmentParams,
      /**
       * Returns the current segment or subsegment. For use with automatic mode only.
       * @memberof AWSXRay
       * @function
       * @returns {Segment|Subsegment}
       * @see module:context_utils.getSegment
       */
      getSegment: contextUtils.getSegment,
      /**
       * Sets the current segment or subsegment.  For use with automatic mode only.
       * @memberof AWSXRay
       * @function
       * @see module:context_utils.setSegment
       */
      setSegment: contextUtils.setSegment,
      /**
       * Returns true if automatic mode is enabled, otherwise false.
       * @memberof AWSXRay
       * @function
       * @see module:context_utils.isAutomaticMode
       */
      isAutomaticMode: contextUtils.isAutomaticMode,
      /**
       * Enables automatic mode. Automatic mode uses 'cls-hooked'.
       * @see https://github.com/jeff-lewis/cls-hooked
       * @memberof AWSXRay
       * @function
       * @see module:context_utils.enableAutomaticMode
       */
      enableAutomaticMode: contextUtils.enableAutomaticMode,
      /**
       * Disables automatic mode. Current segment or subsegment must be passed manually
       * via the parent optional on captureFunc, captureAsyncFunc etc.
       * @memberof AWSXRay
       * @function
       * @see module:context_utils.enableManualMode
       */
      enableManualMode: contextUtils.enableManualMode,
      /**
       * Sets the context missing strategy.
       * @param {Object} strategy - The strategy to set. This object's contextMissing function will be called whenever trace context is not found.
       */
      setContextMissingStrategy: contextUtils.setContextMissingStrategy,
      /**
       * Exposes the segment class.
       * @memberof AWSXRay
       * @function
       */
      Segment: require_segment(),
      /**
       * Exposes the subsegment class.
       * @memberof AWSXRay
       * @see Subsegment
       */
      Subsegment: require_subsegment(),
      SegmentUtils: segmentUtils
    };
    AWSXRay4.middleware.IncomingRequestData = require_incoming_request_data(), (function() {
      var data = {
        runtime: process.release && process.release.name ? process.release.name : UNKNOWN,
        runtime_version: process.version,
        version: process.env.npm_package_version || UNKNOWN,
        name: process.env.npm_package_name || UNKNOWN
      };
      var sdkData = {
        sdk: "X-Ray for Node.js",
        sdk_version: pkginfo.version ? pkginfo.version : UNKNOWN,
        package: pkginfo.name ? pkginfo.name : UNKNOWN
      };
      segmentUtils.setSDKData(sdkData);
      segmentUtils.setServiceData(data);
      if (process.env.LAMBDA_TASK_ROOT) {
        LambdaEnv.init();
      }
    })();
    module2.exports = AWSXRay4;
  }
});

// node_modules/aws-xray-sdk-core/dist/lib/index.js
var require_lib = __commonJS({
  "node_modules/aws-xray-sdk-core/dist/lib/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_aws_xray();
  }
});

// node_modules/handlebars/dist/cjs/handlebars/utils.js
var require_utils2 = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/utils.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.extend = extend;
    exports2.indexOf = indexOf;
    exports2.escapeExpression = escapeExpression;
    exports2.isEmpty = isEmpty;
    exports2.createFrame = createFrame;
    exports2.blockParams = blockParams;
    exports2.appendContextPath = appendContextPath;
    var escape = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "`": "&#x60;",
      "=": "&#x3D;"
    };
    var badChars = /[&<>"'`=]/g;
    var possible = /[&<>"'`=]/;
    function escapeChar(chr) {
      return escape[chr];
    }
    function extend(obj) {
      for (var i = 1; i < arguments.length; i++) {
        for (var key in arguments[i]) {
          if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
            obj[key] = arguments[i][key];
          }
        }
      }
      return obj;
    }
    var toString = Object.prototype.toString;
    exports2.toString = toString;
    var isFunction = function isFunction2(value) {
      return typeof value === "function";
    };
    if (isFunction(/x/)) {
      exports2.isFunction = isFunction = function(value) {
        return typeof value === "function" && toString.call(value) === "[object Function]";
      };
    }
    exports2.isFunction = isFunction;
    var isArray = Array.isArray || function(value) {
      return value && typeof value === "object" ? toString.call(value) === "[object Array]" : false;
    };
    exports2.isArray = isArray;
    function indexOf(array, value) {
      for (var i = 0, len = array.length; i < len; i++) {
        if (array[i] === value) {
          return i;
        }
      }
      return -1;
    }
    function escapeExpression(string) {
      if (typeof string !== "string") {
        if (string && string.toHTML) {
          return string.toHTML();
        } else if (string == null) {
          return "";
        } else if (!string) {
          return string + "";
        }
        string = "" + string;
      }
      if (!possible.test(string)) {
        return string;
      }
      return string.replace(badChars, escapeChar);
    }
    function isEmpty(value) {
      if (!value && value !== 0) {
        return true;
      } else if (isArray(value) && value.length === 0) {
        return true;
      } else {
        return false;
      }
    }
    function createFrame(object) {
      var frame = extend({}, object);
      frame._parent = object;
      return frame;
    }
    function blockParams(params, ids) {
      params.path = ids;
      return params;
    }
    function appendContextPath(contextPath, id) {
      return (contextPath ? contextPath + "." : "") + id;
    }
  }
});

// node_modules/handlebars/dist/cjs/handlebars/exception.js
var require_exception = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/exception.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    var errorProps = ["description", "fileName", "lineNumber", "endLineNumber", "message", "name", "number", "stack"];
    function Exception(message, node) {
      var loc = node && node.loc, line = void 0, endLineNumber = void 0, column = void 0, endColumn = void 0;
      if (loc) {
        line = loc.start.line;
        endLineNumber = loc.end.line;
        column = loc.start.column;
        endColumn = loc.end.column;
        message += " - " + line + ":" + column;
      }
      var tmp = Error.prototype.constructor.call(this, message);
      for (var idx = 0; idx < errorProps.length; idx++) {
        this[errorProps[idx]] = tmp[errorProps[idx]];
      }
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, Exception);
      }
      try {
        if (loc) {
          this.lineNumber = line;
          this.endLineNumber = endLineNumber;
          if (Object.defineProperty) {
            Object.defineProperty(this, "column", {
              value: column,
              enumerable: true
            });
            Object.defineProperty(this, "endColumn", {
              value: endColumn,
              enumerable: true
            });
          } else {
            this.column = column;
            this.endColumn = endColumn;
          }
        }
      } catch (nop) {
      }
    }
    Exception.prototype = new Error();
    exports2["default"] = Exception;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/helpers/block-helper-missing.js
var require_block_helper_missing = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/helpers/block-helper-missing.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    var _utils = require_utils2();
    exports2["default"] = function(instance) {
      instance.registerHelper("blockHelperMissing", function(context, options) {
        var inverse = options.inverse, fn = options.fn;
        if (context === true) {
          return fn(this);
        } else if (context === false || context == null) {
          return inverse(this);
        } else if (_utils.isArray(context)) {
          if (context.length > 0) {
            if (options.ids) {
              options.ids = [options.name];
            }
            return instance.helpers.each(context, options);
          } else {
            return inverse(this);
          }
        } else {
          if (options.data && options.ids) {
            var data = _utils.createFrame(options.data);
            data.contextPath = _utils.appendContextPath(options.data.contextPath, options.name);
            options = { data };
          }
          return fn(context, options);
        }
      });
    };
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/helpers/each.js
var require_each = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/helpers/each.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _utils = require_utils2();
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    exports2["default"] = function(instance) {
      instance.registerHelper("each", function(context, options) {
        if (!options) {
          throw new _exception2["default"]("Must pass iterator to #each");
        }
        var fn = options.fn, inverse = options.inverse, i = 0, ret = "", data = void 0, contextPath = void 0;
        if (options.data && options.ids) {
          contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]) + ".";
        }
        if (_utils.isFunction(context)) {
          context = context.call(this);
        }
        if (options.data) {
          data = _utils.createFrame(options.data);
        }
        function execIteration(field, index, last) {
          if (data) {
            data.key = field;
            data.index = index;
            data.first = index === 0;
            data.last = !!last;
            if (contextPath) {
              data.contextPath = contextPath + field;
            }
          }
          ret = ret + fn(context[field], {
            data,
            blockParams: _utils.blockParams([context[field], field], [contextPath + field, null])
          });
        }
        if (context && typeof context === "object") {
          if (_utils.isArray(context)) {
            for (var j = context.length; i < j; i++) {
              if (i in context) {
                execIteration(i, i, i === context.length - 1);
              }
            }
          } else if (typeof Symbol === "function" && context[Symbol.iterator]) {
            var newContext = [];
            var iterator = context[Symbol.iterator]();
            for (var it = iterator.next(); !it.done; it = iterator.next()) {
              newContext.push(it.value);
            }
            context = newContext;
            for (var j = context.length; i < j; i++) {
              execIteration(i, i, i === context.length - 1);
            }
          } else {
            (function() {
              var priorKey = void 0;
              Object.keys(context).forEach(function(key) {
                if (priorKey !== void 0) {
                  execIteration(priorKey, i - 1);
                }
                priorKey = key;
                i++;
              });
              if (priorKey !== void 0) {
                execIteration(priorKey, i - 1, true);
              }
            })();
          }
        }
        if (i === 0) {
          ret = inverse(this);
        }
        return ret;
      });
    };
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js
var require_helper_missing = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    exports2["default"] = function(instance) {
      instance.registerHelper("helperMissing", function() {
        if (arguments.length === 1) {
          return void 0;
        } else {
          throw new _exception2["default"]('Missing helper: "' + arguments[arguments.length - 1].name + '"');
        }
      });
    };
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/helpers/if.js
var require_if = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/helpers/if.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _utils = require_utils2();
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    exports2["default"] = function(instance) {
      instance.registerHelper("if", function(conditional, options) {
        if (arguments.length != 2) {
          throw new _exception2["default"]("#if requires exactly one argument");
        }
        if (_utils.isFunction(conditional)) {
          conditional = conditional.call(this);
        }
        if (!options.hash.includeZero && !conditional || _utils.isEmpty(conditional)) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      });
      instance.registerHelper("unless", function(conditional, options) {
        if (arguments.length != 2) {
          throw new _exception2["default"]("#unless requires exactly one argument");
        }
        return instance.helpers["if"].call(this, conditional, {
          fn: options.inverse,
          inverse: options.fn,
          hash: options.hash
        });
      });
    };
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/helpers/log.js
var require_log = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/helpers/log.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2["default"] = function(instance) {
      instance.registerHelper("log", function() {
        var args = [void 0], options = arguments[arguments.length - 1];
        for (var i = 0; i < arguments.length - 1; i++) {
          args.push(arguments[i]);
        }
        var level = 1;
        if (options.hash.level != null) {
          level = options.hash.level;
        } else if (options.data && options.data.level != null) {
          level = options.data.level;
        }
        args[0] = level;
        instance.log.apply(instance, args);
      });
    };
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/helpers/lookup.js
var require_lookup = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/helpers/lookup.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2["default"] = function(instance) {
      instance.registerHelper("lookup", function(obj, field, options) {
        if (!obj) {
          return obj;
        }
        return options.lookupProperty(obj, field);
      });
    };
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/helpers/with.js
var require_with = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/helpers/with.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _utils = require_utils2();
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    exports2["default"] = function(instance) {
      instance.registerHelper("with", function(context, options) {
        if (arguments.length != 2) {
          throw new _exception2["default"]("#with requires exactly one argument");
        }
        if (_utils.isFunction(context)) {
          context = context.call(this);
        }
        var fn = options.fn;
        if (!_utils.isEmpty(context)) {
          var data = options.data;
          if (options.data && options.ids) {
            data = _utils.createFrame(options.data);
            data.contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]);
          }
          return fn(context, {
            data,
            blockParams: _utils.blockParams([context], [data && data.contextPath])
          });
        } else {
          return options.inverse(this);
        }
      });
    };
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/helpers.js
var require_helpers = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/helpers.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.registerDefaultHelpers = registerDefaultHelpers;
    exports2.moveHelperToHooks = moveHelperToHooks;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _helpersBlockHelperMissing = require_block_helper_missing();
    var _helpersBlockHelperMissing2 = _interopRequireDefault(_helpersBlockHelperMissing);
    var _helpersEach = require_each();
    var _helpersEach2 = _interopRequireDefault(_helpersEach);
    var _helpersHelperMissing = require_helper_missing();
    var _helpersHelperMissing2 = _interopRequireDefault(_helpersHelperMissing);
    var _helpersIf = require_if();
    var _helpersIf2 = _interopRequireDefault(_helpersIf);
    var _helpersLog = require_log();
    var _helpersLog2 = _interopRequireDefault(_helpersLog);
    var _helpersLookup = require_lookup();
    var _helpersLookup2 = _interopRequireDefault(_helpersLookup);
    var _helpersWith = require_with();
    var _helpersWith2 = _interopRequireDefault(_helpersWith);
    function registerDefaultHelpers(instance) {
      _helpersBlockHelperMissing2["default"](instance);
      _helpersEach2["default"](instance);
      _helpersHelperMissing2["default"](instance);
      _helpersIf2["default"](instance);
      _helpersLog2["default"](instance);
      _helpersLookup2["default"](instance);
      _helpersWith2["default"](instance);
    }
    function moveHelperToHooks(instance, helperName, keepHelper) {
      if (instance.helpers[helperName]) {
        instance.hooks[helperName] = instance.helpers[helperName];
        if (!keepHelper) {
          instance.helpers[helperName] = void 0;
        }
      }
    }
  }
});

// node_modules/handlebars/dist/cjs/handlebars/decorators/inline.js
var require_inline = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/decorators/inline.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    var _utils = require_utils2();
    exports2["default"] = function(instance) {
      instance.registerDecorator("inline", function(fn, props, container, options) {
        var ret = fn;
        if (!props.partials) {
          props.partials = {};
          ret = function(context, options2) {
            var original = container.partials;
            container.partials = _utils.extend({}, original, props.partials);
            var ret2 = fn(context, options2);
            container.partials = original;
            return ret2;
          };
        }
        props.partials[options.args[0]] = options.fn;
        return ret;
      });
    };
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/decorators.js
var require_decorators = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/decorators.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.registerDefaultDecorators = registerDefaultDecorators;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _decoratorsInline = require_inline();
    var _decoratorsInline2 = _interopRequireDefault(_decoratorsInline);
    function registerDefaultDecorators(instance) {
      _decoratorsInline2["default"](instance);
    }
  }
});

// node_modules/handlebars/dist/cjs/handlebars/logger.js
var require_logger2 = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/logger.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    var _utils = require_utils2();
    var logger = {
      methodMap: ["debug", "info", "warn", "error"],
      level: "info",
      // Maps a given level value to the `methodMap` indexes above.
      lookupLevel: function lookupLevel(level) {
        if (typeof level === "string") {
          var levelMap = _utils.indexOf(logger.methodMap, level.toLowerCase());
          if (levelMap >= 0) {
            level = levelMap;
          } else {
            level = parseInt(level, 10);
          }
        }
        return level;
      },
      // Can be overridden in the host environment
      log: function log(level) {
        level = logger.lookupLevel(level);
        if (typeof console !== "undefined" && logger.lookupLevel(logger.level) <= level) {
          var method = logger.methodMap[level];
          if (!console[method]) {
            method = "log";
          }
          for (var _len = arguments.length, message = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            message[_key - 1] = arguments[_key];
          }
          console[method].apply(console, message);
        }
      }
    };
    exports2["default"] = logger;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/internal/proto-access.js
var require_proto_access = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/internal/proto-access.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.createProtoAccessControl = createProtoAccessControl;
    exports2.resultIsAllowed = resultIsAllowed;
    exports2.resetLoggedProperties = resetLoggedProperties;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _utils = require_utils2();
    var _logger = require_logger2();
    var _logger2 = _interopRequireDefault(_logger);
    var loggedProperties = /* @__PURE__ */ Object.create(null);
    function createProtoAccessControl(runtimeOptions) {
      var propertyWhiteList = /* @__PURE__ */ Object.create(null);
      propertyWhiteList["__proto__"] = false;
      _utils.extend(propertyWhiteList, runtimeOptions.allowedProtoProperties);
      var methodWhiteList = /* @__PURE__ */ Object.create(null);
      methodWhiteList["constructor"] = false;
      methodWhiteList["__defineGetter__"] = false;
      methodWhiteList["__defineSetter__"] = false;
      methodWhiteList["__lookupGetter__"] = false;
      methodWhiteList["__lookupSetter__"] = false;
      _utils.extend(methodWhiteList, runtimeOptions.allowedProtoMethods);
      return {
        properties: {
          whitelist: propertyWhiteList,
          defaultValue: runtimeOptions.allowProtoPropertiesByDefault
        },
        methods: {
          whitelist: methodWhiteList,
          defaultValue: runtimeOptions.allowProtoMethodsByDefault
        }
      };
    }
    function resultIsAllowed(result, protoAccessControl, propertyName) {
      if (typeof result === "function") {
        return checkWhiteList(protoAccessControl.methods, propertyName);
      } else {
        return checkWhiteList(protoAccessControl.properties, propertyName);
      }
    }
    function checkWhiteList(protoAccessControlForType, propertyName) {
      if (protoAccessControlForType.whitelist[propertyName] !== void 0) {
        return protoAccessControlForType.whitelist[propertyName] === true;
      }
      if (protoAccessControlForType.defaultValue !== void 0) {
        return protoAccessControlForType.defaultValue;
      }
      logUnexpecedPropertyAccessOnce(propertyName);
      return false;
    }
    function logUnexpecedPropertyAccessOnce(propertyName) {
      if (loggedProperties[propertyName] !== true) {
        loggedProperties[propertyName] = true;
        _logger2["default"].log("error", 'Handlebars: Access has been denied to resolve the property "' + propertyName + '" because it is not an "own property" of its parent.\nYou can add a runtime option to disable the check or this warning:\nSee https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details');
      }
    }
    function resetLoggedProperties() {
      Object.keys(loggedProperties).forEach(function(propertyName) {
        delete loggedProperties[propertyName];
      });
    }
  }
});

// node_modules/handlebars/dist/cjs/handlebars/base.js
var require_base = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/base.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.HandlebarsEnvironment = HandlebarsEnvironment;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _utils = require_utils2();
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    var _helpers = require_helpers();
    var _decorators = require_decorators();
    var _logger = require_logger2();
    var _logger2 = _interopRequireDefault(_logger);
    var _internalProtoAccess = require_proto_access();
    var VERSION = "4.7.9";
    exports2.VERSION = VERSION;
    var COMPILER_REVISION = 8;
    exports2.COMPILER_REVISION = COMPILER_REVISION;
    var LAST_COMPATIBLE_COMPILER_REVISION = 7;
    exports2.LAST_COMPATIBLE_COMPILER_REVISION = LAST_COMPATIBLE_COMPILER_REVISION;
    var REVISION_CHANGES = {
      1: "<= 1.0.rc.2",
      // 1.0.rc.2 is actually rev2 but doesn't report it
      2: "== 1.0.0-rc.3",
      3: "== 1.0.0-rc.4",
      4: "== 1.x.x",
      5: "== 2.0.0-alpha.x",
      6: ">= 2.0.0-beta.1",
      7: ">= 4.0.0 <4.3.0",
      8: ">= 4.3.0"
    };
    exports2.REVISION_CHANGES = REVISION_CHANGES;
    var objectType = "[object Object]";
    function HandlebarsEnvironment(helpers, partials, decorators) {
      this.helpers = helpers || {};
      this.partials = partials || {};
      this.decorators = decorators || {};
      _helpers.registerDefaultHelpers(this);
      _decorators.registerDefaultDecorators(this);
    }
    HandlebarsEnvironment.prototype = {
      constructor: HandlebarsEnvironment,
      logger: _logger2["default"],
      log: _logger2["default"].log,
      registerHelper: function registerHelper(name, fn) {
        if (_utils.toString.call(name) === objectType) {
          if (fn) {
            throw new _exception2["default"]("Arg not supported with multiple helpers");
          }
          _utils.extend(this.helpers, name);
        } else {
          this.helpers[name] = fn;
        }
      },
      unregisterHelper: function unregisterHelper(name) {
        delete this.helpers[name];
      },
      registerPartial: function registerPartial(name, partial) {
        if (_utils.toString.call(name) === objectType) {
          _utils.extend(this.partials, name);
        } else {
          if (typeof partial === "undefined") {
            throw new _exception2["default"]('Attempting to register a partial called "' + name + '" as undefined');
          }
          this.partials[name] = partial;
        }
      },
      unregisterPartial: function unregisterPartial(name) {
        delete this.partials[name];
      },
      registerDecorator: function registerDecorator(name, fn) {
        if (_utils.toString.call(name) === objectType) {
          if (fn) {
            throw new _exception2["default"]("Arg not supported with multiple decorators");
          }
          _utils.extend(this.decorators, name);
        } else {
          this.decorators[name] = fn;
        }
      },
      unregisterDecorator: function unregisterDecorator(name) {
        delete this.decorators[name];
      },
      /**
       * Reset the memory of illegal property accesses that have already been logged.
       * @deprecated should only be used in handlebars test-cases
       */
      resetLoggedPropertyAccesses: function resetLoggedPropertyAccesses() {
        _internalProtoAccess.resetLoggedProperties();
      }
    };
    var log = _logger2["default"].log;
    exports2.log = log;
    exports2.createFrame = _utils.createFrame;
    exports2.logger = _logger2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/safe-string.js
var require_safe_string = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/safe-string.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    function SafeString(string) {
      this.string = string;
    }
    SafeString.prototype.toString = SafeString.prototype.toHTML = function() {
      return "" + this.string;
    };
    exports2["default"] = SafeString;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/internal/wrapHelper.js
var require_wrapHelper = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/internal/wrapHelper.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.wrapHelper = wrapHelper;
    function wrapHelper(helper, transformOptionsFn) {
      if (typeof helper !== "function") {
        return helper;
      }
      var wrapper = function wrapper2() {
        var options = arguments[arguments.length - 1];
        arguments[arguments.length - 1] = transformOptionsFn(options);
        return helper.apply(this, arguments);
      };
      return wrapper;
    }
  }
});

// node_modules/handlebars/dist/cjs/handlebars/runtime.js
var require_runtime = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/runtime.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.checkRevision = checkRevision;
    exports2.template = template;
    exports2.wrapProgram = wrapProgram;
    exports2.resolvePartial = resolvePartial;
    exports2.invokePartial = invokePartial;
    exports2.noop = noop;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    function _interopRequireWildcard(obj) {
      if (obj && obj.__esModule) {
        return obj;
      } else {
        var newObj = {};
        if (obj != null) {
          for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
          }
        }
        newObj["default"] = obj;
        return newObj;
      }
    }
    var _utils = require_utils2();
    var Utils = _interopRequireWildcard(_utils);
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    var _base = require_base();
    var _helpers = require_helpers();
    var _internalWrapHelper = require_wrapHelper();
    var _internalProtoAccess = require_proto_access();
    function checkRevision(compilerInfo) {
      var compilerRevision = compilerInfo && compilerInfo[0] || 1, currentRevision = _base.COMPILER_REVISION;
      if (compilerRevision >= _base.LAST_COMPATIBLE_COMPILER_REVISION && compilerRevision <= _base.COMPILER_REVISION) {
        return;
      }
      if (compilerRevision < _base.LAST_COMPATIBLE_COMPILER_REVISION) {
        var runtimeVersions = _base.REVISION_CHANGES[currentRevision], compilerVersions = _base.REVISION_CHANGES[compilerRevision];
        throw new _exception2["default"]("Template was precompiled with an older version of Handlebars than the current runtime. Please update your precompiler to a newer version (" + runtimeVersions + ") or downgrade your runtime to an older version (" + compilerVersions + ").");
      } else {
        throw new _exception2["default"]("Template was precompiled with a newer version of Handlebars than the current runtime. Please update your runtime to a newer version (" + compilerInfo[1] + ").");
      }
    }
    function template(templateSpec, env2) {
      if (!env2) {
        throw new _exception2["default"]("No environment passed to template");
      }
      if (!templateSpec || !templateSpec.main) {
        throw new _exception2["default"]("Unknown template object: " + typeof templateSpec);
      }
      templateSpec.main.decorator = templateSpec.main_d;
      env2.VM.checkRevision(templateSpec.compiler);
      var templateWasPrecompiledWithCompilerV7 = templateSpec.compiler && templateSpec.compiler[0] === 7;
      function invokePartialWrapper(partial, context, options) {
        if (options.hash) {
          context = Utils.extend({}, context, options.hash);
          if (options.ids) {
            options.ids[0] = true;
          }
        }
        partial = env2.VM.resolvePartial.call(this, partial, context, options);
        options.hooks = this.hooks;
        options.protoAccessControl = this.protoAccessControl;
        var result = env2.VM.invokePartial.call(this, partial, context, options);
        if (result == null && env2.compile) {
          options.partials[options.name] = env2.compile(partial, templateSpec.compilerOptions, env2);
          result = options.partials[options.name](context, options);
        }
        if (result != null) {
          if (options.indent) {
            var lines = result.split("\n");
            for (var i = 0, l = lines.length; i < l; i++) {
              if (!lines[i] && i + 1 === l) {
                break;
              }
              lines[i] = options.indent + lines[i];
            }
            result = lines.join("\n");
          }
          return result;
        } else {
          throw new _exception2["default"]("The partial " + options.name + " could not be compiled when running in runtime-only mode");
        }
      }
      var container = {
        strict: function strict(obj, name, loc) {
          if (!obj || !(name in obj)) {
            throw new _exception2["default"]('"' + name + '" not defined in ' + obj, {
              loc
            });
          }
          return container.lookupProperty(obj, name);
        },
        lookupProperty: function lookupProperty(parent, propertyName) {
          var result = parent[propertyName];
          if (result == null) {
            return result;
          }
          if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
            return result;
          }
          if (_internalProtoAccess.resultIsAllowed(result, container.protoAccessControl, propertyName)) {
            return result;
          }
          return void 0;
        },
        lookup: function lookup(depths, name) {
          var len = depths.length;
          for (var i = 0; i < len; i++) {
            var result = depths[i] && container.lookupProperty(depths[i], name);
            if (result != null) {
              return result;
            }
          }
        },
        lambda: function lambda(current, context) {
          return typeof current === "function" ? current.call(context) : current;
        },
        escapeExpression: Utils.escapeExpression,
        invokePartial: invokePartialWrapper,
        fn: function fn(i) {
          var ret2 = templateSpec[i];
          ret2.decorator = templateSpec[i + "_d"];
          return ret2;
        },
        programs: [],
        program: function program(i, data, declaredBlockParams, blockParams, depths) {
          var programWrapper = this.programs[i], fn = this.fn(i);
          if (data || depths || blockParams || declaredBlockParams) {
            programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
          } else if (!programWrapper) {
            programWrapper = this.programs[i] = wrapProgram(this, i, fn);
          }
          return programWrapper;
        },
        data: function data(value, depth) {
          while (value && depth--) {
            value = value._parent;
          }
          return value;
        },
        mergeIfNeeded: function mergeIfNeeded(param, common) {
          var obj = param || common;
          if (param && common && param !== common) {
            obj = Utils.extend({}, common, param);
          }
          return obj;
        },
        // An empty object to use as replacement for null-contexts
        nullContext: Object.seal({}),
        noop: env2.VM.noop,
        compilerInfo: templateSpec.compiler
      };
      function ret(context) {
        var options = arguments.length <= 1 || arguments[1] === void 0 ? {} : arguments[1];
        var data = options.data;
        ret._setup(options);
        if (!options.partial && templateSpec.useData) {
          data = initData(context, data);
        }
        var depths = void 0, blockParams = templateSpec.useBlockParams ? [] : void 0;
        if (templateSpec.useDepths) {
          if (options.depths) {
            depths = context != options.depths[0] ? [context].concat(options.depths) : options.depths;
          } else {
            depths = [context];
          }
        }
        function main(context2) {
          return "" + templateSpec.main(container, context2, container.helpers, container.partials, data, blockParams, depths);
        }
        main = executeDecorators(templateSpec.main, main, container, options.depths || [], data, blockParams);
        return main(context, options);
      }
      ret.isTop = true;
      ret._setup = function(options) {
        if (!options.partial) {
          var mergedHelpers = {};
          addHelpers(mergedHelpers, env2.helpers, container);
          addHelpers(mergedHelpers, options.helpers, container);
          container.helpers = mergedHelpers;
          if (templateSpec.usePartial) {
            container.partials = container.mergeIfNeeded(options.partials, env2.partials);
          }
          if (templateSpec.usePartial || templateSpec.useDecorators) {
            container.decorators = Utils.extend({}, env2.decorators, options.decorators);
          }
          container.hooks = {};
          container.protoAccessControl = _internalProtoAccess.createProtoAccessControl(options);
          var keepHelperInHelpers = options.allowCallsToHelperMissing || templateWasPrecompiledWithCompilerV7;
          _helpers.moveHelperToHooks(container, "helperMissing", keepHelperInHelpers);
          _helpers.moveHelperToHooks(container, "blockHelperMissing", keepHelperInHelpers);
        } else {
          container.protoAccessControl = options.protoAccessControl;
          container.helpers = options.helpers;
          container.partials = options.partials;
          container.decorators = options.decorators;
          container.hooks = options.hooks;
        }
      };
      ret._child = function(i, data, blockParams, depths) {
        if (templateSpec.useBlockParams && !blockParams) {
          throw new _exception2["default"]("must pass block params");
        }
        if (templateSpec.useDepths && !depths) {
          throw new _exception2["default"]("must pass parent depths");
        }
        return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
      };
      return ret;
    }
    function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
      function prog(context) {
        var options = arguments.length <= 1 || arguments[1] === void 0 ? {} : arguments[1];
        var currentDepths = depths;
        if (depths && context != depths[0] && !(context === container.nullContext && depths[0] === null)) {
          currentDepths = [context].concat(depths);
        }
        return fn(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), currentDepths);
      }
      prog = executeDecorators(fn, prog, container, depths, data, blockParams);
      prog.program = i;
      prog.depth = depths ? depths.length : 0;
      prog.blockParams = declaredBlockParams || 0;
      return prog;
    }
    function resolvePartial(partial, context, options) {
      if (!partial) {
        if (options.name === "@partial-block") {
          partial = lookupOwnProperty(options.data, "partial-block");
        } else {
          partial = lookupOwnProperty(options.partials, options.name);
        }
      } else if (!partial.call && !options.name) {
        options.name = partial;
        partial = lookupOwnProperty(options.partials, partial);
      }
      return partial;
    }
    function invokePartial(partial, context, options) {
      var currentPartialBlock = lookupOwnProperty(options.data, "partial-block");
      options.partial = true;
      if (options.ids) {
        options.data.contextPath = options.ids[0] || options.data.contextPath;
      }
      var partialBlock = void 0;
      if (options.fn && options.fn !== noop) {
        (function() {
          options.data = _base.createFrame(options.data);
          var fn = options.fn;
          partialBlock = options.data["partial-block"] = function partialBlockWrapper(context2) {
            var options2 = arguments.length <= 1 || arguments[1] === void 0 ? {} : arguments[1];
            options2.data = _base.createFrame(options2.data);
            options2.data["partial-block"] = currentPartialBlock;
            return fn(context2, options2);
          };
          if (fn.partials) {
            options.partials = Utils.extend({}, options.partials, fn.partials);
          }
        })();
      }
      if (partial === void 0 && partialBlock) {
        partial = partialBlock;
      }
      if (partial === void 0) {
        throw new _exception2["default"]("The partial " + options.name + " could not be found");
      } else if (partial instanceof Function) {
        return partial(context, options);
      }
    }
    function noop() {
      return "";
    }
    function lookupOwnProperty(obj, name) {
      if (obj && Object.prototype.hasOwnProperty.call(obj, name)) {
        return obj[name];
      }
    }
    function initData(context, data) {
      if (!data || !("root" in data)) {
        data = data ? _base.createFrame(data) : {};
        data.root = context;
      }
      return data;
    }
    function executeDecorators(fn, prog, container, depths, data, blockParams) {
      if (fn.decorator) {
        var props = {};
        prog = fn.decorator(prog, props, container, depths && depths[0], data, blockParams, depths);
        Utils.extend(prog, props);
      }
      return prog;
    }
    function addHelpers(mergedHelpers, helpers, container) {
      if (!helpers) return;
      Object.keys(helpers).forEach(function(helperName) {
        var helper = helpers[helperName];
        mergedHelpers[helperName] = passLookupPropertyOption(helper, container);
      });
    }
    function passLookupPropertyOption(helper, container) {
      var lookupProperty = container.lookupProperty;
      return _internalWrapHelper.wrapHelper(helper, function(options) {
        options.lookupProperty = lookupProperty;
        return options;
      });
    }
  }
});

// node_modules/handlebars/dist/cjs/handlebars/no-conflict.js
var require_no_conflict = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/no-conflict.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2["default"] = function(Handlebars2) {
      (function() {
        if (typeof globalThis === "object") return;
        Object.prototype.__defineGetter__("__magic__", function() {
          return this;
        });
        __magic__.globalThis = __magic__;
        delete Object.prototype.__magic__;
      })();
      var $Handlebars = globalThis.Handlebars;
      Handlebars2.noConflict = function() {
        if (globalThis.Handlebars === Handlebars2) {
          globalThis.Handlebars = $Handlebars;
        }
        return Handlebars2;
      };
    };
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars.runtime.js
var require_handlebars_runtime = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars.runtime.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    function _interopRequireWildcard(obj) {
      if (obj && obj.__esModule) {
        return obj;
      } else {
        var newObj = {};
        if (obj != null) {
          for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
          }
        }
        newObj["default"] = obj;
        return newObj;
      }
    }
    var _handlebarsBase = require_base();
    var base = _interopRequireWildcard(_handlebarsBase);
    var _handlebarsSafeString = require_safe_string();
    var _handlebarsSafeString2 = _interopRequireDefault(_handlebarsSafeString);
    var _handlebarsException = require_exception();
    var _handlebarsException2 = _interopRequireDefault(_handlebarsException);
    var _handlebarsUtils = require_utils2();
    var Utils = _interopRequireWildcard(_handlebarsUtils);
    var _handlebarsRuntime = require_runtime();
    var runtime = _interopRequireWildcard(_handlebarsRuntime);
    var _handlebarsNoConflict = require_no_conflict();
    var _handlebarsNoConflict2 = _interopRequireDefault(_handlebarsNoConflict);
    function create() {
      var hb = new base.HandlebarsEnvironment();
      Utils.extend(hb, base);
      hb.SafeString = _handlebarsSafeString2["default"];
      hb.Exception = _handlebarsException2["default"];
      hb.Utils = Utils;
      hb.escapeExpression = Utils.escapeExpression;
      hb.VM = runtime;
      hb.template = function(spec) {
        return runtime.template(spec, hb);
      };
      return hb;
    }
    var inst = create();
    inst.create = create;
    _handlebarsNoConflict2["default"](inst);
    inst["default"] = inst;
    exports2["default"] = inst;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/compiler/ast.js
var require_ast = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/compiler/ast.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    var AST = {
      // Public API used to evaluate derived attributes regarding AST nodes
      helpers: {
        // a mustache is definitely a helper if:
        // * it is an eligible helper, and
        // * it has at least one parameter or hash segment
        helperExpression: function helperExpression(node) {
          return node.type === "SubExpression" || (node.type === "MustacheStatement" || node.type === "BlockStatement") && !!(node.params && node.params.length || node.hash);
        },
        scopedId: function scopedId(path) {
          return /^\.|this\b/.test(path.original);
        },
        // an ID is simple if it only has one part, and that part is not
        // `..` or `this`.
        simpleId: function simpleId(path) {
          return path.parts.length === 1 && !AST.helpers.scopedId(path) && !path.depth;
        }
      }
    };
    exports2["default"] = AST;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js
var require_parser = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    var handlebars = (function() {
      var parser = {
        trace: function trace() {
        },
        yy: {},
        symbols_: { "error": 2, "root": 3, "program": 4, "EOF": 5, "program_repetition0": 6, "statement": 7, "mustache": 8, "block": 9, "rawBlock": 10, "partial": 11, "partialBlock": 12, "content": 13, "COMMENT": 14, "CONTENT": 15, "openRawBlock": 16, "rawBlock_repetition0": 17, "END_RAW_BLOCK": 18, "OPEN_RAW_BLOCK": 19, "helperName": 20, "openRawBlock_repetition0": 21, "openRawBlock_option0": 22, "CLOSE_RAW_BLOCK": 23, "openBlock": 24, "block_option0": 25, "closeBlock": 26, "openInverse": 27, "block_option1": 28, "OPEN_BLOCK": 29, "openBlock_repetition0": 30, "openBlock_option0": 31, "openBlock_option1": 32, "CLOSE": 33, "OPEN_INVERSE": 34, "openInverse_repetition0": 35, "openInverse_option0": 36, "openInverse_option1": 37, "openInverseChain": 38, "OPEN_INVERSE_CHAIN": 39, "openInverseChain_repetition0": 40, "openInverseChain_option0": 41, "openInverseChain_option1": 42, "inverseAndProgram": 43, "INVERSE": 44, "inverseChain": 45, "inverseChain_option0": 46, "OPEN_ENDBLOCK": 47, "OPEN": 48, "mustache_repetition0": 49, "mustache_option0": 50, "OPEN_UNESCAPED": 51, "mustache_repetition1": 52, "mustache_option1": 53, "CLOSE_UNESCAPED": 54, "OPEN_PARTIAL": 55, "partialName": 56, "partial_repetition0": 57, "partial_option0": 58, "openPartialBlock": 59, "OPEN_PARTIAL_BLOCK": 60, "openPartialBlock_repetition0": 61, "openPartialBlock_option0": 62, "param": 63, "sexpr": 64, "OPEN_SEXPR": 65, "sexpr_repetition0": 66, "sexpr_option0": 67, "CLOSE_SEXPR": 68, "hash": 69, "hash_repetition_plus0": 70, "hashSegment": 71, "ID": 72, "EQUALS": 73, "blockParams": 74, "OPEN_BLOCK_PARAMS": 75, "blockParams_repetition_plus0": 76, "CLOSE_BLOCK_PARAMS": 77, "path": 78, "dataName": 79, "STRING": 80, "NUMBER": 81, "BOOLEAN": 82, "UNDEFINED": 83, "NULL": 84, "DATA": 85, "pathSegments": 86, "SEP": 87, "$accept": 0, "$end": 1 },
        terminals_: { 2: "error", 5: "EOF", 14: "COMMENT", 15: "CONTENT", 18: "END_RAW_BLOCK", 19: "OPEN_RAW_BLOCK", 23: "CLOSE_RAW_BLOCK", 29: "OPEN_BLOCK", 33: "CLOSE", 34: "OPEN_INVERSE", 39: "OPEN_INVERSE_CHAIN", 44: "INVERSE", 47: "OPEN_ENDBLOCK", 48: "OPEN", 51: "OPEN_UNESCAPED", 54: "CLOSE_UNESCAPED", 55: "OPEN_PARTIAL", 60: "OPEN_PARTIAL_BLOCK", 65: "OPEN_SEXPR", 68: "CLOSE_SEXPR", 72: "ID", 73: "EQUALS", 75: "OPEN_BLOCK_PARAMS", 77: "CLOSE_BLOCK_PARAMS", 80: "STRING", 81: "NUMBER", 82: "BOOLEAN", 83: "UNDEFINED", 84: "NULL", 85: "DATA", 87: "SEP" },
        productions_: [0, [3, 2], [4, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [13, 1], [10, 3], [16, 5], [9, 4], [9, 4], [24, 6], [27, 6], [38, 6], [43, 2], [45, 3], [45, 1], [26, 3], [8, 5], [8, 5], [11, 5], [12, 3], [59, 5], [63, 1], [63, 1], [64, 5], [69, 1], [71, 3], [74, 3], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [56, 1], [56, 1], [79, 2], [78, 1], [86, 3], [86, 1], [6, 0], [6, 2], [17, 0], [17, 2], [21, 0], [21, 2], [22, 0], [22, 1], [25, 0], [25, 1], [28, 0], [28, 1], [30, 0], [30, 2], [31, 0], [31, 1], [32, 0], [32, 1], [35, 0], [35, 2], [36, 0], [36, 1], [37, 0], [37, 1], [40, 0], [40, 2], [41, 0], [41, 1], [42, 0], [42, 1], [46, 0], [46, 1], [49, 0], [49, 2], [50, 0], [50, 1], [52, 0], [52, 2], [53, 0], [53, 1], [57, 0], [57, 2], [58, 0], [58, 1], [61, 0], [61, 2], [62, 0], [62, 1], [66, 0], [66, 2], [67, 0], [67, 1], [70, 1], [70, 2], [76, 1], [76, 2]],
        performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
          var $0 = $$.length - 1;
          switch (yystate) {
            case 1:
              return $$[$0 - 1];
              break;
            case 2:
              this.$ = yy.prepareProgram($$[$0]);
              break;
            case 3:
              this.$ = $$[$0];
              break;
            case 4:
              this.$ = $$[$0];
              break;
            case 5:
              this.$ = $$[$0];
              break;
            case 6:
              this.$ = $$[$0];
              break;
            case 7:
              this.$ = $$[$0];
              break;
            case 8:
              this.$ = $$[$0];
              break;
            case 9:
              this.$ = {
                type: "CommentStatement",
                value: yy.stripComment($$[$0]),
                strip: yy.stripFlags($$[$0], $$[$0]),
                loc: yy.locInfo(this._$)
              };
              break;
            case 10:
              this.$ = {
                type: "ContentStatement",
                original: $$[$0],
                value: $$[$0],
                loc: yy.locInfo(this._$)
              };
              break;
            case 11:
              this.$ = yy.prepareRawBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
              break;
            case 12:
              this.$ = { path: $$[$0 - 3], params: $$[$0 - 2], hash: $$[$0 - 1] };
              break;
            case 13:
              this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], false, this._$);
              break;
            case 14:
              this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], true, this._$);
              break;
            case 15:
              this.$ = { open: $$[$0 - 5], path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
              break;
            case 16:
              this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
              break;
            case 17:
              this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
              break;
            case 18:
              this.$ = { strip: yy.stripFlags($$[$0 - 1], $$[$0 - 1]), program: $$[$0] };
              break;
            case 19:
              var inverse = yy.prepareBlock($$[$0 - 2], $$[$0 - 1], $$[$0], $$[$0], false, this._$), program = yy.prepareProgram([inverse], $$[$0 - 1].loc);
              program.chained = true;
              this.$ = { strip: $$[$0 - 2].strip, program, chain: true };
              break;
            case 20:
              this.$ = $$[$0];
              break;
            case 21:
              this.$ = { path: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 2], $$[$0]) };
              break;
            case 22:
              this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
              break;
            case 23:
              this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
              break;
            case 24:
              this.$ = {
                type: "PartialStatement",
                name: $$[$0 - 3],
                params: $$[$0 - 2],
                hash: $$[$0 - 1],
                indent: "",
                strip: yy.stripFlags($$[$0 - 4], $$[$0]),
                loc: yy.locInfo(this._$)
              };
              break;
            case 25:
              this.$ = yy.preparePartialBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
              break;
            case 26:
              this.$ = { path: $$[$0 - 3], params: $$[$0 - 2], hash: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 4], $$[$0]) };
              break;
            case 27:
              this.$ = $$[$0];
              break;
            case 28:
              this.$ = $$[$0];
              break;
            case 29:
              this.$ = {
                type: "SubExpression",
                path: $$[$0 - 3],
                params: $$[$0 - 2],
                hash: $$[$0 - 1],
                loc: yy.locInfo(this._$)
              };
              break;
            case 30:
              this.$ = { type: "Hash", pairs: $$[$0], loc: yy.locInfo(this._$) };
              break;
            case 31:
              this.$ = { type: "HashPair", key: yy.id($$[$0 - 2]), value: $$[$0], loc: yy.locInfo(this._$) };
              break;
            case 32:
              this.$ = yy.id($$[$0 - 1]);
              break;
            case 33:
              this.$ = $$[$0];
              break;
            case 34:
              this.$ = $$[$0];
              break;
            case 35:
              this.$ = { type: "StringLiteral", value: $$[$0], original: $$[$0], loc: yy.locInfo(this._$) };
              break;
            case 36:
              this.$ = { type: "NumberLiteral", value: Number($$[$0]), original: Number($$[$0]), loc: yy.locInfo(this._$) };
              break;
            case 37:
              this.$ = { type: "BooleanLiteral", value: $$[$0] === "true", original: $$[$0] === "true", loc: yy.locInfo(this._$) };
              break;
            case 38:
              this.$ = { type: "UndefinedLiteral", original: void 0, value: void 0, loc: yy.locInfo(this._$) };
              break;
            case 39:
              this.$ = { type: "NullLiteral", original: null, value: null, loc: yy.locInfo(this._$) };
              break;
            case 40:
              this.$ = $$[$0];
              break;
            case 41:
              this.$ = $$[$0];
              break;
            case 42:
              this.$ = yy.preparePath(true, $$[$0], this._$);
              break;
            case 43:
              this.$ = yy.preparePath(false, $$[$0], this._$);
              break;
            case 44:
              $$[$0 - 2].push({ part: yy.id($$[$0]), original: $$[$0], separator: $$[$0 - 1] });
              this.$ = $$[$0 - 2];
              break;
            case 45:
              this.$ = [{ part: yy.id($$[$0]), original: $$[$0] }];
              break;
            case 46:
              this.$ = [];
              break;
            case 47:
              $$[$0 - 1].push($$[$0]);
              break;
            case 48:
              this.$ = [];
              break;
            case 49:
              $$[$0 - 1].push($$[$0]);
              break;
            case 50:
              this.$ = [];
              break;
            case 51:
              $$[$0 - 1].push($$[$0]);
              break;
            case 58:
              this.$ = [];
              break;
            case 59:
              $$[$0 - 1].push($$[$0]);
              break;
            case 64:
              this.$ = [];
              break;
            case 65:
              $$[$0 - 1].push($$[$0]);
              break;
            case 70:
              this.$ = [];
              break;
            case 71:
              $$[$0 - 1].push($$[$0]);
              break;
            case 78:
              this.$ = [];
              break;
            case 79:
              $$[$0 - 1].push($$[$0]);
              break;
            case 82:
              this.$ = [];
              break;
            case 83:
              $$[$0 - 1].push($$[$0]);
              break;
            case 86:
              this.$ = [];
              break;
            case 87:
              $$[$0 - 1].push($$[$0]);
              break;
            case 90:
              this.$ = [];
              break;
            case 91:
              $$[$0 - 1].push($$[$0]);
              break;
            case 94:
              this.$ = [];
              break;
            case 95:
              $$[$0 - 1].push($$[$0]);
              break;
            case 98:
              this.$ = [$$[$0]];
              break;
            case 99:
              $$[$0 - 1].push($$[$0]);
              break;
            case 100:
              this.$ = [$$[$0]];
              break;
            case 101:
              $$[$0 - 1].push($$[$0]);
              break;
          }
        },
        table: [{ 3: 1, 4: 2, 5: [2, 46], 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 1: [3] }, { 5: [1, 4] }, { 5: [2, 2], 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10, 13: 11, 14: [1, 12], 15: [1, 20], 16: 17, 19: [1, 23], 24: 15, 27: 16, 29: [1, 21], 34: [1, 22], 39: [2, 2], 44: [2, 2], 47: [2, 2], 48: [1, 13], 51: [1, 14], 55: [1, 18], 59: 19, 60: [1, 24] }, { 1: [2, 1] }, { 5: [2, 47], 14: [2, 47], 15: [2, 47], 19: [2, 47], 29: [2, 47], 34: [2, 47], 39: [2, 47], 44: [2, 47], 47: [2, 47], 48: [2, 47], 51: [2, 47], 55: [2, 47], 60: [2, 47] }, { 5: [2, 3], 14: [2, 3], 15: [2, 3], 19: [2, 3], 29: [2, 3], 34: [2, 3], 39: [2, 3], 44: [2, 3], 47: [2, 3], 48: [2, 3], 51: [2, 3], 55: [2, 3], 60: [2, 3] }, { 5: [2, 4], 14: [2, 4], 15: [2, 4], 19: [2, 4], 29: [2, 4], 34: [2, 4], 39: [2, 4], 44: [2, 4], 47: [2, 4], 48: [2, 4], 51: [2, 4], 55: [2, 4], 60: [2, 4] }, { 5: [2, 5], 14: [2, 5], 15: [2, 5], 19: [2, 5], 29: [2, 5], 34: [2, 5], 39: [2, 5], 44: [2, 5], 47: [2, 5], 48: [2, 5], 51: [2, 5], 55: [2, 5], 60: [2, 5] }, { 5: [2, 6], 14: [2, 6], 15: [2, 6], 19: [2, 6], 29: [2, 6], 34: [2, 6], 39: [2, 6], 44: [2, 6], 47: [2, 6], 48: [2, 6], 51: [2, 6], 55: [2, 6], 60: [2, 6] }, { 5: [2, 7], 14: [2, 7], 15: [2, 7], 19: [2, 7], 29: [2, 7], 34: [2, 7], 39: [2, 7], 44: [2, 7], 47: [2, 7], 48: [2, 7], 51: [2, 7], 55: [2, 7], 60: [2, 7] }, { 5: [2, 8], 14: [2, 8], 15: [2, 8], 19: [2, 8], 29: [2, 8], 34: [2, 8], 39: [2, 8], 44: [2, 8], 47: [2, 8], 48: [2, 8], 51: [2, 8], 55: [2, 8], 60: [2, 8] }, { 5: [2, 9], 14: [2, 9], 15: [2, 9], 19: [2, 9], 29: [2, 9], 34: [2, 9], 39: [2, 9], 44: [2, 9], 47: [2, 9], 48: [2, 9], 51: [2, 9], 55: [2, 9], 60: [2, 9] }, { 20: 25, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 36, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 4: 37, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 39: [2, 46], 44: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 4: 38, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 44: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 15: [2, 48], 17: 39, 18: [2, 48] }, { 20: 41, 56: 40, 64: 42, 65: [1, 43], 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 4: 44, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 5: [2, 10], 14: [2, 10], 15: [2, 10], 18: [2, 10], 19: [2, 10], 29: [2, 10], 34: [2, 10], 39: [2, 10], 44: [2, 10], 47: [2, 10], 48: [2, 10], 51: [2, 10], 55: [2, 10], 60: [2, 10] }, { 20: 45, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 46, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 47, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 41, 56: 48, 64: 42, 65: [1, 43], 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 33: [2, 78], 49: 49, 65: [2, 78], 72: [2, 78], 80: [2, 78], 81: [2, 78], 82: [2, 78], 83: [2, 78], 84: [2, 78], 85: [2, 78] }, { 23: [2, 33], 33: [2, 33], 54: [2, 33], 65: [2, 33], 68: [2, 33], 72: [2, 33], 75: [2, 33], 80: [2, 33], 81: [2, 33], 82: [2, 33], 83: [2, 33], 84: [2, 33], 85: [2, 33] }, { 23: [2, 34], 33: [2, 34], 54: [2, 34], 65: [2, 34], 68: [2, 34], 72: [2, 34], 75: [2, 34], 80: [2, 34], 81: [2, 34], 82: [2, 34], 83: [2, 34], 84: [2, 34], 85: [2, 34] }, { 23: [2, 35], 33: [2, 35], 54: [2, 35], 65: [2, 35], 68: [2, 35], 72: [2, 35], 75: [2, 35], 80: [2, 35], 81: [2, 35], 82: [2, 35], 83: [2, 35], 84: [2, 35], 85: [2, 35] }, { 23: [2, 36], 33: [2, 36], 54: [2, 36], 65: [2, 36], 68: [2, 36], 72: [2, 36], 75: [2, 36], 80: [2, 36], 81: [2, 36], 82: [2, 36], 83: [2, 36], 84: [2, 36], 85: [2, 36] }, { 23: [2, 37], 33: [2, 37], 54: [2, 37], 65: [2, 37], 68: [2, 37], 72: [2, 37], 75: [2, 37], 80: [2, 37], 81: [2, 37], 82: [2, 37], 83: [2, 37], 84: [2, 37], 85: [2, 37] }, { 23: [2, 38], 33: [2, 38], 54: [2, 38], 65: [2, 38], 68: [2, 38], 72: [2, 38], 75: [2, 38], 80: [2, 38], 81: [2, 38], 82: [2, 38], 83: [2, 38], 84: [2, 38], 85: [2, 38] }, { 23: [2, 39], 33: [2, 39], 54: [2, 39], 65: [2, 39], 68: [2, 39], 72: [2, 39], 75: [2, 39], 80: [2, 39], 81: [2, 39], 82: [2, 39], 83: [2, 39], 84: [2, 39], 85: [2, 39] }, { 23: [2, 43], 33: [2, 43], 54: [2, 43], 65: [2, 43], 68: [2, 43], 72: [2, 43], 75: [2, 43], 80: [2, 43], 81: [2, 43], 82: [2, 43], 83: [2, 43], 84: [2, 43], 85: [2, 43], 87: [1, 50] }, { 72: [1, 35], 86: 51 }, { 23: [2, 45], 33: [2, 45], 54: [2, 45], 65: [2, 45], 68: [2, 45], 72: [2, 45], 75: [2, 45], 80: [2, 45], 81: [2, 45], 82: [2, 45], 83: [2, 45], 84: [2, 45], 85: [2, 45], 87: [2, 45] }, { 52: 52, 54: [2, 82], 65: [2, 82], 72: [2, 82], 80: [2, 82], 81: [2, 82], 82: [2, 82], 83: [2, 82], 84: [2, 82], 85: [2, 82] }, { 25: 53, 38: 55, 39: [1, 57], 43: 56, 44: [1, 58], 45: 54, 47: [2, 54] }, { 28: 59, 43: 60, 44: [1, 58], 47: [2, 56] }, { 13: 62, 15: [1, 20], 18: [1, 61] }, { 33: [2, 86], 57: 63, 65: [2, 86], 72: [2, 86], 80: [2, 86], 81: [2, 86], 82: [2, 86], 83: [2, 86], 84: [2, 86], 85: [2, 86] }, { 33: [2, 40], 65: [2, 40], 72: [2, 40], 80: [2, 40], 81: [2, 40], 82: [2, 40], 83: [2, 40], 84: [2, 40], 85: [2, 40] }, { 33: [2, 41], 65: [2, 41], 72: [2, 41], 80: [2, 41], 81: [2, 41], 82: [2, 41], 83: [2, 41], 84: [2, 41], 85: [2, 41] }, { 20: 64, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 26: 65, 47: [1, 66] }, { 30: 67, 33: [2, 58], 65: [2, 58], 72: [2, 58], 75: [2, 58], 80: [2, 58], 81: [2, 58], 82: [2, 58], 83: [2, 58], 84: [2, 58], 85: [2, 58] }, { 33: [2, 64], 35: 68, 65: [2, 64], 72: [2, 64], 75: [2, 64], 80: [2, 64], 81: [2, 64], 82: [2, 64], 83: [2, 64], 84: [2, 64], 85: [2, 64] }, { 21: 69, 23: [2, 50], 65: [2, 50], 72: [2, 50], 80: [2, 50], 81: [2, 50], 82: [2, 50], 83: [2, 50], 84: [2, 50], 85: [2, 50] }, { 33: [2, 90], 61: 70, 65: [2, 90], 72: [2, 90], 80: [2, 90], 81: [2, 90], 82: [2, 90], 83: [2, 90], 84: [2, 90], 85: [2, 90] }, { 20: 74, 33: [2, 80], 50: 71, 63: 72, 64: 75, 65: [1, 43], 69: 73, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 72: [1, 79] }, { 23: [2, 42], 33: [2, 42], 54: [2, 42], 65: [2, 42], 68: [2, 42], 72: [2, 42], 75: [2, 42], 80: [2, 42], 81: [2, 42], 82: [2, 42], 83: [2, 42], 84: [2, 42], 85: [2, 42], 87: [1, 50] }, { 20: 74, 53: 80, 54: [2, 84], 63: 81, 64: 75, 65: [1, 43], 69: 82, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 26: 83, 47: [1, 66] }, { 47: [2, 55] }, { 4: 84, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 39: [2, 46], 44: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 47: [2, 20] }, { 20: 85, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 4: 86, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 26: 87, 47: [1, 66] }, { 47: [2, 57] }, { 5: [2, 11], 14: [2, 11], 15: [2, 11], 19: [2, 11], 29: [2, 11], 34: [2, 11], 39: [2, 11], 44: [2, 11], 47: [2, 11], 48: [2, 11], 51: [2, 11], 55: [2, 11], 60: [2, 11] }, { 15: [2, 49], 18: [2, 49] }, { 20: 74, 33: [2, 88], 58: 88, 63: 89, 64: 75, 65: [1, 43], 69: 90, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 65: [2, 94], 66: 91, 68: [2, 94], 72: [2, 94], 80: [2, 94], 81: [2, 94], 82: [2, 94], 83: [2, 94], 84: [2, 94], 85: [2, 94] }, { 5: [2, 25], 14: [2, 25], 15: [2, 25], 19: [2, 25], 29: [2, 25], 34: [2, 25], 39: [2, 25], 44: [2, 25], 47: [2, 25], 48: [2, 25], 51: [2, 25], 55: [2, 25], 60: [2, 25] }, { 20: 92, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 31: 93, 33: [2, 60], 63: 94, 64: 75, 65: [1, 43], 69: 95, 70: 76, 71: 77, 72: [1, 78], 75: [2, 60], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 33: [2, 66], 36: 96, 63: 97, 64: 75, 65: [1, 43], 69: 98, 70: 76, 71: 77, 72: [1, 78], 75: [2, 66], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 22: 99, 23: [2, 52], 63: 100, 64: 75, 65: [1, 43], 69: 101, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 33: [2, 92], 62: 102, 63: 103, 64: 75, 65: [1, 43], 69: 104, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 33: [1, 105] }, { 33: [2, 79], 65: [2, 79], 72: [2, 79], 80: [2, 79], 81: [2, 79], 82: [2, 79], 83: [2, 79], 84: [2, 79], 85: [2, 79] }, { 33: [2, 81] }, { 23: [2, 27], 33: [2, 27], 54: [2, 27], 65: [2, 27], 68: [2, 27], 72: [2, 27], 75: [2, 27], 80: [2, 27], 81: [2, 27], 82: [2, 27], 83: [2, 27], 84: [2, 27], 85: [2, 27] }, { 23: [2, 28], 33: [2, 28], 54: [2, 28], 65: [2, 28], 68: [2, 28], 72: [2, 28], 75: [2, 28], 80: [2, 28], 81: [2, 28], 82: [2, 28], 83: [2, 28], 84: [2, 28], 85: [2, 28] }, { 23: [2, 30], 33: [2, 30], 54: [2, 30], 68: [2, 30], 71: 106, 72: [1, 107], 75: [2, 30] }, { 23: [2, 98], 33: [2, 98], 54: [2, 98], 68: [2, 98], 72: [2, 98], 75: [2, 98] }, { 23: [2, 45], 33: [2, 45], 54: [2, 45], 65: [2, 45], 68: [2, 45], 72: [2, 45], 73: [1, 108], 75: [2, 45], 80: [2, 45], 81: [2, 45], 82: [2, 45], 83: [2, 45], 84: [2, 45], 85: [2, 45], 87: [2, 45] }, { 23: [2, 44], 33: [2, 44], 54: [2, 44], 65: [2, 44], 68: [2, 44], 72: [2, 44], 75: [2, 44], 80: [2, 44], 81: [2, 44], 82: [2, 44], 83: [2, 44], 84: [2, 44], 85: [2, 44], 87: [2, 44] }, { 54: [1, 109] }, { 54: [2, 83], 65: [2, 83], 72: [2, 83], 80: [2, 83], 81: [2, 83], 82: [2, 83], 83: [2, 83], 84: [2, 83], 85: [2, 83] }, { 54: [2, 85] }, { 5: [2, 13], 14: [2, 13], 15: [2, 13], 19: [2, 13], 29: [2, 13], 34: [2, 13], 39: [2, 13], 44: [2, 13], 47: [2, 13], 48: [2, 13], 51: [2, 13], 55: [2, 13], 60: [2, 13] }, { 38: 55, 39: [1, 57], 43: 56, 44: [1, 58], 45: 111, 46: 110, 47: [2, 76] }, { 33: [2, 70], 40: 112, 65: [2, 70], 72: [2, 70], 75: [2, 70], 80: [2, 70], 81: [2, 70], 82: [2, 70], 83: [2, 70], 84: [2, 70], 85: [2, 70] }, { 47: [2, 18] }, { 5: [2, 14], 14: [2, 14], 15: [2, 14], 19: [2, 14], 29: [2, 14], 34: [2, 14], 39: [2, 14], 44: [2, 14], 47: [2, 14], 48: [2, 14], 51: [2, 14], 55: [2, 14], 60: [2, 14] }, { 33: [1, 113] }, { 33: [2, 87], 65: [2, 87], 72: [2, 87], 80: [2, 87], 81: [2, 87], 82: [2, 87], 83: [2, 87], 84: [2, 87], 85: [2, 87] }, { 33: [2, 89] }, { 20: 74, 63: 115, 64: 75, 65: [1, 43], 67: 114, 68: [2, 96], 69: 116, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 33: [1, 117] }, { 32: 118, 33: [2, 62], 74: 119, 75: [1, 120] }, { 33: [2, 59], 65: [2, 59], 72: [2, 59], 75: [2, 59], 80: [2, 59], 81: [2, 59], 82: [2, 59], 83: [2, 59], 84: [2, 59], 85: [2, 59] }, { 33: [2, 61], 75: [2, 61] }, { 33: [2, 68], 37: 121, 74: 122, 75: [1, 120] }, { 33: [2, 65], 65: [2, 65], 72: [2, 65], 75: [2, 65], 80: [2, 65], 81: [2, 65], 82: [2, 65], 83: [2, 65], 84: [2, 65], 85: [2, 65] }, { 33: [2, 67], 75: [2, 67] }, { 23: [1, 123] }, { 23: [2, 51], 65: [2, 51], 72: [2, 51], 80: [2, 51], 81: [2, 51], 82: [2, 51], 83: [2, 51], 84: [2, 51], 85: [2, 51] }, { 23: [2, 53] }, { 33: [1, 124] }, { 33: [2, 91], 65: [2, 91], 72: [2, 91], 80: [2, 91], 81: [2, 91], 82: [2, 91], 83: [2, 91], 84: [2, 91], 85: [2, 91] }, { 33: [2, 93] }, { 5: [2, 22], 14: [2, 22], 15: [2, 22], 19: [2, 22], 29: [2, 22], 34: [2, 22], 39: [2, 22], 44: [2, 22], 47: [2, 22], 48: [2, 22], 51: [2, 22], 55: [2, 22], 60: [2, 22] }, { 23: [2, 99], 33: [2, 99], 54: [2, 99], 68: [2, 99], 72: [2, 99], 75: [2, 99] }, { 73: [1, 108] }, { 20: 74, 63: 125, 64: 75, 65: [1, 43], 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 5: [2, 23], 14: [2, 23], 15: [2, 23], 19: [2, 23], 29: [2, 23], 34: [2, 23], 39: [2, 23], 44: [2, 23], 47: [2, 23], 48: [2, 23], 51: [2, 23], 55: [2, 23], 60: [2, 23] }, { 47: [2, 19] }, { 47: [2, 77] }, { 20: 74, 33: [2, 72], 41: 126, 63: 127, 64: 75, 65: [1, 43], 69: 128, 70: 76, 71: 77, 72: [1, 78], 75: [2, 72], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 5: [2, 24], 14: [2, 24], 15: [2, 24], 19: [2, 24], 29: [2, 24], 34: [2, 24], 39: [2, 24], 44: [2, 24], 47: [2, 24], 48: [2, 24], 51: [2, 24], 55: [2, 24], 60: [2, 24] }, { 68: [1, 129] }, { 65: [2, 95], 68: [2, 95], 72: [2, 95], 80: [2, 95], 81: [2, 95], 82: [2, 95], 83: [2, 95], 84: [2, 95], 85: [2, 95] }, { 68: [2, 97] }, { 5: [2, 21], 14: [2, 21], 15: [2, 21], 19: [2, 21], 29: [2, 21], 34: [2, 21], 39: [2, 21], 44: [2, 21], 47: [2, 21], 48: [2, 21], 51: [2, 21], 55: [2, 21], 60: [2, 21] }, { 33: [1, 130] }, { 33: [2, 63] }, { 72: [1, 132], 76: 131 }, { 33: [1, 133] }, { 33: [2, 69] }, { 15: [2, 12], 18: [2, 12] }, { 14: [2, 26], 15: [2, 26], 19: [2, 26], 29: [2, 26], 34: [2, 26], 47: [2, 26], 48: [2, 26], 51: [2, 26], 55: [2, 26], 60: [2, 26] }, { 23: [2, 31], 33: [2, 31], 54: [2, 31], 68: [2, 31], 72: [2, 31], 75: [2, 31] }, { 33: [2, 74], 42: 134, 74: 135, 75: [1, 120] }, { 33: [2, 71], 65: [2, 71], 72: [2, 71], 75: [2, 71], 80: [2, 71], 81: [2, 71], 82: [2, 71], 83: [2, 71], 84: [2, 71], 85: [2, 71] }, { 33: [2, 73], 75: [2, 73] }, { 23: [2, 29], 33: [2, 29], 54: [2, 29], 65: [2, 29], 68: [2, 29], 72: [2, 29], 75: [2, 29], 80: [2, 29], 81: [2, 29], 82: [2, 29], 83: [2, 29], 84: [2, 29], 85: [2, 29] }, { 14: [2, 15], 15: [2, 15], 19: [2, 15], 29: [2, 15], 34: [2, 15], 39: [2, 15], 44: [2, 15], 47: [2, 15], 48: [2, 15], 51: [2, 15], 55: [2, 15], 60: [2, 15] }, { 72: [1, 137], 77: [1, 136] }, { 72: [2, 100], 77: [2, 100] }, { 14: [2, 16], 15: [2, 16], 19: [2, 16], 29: [2, 16], 34: [2, 16], 44: [2, 16], 47: [2, 16], 48: [2, 16], 51: [2, 16], 55: [2, 16], 60: [2, 16] }, { 33: [1, 138] }, { 33: [2, 75] }, { 33: [2, 32] }, { 72: [2, 101], 77: [2, 101] }, { 14: [2, 17], 15: [2, 17], 19: [2, 17], 29: [2, 17], 34: [2, 17], 39: [2, 17], 44: [2, 17], 47: [2, 17], 48: [2, 17], 51: [2, 17], 55: [2, 17], 60: [2, 17] }],
        defaultActions: { 4: [2, 1], 54: [2, 55], 56: [2, 20], 60: [2, 57], 73: [2, 81], 82: [2, 85], 86: [2, 18], 90: [2, 89], 101: [2, 53], 104: [2, 93], 110: [2, 19], 111: [2, 77], 116: [2, 97], 119: [2, 63], 122: [2, 69], 135: [2, 75], 136: [2, 32] },
        parseError: function parseError(str, hash) {
          throw new Error(str);
        },
        parse: function parse(input) {
          var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
          this.lexer.setInput(input);
          this.lexer.yy = this.yy;
          this.yy.lexer = this.lexer;
          this.yy.parser = this;
          if (typeof this.lexer.yylloc == "undefined") this.lexer.yylloc = {};
          var yyloc = this.lexer.yylloc;
          lstack.push(yyloc);
          var ranges = this.lexer.options && this.lexer.options.ranges;
          if (typeof this.yy.parseError === "function") this.parseError = this.yy.parseError;
          function popStack(n) {
            stack.length = stack.length - 2 * n;
            vstack.length = vstack.length - n;
            lstack.length = lstack.length - n;
          }
          function lex() {
            var token;
            token = self.lexer.lex() || 1;
            if (typeof token !== "number") {
              token = self.symbols_[token] || token;
            }
            return token;
          }
          var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
          while (true) {
            state = stack[stack.length - 1];
            if (this.defaultActions[state]) {
              action = this.defaultActions[state];
            } else {
              if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
              }
              action = table[state] && table[state][symbol];
            }
            if (typeof action === "undefined" || !action.length || !action[0]) {
              var errStr = "";
              if (!recovering) {
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                  expected.push("'" + this.terminals_[p] + "'");
                }
                if (this.lexer.showPosition) {
                  errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                  errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, { text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected });
              }
            }
            if (action[0] instanceof Array && action.length > 1) {
              throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
            }
            switch (action[0]) {
              case 1:
                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]);
                symbol = null;
                if (!preErrorSymbol) {
                  yyleng = this.lexer.yyleng;
                  yytext = this.lexer.yytext;
                  yylineno = this.lexer.yylineno;
                  yyloc = this.lexer.yylloc;
                  if (recovering > 0) recovering--;
                } else {
                  symbol = preErrorSymbol;
                  preErrorSymbol = null;
                }
                break;
              case 2:
                len = this.productions_[action[1]][1];
                yyval.$ = vstack[vstack.length - len];
                yyval._$ = { first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column };
                if (ranges) {
                  yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
                }
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
                if (typeof r !== "undefined") {
                  return r;
                }
                if (len) {
                  stack = stack.slice(0, -1 * len * 2);
                  vstack = vstack.slice(0, -1 * len);
                  lstack = lstack.slice(0, -1 * len);
                }
                stack.push(this.productions_[action[1]][0]);
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                stack.push(newState);
                break;
              case 3:
                return true;
            }
          }
          return true;
        }
      };
      var lexer = (function() {
        var lexer2 = {
          EOF: 1,
          parseError: function parseError(str, hash) {
            if (this.yy.parser) {
              this.yy.parser.parseError(str, hash);
            } else {
              throw new Error(str);
            }
          },
          setInput: function setInput(input) {
            this._input = input;
            this._more = this._less = this.done = false;
            this.yylineno = this.yyleng = 0;
            this.yytext = this.matched = this.match = "";
            this.conditionStack = ["INITIAL"];
            this.yylloc = { first_line: 1, first_column: 0, last_line: 1, last_column: 0 };
            if (this.options.ranges) this.yylloc.range = [0, 0];
            this.offset = 0;
            return this;
          },
          input: function input() {
            var ch = this._input[0];
            this.yytext += ch;
            this.yyleng++;
            this.offset++;
            this.match += ch;
            this.matched += ch;
            var lines = ch.match(/(?:\r\n?|\n).*/g);
            if (lines) {
              this.yylineno++;
              this.yylloc.last_line++;
            } else {
              this.yylloc.last_column++;
            }
            if (this.options.ranges) this.yylloc.range[1]++;
            this._input = this._input.slice(1);
            return ch;
          },
          unput: function unput(ch) {
            var len = ch.length;
            var lines = ch.split(/(?:\r\n?|\n)/g);
            this._input = ch + this._input;
            this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
            this.offset -= len;
            var oldLines = this.match.split(/(?:\r\n?|\n)/g);
            this.match = this.match.substr(0, this.match.length - 1);
            this.matched = this.matched.substr(0, this.matched.length - 1);
            if (lines.length - 1) this.yylineno -= lines.length - 1;
            var r = this.yylloc.range;
            this.yylloc = {
              first_line: this.yylloc.first_line,
              last_line: this.yylineno + 1,
              first_column: this.yylloc.first_column,
              last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
            };
            if (this.options.ranges) {
              this.yylloc.range = [r[0], r[0] + this.yyleng - len];
            }
            return this;
          },
          more: function more() {
            this._more = true;
            return this;
          },
          less: function less(n) {
            this.unput(this.match.slice(n));
          },
          pastInput: function pastInput() {
            var past = this.matched.substr(0, this.matched.length - this.match.length);
            return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
          },
          upcomingInput: function upcomingInput() {
            var next = this.match;
            if (next.length < 20) {
              next += this._input.substr(0, 20 - next.length);
            }
            return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
          },
          showPosition: function showPosition() {
            var pre = this.pastInput();
            var c = new Array(pre.length + 1).join("-");
            return pre + this.upcomingInput() + "\n" + c + "^";
          },
          next: function next() {
            if (this.done) {
              return this.EOF;
            }
            if (!this._input) this.done = true;
            var token, match, tempMatch, index, col, lines;
            if (!this._more) {
              this.yytext = "";
              this.match = "";
            }
            var rules = this._currentRules();
            for (var i = 0; i < rules.length; i++) {
              tempMatch = this._input.match(this.rules[rules[i]]);
              if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
              }
            }
            if (match) {
              lines = match[0].match(/(?:\r\n?|\n).*/g);
              if (lines) this.yylineno += lines.length;
              this.yylloc = {
                first_line: this.yylloc.last_line,
                last_line: this.yylineno + 1,
                first_column: this.yylloc.last_column,
                last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
              };
              this.yytext += match[0];
              this.match += match[0];
              this.matches = match;
              this.yyleng = this.yytext.length;
              if (this.options.ranges) {
                this.yylloc.range = [this.offset, this.offset += this.yyleng];
              }
              this._more = false;
              this._input = this._input.slice(match[0].length);
              this.matched += match[0];
              token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
              if (this.done && this._input) this.done = false;
              if (token) return token;
              else return;
            }
            if (this._input === "") {
              return this.EOF;
            } else {
              return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), { text: "", token: null, line: this.yylineno });
            }
          },
          lex: function lex() {
            var r = this.next();
            if (typeof r !== "undefined") {
              return r;
            } else {
              return this.lex();
            }
          },
          begin: function begin(condition) {
            this.conditionStack.push(condition);
          },
          popState: function popState() {
            return this.conditionStack.pop();
          },
          _currentRules: function _currentRules() {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
          },
          topState: function topState() {
            return this.conditionStack[this.conditionStack.length - 2];
          },
          pushState: function begin(condition) {
            this.begin(condition);
          }
        };
        lexer2.options = {};
        lexer2.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
          function strip(start, end) {
            return yy_.yytext = yy_.yytext.substring(start, yy_.yyleng - end + start);
          }
          var YYSTATE = YY_START;
          switch ($avoiding_name_collisions) {
            case 0:
              if (yy_.yytext.slice(-2) === "\\\\") {
                strip(0, 1);
                this.begin("mu");
              } else if (yy_.yytext.slice(-1) === "\\") {
                strip(0, 1);
                this.begin("emu");
              } else {
                this.begin("mu");
              }
              if (yy_.yytext) return 15;
              break;
            case 1:
              return 15;
              break;
            case 2:
              this.popState();
              return 15;
              break;
            case 3:
              this.begin("raw");
              return 15;
              break;
            case 4:
              this.popState();
              if (this.conditionStack[this.conditionStack.length - 1] === "raw") {
                return 15;
              } else {
                strip(5, 9);
                return "END_RAW_BLOCK";
              }
              break;
            case 5:
              return 15;
              break;
            case 6:
              this.popState();
              return 14;
              break;
            case 7:
              return 65;
              break;
            case 8:
              return 68;
              break;
            case 9:
              return 19;
              break;
            case 10:
              this.popState();
              this.begin("raw");
              return 23;
              break;
            case 11:
              return 55;
              break;
            case 12:
              return 60;
              break;
            case 13:
              return 29;
              break;
            case 14:
              return 47;
              break;
            case 15:
              this.popState();
              return 44;
              break;
            case 16:
              this.popState();
              return 44;
              break;
            case 17:
              return 34;
              break;
            case 18:
              return 39;
              break;
            case 19:
              return 51;
              break;
            case 20:
              return 48;
              break;
            case 21:
              this.unput(yy_.yytext);
              this.popState();
              this.begin("com");
              break;
            case 22:
              this.popState();
              return 14;
              break;
            case 23:
              return 48;
              break;
            case 24:
              return 73;
              break;
            case 25:
              return 72;
              break;
            case 26:
              return 72;
              break;
            case 27:
              return 87;
              break;
            case 28:
              break;
            case 29:
              this.popState();
              return 54;
              break;
            case 30:
              this.popState();
              return 33;
              break;
            case 31:
              yy_.yytext = strip(1, 2).replace(/\\"/g, '"');
              return 80;
              break;
            case 32:
              yy_.yytext = strip(1, 2).replace(/\\'/g, "'");
              return 80;
              break;
            case 33:
              return 85;
              break;
            case 34:
              return 82;
              break;
            case 35:
              return 82;
              break;
            case 36:
              return 83;
              break;
            case 37:
              return 84;
              break;
            case 38:
              return 81;
              break;
            case 39:
              return 75;
              break;
            case 40:
              return 77;
              break;
            case 41:
              return 72;
              break;
            case 42:
              yy_.yytext = yy_.yytext.replace(/\\([\\\]])/g, "$1");
              return 72;
              break;
            case 43:
              return "INVALID";
              break;
            case 44:
              return 5;
              break;
          }
        };
        lexer2.rules = [/^(?:[^\x00]*?(?=(\{\{)))/, /^(?:[^\x00]+)/, /^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/, /^(?:\{\{\{\{(?=[^\/]))/, /^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/, /^(?:[^\x00]+?(?=(\{\{\{\{)))/, /^(?:[\s\S]*?--(~)?\}\})/, /^(?:\()/, /^(?:\))/, /^(?:\{\{\{\{)/, /^(?:\}\}\}\})/, /^(?:\{\{(~)?>)/, /^(?:\{\{(~)?#>)/, /^(?:\{\{(~)?#\*?)/, /^(?:\{\{(~)?\/)/, /^(?:\{\{(~)?\^\s*(~)?\}\})/, /^(?:\{\{(~)?\s*else\s*(~)?\}\})/, /^(?:\{\{(~)?\^)/, /^(?:\{\{(~)?\s*else\b)/, /^(?:\{\{(~)?\{)/, /^(?:\{\{(~)?&)/, /^(?:\{\{(~)?!--)/, /^(?:\{\{(~)?![\s\S]*?\}\})/, /^(?:\{\{(~)?\*?)/, /^(?:=)/, /^(?:\.\.)/, /^(?:\.(?=([=~}\s\/.)|])))/, /^(?:[\/.])/, /^(?:\s+)/, /^(?:\}(~)?\}\})/, /^(?:(~)?\}\})/, /^(?:"(\\["]|[^"])*")/, /^(?:'(\\[']|[^'])*')/, /^(?:@)/, /^(?:true(?=([~}\s)])))/, /^(?:false(?=([~}\s)])))/, /^(?:undefined(?=([~}\s)])))/, /^(?:null(?=([~}\s)])))/, /^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/, /^(?:as\s+\|)/, /^(?:\|)/, /^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/, /^(?:\[(\\\]|[^\]])*\])/, /^(?:.)/, /^(?:$)/];
        lexer2.conditions = { "mu": { "rules": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44], "inclusive": false }, "emu": { "rules": [2], "inclusive": false }, "com": { "rules": [6], "inclusive": false }, "raw": { "rules": [3, 4, 5], "inclusive": false }, "INITIAL": { "rules": [0, 1, 44], "inclusive": true } };
        return lexer2;
      })();
      parser.lexer = lexer;
      function Parser() {
        this.yy = {};
      }
      Parser.prototype = parser;
      parser.Parser = Parser;
      return new Parser();
    })();
    exports2["default"] = handlebars;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/compiler/visitor.js
var require_visitor = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/compiler/visitor.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    function Visitor() {
      this.parents = [];
    }
    Visitor.prototype = {
      constructor: Visitor,
      mutating: false,
      // Visits a given value. If mutating, will replace the value if necessary.
      acceptKey: function acceptKey(node, name) {
        var value = this.accept(node[name]);
        if (this.mutating) {
          if (value && !Visitor.prototype[value.type]) {
            throw new _exception2["default"]('Unexpected node type "' + value.type + '" found when accepting ' + name + " on " + node.type);
          }
          node[name] = value;
        }
      },
      // Performs an accept operation with added sanity check to ensure
      // required keys are not removed.
      acceptRequired: function acceptRequired(node, name) {
        this.acceptKey(node, name);
        if (!node[name]) {
          throw new _exception2["default"](node.type + " requires " + name);
        }
      },
      // Traverses a given array. If mutating, empty respnses will be removed
      // for child elements.
      acceptArray: function acceptArray(array) {
        for (var i = 0, l = array.length; i < l; i++) {
          this.acceptKey(array, i);
          if (!array[i]) {
            array.splice(i, 1);
            i--;
            l--;
          }
        }
      },
      accept: function accept(object) {
        if (!object) {
          return;
        }
        if (!this[object.type]) {
          throw new _exception2["default"]("Unknown type: " + object.type, object);
        }
        if (this.current) {
          this.parents.unshift(this.current);
        }
        this.current = object;
        var ret = this[object.type](object);
        this.current = this.parents.shift();
        if (!this.mutating || ret) {
          return ret;
        } else if (ret !== false) {
          return object;
        }
      },
      Program: function Program(program) {
        this.acceptArray(program.body);
      },
      MustacheStatement: visitSubExpression,
      Decorator: visitSubExpression,
      BlockStatement: visitBlock,
      DecoratorBlock: visitBlock,
      PartialStatement: visitPartial,
      PartialBlockStatement: function PartialBlockStatement(partial) {
        visitPartial.call(this, partial);
        this.acceptKey(partial, "program");
      },
      ContentStatement: function ContentStatement() {
      },
      CommentStatement: function CommentStatement() {
      },
      SubExpression: visitSubExpression,
      PathExpression: function PathExpression() {
      },
      StringLiteral: function StringLiteral() {
      },
      NumberLiteral: function NumberLiteral() {
      },
      BooleanLiteral: function BooleanLiteral() {
      },
      UndefinedLiteral: function UndefinedLiteral() {
      },
      NullLiteral: function NullLiteral() {
      },
      Hash: function Hash(hash) {
        this.acceptArray(hash.pairs);
      },
      HashPair: function HashPair(pair) {
        this.acceptRequired(pair, "value");
      }
    };
    function visitSubExpression(mustache) {
      this.acceptRequired(mustache, "path");
      this.acceptArray(mustache.params);
      this.acceptKey(mustache, "hash");
    }
    function visitBlock(block) {
      visitSubExpression.call(this, block);
      this.acceptKey(block, "program");
      this.acceptKey(block, "inverse");
    }
    function visitPartial(partial) {
      this.acceptRequired(partial, "name");
      this.acceptArray(partial.params);
      this.acceptKey(partial, "hash");
    }
    exports2["default"] = Visitor;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/compiler/whitespace-control.js
var require_whitespace_control = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/compiler/whitespace-control.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _visitor = require_visitor();
    var _visitor2 = _interopRequireDefault(_visitor);
    function WhitespaceControl() {
      var options = arguments.length <= 0 || arguments[0] === void 0 ? {} : arguments[0];
      this.options = options;
    }
    WhitespaceControl.prototype = new _visitor2["default"]();
    WhitespaceControl.prototype.Program = function(program) {
      var doStandalone = !this.options.ignoreStandalone;
      var isRoot = !this.isRootSeen;
      this.isRootSeen = true;
      var body = program.body;
      for (var i = 0, l = body.length; i < l; i++) {
        var current = body[i], strip = this.accept(current);
        if (!strip) {
          continue;
        }
        var _isPrevWhitespace = isPrevWhitespace(body, i, isRoot), _isNextWhitespace = isNextWhitespace(body, i, isRoot), openStandalone = strip.openStandalone && _isPrevWhitespace, closeStandalone = strip.closeStandalone && _isNextWhitespace, inlineStandalone = strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;
        if (strip.close) {
          omitRight(body, i, true);
        }
        if (strip.open) {
          omitLeft(body, i, true);
        }
        if (doStandalone && inlineStandalone) {
          omitRight(body, i);
          if (omitLeft(body, i)) {
            if (current.type === "PartialStatement") {
              current.indent = /([ \t]+$)/.exec(body[i - 1].original)[1];
            }
          }
        }
        if (doStandalone && openStandalone) {
          omitRight((current.program || current.inverse).body);
          omitLeft(body, i);
        }
        if (doStandalone && closeStandalone) {
          omitRight(body, i);
          omitLeft((current.inverse || current.program).body);
        }
      }
      return program;
    };
    WhitespaceControl.prototype.BlockStatement = WhitespaceControl.prototype.DecoratorBlock = WhitespaceControl.prototype.PartialBlockStatement = function(block) {
      this.accept(block.program);
      this.accept(block.inverse);
      var program = block.program || block.inverse, inverse = block.program && block.inverse, firstInverse = inverse, lastInverse = inverse;
      if (inverse && inverse.chained) {
        firstInverse = inverse.body[0].program;
        while (lastInverse.chained) {
          lastInverse = lastInverse.body[lastInverse.body.length - 1].program;
        }
      }
      var strip = {
        open: block.openStrip.open,
        close: block.closeStrip.close,
        // Determine the standalone candiacy. Basically flag our content as being possibly standalone
        // so our parent can determine if we actually are standalone
        openStandalone: isNextWhitespace(program.body),
        closeStandalone: isPrevWhitespace((firstInverse || program).body)
      };
      if (block.openStrip.close) {
        omitRight(program.body, null, true);
      }
      if (inverse) {
        var inverseStrip = block.inverseStrip;
        if (inverseStrip.open) {
          omitLeft(program.body, null, true);
        }
        if (inverseStrip.close) {
          omitRight(firstInverse.body, null, true);
        }
        if (block.closeStrip.open) {
          omitLeft(lastInverse.body, null, true);
        }
        if (!this.options.ignoreStandalone && isPrevWhitespace(program.body) && isNextWhitespace(firstInverse.body)) {
          omitLeft(program.body);
          omitRight(firstInverse.body);
        }
      } else if (block.closeStrip.open) {
        omitLeft(program.body, null, true);
      }
      return strip;
    };
    WhitespaceControl.prototype.Decorator = WhitespaceControl.prototype.MustacheStatement = function(mustache) {
      return mustache.strip;
    };
    WhitespaceControl.prototype.PartialStatement = WhitespaceControl.prototype.CommentStatement = function(node) {
      var strip = node.strip || {};
      return {
        inlineStandalone: true,
        open: strip.open,
        close: strip.close
      };
    };
    function isPrevWhitespace(body, i, isRoot) {
      if (i === void 0) {
        i = body.length;
      }
      var prev = body[i - 1], sibling = body[i - 2];
      if (!prev) {
        return isRoot;
      }
      if (prev.type === "ContentStatement") {
        return (sibling || !isRoot ? /\r?\n\s*?$/ : /(^|\r?\n)\s*?$/).test(prev.original);
      }
    }
    function isNextWhitespace(body, i, isRoot) {
      if (i === void 0) {
        i = -1;
      }
      var next = body[i + 1], sibling = body[i + 2];
      if (!next) {
        return isRoot;
      }
      if (next.type === "ContentStatement") {
        return (sibling || !isRoot ? /^\s*?\r?\n/ : /^\s*?(\r?\n|$)/).test(next.original);
      }
    }
    function omitRight(body, i, multiple) {
      var current = body[i == null ? 0 : i + 1];
      if (!current || current.type !== "ContentStatement" || !multiple && current.rightStripped) {
        return;
      }
      var original = current.value;
      current.value = current.value.replace(multiple ? /^\s+/ : /^[ \t]*\r?\n?/, "");
      current.rightStripped = current.value !== original;
    }
    function omitLeft(body, i, multiple) {
      var current = body[i == null ? body.length - 1 : i - 1];
      if (!current || current.type !== "ContentStatement" || !multiple && current.leftStripped) {
        return;
      }
      var original = current.value;
      current.value = current.value.replace(multiple ? /\s+$/ : /[ \t]+$/, "");
      current.leftStripped = current.value !== original;
      return current.leftStripped;
    }
    exports2["default"] = WhitespaceControl;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/compiler/helpers.js
var require_helpers2 = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/compiler/helpers.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.SourceLocation = SourceLocation;
    exports2.id = id;
    exports2.stripFlags = stripFlags;
    exports2.stripComment = stripComment;
    exports2.preparePath = preparePath;
    exports2.prepareMustache = prepareMustache;
    exports2.prepareRawBlock = prepareRawBlock;
    exports2.prepareBlock = prepareBlock;
    exports2.prepareProgram = prepareProgram;
    exports2.preparePartialBlock = preparePartialBlock;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    function validateClose(open, close) {
      close = close.path ? close.path.original : close;
      if (open.path.original !== close) {
        var errorNode = { loc: open.path.loc };
        throw new _exception2["default"](open.path.original + " doesn't match " + close, errorNode);
      }
    }
    function SourceLocation(source, locInfo) {
      this.source = source;
      this.start = {
        line: locInfo.first_line,
        column: locInfo.first_column
      };
      this.end = {
        line: locInfo.last_line,
        column: locInfo.last_column
      };
    }
    function id(token) {
      if (/^\[.*\]$/.test(token)) {
        return token.substring(1, token.length - 1);
      } else {
        return token;
      }
    }
    function stripFlags(open, close) {
      return {
        open: open.charAt(2) === "~",
        close: close.charAt(close.length - 3) === "~"
      };
    }
    function stripComment(comment) {
      return comment.replace(/^\{\{~?!-?-?/, "").replace(/-?-?~?\}\}$/, "");
    }
    function preparePath(data, parts, loc) {
      loc = this.locInfo(loc);
      var original = data ? "@" : "", dig = [], depth = 0;
      for (var i = 0, l = parts.length; i < l; i++) {
        var part = parts[i].part, isLiteral = parts[i].original !== part;
        original += (parts[i].separator || "") + part;
        if (!isLiteral && (part === ".." || part === "." || part === "this")) {
          if (dig.length > 0) {
            throw new _exception2["default"]("Invalid path: " + original, { loc });
          } else if (part === "..") {
            depth++;
          }
        } else {
          dig.push(part);
        }
      }
      return {
        type: "PathExpression",
        data,
        depth,
        parts: dig,
        original,
        loc
      };
    }
    function prepareMustache(path, params, hash, open, strip, locInfo) {
      var escapeFlag = open.charAt(3) || open.charAt(2), escaped = escapeFlag !== "{" && escapeFlag !== "&";
      var decorator = /\*/.test(open);
      return {
        type: decorator ? "Decorator" : "MustacheStatement",
        path,
        params,
        hash,
        escaped,
        strip,
        loc: this.locInfo(locInfo)
      };
    }
    function prepareRawBlock(openRawBlock, contents, close, locInfo) {
      validateClose(openRawBlock, close);
      locInfo = this.locInfo(locInfo);
      var program = {
        type: "Program",
        body: contents,
        strip: {},
        loc: locInfo
      };
      return {
        type: "BlockStatement",
        path: openRawBlock.path,
        params: openRawBlock.params,
        hash: openRawBlock.hash,
        program,
        openStrip: {},
        inverseStrip: {},
        closeStrip: {},
        loc: locInfo
      };
    }
    function prepareBlock(openBlock, program, inverseAndProgram, close, inverted, locInfo) {
      if (close && close.path) {
        validateClose(openBlock, close);
      }
      var decorator = /\*/.test(openBlock.open);
      program.blockParams = openBlock.blockParams;
      var inverse = void 0, inverseStrip = void 0;
      if (inverseAndProgram) {
        if (decorator) {
          throw new _exception2["default"]("Unexpected inverse block on decorator", inverseAndProgram);
        }
        if (inverseAndProgram.chain) {
          inverseAndProgram.program.body[0].closeStrip = close.strip;
        }
        inverseStrip = inverseAndProgram.strip;
        inverse = inverseAndProgram.program;
      }
      if (inverted) {
        inverted = inverse;
        inverse = program;
        program = inverted;
      }
      return {
        type: decorator ? "DecoratorBlock" : "BlockStatement",
        path: openBlock.path,
        params: openBlock.params,
        hash: openBlock.hash,
        program,
        inverse,
        openStrip: openBlock.strip,
        inverseStrip,
        closeStrip: close && close.strip,
        loc: this.locInfo(locInfo)
      };
    }
    function prepareProgram(statements, loc) {
      if (!loc && statements.length) {
        var firstLoc = statements[0].loc, lastLoc = statements[statements.length - 1].loc;
        if (firstLoc && lastLoc) {
          loc = {
            source: firstLoc.source,
            start: {
              line: firstLoc.start.line,
              column: firstLoc.start.column
            },
            end: {
              line: lastLoc.end.line,
              column: lastLoc.end.column
            }
          };
        }
      }
      return {
        type: "Program",
        body: statements,
        strip: {},
        loc
      };
    }
    function preparePartialBlock(open, program, close, locInfo) {
      validateClose(open, close);
      return {
        type: "PartialBlockStatement",
        name: open.path,
        params: open.params,
        hash: open.hash,
        program,
        openStrip: open.strip,
        closeStrip: close && close.strip,
        loc: this.locInfo(locInfo)
      };
    }
  }
});

// node_modules/handlebars/dist/cjs/handlebars/compiler/base.js
var require_base2 = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/compiler/base.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.parseWithoutProcessing = parseWithoutProcessing;
    exports2.parse = parse;
    function _interopRequireWildcard(obj) {
      if (obj && obj.__esModule) {
        return obj;
      } else {
        var newObj = {};
        if (obj != null) {
          for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
          }
        }
        newObj["default"] = obj;
        return newObj;
      }
    }
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _parser = require_parser();
    var _parser2 = _interopRequireDefault(_parser);
    var _whitespaceControl = require_whitespace_control();
    var _whitespaceControl2 = _interopRequireDefault(_whitespaceControl);
    var _helpers = require_helpers2();
    var Helpers = _interopRequireWildcard(_helpers);
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    var _utils = require_utils2();
    exports2.parser = _parser2["default"];
    var yy = {};
    _utils.extend(yy, Helpers);
    function parseWithoutProcessing(input, options) {
      if (input.type === "Program") {
        validateInputAst(input);
        return input;
      }
      _parser2["default"].yy = yy;
      yy.locInfo = function(locInfo) {
        return new yy.SourceLocation(options && options.srcName, locInfo);
      };
      var ast = _parser2["default"].parse(input);
      return ast;
    }
    function parse(input, options) {
      var ast = parseWithoutProcessing(input, options);
      var strip = new _whitespaceControl2["default"](options);
      return strip.accept(ast);
    }
    function validateInputAst(ast) {
      validateAstNode(ast);
    }
    function validateAstNode(node) {
      if (node == null) {
        return;
      }
      if (Array.isArray(node)) {
        node.forEach(validateAstNode);
        return;
      }
      if (typeof node !== "object") {
        return;
      }
      if (node.type === "PathExpression") {
        if (!isValidDepth(node.depth)) {
          throw new _exception2["default"]("Invalid AST: PathExpression.depth must be an integer");
        }
        if (!Array.isArray(node.parts)) {
          throw new _exception2["default"]("Invalid AST: PathExpression.parts must be an array");
        }
        for (var i = 0; i < node.parts.length; i++) {
          if (typeof node.parts[i] !== "string") {
            throw new _exception2["default"]("Invalid AST: PathExpression.parts must only contain strings");
          }
        }
      } else if (node.type === "NumberLiteral") {
        if (typeof node.value !== "number" || !isFinite(node.value)) {
          throw new _exception2["default"]("Invalid AST: NumberLiteral.value must be a number");
        }
      } else if (node.type === "BooleanLiteral") {
        if (typeof node.value !== "boolean") {
          throw new _exception2["default"]("Invalid AST: BooleanLiteral.value must be a boolean");
        }
      }
      Object.keys(node).forEach(function(propertyName) {
        if (propertyName === "loc") {
          return;
        }
        validateAstNode(node[propertyName]);
      });
    }
    function isValidDepth(depth) {
      return typeof depth === "number" && isFinite(depth) && Math.floor(depth) === depth && depth >= 0;
    }
  }
});

// node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js
var require_compiler = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.Compiler = Compiler;
    exports2.precompile = precompile;
    exports2.compile = compile;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    var _utils = require_utils2();
    var _ast = require_ast();
    var _ast2 = _interopRequireDefault(_ast);
    var slice = [].slice;
    function Compiler() {
    }
    Compiler.prototype = {
      compiler: Compiler,
      equals: function equals(other) {
        var len = this.opcodes.length;
        if (other.opcodes.length !== len) {
          return false;
        }
        for (var i = 0; i < len; i++) {
          var opcode = this.opcodes[i], otherOpcode = other.opcodes[i];
          if (opcode.opcode !== otherOpcode.opcode || !argEquals(opcode.args, otherOpcode.args)) {
            return false;
          }
        }
        len = this.children.length;
        for (var i = 0; i < len; i++) {
          if (!this.children[i].equals(other.children[i])) {
            return false;
          }
        }
        return true;
      },
      guid: 0,
      compile: function compile2(program, options) {
        this.sourceNode = [];
        this.opcodes = [];
        this.children = [];
        this.options = options;
        this.stringParams = options.stringParams;
        this.trackIds = options.trackIds;
        options.blockParams = options.blockParams || [];
        options.knownHelpers = _utils.extend(/* @__PURE__ */ Object.create(null), {
          helperMissing: true,
          blockHelperMissing: true,
          each: true,
          "if": true,
          unless: true,
          "with": true,
          log: true,
          lookup: true
        }, options.knownHelpers);
        return this.accept(program);
      },
      compileProgram: function compileProgram(program) {
        var childCompiler = new this.compiler(), result = childCompiler.compile(program, this.options), guid = this.guid++;
        this.usePartial = this.usePartial || result.usePartial;
        this.children[guid] = result;
        this.useDepths = this.useDepths || result.useDepths;
        return guid;
      },
      accept: function accept(node) {
        if (!this[node.type]) {
          throw new _exception2["default"]("Unknown type: " + node.type, node);
        }
        this.sourceNode.unshift(node);
        var ret = this[node.type](node);
        this.sourceNode.shift();
        return ret;
      },
      Program: function Program(program) {
        this.options.blockParams.unshift(program.blockParams);
        var body = program.body, bodyLength = body.length;
        for (var i = 0; i < bodyLength; i++) {
          this.accept(body[i]);
        }
        this.options.blockParams.shift();
        this.isSimple = bodyLength === 1;
        this.blockParams = program.blockParams ? program.blockParams.length : 0;
        return this;
      },
      BlockStatement: function BlockStatement(block) {
        transformLiteralToPath(block);
        var program = block.program, inverse = block.inverse;
        program = program && this.compileProgram(program);
        inverse = inverse && this.compileProgram(inverse);
        var type = this.classifySexpr(block);
        if (type === "helper") {
          this.helperSexpr(block, program, inverse);
        } else if (type === "simple") {
          this.simpleSexpr(block);
          this.opcode("pushProgram", program);
          this.opcode("pushProgram", inverse);
          this.opcode("emptyHash");
          this.opcode("blockValue", block.path.original);
        } else {
          this.ambiguousSexpr(block, program, inverse);
          this.opcode("pushProgram", program);
          this.opcode("pushProgram", inverse);
          this.opcode("emptyHash");
          this.opcode("ambiguousBlockValue");
        }
        this.opcode("append");
      },
      DecoratorBlock: function DecoratorBlock(decorator) {
        var program = decorator.program && this.compileProgram(decorator.program);
        var params = this.setupFullMustacheParams(decorator, program, void 0), path = decorator.path;
        this.useDecorators = true;
        this.opcode("registerDecorator", params.length, path.original);
      },
      PartialStatement: function PartialStatement(partial) {
        this.usePartial = true;
        var program = partial.program;
        if (program) {
          program = this.compileProgram(partial.program);
        }
        var params = partial.params;
        if (params.length > 1) {
          throw new _exception2["default"]("Unsupported number of partial arguments: " + params.length, partial);
        } else if (!params.length) {
          if (this.options.explicitPartialContext) {
            this.opcode("pushLiteral", "undefined");
          } else {
            params.push({ type: "PathExpression", parts: [], depth: 0 });
          }
        }
        var partialName = partial.name.original, isDynamic = partial.name.type === "SubExpression";
        if (isDynamic) {
          this.accept(partial.name);
        }
        this.setupFullMustacheParams(partial, program, void 0, true);
        var indent = partial.indent || "";
        if (this.options.preventIndent && indent) {
          this.opcode("appendContent", indent);
          indent = "";
        }
        this.opcode("invokePartial", isDynamic, partialName, indent);
        this.opcode("append");
      },
      PartialBlockStatement: function PartialBlockStatement(partialBlock) {
        this.PartialStatement(partialBlock);
      },
      MustacheStatement: function MustacheStatement(mustache) {
        this.SubExpression(mustache);
        if (mustache.escaped && !this.options.noEscape) {
          this.opcode("appendEscaped");
        } else {
          this.opcode("append");
        }
      },
      Decorator: function Decorator(decorator) {
        this.DecoratorBlock(decorator);
      },
      ContentStatement: function ContentStatement(content) {
        if (content.value) {
          this.opcode("appendContent", content.value);
        }
      },
      CommentStatement: function CommentStatement() {
      },
      SubExpression: function SubExpression(sexpr) {
        transformLiteralToPath(sexpr);
        var type = this.classifySexpr(sexpr);
        if (type === "simple") {
          this.simpleSexpr(sexpr);
        } else if (type === "helper") {
          this.helperSexpr(sexpr);
        } else {
          this.ambiguousSexpr(sexpr);
        }
      },
      ambiguousSexpr: function ambiguousSexpr(sexpr, program, inverse) {
        var path = sexpr.path, name = path.parts[0], isBlock = program != null || inverse != null;
        this.opcode("getContext", path.depth);
        this.opcode("pushProgram", program);
        this.opcode("pushProgram", inverse);
        path.strict = true;
        this.accept(path);
        this.opcode("invokeAmbiguous", name, isBlock);
      },
      simpleSexpr: function simpleSexpr(sexpr) {
        var path = sexpr.path;
        path.strict = true;
        this.accept(path);
        this.opcode("resolvePossibleLambda");
      },
      helperSexpr: function helperSexpr(sexpr, program, inverse) {
        var params = this.setupFullMustacheParams(sexpr, program, inverse), path = sexpr.path, name = path.parts[0];
        if (this.options.knownHelpers[name]) {
          this.opcode("invokeKnownHelper", params.length, name);
        } else if (this.options.knownHelpersOnly) {
          throw new _exception2["default"]("You specified knownHelpersOnly, but used the unknown helper " + name, sexpr);
        } else {
          path.strict = true;
          path.falsy = true;
          this.accept(path);
          this.opcode("invokeHelper", params.length, path.original, _ast2["default"].helpers.simpleId(path));
        }
      },
      PathExpression: function PathExpression(path) {
        this.addDepth(path.depth);
        this.opcode("getContext", path.depth);
        var name = path.parts[0], scoped = _ast2["default"].helpers.scopedId(path), blockParamId = !path.depth && !scoped && this.blockParamIndex(name);
        if (blockParamId) {
          this.opcode("lookupBlockParam", blockParamId, path.parts);
        } else if (!name) {
          this.opcode("pushContext");
        } else if (path.data) {
          this.options.data = true;
          this.opcode("lookupData", path.depth, path.parts, path.strict);
        } else {
          this.opcode("lookupOnContext", path.parts, path.falsy, path.strict, scoped);
        }
      },
      StringLiteral: function StringLiteral(string) {
        this.opcode("pushString", string.value);
      },
      NumberLiteral: function NumberLiteral(number) {
        this.opcode("pushLiteral", number.value);
      },
      BooleanLiteral: function BooleanLiteral(bool) {
        this.opcode("pushLiteral", bool.value);
      },
      UndefinedLiteral: function UndefinedLiteral() {
        this.opcode("pushLiteral", "undefined");
      },
      NullLiteral: function NullLiteral() {
        this.opcode("pushLiteral", "null");
      },
      Hash: function Hash(hash) {
        var pairs = hash.pairs, i = 0, l = pairs.length;
        this.opcode("pushHash");
        for (; i < l; i++) {
          this.pushParam(pairs[i].value);
        }
        while (i--) {
          this.opcode("assignToHash", pairs[i].key);
        }
        this.opcode("popHash");
      },
      // HELPERS
      opcode: function opcode(name) {
        this.opcodes.push({
          opcode: name,
          args: slice.call(arguments, 1),
          loc: this.sourceNode[0].loc
        });
      },
      addDepth: function addDepth(depth) {
        if (!depth) {
          return;
        }
        this.useDepths = true;
      },
      classifySexpr: function classifySexpr(sexpr) {
        var isSimple = _ast2["default"].helpers.simpleId(sexpr.path);
        var isBlockParam = isSimple && !!this.blockParamIndex(sexpr.path.parts[0]);
        var isHelper = !isBlockParam && _ast2["default"].helpers.helperExpression(sexpr);
        var isEligible = !isBlockParam && (isHelper || isSimple);
        if (isEligible && !isHelper) {
          var _name = sexpr.path.parts[0], options = this.options;
          if (options.knownHelpers[_name]) {
            isHelper = true;
          } else if (options.knownHelpersOnly) {
            isEligible = false;
          }
        }
        if (isHelper) {
          return "helper";
        } else if (isEligible) {
          return "ambiguous";
        } else {
          return "simple";
        }
      },
      pushParams: function pushParams(params) {
        for (var i = 0, l = params.length; i < l; i++) {
          this.pushParam(params[i]);
        }
      },
      pushParam: function pushParam(val) {
        var value = val.value != null ? val.value : val.original || "";
        if (this.stringParams) {
          if (value.replace) {
            value = value.replace(/^(\.?\.\/)*/g, "").replace(/\//g, ".");
          }
          if (val.depth) {
            this.addDepth(val.depth);
          }
          this.opcode("getContext", val.depth || 0);
          this.opcode("pushStringParam", value, val.type);
          if (val.type === "SubExpression") {
            this.accept(val);
          }
        } else {
          if (this.trackIds) {
            var blockParamIndex = void 0;
            if (val.parts && !_ast2["default"].helpers.scopedId(val) && !val.depth) {
              blockParamIndex = this.blockParamIndex(val.parts[0]);
            }
            if (blockParamIndex) {
              var blockParamChild = val.parts.slice(1).join(".");
              this.opcode("pushId", "BlockParam", blockParamIndex, blockParamChild);
            } else {
              value = val.original || value;
              if (value.replace) {
                value = value.replace(/^this(?:\.|$)/, "").replace(/^\.\//, "").replace(/^\.$/, "");
              }
              this.opcode("pushId", val.type, value);
            }
          }
          this.accept(val);
        }
      },
      setupFullMustacheParams: function setupFullMustacheParams(sexpr, program, inverse, omitEmpty) {
        var params = sexpr.params;
        this.pushParams(params);
        this.opcode("pushProgram", program);
        this.opcode("pushProgram", inverse);
        if (sexpr.hash) {
          this.accept(sexpr.hash);
        } else {
          this.opcode("emptyHash", omitEmpty);
        }
        return params;
      },
      blockParamIndex: function blockParamIndex(name) {
        for (var depth = 0, len = this.options.blockParams.length; depth < len; depth++) {
          var blockParams = this.options.blockParams[depth], param = blockParams && _utils.indexOf(blockParams, name);
          if (blockParams && param >= 0) {
            return [depth, param];
          }
        }
      }
    };
    function precompile(input, options, env2) {
      if (input == null || typeof input !== "string" && input.type !== "Program") {
        throw new _exception2["default"]("You must pass a string or Handlebars AST to Handlebars.precompile. You passed " + input);
      }
      options = options || {};
      if (!("data" in options)) {
        options.data = true;
      }
      if (options.compat) {
        options.useDepths = true;
      }
      var ast = env2.parse(input, options), environment = new env2.Compiler().compile(ast, options);
      return new env2.JavaScriptCompiler().compile(environment, options);
    }
    function compile(input, options, env2) {
      if (options === void 0) options = {};
      if (input == null || typeof input !== "string" && input.type !== "Program") {
        throw new _exception2["default"]("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + input);
      }
      options = _utils.extend({}, options);
      if (!("data" in options)) {
        options.data = true;
      }
      if (options.compat) {
        options.useDepths = true;
      }
      var compiled = void 0;
      function compileInput() {
        var ast = env2.parse(input, options), environment = new env2.Compiler().compile(ast, options), templateSpec = new env2.JavaScriptCompiler().compile(environment, options, void 0, true);
        return env2.template(templateSpec);
      }
      function ret(context, execOptions) {
        if (!compiled) {
          compiled = compileInput();
        }
        return compiled.call(this, context, execOptions);
      }
      ret._setup = function(setupOptions) {
        if (!compiled) {
          compiled = compileInput();
        }
        return compiled._setup(setupOptions);
      };
      ret._child = function(i, data, blockParams, depths) {
        if (!compiled) {
          compiled = compileInput();
        }
        return compiled._child(i, data, blockParams, depths);
      };
      return ret;
    }
    function argEquals(a, b) {
      if (a === b) {
        return true;
      }
      if (_utils.isArray(a) && _utils.isArray(b) && a.length === b.length) {
        for (var i = 0; i < a.length; i++) {
          if (!argEquals(a[i], b[i])) {
            return false;
          }
        }
        return true;
      }
    }
    function transformLiteralToPath(sexpr) {
      if (!sexpr.path.parts) {
        var literal = sexpr.path;
        sexpr.path = {
          type: "PathExpression",
          data: false,
          depth: 0,
          parts: [literal.original + ""],
          original: literal.original + "",
          loc: literal.loc
        };
      }
    }
  }
});

// node_modules/source-map/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/source-map/lib/base64.js"(exports2) {
    var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    exports2.encode = function(number) {
      if (0 <= number && number < intToCharMap.length) {
        return intToCharMap[number];
      }
      throw new TypeError("Must be between 0 and 63: " + number);
    };
    exports2.decode = function(charCode) {
      var bigA = 65;
      var bigZ = 90;
      var littleA = 97;
      var littleZ = 122;
      var zero = 48;
      var nine = 57;
      var plus = 43;
      var slash = 47;
      var littleOffset = 26;
      var numberOffset = 52;
      if (bigA <= charCode && charCode <= bigZ) {
        return charCode - bigA;
      }
      if (littleA <= charCode && charCode <= littleZ) {
        return charCode - littleA + littleOffset;
      }
      if (zero <= charCode && charCode <= nine) {
        return charCode - zero + numberOffset;
      }
      if (charCode == plus) {
        return 62;
      }
      if (charCode == slash) {
        return 63;
      }
      return -1;
    };
  }
});

// node_modules/source-map/lib/base64-vlq.js
var require_base64_vlq = __commonJS({
  "node_modules/source-map/lib/base64-vlq.js"(exports2) {
    var base64 = require_base64();
    var VLQ_BASE_SHIFT = 5;
    var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
    var VLQ_BASE_MASK = VLQ_BASE - 1;
    var VLQ_CONTINUATION_BIT = VLQ_BASE;
    function toVLQSigned(aValue) {
      return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
    }
    function fromVLQSigned(aValue) {
      var isNegative = (aValue & 1) === 1;
      var shifted = aValue >> 1;
      return isNegative ? -shifted : shifted;
    }
    exports2.encode = function base64VLQ_encode(aValue) {
      var encoded = "";
      var digit;
      var vlq = toVLQSigned(aValue);
      do {
        digit = vlq & VLQ_BASE_MASK;
        vlq >>>= VLQ_BASE_SHIFT;
        if (vlq > 0) {
          digit |= VLQ_CONTINUATION_BIT;
        }
        encoded += base64.encode(digit);
      } while (vlq > 0);
      return encoded;
    };
    exports2.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
      var strLen = aStr.length;
      var result = 0;
      var shift = 0;
      var continuation, digit;
      do {
        if (aIndex >= strLen) {
          throw new Error("Expected more digits in base 64 VLQ value.");
        }
        digit = base64.decode(aStr.charCodeAt(aIndex++));
        if (digit === -1) {
          throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
        }
        continuation = !!(digit & VLQ_CONTINUATION_BIT);
        digit &= VLQ_BASE_MASK;
        result = result + (digit << shift);
        shift += VLQ_BASE_SHIFT;
      } while (continuation);
      aOutParam.value = fromVLQSigned(result);
      aOutParam.rest = aIndex;
    };
  }
});

// node_modules/source-map/lib/util.js
var require_util = __commonJS({
  "node_modules/source-map/lib/util.js"(exports2) {
    function getArg(aArgs, aName, aDefaultValue) {
      if (aName in aArgs) {
        return aArgs[aName];
      } else if (arguments.length === 3) {
        return aDefaultValue;
      } else {
        throw new Error('"' + aName + '" is a required argument.');
      }
    }
    exports2.getArg = getArg;
    var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
    var dataUrlRegexp = /^data:.+\,.+$/;
    function urlParse(aUrl) {
      var match = aUrl.match(urlRegexp);
      if (!match) {
        return null;
      }
      return {
        scheme: match[1],
        auth: match[2],
        host: match[3],
        port: match[4],
        path: match[5]
      };
    }
    exports2.urlParse = urlParse;
    function urlGenerate(aParsedUrl) {
      var url = "";
      if (aParsedUrl.scheme) {
        url += aParsedUrl.scheme + ":";
      }
      url += "//";
      if (aParsedUrl.auth) {
        url += aParsedUrl.auth + "@";
      }
      if (aParsedUrl.host) {
        url += aParsedUrl.host;
      }
      if (aParsedUrl.port) {
        url += ":" + aParsedUrl.port;
      }
      if (aParsedUrl.path) {
        url += aParsedUrl.path;
      }
      return url;
    }
    exports2.urlGenerate = urlGenerate;
    function normalize(aPath) {
      var path = aPath;
      var url = urlParse(aPath);
      if (url) {
        if (!url.path) {
          return aPath;
        }
        path = url.path;
      }
      var isAbsolute = exports2.isAbsolute(path);
      var parts = path.split(/\/+/);
      for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
        part = parts[i];
        if (part === ".") {
          parts.splice(i, 1);
        } else if (part === "..") {
          up++;
        } else if (up > 0) {
          if (part === "") {
            parts.splice(i + 1, up);
            up = 0;
          } else {
            parts.splice(i, 2);
            up--;
          }
        }
      }
      path = parts.join("/");
      if (path === "") {
        path = isAbsolute ? "/" : ".";
      }
      if (url) {
        url.path = path;
        return urlGenerate(url);
      }
      return path;
    }
    exports2.normalize = normalize;
    function join(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      if (aPath === "") {
        aPath = ".";
      }
      var aPathUrl = urlParse(aPath);
      var aRootUrl = urlParse(aRoot);
      if (aRootUrl) {
        aRoot = aRootUrl.path || "/";
      }
      if (aPathUrl && !aPathUrl.scheme) {
        if (aRootUrl) {
          aPathUrl.scheme = aRootUrl.scheme;
        }
        return urlGenerate(aPathUrl);
      }
      if (aPathUrl || aPath.match(dataUrlRegexp)) {
        return aPath;
      }
      if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
        aRootUrl.host = aPath;
        return urlGenerate(aRootUrl);
      }
      var joined = aPath.charAt(0) === "/" ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
      if (aRootUrl) {
        aRootUrl.path = joined;
        return urlGenerate(aRootUrl);
      }
      return joined;
    }
    exports2.join = join;
    exports2.isAbsolute = function(aPath) {
      return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
    };
    function relative(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      aRoot = aRoot.replace(/\/$/, "");
      var level = 0;
      while (aPath.indexOf(aRoot + "/") !== 0) {
        var index = aRoot.lastIndexOf("/");
        if (index < 0) {
          return aPath;
        }
        aRoot = aRoot.slice(0, index);
        if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
          return aPath;
        }
        ++level;
      }
      return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
    }
    exports2.relative = relative;
    var supportsNullProto = (function() {
      var obj = /* @__PURE__ */ Object.create(null);
      return !("__proto__" in obj);
    })();
    function identity(s) {
      return s;
    }
    function toSetString(aStr) {
      if (isProtoString(aStr)) {
        return "$" + aStr;
      }
      return aStr;
    }
    exports2.toSetString = supportsNullProto ? identity : toSetString;
    function fromSetString(aStr) {
      if (isProtoString(aStr)) {
        return aStr.slice(1);
      }
      return aStr;
    }
    exports2.fromSetString = supportsNullProto ? identity : fromSetString;
    function isProtoString(s) {
      if (!s) {
        return false;
      }
      var length = s.length;
      if (length < 9) {
        return false;
      }
      if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
        return false;
      }
      for (var i = length - 10; i >= 0; i--) {
        if (s.charCodeAt(i) !== 36) {
          return false;
        }
      }
      return true;
    }
    function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
      var cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports2.compareByOriginalPositions = compareByOriginalPositions;
    function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports2.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
    function strcmp(aStr1, aStr2) {
      if (aStr1 === aStr2) {
        return 0;
      }
      if (aStr1 === null) {
        return 1;
      }
      if (aStr2 === null) {
        return -1;
      }
      if (aStr1 > aStr2) {
        return 1;
      }
      return -1;
    }
    function compareByGeneratedPositionsInflated(mappingA, mappingB) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports2.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
    function parseSourceMapInput(str) {
      return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
    }
    exports2.parseSourceMapInput = parseSourceMapInput;
    function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
      sourceURL = sourceURL || "";
      if (sourceRoot) {
        if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
          sourceRoot += "/";
        }
        sourceURL = sourceRoot + sourceURL;
      }
      if (sourceMapURL) {
        var parsed = urlParse(sourceMapURL);
        if (!parsed) {
          throw new Error("sourceMapURL could not be parsed");
        }
        if (parsed.path) {
          var index = parsed.path.lastIndexOf("/");
          if (index >= 0) {
            parsed.path = parsed.path.substring(0, index + 1);
          }
        }
        sourceURL = join(urlGenerate(parsed), sourceURL);
      }
      return normalize(sourceURL);
    }
    exports2.computeSourceURL = computeSourceURL;
  }
});

// node_modules/source-map/lib/array-set.js
var require_array_set = __commonJS({
  "node_modules/source-map/lib/array-set.js"(exports2) {
    var util = require_util();
    var has = Object.prototype.hasOwnProperty;
    var hasNativeMap = typeof Map !== "undefined";
    function ArraySet() {
      this._array = [];
      this._set = hasNativeMap ? /* @__PURE__ */ new Map() : /* @__PURE__ */ Object.create(null);
    }
    ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
      var set = new ArraySet();
      for (var i = 0, len = aArray.length; i < len; i++) {
        set.add(aArray[i], aAllowDuplicates);
      }
      return set;
    };
    ArraySet.prototype.size = function ArraySet_size() {
      return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
    };
    ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
      var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
      var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
      var idx = this._array.length;
      if (!isDuplicate || aAllowDuplicates) {
        this._array.push(aStr);
      }
      if (!isDuplicate) {
        if (hasNativeMap) {
          this._set.set(aStr, idx);
        } else {
          this._set[sStr] = idx;
        }
      }
    };
    ArraySet.prototype.has = function ArraySet_has(aStr) {
      if (hasNativeMap) {
        return this._set.has(aStr);
      } else {
        var sStr = util.toSetString(aStr);
        return has.call(this._set, sStr);
      }
    };
    ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
      if (hasNativeMap) {
        var idx = this._set.get(aStr);
        if (idx >= 0) {
          return idx;
        }
      } else {
        var sStr = util.toSetString(aStr);
        if (has.call(this._set, sStr)) {
          return this._set[sStr];
        }
      }
      throw new Error('"' + aStr + '" is not in the set.');
    };
    ArraySet.prototype.at = function ArraySet_at(aIdx) {
      if (aIdx >= 0 && aIdx < this._array.length) {
        return this._array[aIdx];
      }
      throw new Error("No element indexed by " + aIdx);
    };
    ArraySet.prototype.toArray = function ArraySet_toArray() {
      return this._array.slice();
    };
    exports2.ArraySet = ArraySet;
  }
});

// node_modules/source-map/lib/mapping-list.js
var require_mapping_list = __commonJS({
  "node_modules/source-map/lib/mapping-list.js"(exports2) {
    var util = require_util();
    function generatedPositionAfter(mappingA, mappingB) {
      var lineA = mappingA.generatedLine;
      var lineB = mappingB.generatedLine;
      var columnA = mappingA.generatedColumn;
      var columnB = mappingB.generatedColumn;
      return lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
    }
    function MappingList() {
      this._array = [];
      this._sorted = true;
      this._last = { generatedLine: -1, generatedColumn: 0 };
    }
    MappingList.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
      this._array.forEach(aCallback, aThisArg);
    };
    MappingList.prototype.add = function MappingList_add(aMapping) {
      if (generatedPositionAfter(this._last, aMapping)) {
        this._last = aMapping;
        this._array.push(aMapping);
      } else {
        this._sorted = false;
        this._array.push(aMapping);
      }
    };
    MappingList.prototype.toArray = function MappingList_toArray() {
      if (!this._sorted) {
        this._array.sort(util.compareByGeneratedPositionsInflated);
        this._sorted = true;
      }
      return this._array;
    };
    exports2.MappingList = MappingList;
  }
});

// node_modules/source-map/lib/source-map-generator.js
var require_source_map_generator = __commonJS({
  "node_modules/source-map/lib/source-map-generator.js"(exports2) {
    var base64VLQ = require_base64_vlq();
    var util = require_util();
    var ArraySet = require_array_set().ArraySet;
    var MappingList = require_mapping_list().MappingList;
    function SourceMapGenerator(aArgs) {
      if (!aArgs) {
        aArgs = {};
      }
      this._file = util.getArg(aArgs, "file", null);
      this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
      this._skipValidation = util.getArg(aArgs, "skipValidation", false);
      this._sources = new ArraySet();
      this._names = new ArraySet();
      this._mappings = new MappingList();
      this._sourcesContents = null;
    }
    SourceMapGenerator.prototype._version = 3;
    SourceMapGenerator.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator({
        file: aSourceMapConsumer.file,
        sourceRoot
      });
      aSourceMapConsumer.eachMapping(function(mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };
        if (mapping.source != null) {
          newMapping.source = mapping.source;
          if (sourceRoot != null) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }
          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };
          if (mapping.name != null) {
            newMapping.name = mapping.name;
          }
        }
        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var sourceRelative = sourceFile;
        if (sourceRoot !== null) {
          sourceRelative = util.relative(sourceRoot, sourceFile);
        }
        if (!generator._sources.has(sourceRelative)) {
          generator._sources.add(sourceRelative);
        }
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };
    SourceMapGenerator.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, "generated");
      var original = util.getArg(aArgs, "original", null);
      var source = util.getArg(aArgs, "source", null);
      var name = util.getArg(aArgs, "name", null);
      if (!this._skipValidation) {
        this._validateMapping(generated, original, source, name);
      }
      if (source != null) {
        source = String(source);
        if (!this._sources.has(source)) {
          this._sources.add(source);
        }
      }
      if (name != null) {
        name = String(name);
        if (!this._names.has(name)) {
          this._names.add(name);
        }
      }
      this._mappings.add({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source,
        name
      });
    };
    SourceMapGenerator.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot != null) {
        source = util.relative(this._sourceRoot, source);
      }
      if (aSourceContent != null) {
        if (!this._sourcesContents) {
          this._sourcesContents = /* @__PURE__ */ Object.create(null);
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else if (this._sourcesContents) {
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };
    SourceMapGenerator.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      var sourceFile = aSourceFile;
      if (aSourceFile == null) {
        if (aSourceMapConsumer.file == null) {
          throw new Error(
            `SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`
          );
        }
        sourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      if (sourceRoot != null) {
        sourceFile = util.relative(sourceRoot, sourceFile);
      }
      var newSources = new ArraySet();
      var newNames = new ArraySet();
      this._mappings.unsortedForEach(function(mapping) {
        if (mapping.source === sourceFile && mapping.originalLine != null) {
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source != null) {
            mapping.source = original.source;
            if (aSourceMapPath != null) {
              mapping.source = util.join(aSourceMapPath, mapping.source);
            }
            if (sourceRoot != null) {
              mapping.source = util.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name != null) {
              mapping.name = original.name;
            }
          }
        }
        var source = mapping.source;
        if (source != null && !newSources.has(source)) {
          newSources.add(source);
        }
        var name = mapping.name;
        if (name != null && !newNames.has(name)) {
          newNames.add(name);
        }
      }, this);
      this._sources = newSources;
      this._names = newNames;
      aSourceMapConsumer.sources.forEach(function(sourceFile2) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile2);
        if (content != null) {
          if (aSourceMapPath != null) {
            sourceFile2 = util.join(aSourceMapPath, sourceFile2);
          }
          if (sourceRoot != null) {
            sourceFile2 = util.relative(sourceRoot, sourceFile2);
          }
          this.setSourceContent(sourceFile2, content);
        }
      }, this);
    };
    SourceMapGenerator.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
      if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
        throw new Error(
          "original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values."
        );
      }
      if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
        return;
      } else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
        return;
      } else {
        throw new Error("Invalid mapping: " + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        }));
      }
    };
    SourceMapGenerator.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = "";
      var next;
      var mapping;
      var nameIdx;
      var sourceIdx;
      var mappings = this._mappings.toArray();
      for (var i = 0, len = mappings.length; i < len; i++) {
        mapping = mappings[i];
        next = "";
        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          while (mapping.generatedLine !== previousGeneratedLine) {
            next += ";";
            previousGeneratedLine++;
          }
        } else {
          if (i > 0) {
            if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
              continue;
            }
            next += ",";
          }
        }
        next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;
        if (mapping.source != null) {
          sourceIdx = this._sources.indexOf(mapping.source);
          next += base64VLQ.encode(sourceIdx - previousSource);
          previousSource = sourceIdx;
          next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;
          next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;
          if (mapping.name != null) {
            nameIdx = this._names.indexOf(mapping.name);
            next += base64VLQ.encode(nameIdx - previousName);
            previousName = nameIdx;
          }
        }
        result += next;
      }
      return result;
    };
    SourceMapGenerator.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function(source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot != null) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
      }, this);
    };
    SourceMapGenerator.prototype.toJSON = function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._file != null) {
        map.file = this._file;
      }
      if (this._sourceRoot != null) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }
      return map;
    };
    SourceMapGenerator.prototype.toString = function SourceMapGenerator_toString() {
      return JSON.stringify(this.toJSON());
    };
    exports2.SourceMapGenerator = SourceMapGenerator;
  }
});

// node_modules/source-map/lib/binary-search.js
var require_binary_search = __commonJS({
  "node_modules/source-map/lib/binary-search.js"(exports2) {
    exports2.GREATEST_LOWER_BOUND = 1;
    exports2.LEAST_UPPER_BOUND = 2;
    function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
      var mid = Math.floor((aHigh - aLow) / 2) + aLow;
      var cmp = aCompare(aNeedle, aHaystack[mid], true);
      if (cmp === 0) {
        return mid;
      } else if (cmp > 0) {
        if (aHigh - mid > 1) {
          return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
        }
        if (aBias == exports2.LEAST_UPPER_BOUND) {
          return aHigh < aHaystack.length ? aHigh : -1;
        } else {
          return mid;
        }
      } else {
        if (mid - aLow > 1) {
          return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
        }
        if (aBias == exports2.LEAST_UPPER_BOUND) {
          return mid;
        } else {
          return aLow < 0 ? -1 : aLow;
        }
      }
    }
    exports2.search = function search(aNeedle, aHaystack, aCompare, aBias) {
      if (aHaystack.length === 0) {
        return -1;
      }
      var index = recursiveSearch(
        -1,
        aHaystack.length,
        aNeedle,
        aHaystack,
        aCompare,
        aBias || exports2.GREATEST_LOWER_BOUND
      );
      if (index < 0) {
        return -1;
      }
      while (index - 1 >= 0) {
        if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
          break;
        }
        --index;
      }
      return index;
    };
  }
});

// node_modules/source-map/lib/quick-sort.js
var require_quick_sort = __commonJS({
  "node_modules/source-map/lib/quick-sort.js"(exports2) {
    function swap(ary, x, y) {
      var temp = ary[x];
      ary[x] = ary[y];
      ary[y] = temp;
    }
    function randomIntInRange(low, high) {
      return Math.round(low + Math.random() * (high - low));
    }
    function doQuickSort(ary, comparator, p, r) {
      if (p < r) {
        var pivotIndex = randomIntInRange(p, r);
        var i = p - 1;
        swap(ary, pivotIndex, r);
        var pivot = ary[r];
        for (var j = p; j < r; j++) {
          if (comparator(ary[j], pivot) <= 0) {
            i += 1;
            swap(ary, i, j);
          }
        }
        swap(ary, i + 1, j);
        var q = i + 1;
        doQuickSort(ary, comparator, p, q - 1);
        doQuickSort(ary, comparator, q + 1, r);
      }
    }
    exports2.quickSort = function(ary, comparator) {
      doQuickSort(ary, comparator, 0, ary.length - 1);
    };
  }
});

// node_modules/source-map/lib/source-map-consumer.js
var require_source_map_consumer = __commonJS({
  "node_modules/source-map/lib/source-map-consumer.js"(exports2) {
    var util = require_util();
    var binarySearch = require_binary_search();
    var ArraySet = require_array_set().ArraySet;
    var base64VLQ = require_base64_vlq();
    var quickSort = require_quick_sort().quickSort;
    function SourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      return sourceMap.sections != null ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL) : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
    }
    SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
      return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
    };
    SourceMapConsumer.prototype._version = 3;
    SourceMapConsumer.prototype.__generatedMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, "_generatedMappings", {
      configurable: true,
      enumerable: true,
      get: function() {
        if (!this.__generatedMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__generatedMappings;
      }
    });
    SourceMapConsumer.prototype.__originalMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, "_originalMappings", {
      configurable: true,
      enumerable: true,
      get: function() {
        if (!this.__originalMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__originalMappings;
      }
    });
    SourceMapConsumer.prototype._charIsMappingSeparator = function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
      var c = aStr.charAt(index);
      return c === ";" || c === ",";
    };
    SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      throw new Error("Subclasses must implement _parseMappings");
    };
    SourceMapConsumer.GENERATED_ORDER = 1;
    SourceMapConsumer.ORIGINAL_ORDER = 2;
    SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
    SourceMapConsumer.LEAST_UPPER_BOUND = 2;
    SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
      var mappings;
      switch (order) {
        case SourceMapConsumer.GENERATED_ORDER:
          mappings = this._generatedMappings;
          break;
        case SourceMapConsumer.ORIGINAL_ORDER:
          mappings = this._originalMappings;
          break;
        default:
          throw new Error("Unknown order of iteration.");
      }
      var sourceRoot = this.sourceRoot;
      mappings.map(function(mapping) {
        var source = mapping.source === null ? null : this._sources.at(mapping.source);
        source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
        return {
          source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name === null ? null : this._names.at(mapping.name)
        };
      }, this).forEach(aCallback, context);
    };
    SourceMapConsumer.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
      var line = util.getArg(aArgs, "line");
      var needle = {
        source: util.getArg(aArgs, "source"),
        originalLine: line,
        originalColumn: util.getArg(aArgs, "column", 0)
      };
      needle.source = this._findSourceIndex(needle.source);
      if (needle.source < 0) {
        return [];
      }
      var mappings = [];
      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        binarySearch.LEAST_UPPER_BOUND
      );
      if (index >= 0) {
        var mapping = this._originalMappings[index];
        if (aArgs.column === void 0) {
          var originalLine = mapping.originalLine;
          while (mapping && mapping.originalLine === originalLine) {
            mappings.push({
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            });
            mapping = this._originalMappings[++index];
          }
        } else {
          var originalColumn = mapping.originalColumn;
          while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
            mappings.push({
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            });
            mapping = this._originalMappings[++index];
          }
        }
      }
      return mappings;
    };
    exports2.SourceMapConsumer = SourceMapConsumer;
    function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      var version = util.getArg(sourceMap, "version");
      var sources = util.getArg(sourceMap, "sources");
      var names = util.getArg(sourceMap, "names", []);
      var sourceRoot = util.getArg(sourceMap, "sourceRoot", null);
      var sourcesContent = util.getArg(sourceMap, "sourcesContent", null);
      var mappings = util.getArg(sourceMap, "mappings");
      var file = util.getArg(sourceMap, "file", null);
      if (version != this._version) {
        throw new Error("Unsupported version: " + version);
      }
      if (sourceRoot) {
        sourceRoot = util.normalize(sourceRoot);
      }
      sources = sources.map(String).map(util.normalize).map(function(source) {
        return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source) ? util.relative(sourceRoot, source) : source;
      });
      this._names = ArraySet.fromArray(names.map(String), true);
      this._sources = ArraySet.fromArray(sources, true);
      this._absoluteSources = this._sources.toArray().map(function(s) {
        return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
      });
      this.sourceRoot = sourceRoot;
      this.sourcesContent = sourcesContent;
      this._mappings = mappings;
      this._sourceMapURL = aSourceMapURL;
      this.file = file;
    }
    BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
    BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }
      if (this._sources.has(relativeSource)) {
        return this._sources.indexOf(relativeSource);
      }
      var i;
      for (i = 0; i < this._absoluteSources.length; ++i) {
        if (this._absoluteSources[i] == aSource) {
          return i;
        }
      }
      return -1;
    };
    BasicSourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
      var smc = Object.create(BasicSourceMapConsumer.prototype);
      var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(
        smc._sources.toArray(),
        smc.sourceRoot
      );
      smc.file = aSourceMap._file;
      smc._sourceMapURL = aSourceMapURL;
      smc._absoluteSources = smc._sources.toArray().map(function(s) {
        return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
      });
      var generatedMappings = aSourceMap._mappings.toArray().slice();
      var destGeneratedMappings = smc.__generatedMappings = [];
      var destOriginalMappings = smc.__originalMappings = [];
      for (var i = 0, length = generatedMappings.length; i < length; i++) {
        var srcMapping = generatedMappings[i];
        var destMapping = new Mapping();
        destMapping.generatedLine = srcMapping.generatedLine;
        destMapping.generatedColumn = srcMapping.generatedColumn;
        if (srcMapping.source) {
          destMapping.source = sources.indexOf(srcMapping.source);
          destMapping.originalLine = srcMapping.originalLine;
          destMapping.originalColumn = srcMapping.originalColumn;
          if (srcMapping.name) {
            destMapping.name = names.indexOf(srcMapping.name);
          }
          destOriginalMappings.push(destMapping);
        }
        destGeneratedMappings.push(destMapping);
      }
      quickSort(smc.__originalMappings, util.compareByOriginalPositions);
      return smc;
    };
    BasicSourceMapConsumer.prototype._version = 3;
    Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", {
      get: function() {
        return this._absoluteSources.slice();
      }
    });
    function Mapping() {
      this.generatedLine = 0;
      this.generatedColumn = 0;
      this.source = null;
      this.originalLine = null;
      this.originalColumn = null;
      this.name = null;
    }
    BasicSourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var length = aStr.length;
      var index = 0;
      var cachedSegments = {};
      var temp = {};
      var originalMappings = [];
      var generatedMappings = [];
      var mapping, str, segment, end, value;
      while (index < length) {
        if (aStr.charAt(index) === ";") {
          generatedLine++;
          index++;
          previousGeneratedColumn = 0;
        } else if (aStr.charAt(index) === ",") {
          index++;
        } else {
          mapping = new Mapping();
          mapping.generatedLine = generatedLine;
          for (end = index; end < length; end++) {
            if (this._charIsMappingSeparator(aStr, end)) {
              break;
            }
          }
          str = aStr.slice(index, end);
          segment = cachedSegments[str];
          if (segment) {
            index += str.length;
          } else {
            segment = [];
            while (index < end) {
              base64VLQ.decode(aStr, index, temp);
              value = temp.value;
              index = temp.rest;
              segment.push(value);
            }
            if (segment.length === 2) {
              throw new Error("Found a source, but no line and column");
            }
            if (segment.length === 3) {
              throw new Error("Found a source and line, but no column");
            }
            cachedSegments[str] = segment;
          }
          mapping.generatedColumn = previousGeneratedColumn + segment[0];
          previousGeneratedColumn = mapping.generatedColumn;
          if (segment.length > 1) {
            mapping.source = previousSource + segment[1];
            previousSource += segment[1];
            mapping.originalLine = previousOriginalLine + segment[2];
            previousOriginalLine = mapping.originalLine;
            mapping.originalLine += 1;
            mapping.originalColumn = previousOriginalColumn + segment[3];
            previousOriginalColumn = mapping.originalColumn;
            if (segment.length > 4) {
              mapping.name = previousName + segment[4];
              previousName += segment[4];
            }
          }
          generatedMappings.push(mapping);
          if (typeof mapping.originalLine === "number") {
            originalMappings.push(mapping);
          }
        }
      }
      quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
      this.__generatedMappings = generatedMappings;
      quickSort(originalMappings, util.compareByOriginalPositions);
      this.__originalMappings = originalMappings;
    };
    BasicSourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
      if (aNeedle[aLineName] <= 0) {
        throw new TypeError("Line must be greater than or equal to 1, got " + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError("Column must be greater than or equal to 0, got " + aNeedle[aColumnName]);
      }
      return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
    };
    BasicSourceMapConsumer.prototype.computeColumnSpans = function SourceMapConsumer_computeColumnSpans() {
      for (var index = 0; index < this._generatedMappings.length; ++index) {
        var mapping = this._generatedMappings[index];
        if (index + 1 < this._generatedMappings.length) {
          var nextMapping = this._generatedMappings[index + 1];
          if (mapping.generatedLine === nextMapping.generatedLine) {
            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
            continue;
          }
        }
        mapping.lastGeneratedColumn = Infinity;
      }
    };
    BasicSourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, "line"),
        generatedColumn: util.getArg(aArgs, "column")
      };
      var index = this._findMapping(
        needle,
        this._generatedMappings,
        "generatedLine",
        "generatedColumn",
        util.compareByGeneratedPositionsDeflated,
        util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
      );
      if (index >= 0) {
        var mapping = this._generatedMappings[index];
        if (mapping.generatedLine === needle.generatedLine) {
          var source = util.getArg(mapping, "source", null);
          if (source !== null) {
            source = this._sources.at(source);
            source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
          }
          var name = util.getArg(mapping, "name", null);
          if (name !== null) {
            name = this._names.at(name);
          }
          return {
            source,
            line: util.getArg(mapping, "originalLine", null),
            column: util.getArg(mapping, "originalColumn", null),
            name
          };
        }
      }
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };
    BasicSourceMapConsumer.prototype.hasContentsOfAllSources = function BasicSourceMapConsumer_hasContentsOfAllSources() {
      if (!this.sourcesContent) {
        return false;
      }
      return this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(sc) {
        return sc == null;
      });
    };
    BasicSourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      if (!this.sourcesContent) {
        return null;
      }
      var index = this._findSourceIndex(aSource);
      if (index >= 0) {
        return this.sourcesContent[index];
      }
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }
      var url;
      if (this.sourceRoot != null && (url = util.urlParse(this.sourceRoot))) {
        var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
        if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
        }
        if ((!url.path || url.path == "/") && this._sources.has("/" + relativeSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
        }
      }
      if (nullOnMissing) {
        return null;
      } else {
        throw new Error('"' + relativeSource + '" is not in the SourceMap.');
      }
    };
    BasicSourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
      var source = util.getArg(aArgs, "source");
      source = this._findSourceIndex(source);
      if (source < 0) {
        return {
          line: null,
          column: null,
          lastColumn: null
        };
      }
      var needle = {
        source,
        originalLine: util.getArg(aArgs, "line"),
        originalColumn: util.getArg(aArgs, "column")
      };
      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
      );
      if (index >= 0) {
        var mapping = this._originalMappings[index];
        if (mapping.source === needle.source) {
          return {
            line: util.getArg(mapping, "generatedLine", null),
            column: util.getArg(mapping, "generatedColumn", null),
            lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
          };
        }
      }
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    };
    exports2.BasicSourceMapConsumer = BasicSourceMapConsumer;
    function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      var version = util.getArg(sourceMap, "version");
      var sections = util.getArg(sourceMap, "sections");
      if (version != this._version) {
        throw new Error("Unsupported version: " + version);
      }
      this._sources = new ArraySet();
      this._names = new ArraySet();
      var lastOffset = {
        line: -1,
        column: 0
      };
      this._sections = sections.map(function(s) {
        if (s.url) {
          throw new Error("Support for url field in sections not implemented.");
        }
        var offset = util.getArg(s, "offset");
        var offsetLine = util.getArg(offset, "line");
        var offsetColumn = util.getArg(offset, "column");
        if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) {
          throw new Error("Section offsets must be ordered and non-overlapping.");
        }
        lastOffset = offset;
        return {
          generatedOffset: {
            // The offset fields are 0-based, but we use 1-based indices when
            // encoding/decoding from VLQ.
            generatedLine: offsetLine + 1,
            generatedColumn: offsetColumn + 1
          },
          consumer: new SourceMapConsumer(util.getArg(s, "map"), aSourceMapURL)
        };
      });
    }
    IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;
    IndexedSourceMapConsumer.prototype._version = 3;
    Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", {
      get: function() {
        var sources = [];
        for (var i = 0; i < this._sections.length; i++) {
          for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
            sources.push(this._sections[i].consumer.sources[j]);
          }
        }
        return sources;
      }
    });
    IndexedSourceMapConsumer.prototype.originalPositionFor = function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, "line"),
        generatedColumn: util.getArg(aArgs, "column")
      };
      var sectionIndex = binarySearch.search(
        needle,
        this._sections,
        function(needle2, section2) {
          var cmp = needle2.generatedLine - section2.generatedOffset.generatedLine;
          if (cmp) {
            return cmp;
          }
          return needle2.generatedColumn - section2.generatedOffset.generatedColumn;
        }
      );
      var section = this._sections[sectionIndex];
      if (!section) {
        return {
          source: null,
          line: null,
          column: null,
          name: null
        };
      }
      return section.consumer.originalPositionFor({
        line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
        column: needle.generatedColumn - (section.generatedOffset.generatedLine === needle.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
        bias: aArgs.bias
      });
    };
    IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = function IndexedSourceMapConsumer_hasContentsOfAllSources() {
      return this._sections.every(function(s) {
        return s.consumer.hasContentsOfAllSources();
      });
    };
    IndexedSourceMapConsumer.prototype.sourceContentFor = function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        var content = section.consumer.sourceContentFor(aSource, true);
        if (content) {
          return content;
        }
      }
      if (nullOnMissing) {
        return null;
      } else {
        throw new Error('"' + aSource + '" is not in the SourceMap.');
      }
    };
    IndexedSourceMapConsumer.prototype.generatedPositionFor = function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        if (section.consumer._findSourceIndex(util.getArg(aArgs, "source")) === -1) {
          continue;
        }
        var generatedPosition = section.consumer.generatedPositionFor(aArgs);
        if (generatedPosition) {
          var ret = {
            line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
            column: generatedPosition.column + (section.generatedOffset.generatedLine === generatedPosition.line ? section.generatedOffset.generatedColumn - 1 : 0)
          };
          return ret;
        }
      }
      return {
        line: null,
        column: null
      };
    };
    IndexedSourceMapConsumer.prototype._parseMappings = function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      this.__generatedMappings = [];
      this.__originalMappings = [];
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        var sectionMappings = section.consumer._generatedMappings;
        for (var j = 0; j < sectionMappings.length; j++) {
          var mapping = sectionMappings[j];
          var source = section.consumer._sources.at(mapping.source);
          source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
          this._sources.add(source);
          source = this._sources.indexOf(source);
          var name = null;
          if (mapping.name) {
            name = section.consumer._names.at(mapping.name);
            this._names.add(name);
            name = this._names.indexOf(name);
          }
          var adjustedMapping = {
            source,
            generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
            generatedColumn: mapping.generatedColumn + (section.generatedOffset.generatedLine === mapping.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
            originalLine: mapping.originalLine,
            originalColumn: mapping.originalColumn,
            name
          };
          this.__generatedMappings.push(adjustedMapping);
          if (typeof adjustedMapping.originalLine === "number") {
            this.__originalMappings.push(adjustedMapping);
          }
        }
      }
      quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
      quickSort(this.__originalMappings, util.compareByOriginalPositions);
    };
    exports2.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
  }
});

// node_modules/source-map/lib/source-node.js
var require_source_node = __commonJS({
  "node_modules/source-map/lib/source-node.js"(exports2) {
    var SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
    var util = require_util();
    var REGEX_NEWLINE = /(\r?\n)/;
    var NEWLINE_CODE = 10;
    var isSourceNode = "$$$isSourceNode$$$";
    function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
      this.children = [];
      this.sourceContents = {};
      this.line = aLine == null ? null : aLine;
      this.column = aColumn == null ? null : aColumn;
      this.source = aSource == null ? null : aSource;
      this.name = aName == null ? null : aName;
      this[isSourceNode] = true;
      if (aChunks != null) this.add(aChunks);
    }
    SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
      var node = new SourceNode();
      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
      var remainingLinesIndex = 0;
      var shiftNextLine = function() {
        var lineContents = getNextLine();
        var newLine = getNextLine() || "";
        return lineContents + newLine;
        function getNextLine() {
          return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : void 0;
        }
      };
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;
      var lastMapping = null;
      aSourceMapConsumer.eachMapping(function(mapping) {
        if (lastMapping !== null) {
          if (lastGeneratedLine < mapping.generatedLine) {
            addMappingWithCode(lastMapping, shiftNextLine());
            lastGeneratedLine++;
            lastGeneratedColumn = 0;
          } else {
            var nextLine = remainingLines[remainingLinesIndex] || "";
            var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
            remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
            lastMapping = mapping;
            return;
          }
        }
        while (lastGeneratedLine < mapping.generatedLine) {
          node.add(shiftNextLine());
          lastGeneratedLine++;
        }
        if (lastGeneratedColumn < mapping.generatedColumn) {
          var nextLine = remainingLines[remainingLinesIndex] || "";
          node.add(nextLine.substr(0, mapping.generatedColumn));
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
        }
        lastMapping = mapping;
      }, this);
      if (remainingLinesIndex < remainingLines.length) {
        if (lastMapping) {
          addMappingWithCode(lastMapping, shiftNextLine());
        }
        node.add(remainingLines.splice(remainingLinesIndex).join(""));
      }
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aRelativePath != null) {
            sourceFile = util.join(aRelativePath, sourceFile);
          }
          node.setSourceContent(sourceFile, content);
        }
      });
      return node;
      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === void 0) {
          node.add(code);
        } else {
          var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source;
          node.add(new SourceNode(
            mapping.originalLine,
            mapping.originalColumn,
            source,
            code,
            mapping.name
          ));
        }
      }
    };
    SourceNode.prototype.add = function SourceNode_add(aChunk) {
      if (Array.isArray(aChunk)) {
        aChunk.forEach(function(chunk) {
          this.add(chunk);
        }, this);
      } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        if (aChunk) {
          this.children.push(aChunk);
        }
      } else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    };
    SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
      if (Array.isArray(aChunk)) {
        for (var i = aChunk.length - 1; i >= 0; i--) {
          this.prepend(aChunk[i]);
        }
      } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        this.children.unshift(aChunk);
      } else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    };
    SourceNode.prototype.walk = function SourceNode_walk(aFn) {
      var chunk;
      for (var i = 0, len = this.children.length; i < len; i++) {
        chunk = this.children[i];
        if (chunk[isSourceNode]) {
          chunk.walk(aFn);
        } else {
          if (chunk !== "") {
            aFn(chunk, {
              source: this.source,
              line: this.line,
              column: this.column,
              name: this.name
            });
          }
        }
      }
    };
    SourceNode.prototype.join = function SourceNode_join(aSep) {
      var newChildren;
      var i;
      var len = this.children.length;
      if (len > 0) {
        newChildren = [];
        for (i = 0; i < len - 1; i++) {
          newChildren.push(this.children[i]);
          newChildren.push(aSep);
        }
        newChildren.push(this.children[i]);
        this.children = newChildren;
      }
      return this;
    };
    SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
      var lastChild = this.children[this.children.length - 1];
      if (lastChild[isSourceNode]) {
        lastChild.replaceRight(aPattern, aReplacement);
      } else if (typeof lastChild === "string") {
        this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
      } else {
        this.children.push("".replace(aPattern, aReplacement));
      }
      return this;
    };
    SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
    };
    SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i][isSourceNode]) {
          this.children[i].walkSourceContents(aFn);
        }
      }
      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    };
    SourceNode.prototype.toString = function SourceNode_toString() {
      var str = "";
      this.walk(function(chunk) {
        str += chunk;
      });
      return str;
    };
    SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
      var generated = {
        code: "",
        line: 1,
        column: 0
      };
      var map = new SourceMapGenerator(aArgs);
      var sourceMappingActive = false;
      var lastOriginalSource = null;
      var lastOriginalLine = null;
      var lastOriginalColumn = null;
      var lastOriginalName = null;
      this.walk(function(chunk, original) {
        generated.code += chunk;
        if (original.source !== null && original.line !== null && original.column !== null) {
          if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
          lastOriginalSource = original.source;
          lastOriginalLine = original.line;
          lastOriginalColumn = original.column;
          lastOriginalName = original.name;
          sourceMappingActive = true;
        } else if (sourceMappingActive) {
          map.addMapping({
            generated: {
              line: generated.line,
              column: generated.column
            }
          });
          lastOriginalSource = null;
          sourceMappingActive = false;
        }
        for (var idx = 0, length = chunk.length; idx < length; idx++) {
          if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
            generated.line++;
            generated.column = 0;
            if (idx + 1 === length) {
              lastOriginalSource = null;
              sourceMappingActive = false;
            } else if (sourceMappingActive) {
              map.addMapping({
                source: original.source,
                original: {
                  line: original.line,
                  column: original.column
                },
                generated: {
                  line: generated.line,
                  column: generated.column
                },
                name: original.name
              });
            }
          } else {
            generated.column++;
          }
        }
      });
      this.walkSourceContents(function(sourceFile, sourceContent) {
        map.setSourceContent(sourceFile, sourceContent);
      });
      return { code: generated.code, map };
    };
    exports2.SourceNode = SourceNode;
  }
});

// node_modules/source-map/source-map.js
var require_source_map = __commonJS({
  "node_modules/source-map/source-map.js"(exports2) {
    exports2.SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
    exports2.SourceMapConsumer = require_source_map_consumer().SourceMapConsumer;
    exports2.SourceNode = require_source_node().SourceNode;
  }
});

// node_modules/handlebars/dist/cjs/handlebars/compiler/code-gen.js
var require_code_gen = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/compiler/code-gen.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    var _utils = require_utils2();
    var SourceNode = void 0;
    try {
      if (typeof define !== "function" || !define.amd) {
        SourceMap = require_source_map();
        SourceNode = SourceMap.SourceNode;
      }
    } catch (err) {
    }
    var SourceMap;
    if (!SourceNode) {
      SourceNode = function(line, column, srcFile, chunks) {
        this.src = "";
        if (chunks) {
          this.add(chunks);
        }
      };
      SourceNode.prototype = {
        add: function add(chunks) {
          if (_utils.isArray(chunks)) {
            chunks = chunks.join("");
          }
          this.src += chunks;
        },
        prepend: function prepend(chunks) {
          if (_utils.isArray(chunks)) {
            chunks = chunks.join("");
          }
          this.src = chunks + this.src;
        },
        toStringWithSourceMap: function toStringWithSourceMap() {
          return { code: this.toString() };
        },
        toString: function toString() {
          return this.src;
        }
      };
    }
    function castChunk(chunk, codeGen, loc) {
      if (_utils.isArray(chunk)) {
        var ret = [];
        for (var i = 0, len = chunk.length; i < len; i++) {
          ret.push(codeGen.wrap(chunk[i], loc));
        }
        return ret;
      } else if (typeof chunk === "boolean" || typeof chunk === "number") {
        return chunk + "";
      }
      return chunk;
    }
    function CodeGen(srcFile) {
      this.srcFile = srcFile;
      this.source = [];
    }
    CodeGen.prototype = {
      isEmpty: function isEmpty() {
        return !this.source.length;
      },
      prepend: function prepend(source, loc) {
        this.source.unshift(this.wrap(source, loc));
      },
      push: function push(source, loc) {
        this.source.push(this.wrap(source, loc));
      },
      merge: function merge() {
        var source = this.empty();
        this.each(function(line) {
          source.add(["  ", line, "\n"]);
        });
        return source;
      },
      each: function each(iter) {
        for (var i = 0, len = this.source.length; i < len; i++) {
          iter(this.source[i]);
        }
      },
      empty: function empty() {
        var loc = this.currentLocation || { start: {} };
        return new SourceNode(loc.start.line, loc.start.column, this.srcFile);
      },
      wrap: function wrap(chunk) {
        var loc = arguments.length <= 1 || arguments[1] === void 0 ? this.currentLocation || { start: {} } : arguments[1];
        if (chunk instanceof SourceNode) {
          return chunk;
        }
        chunk = castChunk(chunk, this, loc);
        return new SourceNode(loc.start.line, loc.start.column, this.srcFile, chunk);
      },
      functionCall: function functionCall(fn, type, params) {
        params = this.generateList(params);
        return this.wrap([fn, type ? "." + type + "(" : "(", params, ")"]);
      },
      quotedString: function quotedString(str) {
        return '"' + (str + "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") + '"';
      },
      objectLiteral: function objectLiteral(obj) {
        var _this = this;
        var pairs = [];
        Object.keys(obj).forEach(function(key) {
          var value = castChunk(obj[key], _this);
          if (value !== "undefined") {
            pairs.push([_this.quotedString(key), ":", value]);
          }
        });
        var ret = this.generateList(pairs);
        ret.prepend("{");
        ret.add("}");
        return ret;
      },
      generateList: function generateList(entries) {
        var ret = this.empty();
        for (var i = 0, len = entries.length; i < len; i++) {
          if (i) {
            ret.add(",");
          }
          ret.add(castChunk(entries[i], this));
        }
        return ret;
      },
      generateArray: function generateArray(entries) {
        var ret = this.generateList(entries);
        ret.prepend("[");
        ret.add("]");
        return ret;
      }
    };
    exports2["default"] = CodeGen;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/compiler/javascript-compiler.js
var require_javascript_compiler = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/compiler/javascript-compiler.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _base = require_base();
    var _exception = require_exception();
    var _exception2 = _interopRequireDefault(_exception);
    var _utils = require_utils2();
    var _codeGen = require_code_gen();
    var _codeGen2 = _interopRequireDefault(_codeGen);
    function Literal(value) {
      this.value = value;
    }
    function JavaScriptCompiler() {
    }
    JavaScriptCompiler.prototype = {
      // PUBLIC API: You can override these methods in a subclass to provide
      // alternative compiled forms for name lookup and buffering semantics
      nameLookup: function nameLookup(parent, name) {
        return this.internalNameLookup(parent, name);
      },
      depthedLookup: function depthedLookup(name) {
        return [this.aliasable("container.lookup"), "(depths, ", JSON.stringify(name), ")"];
      },
      compilerInfo: function compilerInfo() {
        var revision = _base.COMPILER_REVISION, versions = _base.REVISION_CHANGES[revision];
        return [revision, versions];
      },
      appendToBuffer: function appendToBuffer(source, location, explicit) {
        if (!_utils.isArray(source)) {
          source = [source];
        }
        source = this.source.wrap(source, location);
        if (this.environment.isSimple) {
          return ["return ", source, ";"];
        } else if (explicit) {
          return ["buffer += ", source, ";"];
        } else {
          source.appendToBuffer = true;
          return source;
        }
      },
      initializeBuffer: function initializeBuffer() {
        return this.quotedString("");
      },
      // END PUBLIC API
      internalNameLookup: function internalNameLookup(parent, name) {
        this.lookupPropertyFunctionIsUsed = true;
        return ["lookupProperty(", parent, ",", JSON.stringify(name), ")"];
      },
      lookupPropertyFunctionIsUsed: false,
      compile: function compile(environment, options, context, asObject) {
        this.environment = environment;
        this.options = options;
        this.stringParams = this.options.stringParams;
        this.trackIds = this.options.trackIds;
        this.precompile = !asObject;
        this.name = this.environment.name;
        this.isChild = !!context;
        this.context = context || {
          decorators: [],
          programs: [],
          environments: []
        };
        this.preamble();
        this.stackSlot = 0;
        this.stackVars = [];
        this.aliases = {};
        this.registers = { list: [] };
        this.hashes = [];
        this.compileStack = [];
        this.inlineStack = [];
        this.blockParams = [];
        this.compileChildren(environment, options);
        this.useDepths = this.useDepths || environment.useDepths || environment.useDecorators || this.options.compat;
        this.useBlockParams = this.useBlockParams || environment.useBlockParams;
        var opcodes = environment.opcodes, opcode = void 0, firstLoc = void 0, i = void 0, l = void 0;
        for (i = 0, l = opcodes.length; i < l; i++) {
          opcode = opcodes[i];
          this.source.currentLocation = opcode.loc;
          firstLoc = firstLoc || opcode.loc;
          this[opcode.opcode].apply(this, opcode.args);
        }
        this.source.currentLocation = firstLoc;
        this.pushSource("");
        if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
          throw new _exception2["default"]("Compile completed with content left on stack");
        }
        if (!this.decorators.isEmpty()) {
          this.useDecorators = true;
          this.decorators.prepend(["var decorators = container.decorators, ", this.lookupPropertyFunctionVarDeclaration(), ";\n"]);
          this.decorators.push("return fn;");
          if (asObject) {
            this.decorators = Function.apply(this, ["fn", "props", "container", "depth0", "data", "blockParams", "depths", this.decorators.merge()]);
          } else {
            this.decorators.prepend("function(fn, props, container, depth0, data, blockParams, depths) {\n");
            this.decorators.push("}\n");
            this.decorators = this.decorators.merge();
          }
        } else {
          this.decorators = void 0;
        }
        var fn = this.createFunctionContext(asObject);
        if (!this.isChild) {
          var ret = {
            compiler: this.compilerInfo(),
            main: fn
          };
          if (this.decorators) {
            ret.main_d = this.decorators;
            ret.useDecorators = true;
          }
          var _context = this.context;
          var programs = _context.programs;
          var decorators = _context.decorators;
          for (i = 0, l = programs.length; i < l; i++) {
            ret[i] = programs[i];
            if (decorators[i]) {
              ret[i + "_d"] = decorators[i];
              ret.useDecorators = true;
            }
          }
          if (this.environment.usePartial) {
            ret.usePartial = true;
          }
          if (this.options.data) {
            ret.useData = true;
          }
          if (this.useDepths) {
            ret.useDepths = true;
          }
          if (this.useBlockParams) {
            ret.useBlockParams = true;
          }
          if (this.options.compat) {
            ret.compat = true;
          }
          if (!asObject) {
            ret.compiler = JSON.stringify(ret.compiler);
            this.source.currentLocation = { start: { line: 1, column: 0 } };
            ret = this.objectLiteral(ret);
            if (options.srcName) {
              ret = ret.toStringWithSourceMap({ file: options.destName });
              ret.map = ret.map && ret.map.toString();
            } else {
              ret = ret.toString();
            }
          } else {
            ret.compilerOptions = this.options;
          }
          return ret;
        } else {
          return fn;
        }
      },
      preamble: function preamble() {
        this.lastContext = 0;
        this.source = new _codeGen2["default"](this.options.srcName);
        this.decorators = new _codeGen2["default"](this.options.srcName);
      },
      createFunctionContext: function createFunctionContext(asObject) {
        var _this = this;
        var varDeclarations = "";
        var locals = this.stackVars.concat(this.registers.list);
        if (locals.length > 0) {
          varDeclarations += ", " + locals.join(", ");
        }
        var aliasCount = 0;
        Object.keys(this.aliases).forEach(function(alias) {
          var node = _this.aliases[alias];
          if (node.children && node.referenceCount > 1) {
            varDeclarations += ", alias" + ++aliasCount + "=" + alias;
            node.children[0] = "alias" + aliasCount;
          }
        });
        if (this.lookupPropertyFunctionIsUsed) {
          varDeclarations += ", " + this.lookupPropertyFunctionVarDeclaration();
        }
        var params = ["container", "depth0", "helpers", "partials", "data"];
        if (this.useBlockParams || this.useDepths) {
          params.push("blockParams");
        }
        if (this.useDepths) {
          params.push("depths");
        }
        var source = this.mergeSource(varDeclarations);
        if (asObject) {
          params.push(source);
          return Function.apply(this, params);
        } else {
          return this.source.wrap(["function(", params.join(","), ") {\n  ", source, "}"]);
        }
      },
      mergeSource: function mergeSource(varDeclarations) {
        var isSimple = this.environment.isSimple, appendOnly = !this.forceBuffer, appendFirst = void 0, sourceSeen = void 0, bufferStart = void 0, bufferEnd = void 0;
        this.source.each(function(line) {
          if (line.appendToBuffer) {
            if (bufferStart) {
              line.prepend("  + ");
            } else {
              bufferStart = line;
            }
            bufferEnd = line;
          } else {
            if (bufferStart) {
              if (!sourceSeen) {
                appendFirst = true;
              } else {
                bufferStart.prepend("buffer += ");
              }
              bufferEnd.add(";");
              bufferStart = bufferEnd = void 0;
            }
            sourceSeen = true;
            if (!isSimple) {
              appendOnly = false;
            }
          }
        });
        if (appendOnly) {
          if (bufferStart) {
            bufferStart.prepend("return ");
            bufferEnd.add(";");
          } else if (!sourceSeen) {
            this.source.push('return "";');
          }
        } else {
          varDeclarations += ", buffer = " + (appendFirst ? "" : this.initializeBuffer());
          if (bufferStart) {
            bufferStart.prepend("return buffer + ");
            bufferEnd.add(";");
          } else {
            this.source.push("return buffer;");
          }
        }
        if (varDeclarations) {
          this.source.prepend("var " + varDeclarations.substring(2) + (appendFirst ? "" : ";\n"));
        }
        return this.source.merge();
      },
      lookupPropertyFunctionVarDeclaration: function lookupPropertyFunctionVarDeclaration() {
        return "\n      lookupProperty = container.lookupProperty || function(parent, propertyName) {\n        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {\n          return parent[propertyName];\n        }\n        return undefined\n    }\n    ".trim();
      },
      // [blockValue]
      //
      // On stack, before: hash, inverse, program, value
      // On stack, after: return value of blockHelperMissing
      //
      // The purpose of this opcode is to take a block of the form
      // `{{#this.foo}}...{{/this.foo}}`, resolve the value of `foo`, and
      // replace it on the stack with the result of properly
      // invoking blockHelperMissing.
      blockValue: function blockValue(name) {
        var blockHelperMissing = this.aliasable("container.hooks.blockHelperMissing"), params = [this.contextName(0)];
        this.setupHelperArgs(name, 0, params);
        var blockName = this.popStack();
        params.splice(1, 0, blockName);
        this.push(this.source.functionCall(blockHelperMissing, "call", params));
      },
      // [ambiguousBlockValue]
      //
      // On stack, before: hash, inverse, program, value
      // Compiler value, before: lastHelper=value of last found helper, if any
      // On stack, after, if no lastHelper: same as [blockValue]
      // On stack, after, if lastHelper: value
      ambiguousBlockValue: function ambiguousBlockValue() {
        var blockHelperMissing = this.aliasable("container.hooks.blockHelperMissing"), params = [this.contextName(0)];
        this.setupHelperArgs("", 0, params, true);
        this.flushInline();
        var current = this.topStack();
        params.splice(1, 0, current);
        this.pushSource(["if (!", this.lastHelper, ") { ", current, " = ", this.source.functionCall(blockHelperMissing, "call", params), "}"]);
      },
      // [appendContent]
      //
      // On stack, before: ...
      // On stack, after: ...
      //
      // Appends the string value of `content` to the current buffer
      appendContent: function appendContent(content) {
        if (this.pendingContent) {
          content = this.pendingContent + content;
        } else {
          this.pendingLocation = this.source.currentLocation;
        }
        this.pendingContent = content;
      },
      // [append]
      //
      // On stack, before: value, ...
      // On stack, after: ...
      //
      // Coerces `value` to a String and appends it to the current buffer.
      //
      // If `value` is truthy, or 0, it is coerced into a string and appended
      // Otherwise, the empty string is appended
      append: function append() {
        if (this.isInline()) {
          this.replaceStack(function(current) {
            return [" != null ? ", current, ' : ""'];
          });
          this.pushSource(this.appendToBuffer(this.popStack()));
        } else {
          var local = this.popStack();
          this.pushSource(["if (", local, " != null) { ", this.appendToBuffer(local, void 0, true), " }"]);
          if (this.environment.isSimple) {
            this.pushSource(["else { ", this.appendToBuffer("''", void 0, true), " }"]);
          }
        }
      },
      // [appendEscaped]
      //
      // On stack, before: value, ...
      // On stack, after: ...
      //
      // Escape `value` and append it to the buffer
      appendEscaped: function appendEscaped() {
        this.pushSource(this.appendToBuffer([this.aliasable("container.escapeExpression"), "(", this.popStack(), ")"]));
      },
      // [getContext]
      //
      // On stack, before: ...
      // On stack, after: ...
      // Compiler value, after: lastContext=depth
      //
      // Set the value of the `lastContext` compiler value to the depth
      getContext: function getContext(depth) {
        this.lastContext = depth;
      },
      // [pushContext]
      //
      // On stack, before: ...
      // On stack, after: currentContext, ...
      //
      // Pushes the value of the current context onto the stack.
      pushContext: function pushContext() {
        this.pushStackLiteral(this.contextName(this.lastContext));
      },
      // [lookupOnContext]
      //
      // On stack, before: ...
      // On stack, after: currentContext[name], ...
      //
      // Looks up the value of `name` on the current context and pushes
      // it onto the stack.
      lookupOnContext: function lookupOnContext(parts, falsy, strict, scoped) {
        var i = 0;
        if (!scoped && this.options.compat && !this.lastContext) {
          this.push(this.depthedLookup(parts[i++]));
        } else {
          this.pushContext();
        }
        this.resolvePath("context", parts, i, falsy, strict);
      },
      // [lookupBlockParam]
      //
      // On stack, before: ...
      // On stack, after: blockParam[name], ...
      //
      // Looks up the value of `parts` on the given block param and pushes
      // it onto the stack.
      lookupBlockParam: function lookupBlockParam(blockParamId, parts) {
        this.useBlockParams = true;
        this.push(["blockParams[", blockParamId[0], "][", blockParamId[1], "]"]);
        this.resolvePath("context", parts, 1);
      },
      // [lookupData]
      //
      // On stack, before: ...
      // On stack, after: data, ...
      //
      // Push the data lookup operator
      lookupData: function lookupData(depth, parts, strict) {
        if (!depth) {
          this.pushStackLiteral("data");
        } else {
          this.pushStackLiteral("container.data(data, " + depth + ")");
        }
        this.resolvePath("data", parts, 0, true, strict);
      },
      resolvePath: function resolvePath(type, parts, startPartIndex, falsy, strict) {
        var _this2 = this;
        if (this.options.strict || this.options.assumeObjects) {
          this.push(strictLookup(this.options.strict && strict, this, parts, startPartIndex, type));
          return;
        }
        var len = parts.length;
        var _loop = function(i2) {
          _this2.replaceStack(function(current) {
            var lookup = _this2.nameLookup(current, parts[i2], type);
            if (!falsy) {
              return [" != null ? ", lookup, " : ", current];
            } else {
              return [" && ", lookup];
            }
          });
        };
        for (var i = startPartIndex; i < len; i++) {
          _loop(i);
        }
      },
      // [resolvePossibleLambda]
      //
      // On stack, before: value, ...
      // On stack, after: resolved value, ...
      //
      // If the `value` is a lambda, replace it on the stack by
      // the return value of the lambda
      resolvePossibleLambda: function resolvePossibleLambda() {
        this.push([this.aliasable("container.lambda"), "(", this.popStack(), ", ", this.contextName(0), ")"]);
      },
      // [pushStringParam]
      //
      // On stack, before: ...
      // On stack, after: string, currentContext, ...
      //
      // This opcode is designed for use in string mode, which
      // provides the string value of a parameter along with its
      // depth rather than resolving it immediately.
      pushStringParam: function pushStringParam(string, type) {
        this.pushContext();
        this.pushString(type);
        if (type !== "SubExpression") {
          if (typeof string === "string") {
            this.pushString(string);
          } else {
            this.pushStackLiteral(string);
          }
        }
      },
      emptyHash: function emptyHash(omitEmpty) {
        if (this.trackIds) {
          this.push("{}");
        }
        if (this.stringParams) {
          this.push("{}");
          this.push("{}");
        }
        this.pushStackLiteral(omitEmpty ? "undefined" : "{}");
      },
      pushHash: function pushHash() {
        if (this.hash) {
          this.hashes.push(this.hash);
        }
        this.hash = { values: {}, types: [], contexts: [], ids: [] };
      },
      popHash: function popHash() {
        var hash = this.hash;
        this.hash = this.hashes.pop();
        if (this.trackIds) {
          this.push(this.objectLiteral(hash.ids));
        }
        if (this.stringParams) {
          this.push(this.objectLiteral(hash.contexts));
          this.push(this.objectLiteral(hash.types));
        }
        this.push(this.objectLiteral(hash.values));
      },
      // [pushString]
      //
      // On stack, before: ...
      // On stack, after: quotedString(string), ...
      //
      // Push a quoted version of `string` onto the stack
      pushString: function pushString(string) {
        this.pushStackLiteral(this.quotedString(string));
      },
      // [pushLiteral]
      //
      // On stack, before: ...
      // On stack, after: value, ...
      //
      // Pushes a value onto the stack. This operation prevents
      // the compiler from creating a temporary variable to hold
      // it.
      pushLiteral: function pushLiteral(value) {
        this.pushStackLiteral(value);
      },
      // [pushProgram]
      //
      // On stack, before: ...
      // On stack, after: program(guid), ...
      //
      // Push a program expression onto the stack. This takes
      // a compile-time guid and converts it into a runtime-accessible
      // expression.
      pushProgram: function pushProgram(guid) {
        if (guid != null) {
          this.pushStackLiteral(this.programExpression(guid));
        } else {
          this.pushStackLiteral(null);
        }
      },
      // [registerDecorator]
      //
      // On stack, before: hash, program, params..., ...
      // On stack, after: ...
      //
      // Pops off the decorator's parameters, invokes the decorator,
      // and inserts the decorator into the decorators list.
      registerDecorator: function registerDecorator(paramSize, name) {
        var foundDecorator = this.nameLookup("decorators", name, "decorator"), options = this.setupHelperArgs(name, paramSize);
        this.decorators.push(["var decorator = ", foundDecorator, ";"]);
        this.decorators.push(['if (typeof decorator !== "function") { throw new Error(', this.quotedString('Missing decorator: "' + name + '"'), "); }"]);
        this.decorators.push(["fn = ", this.decorators.functionCall("decorator", "", ["fn", "props", "container", options]), " || fn;"]);
      },
      // [invokeHelper]
      //
      // On stack, before: hash, inverse, program, params..., ...
      // On stack, after: result of helper invocation
      //
      // Pops off the helper's parameters, invokes the helper,
      // and pushes the helper's return value onto the stack.
      //
      // If the helper is not found, `helperMissing` is called.
      invokeHelper: function invokeHelper(paramSize, name, isSimple) {
        var nonHelper = this.popStack(), helper = this.setupHelper(paramSize, name);
        var possibleFunctionCalls = [];
        if (isSimple) {
          possibleFunctionCalls.push(helper.name);
        }
        possibleFunctionCalls.push(nonHelper);
        if (!this.options.strict) {
          possibleFunctionCalls.push(this.aliasable("container.hooks.helperMissing"));
        }
        var functionLookupCode = ["(", this.itemsSeparatedBy(possibleFunctionCalls, "||"), ")"];
        var functionCall = this.source.functionCall(functionLookupCode, "call", helper.callParams);
        this.push(functionCall);
      },
      itemsSeparatedBy: function itemsSeparatedBy(items, separator) {
        var result = [];
        result.push(items[0]);
        for (var i = 1; i < items.length; i++) {
          result.push(separator, items[i]);
        }
        return result;
      },
      // [invokeKnownHelper]
      //
      // On stack, before: hash, inverse, program, params..., ...
      // On stack, after: result of helper invocation
      //
      // This operation is used when the helper is known to exist,
      // so a `helperMissing` fallback is not required.
      invokeKnownHelper: function invokeKnownHelper(paramSize, name) {
        var helper = this.setupHelper(paramSize, name);
        this.push(this.source.functionCall(helper.name, "call", helper.callParams));
      },
      // [invokeAmbiguous]
      //
      // On stack, before: hash, inverse, program, params..., ...
      // On stack, after: result of disambiguation
      //
      // This operation is used when an expression like `{{foo}}`
      // is provided, but we don't know at compile-time whether it
      // is a helper or a path.
      //
      // This operation emits more code than the other options,
      // and can be avoided by passing the `knownHelpers` and
      // `knownHelpersOnly` flags at compile-time.
      invokeAmbiguous: function invokeAmbiguous(name, helperCall) {
        this.useRegister("helper");
        var nonHelper = this.popStack();
        this.emptyHash();
        var helper = this.setupHelper(0, name, helperCall);
        var helperName = this.lastHelper = this.nameLookup("helpers", name, "helper");
        var lookup = ["(", "(helper = ", helperName, " || ", nonHelper, ")"];
        if (!this.options.strict) {
          lookup[0] = "(helper = ";
          lookup.push(" != null ? helper : ", this.aliasable("container.hooks.helperMissing"));
        }
        this.push(["(", lookup, helper.paramsInit ? ["),(", helper.paramsInit] : [], "),", "(typeof helper === ", this.aliasable('"function"'), " ? ", this.source.functionCall("helper", "call", helper.callParams), " : helper))"]);
      },
      // [invokePartial]
      //
      // On stack, before: context, ...
      // On stack after: result of partial invocation
      //
      // This operation pops off a context, invokes a partial with that context,
      // and pushes the result of the invocation back.
      invokePartial: function invokePartial(isDynamic, name, indent) {
        var params = [], options = this.setupParams(name, 1, params);
        if (isDynamic) {
          name = this.popStack();
          delete options.name;
        }
        if (indent) {
          options.indent = JSON.stringify(indent);
        }
        options.helpers = "helpers";
        options.partials = "partials";
        options.decorators = "container.decorators";
        if (!isDynamic) {
          params.unshift(this.nameLookup("partials", name, "partial"));
        } else {
          params.unshift(name);
        }
        if (this.options.compat) {
          options.depths = "depths";
        }
        options = this.objectLiteral(options);
        params.push(options);
        this.push(this.source.functionCall("container.invokePartial", "", params));
      },
      // [assignToHash]
      //
      // On stack, before: value, ..., hash, ...
      // On stack, after: ..., hash, ...
      //
      // Pops a value off the stack and assigns it to the current hash
      assignToHash: function assignToHash(key) {
        var value = this.popStack(), context = void 0, type = void 0, id = void 0;
        if (this.trackIds) {
          id = this.popStack();
        }
        if (this.stringParams) {
          type = this.popStack();
          context = this.popStack();
        }
        var hash = this.hash;
        if (context) {
          hash.contexts[key] = context;
        }
        if (type) {
          hash.types[key] = type;
        }
        if (id) {
          hash.ids[key] = id;
        }
        hash.values[key] = value;
      },
      pushId: function pushId(type, name, child) {
        if (type === "BlockParam") {
          this.pushStackLiteral("blockParams[" + name[0] + "].path[" + name[1] + "]" + (child ? " + " + JSON.stringify("." + child) : ""));
        } else if (type === "PathExpression") {
          this.pushString(name);
        } else if (type === "SubExpression") {
          this.pushStackLiteral("true");
        } else {
          this.pushStackLiteral("null");
        }
      },
      // HELPERS
      compiler: JavaScriptCompiler,
      compileChildren: function compileChildren(environment, options) {
        var children = environment.children, child = void 0, compiler = void 0;
        for (var i = 0, l = children.length; i < l; i++) {
          child = children[i];
          compiler = new this.compiler();
          var existing = this.matchExistingProgram(child);
          if (existing == null) {
            var index = this.context.programs.push("") - 1;
            child.index = index;
            child.name = "program" + index;
            this.context.programs[index] = compiler.compile(child, options, this.context, !this.precompile);
            this.context.decorators[index] = compiler.decorators;
            this.context.environments[index] = child;
            this.useDepths = this.useDepths || compiler.useDepths;
            this.useBlockParams = this.useBlockParams || compiler.useBlockParams;
            child.useDepths = this.useDepths;
            child.useBlockParams = this.useBlockParams;
          } else {
            child.index = existing.index;
            child.name = "program" + existing.index;
            this.useDepths = this.useDepths || existing.useDepths;
            this.useBlockParams = this.useBlockParams || existing.useBlockParams;
          }
        }
      },
      matchExistingProgram: function matchExistingProgram(child) {
        for (var i = 0, len = this.context.environments.length; i < len; i++) {
          var environment = this.context.environments[i];
          if (environment && environment.equals(child)) {
            return environment;
          }
        }
      },
      programExpression: function programExpression(guid) {
        var child = this.environment.children[guid], programParams = [child.index, "data", child.blockParams];
        if (this.useBlockParams || this.useDepths) {
          programParams.push("blockParams");
        }
        if (this.useDepths) {
          programParams.push("depths");
        }
        return "container.program(" + programParams.join(", ") + ")";
      },
      useRegister: function useRegister(name) {
        if (!this.registers[name]) {
          this.registers[name] = true;
          this.registers.list.push(name);
        }
      },
      push: function push(expr) {
        if (!(expr instanceof Literal)) {
          expr = this.source.wrap(expr);
        }
        this.inlineStack.push(expr);
        return expr;
      },
      pushStackLiteral: function pushStackLiteral(item) {
        this.push(new Literal(item));
      },
      pushSource: function pushSource(source) {
        if (this.pendingContent) {
          this.source.push(this.appendToBuffer(this.source.quotedString(this.pendingContent), this.pendingLocation));
          this.pendingContent = void 0;
        }
        if (source) {
          this.source.push(source);
        }
      },
      replaceStack: function replaceStack(callback) {
        var prefix = ["("], stack = void 0, createdStack = void 0, usedLiteral = void 0;
        if (!this.isInline()) {
          throw new _exception2["default"]("replaceStack on non-inline");
        }
        var top = this.popStack(true);
        if (top instanceof Literal) {
          stack = [top.value];
          prefix = ["(", stack];
          usedLiteral = true;
        } else {
          createdStack = true;
          var _name = this.incrStack();
          prefix = ["((", this.push(_name), " = ", top, ")"];
          stack = this.topStack();
        }
        var item = callback.call(this, stack);
        if (!usedLiteral) {
          this.popStack();
        }
        if (createdStack) {
          this.stackSlot--;
        }
        this.push(prefix.concat(item, ")"));
      },
      incrStack: function incrStack() {
        this.stackSlot++;
        if (this.stackSlot > this.stackVars.length) {
          this.stackVars.push("stack" + this.stackSlot);
        }
        return this.topStackName();
      },
      topStackName: function topStackName() {
        return "stack" + this.stackSlot;
      },
      flushInline: function flushInline() {
        var inlineStack = this.inlineStack;
        this.inlineStack = [];
        for (var i = 0, len = inlineStack.length; i < len; i++) {
          var entry = inlineStack[i];
          if (entry instanceof Literal) {
            this.compileStack.push(entry);
          } else {
            var stack = this.incrStack();
            this.pushSource([stack, " = ", entry, ";"]);
            this.compileStack.push(stack);
          }
        }
      },
      isInline: function isInline() {
        return this.inlineStack.length;
      },
      popStack: function popStack(wrapped) {
        var inline = this.isInline(), item = (inline ? this.inlineStack : this.compileStack).pop();
        if (!wrapped && item instanceof Literal) {
          return item.value;
        } else {
          if (!inline) {
            if (!this.stackSlot) {
              throw new _exception2["default"]("Invalid stack pop");
            }
            this.stackSlot--;
          }
          return item;
        }
      },
      topStack: function topStack() {
        var stack = this.isInline() ? this.inlineStack : this.compileStack, item = stack[stack.length - 1];
        if (item instanceof Literal) {
          return item.value;
        } else {
          return item;
        }
      },
      contextName: function contextName(context) {
        if (this.useDepths && context) {
          return "depths[" + context + "]";
        } else {
          return "depth" + context;
        }
      },
      quotedString: function quotedString(str) {
        return this.source.quotedString(str);
      },
      objectLiteral: function objectLiteral(obj) {
        return this.source.objectLiteral(obj);
      },
      aliasable: function aliasable(name) {
        var ret = this.aliases[name];
        if (ret) {
          ret.referenceCount++;
          return ret;
        }
        ret = this.aliases[name] = this.source.wrap(name);
        ret.aliasable = true;
        ret.referenceCount = 1;
        return ret;
      },
      setupHelper: function setupHelper(paramSize, name, blockHelper) {
        var params = [], paramsInit = this.setupHelperArgs(name, paramSize, params, blockHelper);
        var foundHelper = this.nameLookup("helpers", name, "helper"), callContext = this.aliasable(this.contextName(0) + " != null ? " + this.contextName(0) + " : (container.nullContext || {})");
        return {
          params,
          paramsInit,
          name: foundHelper,
          callParams: [callContext].concat(params)
        };
      },
      setupParams: function setupParams(helper, paramSize, params) {
        var options = {}, contexts = [], types = [], ids = [], objectArgs = !params, param = void 0;
        if (objectArgs) {
          params = [];
        }
        options.name = this.quotedString(helper);
        options.hash = this.popStack();
        if (this.trackIds) {
          options.hashIds = this.popStack();
        }
        if (this.stringParams) {
          options.hashTypes = this.popStack();
          options.hashContexts = this.popStack();
        }
        var inverse = this.popStack(), program = this.popStack();
        if (program || inverse) {
          options.fn = program || "container.noop";
          options.inverse = inverse || "container.noop";
        }
        var i = paramSize;
        while (i--) {
          param = this.popStack();
          params[i] = param;
          if (this.trackIds) {
            ids[i] = this.popStack();
          }
          if (this.stringParams) {
            types[i] = this.popStack();
            contexts[i] = this.popStack();
          }
        }
        if (objectArgs) {
          options.args = this.source.generateArray(params);
        }
        if (this.trackIds) {
          options.ids = this.source.generateArray(ids);
        }
        if (this.stringParams) {
          options.types = this.source.generateArray(types);
          options.contexts = this.source.generateArray(contexts);
        }
        if (this.options.data) {
          options.data = "data";
        }
        if (this.useBlockParams) {
          options.blockParams = "blockParams";
        }
        return options;
      },
      setupHelperArgs: function setupHelperArgs(helper, paramSize, params, useRegister) {
        var options = this.setupParams(helper, paramSize, params);
        options.loc = JSON.stringify(this.source.currentLocation);
        options = this.objectLiteral(options);
        if (useRegister) {
          this.useRegister("options");
          params.push("options");
          return ["options=", options];
        } else if (params) {
          params.push(options);
          return "";
        } else {
          return options;
        }
      }
    };
    (function() {
      var reservedWords = "break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield await null true false".split(" ");
      var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};
      for (var i = 0, l = reservedWords.length; i < l; i++) {
        compilerWords[reservedWords[i]] = true;
      }
    })();
    JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
      return !JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name);
    };
    function strictLookup(requireTerminal, compiler, parts, startPartIndex, type) {
      var stack = compiler.popStack(), len = parts.length;
      if (requireTerminal) {
        len--;
      }
      for (var i = startPartIndex; i < len; i++) {
        stack = compiler.nameLookup(stack, parts[i], type);
      }
      if (requireTerminal) {
        return [compiler.aliasable("container.strict"), "(", stack, ", ", compiler.quotedString(parts[len]), ", ", JSON.stringify(compiler.source.currentLocation), " )"];
      } else {
        return stack;
      }
    }
    exports2["default"] = JavaScriptCompiler;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars.js
var require_handlebars = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _handlebarsRuntime = require_handlebars_runtime();
    var _handlebarsRuntime2 = _interopRequireDefault(_handlebarsRuntime);
    var _handlebarsCompilerAst = require_ast();
    var _handlebarsCompilerAst2 = _interopRequireDefault(_handlebarsCompilerAst);
    var _handlebarsCompilerBase = require_base2();
    var _handlebarsCompilerCompiler = require_compiler();
    var _handlebarsCompilerJavascriptCompiler = require_javascript_compiler();
    var _handlebarsCompilerJavascriptCompiler2 = _interopRequireDefault(_handlebarsCompilerJavascriptCompiler);
    var _handlebarsCompilerVisitor = require_visitor();
    var _handlebarsCompilerVisitor2 = _interopRequireDefault(_handlebarsCompilerVisitor);
    var _handlebarsNoConflict = require_no_conflict();
    var _handlebarsNoConflict2 = _interopRequireDefault(_handlebarsNoConflict);
    var _create = _handlebarsRuntime2["default"].create;
    function create() {
      var hb = _create();
      hb.compile = function(input, options) {
        return _handlebarsCompilerCompiler.compile(input, options, hb);
      };
      hb.precompile = function(input, options) {
        return _handlebarsCompilerCompiler.precompile(input, options, hb);
      };
      hb.AST = _handlebarsCompilerAst2["default"];
      hb.Compiler = _handlebarsCompilerCompiler.Compiler;
      hb.JavaScriptCompiler = _handlebarsCompilerJavascriptCompiler2["default"];
      hb.Parser = _handlebarsCompilerBase.parser;
      hb.parse = _handlebarsCompilerBase.parse;
      hb.parseWithoutProcessing = _handlebarsCompilerBase.parseWithoutProcessing;
      return hb;
    }
    var inst = create();
    inst.create = create;
    _handlebarsNoConflict2["default"](inst);
    inst.Visitor = _handlebarsCompilerVisitor2["default"];
    inst["default"] = inst;
    exports2["default"] = inst;
    module2.exports = exports2["default"];
  }
});

// node_modules/handlebars/dist/cjs/handlebars/compiler/printer.js
var require_printer = __commonJS({
  "node_modules/handlebars/dist/cjs/handlebars/compiler/printer.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.print = print;
    exports2.PrintVisitor = PrintVisitor;
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _visitor = require_visitor();
    var _visitor2 = _interopRequireDefault(_visitor);
    function print(ast) {
      return new PrintVisitor().accept(ast);
    }
    function PrintVisitor() {
      this.padding = 0;
    }
    PrintVisitor.prototype = new _visitor2["default"]();
    PrintVisitor.prototype.pad = function(string) {
      var out = "";
      for (var i = 0, l = this.padding; i < l; i++) {
        out += "  ";
      }
      out += string + "\n";
      return out;
    };
    PrintVisitor.prototype.Program = function(program) {
      var out = "", body = program.body, i = void 0, l = void 0;
      if (program.blockParams) {
        var blockParams = "BLOCK PARAMS: [";
        for (i = 0, l = program.blockParams.length; i < l; i++) {
          blockParams += " " + program.blockParams[i];
        }
        blockParams += " ]";
        out += this.pad(blockParams);
      }
      for (i = 0, l = body.length; i < l; i++) {
        out += this.accept(body[i]);
      }
      this.padding--;
      return out;
    };
    PrintVisitor.prototype.MustacheStatement = function(mustache) {
      return this.pad("{{ " + this.SubExpression(mustache) + " }}");
    };
    PrintVisitor.prototype.Decorator = function(mustache) {
      return this.pad("{{ DIRECTIVE " + this.SubExpression(mustache) + " }}");
    };
    PrintVisitor.prototype.BlockStatement = PrintVisitor.prototype.DecoratorBlock = function(block) {
      var out = "";
      out += this.pad((block.type === "DecoratorBlock" ? "DIRECTIVE " : "") + "BLOCK:");
      this.padding++;
      out += this.pad(this.SubExpression(block));
      if (block.program) {
        out += this.pad("PROGRAM:");
        this.padding++;
        out += this.accept(block.program);
        this.padding--;
      }
      if (block.inverse) {
        if (block.program) {
          this.padding++;
        }
        out += this.pad("{{^}}");
        this.padding++;
        out += this.accept(block.inverse);
        this.padding--;
        if (block.program) {
          this.padding--;
        }
      }
      this.padding--;
      return out;
    };
    PrintVisitor.prototype.PartialStatement = function(partial) {
      var content = "PARTIAL:" + partial.name.original;
      if (partial.params[0]) {
        content += " " + this.accept(partial.params[0]);
      }
      if (partial.hash) {
        content += " " + this.accept(partial.hash);
      }
      return this.pad("{{> " + content + " }}");
    };
    PrintVisitor.prototype.PartialBlockStatement = function(partial) {
      var content = "PARTIAL BLOCK:" + partial.name.original;
      if (partial.params[0]) {
        content += " " + this.accept(partial.params[0]);
      }
      if (partial.hash) {
        content += " " + this.accept(partial.hash);
      }
      content += " " + this.pad("PROGRAM:");
      this.padding++;
      content += this.accept(partial.program);
      this.padding--;
      return this.pad("{{> " + content + " }}");
    };
    PrintVisitor.prototype.ContentStatement = function(content) {
      return this.pad("CONTENT[ '" + content.value + "' ]");
    };
    PrintVisitor.prototype.CommentStatement = function(comment) {
      return this.pad("{{! '" + comment.value + "' }}");
    };
    PrintVisitor.prototype.SubExpression = function(sexpr) {
      var params = sexpr.params, paramStrings = [], hash = void 0;
      for (var i = 0, l = params.length; i < l; i++) {
        paramStrings.push(this.accept(params[i]));
      }
      params = "[" + paramStrings.join(", ") + "]";
      hash = sexpr.hash ? " " + this.accept(sexpr.hash) : "";
      return this.accept(sexpr.path) + " " + params + hash;
    };
    PrintVisitor.prototype.PathExpression = function(id) {
      var path = id.parts.join("/");
      return (id.data ? "@" : "") + "PATH:" + path;
    };
    PrintVisitor.prototype.StringLiteral = function(string) {
      return '"' + string.value + '"';
    };
    PrintVisitor.prototype.NumberLiteral = function(number) {
      return "NUMBER{" + number.value + "}";
    };
    PrintVisitor.prototype.BooleanLiteral = function(bool) {
      return "BOOLEAN{" + bool.value + "}";
    };
    PrintVisitor.prototype.UndefinedLiteral = function() {
      return "UNDEFINED";
    };
    PrintVisitor.prototype.NullLiteral = function() {
      return "NULL";
    };
    PrintVisitor.prototype.Hash = function(hash) {
      var pairs = hash.pairs, joinedPairs = [];
      for (var i = 0, l = pairs.length; i < l; i++) {
        joinedPairs.push(this.accept(pairs[i]));
      }
      return "HASH{" + joinedPairs.join(", ") + "}";
    };
    PrintVisitor.prototype.HashPair = function(pair) {
      return pair.key + "=" + this.accept(pair.value);
    };
  }
});

// node_modules/handlebars/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/handlebars/lib/index.js"(exports2, module2) {
    var handlebars = require_handlebars()["default"];
    var printer = require_printer();
    handlebars.PrintVisitor = printer.PrintVisitor;
    handlebars.print = printer.print;
    module2.exports = handlebars;
    function extension(module3, filename) {
      var fs = require("fs");
      var templateString = fs.readFileSync(filename, "utf8");
      module3.exports = handlebars.compile(templateString);
    }
    if (typeof require !== "undefined" && require.extensions) {
      require.extensions[".handlebars"] = extension;
      require.extensions[".hbs"] = extension;
    }
  }
});

// services/notification/index.ts
var index_exports = {};
__export(index_exports, {
  campaignHandler: () => campaignHandler,
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);

// services/notification/src/infrastructure/providers/email/sesEmailProvider.ts
var import_client_sesv2 = require("@aws-sdk/client-sesv2");
var import_aws_xray_sdk_core = __toESM(require_lib());
var SesEmailProvider = class {
  constructor(fromEmail, client = import_aws_xray_sdk_core.default.captureAWSv3Client(new import_client_sesv2.SESv2Client({}))) {
    this.fromEmail = fromEmail;
    this.client = client;
  }
  fromEmail;
  client;
  async send(message) {
    const isMockMode = !this.fromEmail || this.fromEmail.includes("example.com");
    if (isMockMode) {
      console.warn(`[SES MOCK MODE] SES_FROM_EMAIL is set to default unverified domain: "${this.fromEmail}". Skipping SES send.`);
      console.log(`[MOCK EMAIL LOG]
=========================================
TO: ${message.to}
FROM: ${this.fromEmail}
SUBJECT: ${message.subject}
TEXT: ${message.text}
HTML: ${message.html}
=========================================`);
      return "SKIPPED";
    }
    try {
      await this.client.send(
        new import_client_sesv2.SendEmailCommand({
          FromEmailAddress: this.fromEmail,
          Destination: { ToAddresses: [message.to] },
          Content: {
            Simple: {
              Subject: { Data: message.subject, Charset: "UTF-8" },
              Body: {
                Html: { Data: message.html, Charset: "UTF-8" },
                Text: { Data: message.text, Charset: "UTF-8" }
              }
            }
          }
        })
      );
      return "SENT";
    } catch (err) {
      const isVerificationError = err.name === "MessageRejected" || err.message?.includes("Email address is not verified") || err.message?.includes("not verified");
      if (isVerificationError) {
        console.error(
          `[SES SANDBOX WARNING] Failed to send email to ${message.to} from ${this.fromEmail} because of AWS SES Sandbox email verification restrictions:`,
          err
        );
        console.log(`[MOCK EMAIL FALLBACK LOG]
=========================================
TO: ${message.to}
FROM: ${this.fromEmail}
SUBJECT: ${message.subject}
TEXT: ${message.text}
=========================================`);
        return "SKIPPED";
      }
      throw err;
    }
  }
};

// services/notification/src/infrastructure/providers/sms/snsSmsProvider.ts
var import_client_sns = require("@aws-sdk/client-sns");
var import_aws_xray_sdk_core2 = __toESM(require_lib());
var SnsSmsProvider = class {
  constructor(client = import_aws_xray_sdk_core2.default.captureAWSv3Client(new import_client_sns.SNSClient({}))) {
    this.client = client;
  }
  client;
  async send(message) {
    await this.client.send(
      new import_client_sns.PublishCommand({
        PhoneNumber: message.to,
        Message: message.body,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Transactional"
          }
        }
      })
    );
  }
};

// services/notification/src/infrastructure/templates/templateRenderer.ts
var import_handlebars = __toESM(require_lib2());

// services/notification/src/infrastructure/templates/templateSource.ts
var emailTemplates = {
  "order-placed": {
    subject: "\u0110\xE3 nh\u1EADn \u0111\u01A1n h\xE0ng #{{orderId}} - Music Instrument Store",
    html: "<h2>\u0110\u01A1n h\xE0ng c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c ghi nh\u1EADn</h2><p>M\xE3 \u0111\u01A1n: <strong>#{{orderId}}</strong></p><p>T\u1ED5ng thanh to\xE1n: <strong>{{amount}}\u0111</strong></p>",
    text: "\u0110\u01A1n h\xE0ng #{{orderId}} \u0111\xE3 \u0111\u01B0\u1EE3c ghi nh\u1EADn. T\u1ED5ng thanh to\xE1n: {{amount}}\u0111."
  },
  "order-confirmation": {
    subject: "X\xE1c nh\u1EADn thanh to\xE1n \u0111\u01A1n h\xE0ng #{{orderId}}",
    html: "<h2>Thanh to\xE1n th\xE0nh c\xF4ng!</h2><p>\u0110\u01A1n h\xE0ng <strong>#{{orderId}}</strong> \u0111\xE3 thanh to\xE1n {{amount}}\u0111.</p><p>Ch\xFAng t\xF4i s\u1EBD chu\u1EA9n b\u1ECB h\xE0ng v\xE0 giao s\u1EDBm nh\u1EA5t.</p>",
    text: "\u0110\u01A1n h\xE0ng #{{orderId}} \u0111\xE3 thanh to\xE1n th\xE0nh c\xF4ng. S\u1ED1 ti\u1EC1n: {{amount}}\u0111."
  },
  "order-cancelled": {
    subject: "\u0110\u01A1n h\xE0ng #{{orderId}} \u0111\xE3 b\u1ECB h\u1EE7y",
    html: "<h2>\u0110\u01A1n h\xE0ng c\u1EE7a b\u1EA1n \u0111\xE3 b\u1ECB h\u1EE7y</h2><p>M\xE3 \u0111\u01A1n: <strong>#{{orderId}}</strong></p><p>L\xFD do: {{reason}}</p>",
    text: "\u0110\u01A1n h\xE0ng #{{orderId}} \u0111\xE3 b\u1ECB h\u1EE7y. L\xFD do: {{reason}}"
  }
};
var smsTemplates = {
  "order-cancelled": "[Music Store] Don hang #{{orderId}} da bi huy. Ly do: {{reason}}"
};

// services/notification/src/infrastructure/templates/templateRenderer.ts
var HandlebarsTemplateRenderer = class {
  renderEmail(templateName, data) {
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Unknown email template: ${templateName}`);
    }
    return {
      subject: import_handlebars.default.compile(template.subject)(data),
      html: import_handlebars.default.compile(template.html)(data),
      text: import_handlebars.default.compile(template.text)(data)
    };
  }
  renderSms(templateName, data) {
    const template = smsTemplates[templateName];
    if (!template) {
      throw new Error(`Unknown sms template: ${templateName}`);
    }
    return import_handlebars.default.compile(template)(data);
  }
};

// services/notification/src/infrastructure/repository/notificationLogRepository.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var import_aws_xray_sdk_core3 = __toESM(require_lib());
var THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;
var DynamoNotificationLogRepository = class {
  constructor(tableName, client = import_lib_dynamodb.DynamoDBDocumentClient.from(
    import_aws_xray_sdk_core3.default.captureAWSv3Client(new import_client_dynamodb.DynamoDBClient({}))
  )) {
    this.tableName = tableName;
    this.client = client;
  }
  tableName;
  client;
  async markProcessedIfNew(eventId, consumer) {
    try {
      await this.client.send(
        new import_lib_dynamodb.PutCommand({
          TableName: this.tableName,
          Item: {
            PK: `EVENT#${eventId}`,
            SK: "PROCESSED",
            consumer,
            processedAt: (/* @__PURE__ */ new Date()).toISOString(),
            ttl: Math.floor(Date.now() / 1e3) + THIRTY_DAYS_IN_SECONDS
          },
          ConditionExpression: "attribute_not_exists(PK)"
        })
      );
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
        return false;
      }
      throw err;
    }
  }
};

// services/notification/src/application/use-cases/sendOrderPlaced.usecase.ts
async function sendOrderPlaced(detail, deps2) {
  const email = detail.email;
  if (!email) {
    console.warn(`[Notification] OrderPlaced cho \u0111\u01A1n ${detail.orderId} thi\u1EBFu email kh\xE1ch h\xE0ng, b\u1ECF qua g\u1EEDi.`);
    return;
  }
  const rendered = deps2.templateRenderer.renderEmail("order-placed", {
    orderId: detail.orderId,
    amount: Number(detail.totalPrice || 0).toLocaleString("vi-VN")
  });
  await deps2.emailProvider.send({ to: email, ...rendered });
}

// services/notification/src/application/use-cases/sendOrderCancellation.usecase.ts
async function sendOrderCancellation(detail, deps2) {
  const email = detail.email;
  const phone = detail.customer?.phone;
  const data = {
    orderId: detail.orderId,
    reason: detail.reason || "Kh\xF4ng c\xF3 l\xFD do c\u1EE5 th\u1EC3"
  };
  if (email) {
    const rendered = deps2.templateRenderer.renderEmail("order-cancelled", data);
    await deps2.emailProvider.send({ to: email, ...rendered });
  }
  if (phone) {
    const body = deps2.templateRenderer.renderSms("order-cancelled", data);
    await deps2.smsProvider.send({ to: phone, body });
  }
  if (!email && !phone) {
    console.warn(`[Notification] OrderCancelled cho \u0111\u01A1n ${detail.orderId} thi\u1EBFu c\u1EA3 email l\u1EABn phone, b\u1ECF qua g\u1EEDi.`);
  }
}

// services/notification/src/application/use-cases/sendOrderConfirmation.usecase.ts
async function sendOrderConfirmation(detail, deps2) {
  const orderId = detail.metadata?.orderId || detail.id;
  const email = detail.email;
  if (!email) {
    console.warn(`[Notification] PaymentSucceeded cho \u0111\u01A1n ${orderId} thi\u1EBFu email kh\xE1ch h\xE0ng, b\u1ECF qua g\u1EEDi.`);
    return;
  }
  const rendered = deps2.templateRenderer.renderEmail("order-confirmation", {
    orderId,
    amount: Number(detail.amount || 0).toLocaleString("vi-VN")
  });
  await deps2.emailProvider.send({ to: email, ...rendered });
}

// services/notification/src/application/dispatcher.ts
var CONSUMER_NAME = "notification-service";
async function dispatchEvent(eventId, detailType, detail, deps2) {
  const isNew = await deps2.logRepository.markProcessedIfNew(eventId, CONSUMER_NAME);
  if (!isNew) {
    console.log(`[Notification] Event ${eventId} \u0111\xE3 \u0111\u01B0\u1EE3c x\u1EED l\xFD tr\u01B0\u1EDBc \u0111\xF3, b\u1ECF qua (idempotent).`);
    return;
  }
  switch (detailType) {
    case "OrderPlaced":
      await sendOrderPlaced(detail, deps2);
      break;
    case "OrderCancelled":
      await sendOrderCancellation(detail, deps2);
      break;
    case "PaymentSucceeded":
      await sendOrderConfirmation(detail, deps2);
      break;
    case "OrderUpdated":
      console.log(`[Notification] OrderUpdated (status=${detail.status}) ch\u01B0a c\xF3 template ri\xEAng, b\u1ECF qua.`);
      break;
    default:
      console.warn(`[Notification] Kh\xF4ng r\xF5 lo\u1EA1i event: ${detailType}`);
  }
}

// services/notification/src/config/env.ts
var env = {
  tableName: process.env.TABLE_NAME,
  sesFromEmail: process.env.SES_FROM_EMAIL || "no-reply@musicstore.example.com"
};

// services/notification/src/handlers/sqsConsumerHandler.ts
var deps;
function getDeps() {
  if (!deps) {
    if (!env.tableName) {
      throw new Error("TABLE_NAME env var is required for notification idempotency log");
    }
    deps = {
      emailProvider: new SesEmailProvider(env.sesFromEmail),
      smsProvider: new SnsSmsProvider(),
      templateRenderer: new HandlebarsTemplateRenderer(),
      logRepository: new DynamoNotificationLogRepository(env.tableName)
    };
  }
  return deps;
}
async function handleSqsEvent(event) {
  console.log(`[Notification Service] Processing SQS batch of ${event.Records.length} records...`);
  for (const record of event.Records) {
    const payload = JSON.parse(record.body);
    const detailType = payload["detail-type"] || "Unknown";
    const detail = payload.detail || payload;
    const eventId = detail.eventId || record.messageId;
    try {
      await dispatchEvent(eventId, detailType, detail, getDeps());
    } catch (err) {
      console.error(`[Notification Service] Failed to process record ${record.messageId} (${detailType})`, err);
      throw err;
    }
  }
}

// services/notification/src/handlers/apiHandler.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
  "Content-Type": "application/json"
};
var jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});
var emailProvider = new SesEmailProvider(env.sesFromEmail);
var smsProvider = new SnsSmsProvider();
async function handleApiEvent(event) {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(204, {});
  }
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { message: "Method Not Allowed" });
  }
  if (!event.body) {
    return jsonResponse(400, { message: "Missing request body" });
  }
  try {
    const { type, recipient, message, title } = JSON.parse(event.body);
    if (!recipient || !message) {
      return jsonResponse(400, { message: "Missing recipient or message" });
    }
    if (type === "SMS") {
      await smsProvider.send({ to: recipient, body: message });
    } else {
      const deliveryStatus = await emailProvider.send({
        to: recipient,
        subject: title || "Music Instrument Store Notification",
        html: `<p>${message}</p>`,
        text: message
      });
      if (deliveryStatus !== "SENT") {
        return jsonResponse(502, {
          message: "Email was not delivered: SES is not configured or the recipient is not verified",
          recipient,
          type: "EMAIL",
          status: deliveryStatus
        });
      }
    }
    return jsonResponse(200, {
      message: "Notification sent",
      recipient,
      type: type || "EMAIL",
      status: "SENT"
    });
  } catch (error) {
    console.error("Notification handler failed", error);
    return jsonResponse(500, {
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// services/notification/src/application/use-cases/sendCampaignMessage.usecase.ts
async function sendCampaignMessage(payload, deps2) {
  const { title, message, channel, recipient } = payload;
  if ((channel === "EMAIL" || channel === "BOTH") && recipient.email) {
    await deps2.emailProvider.send({
      to: recipient.email,
      subject: title,
      html: `<p>${message}</p>`,
      text: message
    });
  }
  if ((channel === "SMS" || channel === "BOTH") && recipient.phone) {
    await deps2.smsProvider.send({ to: recipient.phone, body: `${title}: ${message}` });
  }
}

// services/notification/src/handlers/campaignConsumerHandler.ts
var emailProvider2 = new SesEmailProvider(env.sesFromEmail);
var smsProvider2 = new SnsSmsProvider();
var logRepository = env.tableName ? new DynamoNotificationLogRepository(env.tableName) : void 0;
async function handleCampaignSqsEvent(event) {
  console.log(`[Campaign Sender] Processing batch of ${event.Records.length} messages...`);
  for (const record of event.Records) {
    const payload = JSON.parse(record.body);
    const recipientKey = payload.recipient?.email || payload.recipient?.phone || record.messageId;
    const eventId = `${payload.campaignId}:${recipientKey}`;
    try {
      if (logRepository) {
        const isNew = await logRepository.markProcessedIfNew(eventId, "campaign-sender");
        if (!isNew) {
          console.log(`[Campaign Sender] ${eventId} \u0111\xE3 g\u1EEDi tr\u01B0\u1EDBc \u0111\xF3, b\u1ECF qua (idempotent).`);
          continue;
        }
      }
      await sendCampaignMessage(payload, { emailProvider: emailProvider2, smsProvider: smsProvider2 });
    } catch (err) {
      console.error(`[Campaign Sender] Failed to process record ${record.messageId}`, err);
      throw err;
    }
  }
}

// services/notification/index.ts
var handler = async (event) => {
  if (event.Records && Array.isArray(event.Records)) {
    return handleSqsEvent(event);
  }
  return handleApiEvent(event);
};
var campaignHandler = async (event) => handleCampaignSqsEvent(event);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  campaignHandler,
  handler
});
