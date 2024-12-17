var E = x => new Decimal(x);

const EINF = Decimal.dInf
const SUBSCRIPT_NUMBERS = "₀₁₂₃₄₅₆₇₈₉";
const SUPERSCRIPT_NUMBERS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

const FORMATS = {
	sc(ex, acc) {
		var e = ex.log10().floor(), a = 4 - e.e
		return (a < 0 ? '' : ex.m.toFixed(Math.min(a, 3)))+'e'+format(e, 0)
	},
	mixed_sc: (ex, acc) => FORMATS[ex.gte(1e6) && ex.lt(1e36) ? "st" : "sc"](ex,acc),
	st(ex, acc) {
		ex = ex.toNumber()

		var e = Math.floor(Math.log10(ex))
		var e3 = Math.floor(e / 3)
		var p = 3 - e % 3
		var m = Math.floor(ex * 10 ** (p - e3 * 3)) / 10 ** p

		return m.toFixed(p) +
			(e3 ? " " + ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"][e3 - 1] : "")
	},
}

function toSubscript(value) {
    return value.toFixed(0).split("")
      .map((x) => x === "-" ? "₋" : SUBSCRIPT_NUMBERS[parseInt(x, 10)])
      .join("");
}

function toSuperscript(value) {
    return value.toFixed(0).split("")
      .map((x) => x === "-" ? "₋" : SUPERSCRIPT_NUMBERS[parseInt(x, 10)])
      .join("");
}

function format(ex, acc=2, type=options.notation) {
    ex = E(ex)

	// Negatives
	var neg = ex.lt(0)?"-":""
    if (neg) ex = ex.negate()

	// Special cases
    if (Number.isNaN(ex.mag)) return 'NaN'
    if (ex.mag == 1/0) return '∞'
    if (ex.lt(10**-acc)) return (0).toFixed(acc)
	if (ex.lt(1e6)) return formatShort(ex, acc)

	// Big values
	let f = FORMATS[type] ?? FORMATS.mixed_sc
    return neg + f(ex, acc)
}

function formatShort(ex, acc = 0) {
	var a = Math.max(acc - Math.max(ex.e, 0), 0)
	return a > 0 ? ex.toFixed(a) : ex.toFixed(a).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

function formatGain(a,e) {
    return "(" + (e.lt(0) ? "" : "+") + format(e) + "/s)"
}

function formatTime(ex,acc=0,type="s") {
  ex = E(ex)
  if (ex.mag == Infinity) return 'Forever'
  if (ex.gte(31536000)) {
    return format(ex.div(31536000).floor(),0)+"y"+(ex.div(31536000).gte(1e9) ? "" : " " + formatTime(ex.mod(31536000),acc,'y'))
  }
  if (ex.gte(86400)) {
    var n = ex.div(86400).floor()
    return (n.gt(0) || type == "d"?format(ex.div(86400).floor(),0)+"d ":"")+formatTime(ex.mod(86400),acc,'d')
  }
  if (ex.gte(3600)) {
    var n = ex.div(3600).floor()
    return (n.gt(0) || type == "h"?format(ex.div(3600).floor(),0)+"h ":"")+formatTime(ex.mod(3600),acc,'h')
  }
  if (ex.gte(60)) {
    var n = ex.div(60).floor()
    return (n.gt(0) || type == "m"?format(n,0)+"m ":"")+formatTime(ex.mod(60),acc,'m')
  }
  return ex.gt(0) || type == "s"?format(ex,acc)+"s":""
}

function formatReduction(ex,acc) { return format(Decimal.sub(1,ex).mul(100),acc)+"%" }

function formatPercent(ex,acc) { return format(Decimal.mul(ex,100),acc)+"%" }

function formatMult(ex,acc) { return Decimal.gte(ex,1)?"×"+format(ex,acc):"/"+format(Decimal.pow(ex,-1),acc)}

function formatPow(ex,acc) { return "^"+format(ex,acc) }

Decimal.prototype.format = function (acc, max) { return format(this.clone(), acc, max) }

Decimal.prototype.formatGain = function (gain, mass=false) { return formatGain(this.clone(), gain, mass) }