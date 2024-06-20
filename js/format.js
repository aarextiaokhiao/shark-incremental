var E = x => new Decimal(x);

const EINF = Decimal.dInf
const SUBSCRIPT_NUMBERS = "₀₁₂₃₄₅₆₇₈₉";
const SUPERSCRIPT_NUMBERS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

const FORMATS = {
	sc(ex, acc) {
		if (ex.lt(1e6)) return formatShort(ex, acc)
		else if (ex.gte("eeee10")) return formatTetrate(ex)

		var e = ex.log10().floor(), a = E(4).sub(e.log10().floor())
		return (a.lt(0)?'':ex.div(Decimal.pow10(e)).toFixed(a))+'e'+format(e, 0)
	},
	mixed_sc: (ex, acc) => FORMATS[ex.gte(1e6) && ex.lt(1e15) ? "st" : "sc"](ex,acc),
	st(ex, acc) {
		if (ex.lt(1e3)) return formatShort(ex, acc)
		ex = ex.div(1e3)

		var m1, m2, p, e3 = ex.log(1e3).floor()
		p = e3.max(1).log10().floor().toNumber() - 1
		m2 = ex.div(E(1e3).pow(e3.sub(1))).toNumber()
		m1 = Math.floor(m2 / 1e3)
		p += Math.floor(Math.log10(m1))
		m2 = Math.floor((m2 % 1e3) / 10**p) * 10**p
		ex = e3.toNumber()

		var pre = ["K", "M", "B", "T"][ex]
		return (m1 + m2 / 1e3).toFixed(Math.min(3 - p, 3)) + " " + pre
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
    ex = E(ex), neg = ex.lt(0)?"-":""
    if (neg) ex = ex.negate()
    if (ex.lt(10**-acc)) return (0).toFixed(acc)
    if (ex.mag == Infinity) return neg + 'Infinite'
    if (Number.isNaN(ex.mag)) return neg + 'NaN'

	let f = FORMATS[type] ?? FORMATS.mixed_sc
    return neg + f(ex, acc)
}

function formatShort(ex, acc = 0) {
	var a = Math.max(acc - Math.max(ex.log10().floor().toNumber(), 0), 0)
	return a>0?ex.toFixed(a):ex.toFixed(a).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

const DT = Decimal.tetrate(10,6)

function formatGain(a,e) {
    const g = Decimal.add(a,e.div(FPS))

    if (g.neq(a)) {
        if (a.gte(DT)) {
            var oom = E(g).slog(10).sub(E(a).slog(10)).mul(FPS)
            if (oom.gte(1e-3)) return "(+" + oom.format() + " OoMs^^2/s)"
        }

        if (a.gte('ee100')) {
            var tower = Math.floor(E(a).slog(10).toNumber() - 1.3010299956639813);
    
            var oom = E(g).iteratedlog(10,tower).sub(E(a).iteratedlog(10,tower)).mul(FPS), rated = false;
    
            if (oom.gte(1)) rated = true
            else if (tower > 2) {
                tower--
                oom = E(g).iteratedlog(10,tower).sub(E(a).iteratedlog(10,tower)).mul(FPS)
                if (oom.gte(1)) rated = true
            }
    
            if (rated) return "(+" + oom.format() + " OoMs^"+tower+"/s)"
        }
    
        if (a.gte(1e100)) {
            const oom = g.div(a).log10().mul(FPS)
            if (oom.gte(1)) return "(+" + oom.format() + " OoMs/s)"
        }
    }

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