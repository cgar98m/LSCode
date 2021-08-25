//Errors
const ERROR_LANG = "Could not load language, please refresh webpage. Contact admin if this error persists";

const ERROR_NO_CODE = "[Error] No code was found";

const ERROR_GENERIC = "[{0}] {1}";

const ERROR_PARSE = "[{0}] {1}";
const ERROR_UNEXPECTED_TOKEN = "Expected {0} instead of \"{1}\" in line {2}, col {3}";
const ERROR_EXPECTED_TOKEN = "Expected {0} after \"{1}\" in line {2}, col {3}";

const ERROR_SYS_FUNC_REDEFINE = "System function \"{0}\" re-defined in line {1}, col {2}";
const ERROR_FUNC_REDEFINE = "Function \"{0}\" re-defined in line {1}, col {2}";
const ERROR_VAR_REDEFINE = "Var \"{0}\" re-defined in line {1}, col {2}";
const ERROR_VAR_AMOUNT_MISSMATCH = "Different var amounts between assigns in line {0}, col {1}";
const ERROR_UNDEFINED_VAR = "Access to undefined var \"{0}\" in line {1}, col {2}";
const ERROR_UNDEFINED_FUNC = "Call to undefined function \"{0}\" in line {1}, col {2}";
const ERROR_RETURN_AMOUNT_MISSMATCH = "Return total arguments missmatch in function \"{0}\"";
const ERROR_RETURN_TYPE_MISSMATCH = "Return type missmatch in function \"{0}\", return value {1}";
const ERROR_EXP_MISSMATCH = "Expression type/arguments missmatch in line {0}, col {1}";
const ERROR_EXP_CALL_NULL = "Null return function \"{0}\" used on expression in line {1}, col {2}";
const ERROR_EXP_NULL_VAR = "Undefined var \"{0}\" type used on expression in line {1}, col {2}";
const ERROR_CALL_ARG_AMOUNT_MISSMATCH = "Function call \"{0}\" total arguments missmatch in line {1}, col {2}";
const ERROR_CALL_ARG_TYPE_MISSMATCH = "Function call \"{0}\" type missmatch in line {1}, col {2}, param {3}";
const ERROR_ASSIGN_AMOUNT_MISSMATCH = "Var assign total arguments missmatch in line {0}, col {1}";
const ERROR_ASSIGN_TYPE_MISSMATCH = "Var assign type missmatch in line {0}, col {1}, var {2}";
const ERROR_FORK_ARG_AMOUNT_MISSMATCH = "If condition arguments amount missmatch in line {0}, col {1}";
const ERROR_FORK_ARG_TYPE_MISSMATCH = "If condition type missmatch in line {0}, col {1}";
const ERROR_LOOP_ARG_AMOUNT_MISSMATCH = "Loop condition arguments amount missmatch in line {0}, col {1}";
const ERROR_LOOP_ARG_TYPE_MISSMATCH = "Loop condition type missmatch in line {0}, col {1}";

const ERROR_ENDLESS_LOOP = "[Error] Endless loop in line {0}, col {1}";
const ERROR_LONG_LOOP = "[Error] Too long loop in line {0}, col {1} - It may be an endless loop";
const ERROR_ZERO_DIV = "[Error] Division by 0 in line {0}, col {1}";
const ERROR_STACK_OV = "[Error] Stack overflow - Check for endless loops/recurssion";
const ERROR_UNDEFINED = "[Error] Undefined error";

//Warnings
const WARN_UNDEFINED_TOKEN = "Undefined token \"{0}\" in line {1}, col {2} - Program may not work as expected";

const WARN_VAR_REDEFINE = "Var \"{0}\" re-defined in sub-context in line {1}, col {2} - Program may not work as expected";
const WARN_IMPLICIT_VAR_DEFINE = "Var \"{0}\" implicit definition in line {1}, col {2} - Program may not work as expected";

const WARN_ENDLESS_LOOP = "[Warning] Endless loop in line {0}, col {1}";

//Messages
const MSG_NO_CRIT_ERR = "[Info] No critical errors found";

const MSG_TOKEN = "{0}: {1}";

const MSG_TREE = "TREE {0}"
const MSG_SLASH_CONCAT = "{0} / {1}";
const MSG_QUOTED_WORD = "\"{0}\"";

const MSG_BIG_OH = "\u004F({0})";
const MSG_BIG_OMEGA = "\u03A9({0})";
const MSG_BIG_THETA = "\u03B8({0})";
const MSG_COST_CONST = "1";
const MSG_COST_LOG = "log({0})";
const MSG_COST_EXP = "{0} ^ {1}";
const MSG_COST_MULT = "{0} * {1}";
const MSG_COST_MAX = "max({0}, {1})";
const MSG_COST_MIN = "min({0}, {1})";

const MSG_CODE = "CODE";
const MSG_FUNCS = "FUNCTIONS";
const MSG_CONTEXT = "context";
const MSG_LOOP_CONTENT = "loopCode";
const MSG_FUNC_CONTENT = "funcCode";
const MSG_CONDITION = "condition";
const MSG_CASE = "case {0}";
const MSG_PARAMS = "params";
const MSG_PARAM = "param {0}";
const MSG_VARS = "vars";
const MSG_VAR = "var";
const MSG_VAR_INFO = "{0}: {1}";
const MSG_RETURN_TYPE = "returnTypes";
const MSG_RETURN_DATA = "returnData";
const MSG_EXPRESSIONS = "expressions";
const MSG_EXPRESSION = "expression {0}";
const MSG_POSITION = "position {0}";
const MSG_CONST = "const";
const MSG_CALL = "funcCall";

//Auxiliars
const LINE_BREAK = "\n";
const BLANKSPACE_HTML = "&nbsp";
const BACK_SLASH = "\\";
const INFINITE = "\u221e";
const CLASS = ".{0}";
const EMPTY = "";

//sprintf in js
String.prototype.format = function() {
	let formatted = this;
	for(let i = 0; i < arguments.length; i++) {
		let regexp = new RegExp("\\{" + i + "\\}", GLOBAL_REGEXP + CASE_INSENSITIVE_REGEXP);
		formatted = formatted.replace(regexp, arguments[i]);
	}
	return formatted;
}
