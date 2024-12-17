const SCALINGS = {
    shark_rank: {
        get amount() { return player.shark_rank },

        base: [
            [25,2,"P"],
            [1250,3,"E2"],
            [5000,3,"P"],
            [1e6,2,"ME2"],
        ],
    },
    shark_tier: {
        get amount() { return player.shark_tier },

        base: [
            [25,2,"P"],
        ],
    },
    su_m1: {
        get amount() { return player.shark_upg.m1 },

        base: [
            [15,2,"L"],
            [50,1.5,"P"],
        ],
    },
    su_m3: {
        get amount() { return player.shark_upg.m3 },

        base: [
            [10,2,"L"],
            [25,1.5,"P"],
        ],
    },
    su_m5: {
        get amount() { return player.shark_upg.m5 },

        base: [
            [10,2,"L"],
            [25,1.5,"P"],
        ],
    },
    cr_boost: {
        get amount() { return player.core.radiation.boost },

        base: [
            [10,2,"P"],
            [30,2,"P"],
            [1500,2,"ME2"],
        ],
    },
    mining_tier: {
        get amount() { return player.humanoid.mining_tier },

        base: [
            [10,1.5,"L"],
            [15,1.5,"P"],
            [100,2,"ME2"],
            [3e3,2,"P"],
            [1e5,2,"ME2"],
        ],
    },
    mining_ascend: {
        get amount() { return player.humanoid.mining_ascend },

        base: [
            [15,2,"L"],
            [25,2,"P"],
        ],
    },
    remnant_upg: {
        get amount() {
            let x = E(0)
            for (let i = 0; i < REMNANT_UPGS.length; i++) x = x.max(player.singularity.upgs[i])
            return x
        },

        base: [
            [100,1.1,"ME2"],
        ],
    },
    bh_tier: {
        get amount() { return player.singularity.bh_tier },

        base: [
            [10,2,"P"],
            [50,3,"P"],
        ],
    },
}

const PRE_HADRON_SCALINGS = ['shark_rank','su_m1','su_m3','su_m5','cr_boost','mining_tier','mining_ascend','remnant_upg','bh_tier']

function getScalingStarts(id) {
    let b = SCALINGS[id].base.map(x=>x[0])

    switch (id) {
        case "shark_rank": {
            if (hasEvolutionGoal(8)) b[0] = 30
            if (isSSObserved('venus')) b[2] *= 2
            break
        }
        case "cr_boost": {
            if (tmp.ss_difficulty) {
                let q = Decimal.add(1,spaceBaseUpgEffect('t5',0))
                b[0] = q, b[1] = q, b[2] = q
                break
            }
            b[0] = Decimal.add(b[0],researchEffect('m3',0))
            b[1] = Decimal.add(b[1],researchEffect('m3',0))
            if (isSSObserved('mercury')) for (let i = 0; i < 3; i++) b[i] = Decimal.mul(b[i],10);
            break
        }
        case "mining_tier": {
            b[2] = Decimal.add(b[2],remnantUpgEffect(11,0))
            break
        }
        case "remnant_upg": {
            if (player.hadron.starter_upgs.includes(5)) b[0] = Decimal.mul(b[0],10);
            if (hasResearch('m7')) b[0] = Decimal.add(b[0],100);
            break
        }
        case "bh_tier": {
            b[0] = Decimal.add(b[0],simpleResearchEffect('h3',0))
        }
    }

    return b
}

function getScalingPowers(id) {
    let b = SCALINGS[id].base.map(x=>x[1])

    if (PRE_HADRON_SCALINGS.includes(id)) for (let i = 0; i < b.length; i++) b[i] = Decimal.pow(b[i],getNucleobaseEffect('adenine',1));

    return b
}

function getScalingModes(id) {
    let b = SCALINGS[id].base.map(x=>x[2])

    return b
}

function getScalingExclusions(id) {
    let e = SCALINGS[id].base.map(x=>false)

    switch (id) {
        case "shark_level": {
            if (false) for (let x = 0; x < 4; x++) e[x] = true;
            break
        }
        case "shark_rank": {
            if (false) for (let x = 0; x < 3; x++) e[x] = true;
            break
        }
        case "remnant_upg": {
            e[0] = hasResearch('h7')
            break
        }
        case "cr_boost": {
            if (hasResearch('h10')) for (let x = 0; x < 3; x++) e[x] = true;
            break
        }
    }

    return e
}

Decimal.prototype.scale = function (s, p, mode, rev=false) {
    var x = this.clone()

    if (Decimal.lte(x,s)) return x

    switch (mode) {
        case 'L':
            // (x-s)*p+s
            return rev ? x.sub(s).div(p).add(s) : x.sub(s).mul(p).add(s)
        case 'P':
            // (x/s)^p*s
            return rev ? x.div(s).root(p).mul(s) : x.div(s).pow(p).mul(s)
        case 'E1':
            // p^(x-s)*s
            return rev ? x.div(s).max(1).log(p).add(s) : Decimal.pow(p,x.sub(s)).mul(s)
        case 'E2':
            // p^(x/s-1)*s, p >= 2.71828
            return rev ? x.div(s).max(1).log(p).add(1).mul(s).min(x) : Decimal.pow(p,x.div(s).sub(1)).mul(s).max(x)
        case 'ME1': {
            // p^(x-s)*x
            let ln_p = Decimal.ln(p)
            return rev ? Decimal.pow(p,s).mul(x).mul(ln_p).lambertw().div(ln_p) : Decimal.pow(p,x.sub(s)).mul(x)
        }
        case 'ME2': {
            // p^(x/s-1)*x
            let ln_p = Decimal.ln(p)
            return rev ? x.mul(p).mul(ln_p).div(s).lambertw().mul(s).div(ln_p) : Decimal.pow(p,x.div(s).sub(1)).mul(x)
        }
        case 'D': {
            // 10^((lg(x)/s)^p*s)
            let s10 = Decimal.log10(s)
            return rev ? Decimal.pow(10,x.log10().div(s10).root(p).mul(s10)) : Decimal.pow(10,x.log10().div(s10).pow(p).mul(s10))
        }
        default: {
            return x
        }
    }
}

Decimal.prototype.scaleAll = function (id, rev=false) {
    var x = this.clone(), t = tmp.scalings[id], l = t.length

    for (let i = 0; i < l; i++){
        let j = rev ? i : l - i - 1, tt = t[j]

        if (!tt[3]) x = x.scale(tt[0],tt[1],tt[2],rev);
    }

    return x
}

function updateScalingsTemp() {
    for (let x in SCALINGS) {
        let t = tmp.scalings[x]

        let s = getScalingStarts(x), m = getScalingModes(x), p = getScalingPowers(x).map((q,i) => m[i] == "E2" ? Decimal.max(q,Math.E) : q), e = getScalingExclusions(x)

        for (let i = 0; i < SCALINGS[x].base.length; i++) t[i] = [s[i],p[i],m[i],e[i]];
    }
}