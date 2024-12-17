const SHARK = {
    cost(l=player.shark_level) { return Decimal.pow(5,l) },
    bulk(x=player.fish) { return x.log(5).floor().add(1) },

    bonuses: {
        fish: [()=>player.shark_level.gte(1),l=>inExploration(1) ? E(1) : l.max(hasResearch("p3") ? E(1.2).pow(l) : E(1)),E(0)],
        pearl: [()=>player.shark_level.gt(hasResearch("p5") ? 7 : 11),l=>l.sub(hasResearch("p5") ? 7 : 11).div(200).max(0)],
        core: [()=>player.shark_level.gte(300),l=>Decimal.add(1.01,getCRBoost(4,0)).pow(l.sub(299)).overflow('ee3',0.5),E(1)],
        remnants: [()=>player.shark_level.gte(1)&&hasSMilestone(0),l=>{
            let x = l
            if (hasResearch('dm4')) x = x.mul(expPow(l.softcap('e1000',10,'log'),0.25).pow_base(2));
            return x
        },E(0)],
    },

    get ELO() {
        var x = player.shark_level

        x = x.mul(hasResearch('f7') ? Decimal.pow(2,player.humanoid.shark).sub(1) : player.humanoid.shark)

        var mult = E(0.1), exp = E(1)

        mult = mult.mul(simpleETEffect(0)).mul(simpleETEffect(1)).mul(simpleETEffect(2)).mul(simpleETEffect(3)).mul(getCRBoost(7)).mul(remnantUpgEffect(7))

        exp = exp.add(researchEffect('f1',0)).add(getPAEffect(5,0)).mul(simpleCETEffect(0)).mul(simpleCETEffect(1)).mul(simpleCETEffect(2)).mul(simpleCETEffect(3)).mul(coreReactorEffect(11))

        tmp.shark_elo_mult = mult, tmp.shark_elo_exp = exp
        return x.mul(mult).pow(exp).floor()
    },

    get ELO_calculation() {
        var h = `${lang_text("full-shark-level")} × ${hasResearch('f7') ? `(2<sup>${CURRENCIES.humanoid.costName}</sup> - 1)` : CURRENCIES.humanoid.costName} × ${tmp.shark_elo_mult.format()}`
        if (tmp.shark_elo_exp.neq(1)) h = `(${h})<sup>${tmp.shark_elo_exp.format()}</sup>`
        return `[${h}]`
    },

    rank: {
        get require() { return Decimal.pow(1.2,player.shark_rank.add(1).scaleAll("shark_rank")).sub(1).mul(500).ceil() },
        get bulk() { return tmp.shark_elo.div(500).add(1).log(1.2).scaleAll("shark_rank",true).floor() },

        bonuses: {
            fish: [()=>player.shark_rank.gte(1),l=>Decimal.pow(1.1,l),E(1)],
            prestige: [()=>player.shark_rank.gte(50),l=>Decimal.pow(hasResearch('s2') ? 1.075 : 1.05,l.sub(49)),E(1)],
            mining_damage: [()=>player.shark_rank.gte(70),l=>Decimal.pow(1.25,l.sub(69)).softcap(1e4,3,3),E(1)],
            so: [()=>player.shark_rank.gte(100),l=>Decimal.pow(1.5,l.sub(99)),E(1)],
            remnants: [()=>player.shark_rank.gte(1)&&hasSMilestone(1),l=>{
                let x = l.add(1)
                if (hasResearch('dm4')) x = x.mul(expPow(l,0.5).pow_base(4));
                return x
            },E(1)],
        },
    },

    tier: {
        get ELO() {
            var x = E(0)

            x = x.mul(player.hadron.total.add(1).log10())

            var mult = E(10), exp = E(1)

            mult = mult.mul(simpleResearchEffect('h1')).mul(simpleResearchEffect('h6'))

            exp = exp.add(getNucleobaseEffect('adenine',0,0))

            tmp.shark_iq_mult = mult, tmp.shark_iq_exp = exp

            return x.mul(mult).pow(exp).floor()
        },

        get ELO_calculation() {
            var h = `(10<sup>slog10(${lang_text("full-shark-rank")} + 1)</sup> - 1) × log10(${lang_text('total')} ${CURRENCIES.hadron.costName} + 1) × ${tmp.shark_iq_mult.format()}`
            if (tmp.shark_iq_exp.neq(1)) h = `(${h})<sup>${tmp.shark_iq_exp.format()}</sup>`
            return `[${h}]`
        },

        get require() { return player.shark_tier.add(1).scaleAll("shark_tier").sumBase(1.1).mul(10).add(50).ceil() },
        get bulk() { return tmp.shark_iq.sub(50).div(10).max(0).sumBase(1.1,true).scaleAll("shark_tier",true).floor() },

        bonuses: {
            fish: [()=>player.shark_tier.gte(1),l=>Decimal.pow(1.1,l),E(1),x=>formatPow(x)],
            hadron: [()=>player.shark_tier.gte(1),l=>Decimal.pow(1.05,l),E(1),x=>formatMult(x)],
            prestige: [()=>player.shark_tier.gte(50),l=>Decimal.pow(1.1,l.sub(49)),E(1),x=>formatPow(x)],
            nucleobase: [()=>player.shark_tier.gte(75),l=>Decimal.pow(1.1,l.sub(99).pow(.75)).mul(l.sub(99)),E(1),x=>formatMult(x)],
        },
    },
}

const SHARK_UPGRADES = {
    s1: {
        req: ()=>player.shark_level.gte(3),

        cost: l => Decimal.pow(3,l).mul(25),
        bulk: x => x.div(25).log(3).floor().add(1),

        curr: "fish",

        effect: l=>l.add(1),
        effDesc: x=>formatMult(x,0),
    },
    s2: {
        unl: ()=>!inExploration(0),
        req: ()=>player.shark_level.gte(4),

        cost: l => Decimal.pow(2,l).mul(200),
        bulk: x => x.div(200).log(2).floor().add(1),

        curr: "fish",

        effect: l=>l.mul(2),
        effDesc: x=>`+${formatTime(x,0)} worth of fish`,
    },
    s3: {
        unl: ()=>!inExploration(3),
        req: ()=>player.shark_level.gte(5),

        cost: l => Decimal.pow(2,l).mul(2e3),
        bulk: x => x.div(2e3).log(2).floor().add(1),

        curr: "fish",

        effect: l=>{
			let kg = l.add(2).mul(5)
			if (hasDepthMilestone(0,3)) kg = kg.add(player.shark_upg.p2)

			let max = E(30).add(sharkUpgEffect('p2', 0)).add(sharkUpgEffect('p3', 0))
			if (hasResearch('p2')) max = max.add(researchEffect('p2', 0))

			let eff = E(1.1).pow(kg.min(max).sub(10))
			return { kg, max, eff }
		},
        effDesc: x=>`${format(x.kg, 0)}kg / ${format(x.max, 0)}kg (${formatMult(x.eff)} to Fish)`,
    },
    s4: {
        unl: ()=>player.feature>=4,

        cost: l => Decimal.pow(10,l.sub(tmp.explore.eff[2])).mul(1e23),
        bulk: x => x.div(1e23).log(10).add(tmp.explore.eff[2]).floor().add(1),

        curr: "fish",

        effect: l=>l.add(1),
        effDesc: x=>formatMult(x),
    },
    s5: {
        unl: ()=>player.feature>=7,
        req: ()=>player.shark_level.gte(640),

        cost: l => {
            let x = Decimal.pow('e8e5',Decimal.pow(1.1,l))
            return x
        },
        bulk: x => {
            return x.log('e8e5').log(1.1).floor().add(1)
        },

        curr: "fish",

        effect: l=>{
            if (hasResearch('c13')) l = l.mul(1.5)
            return Decimal.pow(2,l)
        },
        effDesc: x=>formatMult(x),
    },

    p1: {
        req: ()=>player.feature>=1,

        cost: l => E(2).pow(l),
        bulk: x => x.log(2).floor().add(1),

        curr: "prestige",

        effect: l=>l.add(1).pow(hasDepthMilestone(1,2) ? 1.3 : 1),
        effDesc: x=>formatMult(x,0),
    },
    p2: {
        unl: ()=>player.feature>=1,

        cost: l => E(2).pow(l).mul(2),
        bulk: x => x.div(2).log(2).floor().add(1),

        curr: "prestige",

        effect: l=>l.mul(researchEffect('p4', 0).add(5)),
        effDesc: x=>"+"+format(x,0)+"kg",
    },
    p3: {
        unl: ()=>player.feature>=1,

        cost: l => l.add(3).sub(tmp.explore.eff[2]).max(0).pow(3),
        bulk: x => x.root(3).add(tmp.explore.eff[2]).sub(3).floor().add(1),

        curr: "pearl",

        effect: l=>l.mul(3),
        effDesc: x=>"+"+format(x,0)+"kg",
    },

    m1: {
        cost: l => {
            let x = Decimal.pow(3,l.scaleAll('su_m1')).mul(10)
            return x
        },
        bulk: x => {
            return x.div(10).log(3).scaleAll('su_m1',true).floor().add(1)
        },

        curr: "stone",

        effect: l=>Decimal.pow(2,l),
        effDesc: x=>formatMult(x,0),
    },
    m2: {
        cost: l => {
            let x = Decimal.pow(2,l).mul(10)
            return x
        },
        bulk: x => {
            return x.div(10).log(2).floor().add(1)
        },

        curr: "coal",

        effect: l=>l.div(10).add(1),
        effDesc: x=>formatMult(x),
    },
    m3: {
        req: ()=>player.humanoid.mining_tier.gte(3),

        cost: l => {
            let x = Decimal.pow(3,l.scaleAll('su_m3')).mul(10)
            return x
        },
        bulk: x => {
            return x.div(10).log(3).scaleAll('su_m3',true).floor().add(1)
        },

        curr: "iron",

        effect: l=>Decimal.pow(2,l),
        effDesc: x=>formatMult(x,0),
    },
    m4: {
        req: ()=>player.humanoid.mining_tier.gte(6),

        cost: l => {
            let x = Decimal.pow(2,l).mul(10)
            return x
        },
        bulk: x => {
            return x.div(10).log(2).floor().add(1)
        },

        curr: "gold",

        effect: l=>l.mul(5),
        effDesc: x=>"+"+format(x,0),
    },
    m5: {
        req: ()=>player.humanoid.mining_tier.gte(9),

        cost: l => {
            let x = Decimal.pow(4,l.scaleAll('su_m5')).mul(10)
            return x
        },
        bulk: x => {
            return x.div(10).log(4).scaleAll('su_m5',true).floor().add(1)
        },

        curr: "platinum",

        effect: l=>Decimal.pow(2,l),
        effDesc: x=>formatMult(x,0),
    },
    m6: {
        unl: ()=>isSSObserved('moon'),
        req: ()=>player.humanoid.mining_ascend.gte(1),
        
        cost: l => {
            let x = Decimal.pow(3,l.scaleAll('su_m1')).mul(100)
            return x
        },
        bulk: x => {
            return x.div(100).log(3).scaleAll('su_m1',true).floor().add(1)
        },

        curr: "radium",

        effect: l=>Decimal.pow(2,l),
        effDesc: x=>formatMult(x,0),
    },
    m7: {
        unl: ()=>isSSObserved('moon'),
        req: ()=>player.humanoid.mining_ascend.gte(3),

        cost: l => {
            let x = Decimal.pow(2,l).mul(10)
            return x
        },
        bulk: x => {
            return x.div(10).log(2).floor().add(1)
        },

        curr: "uranium",

        effect: l=>l.div(4).add(1),
        effDesc: x=>formatMult(x),
    },
    m8: {
        unl: ()=>isSSObserved('moon'),
        req: ()=>player.humanoid.mining_ascend.gte(6),

        cost: l => {
            let x = Decimal.pow(3,l.scaleAll('su_m3')).mul(10)
            return x
        },
        bulk: x => {
            return x.div(10).log(3).scaleAll('su_m3',true).floor().add(1)
        },

        curr: "berkelium",

        effect: l=>Decimal.pow(2,l),
        effDesc: x=>formatMult(x,0),
    },
    m9: {
        unl: ()=>isSSObserved('moon'),
        req: ()=>player.humanoid.mining_ascend.gte(12),

        cost: l => {
            let x = Decimal.pow(2,l).mul(10)
            return x
        },
        bulk: x => {
            return x.div(10).log(2).floor().add(1)
        },

        curr: "californium",

        effect: l=>l.mul(5),
        effDesc: x=>"+"+format(x,0),
    },
}

const SU_TABS = {
    'shark': ['s1','s2','s3','s4','s5','p1','p2','p3'],
    'cultivation': ['m1','m2','m3','m4','m5','m6','m7','m8','m9'],
}

function canAffordSharkUpgrade(i) {
    const u = SHARK_UPGRADES[i]

    if (u.unl && !u.unl() || u.req && !u.req()) return false;

    return CURRENCIES[u.curr].amount.gte(u.cost(player.shark_upg[i]))
}

function buySharkUpgrade(i) {
    const u = SHARK_UPGRADES[i]

    if (u.unl && !u.unl() || u.req && !u.req()) return;

    let cost = u.cost(player.shark_upg[i]), curr = CURRENCIES[u.curr]

    if (curr.amount.gte(cost)) {
        if (!tmp.su_el[u.curr]) curr.amount = curr.amount.sub(cost).max(0)
        player.shark_upg[i] = player.shark_upg[i].add(1)
    }
}
function buyMaxSharkUpgrade(i) {
    const u = SHARK_UPGRADES[i]

    if (u.unl && !u.unl() || u.req && !u.req()) return;

    let cost = u.cost(player.shark_upg[i]), curr = CURRENCIES[u.curr]

    if (curr.amount.gte(cost)) {
        let bulk = u.bulk(curr.amount)
        if (bulk.gt(player.shark_upg[i])) {
            player.shark_upg[i] = bulk
            if (!tmp.su_el[u.curr]) {
                cost = u.cost(bulk.sub(1))
                curr.amount = curr.amount.sub(cost).max(0)
            }
        }
    }
}

function buyAllSharkUpgrades(ii=[]) {
    ii.forEach(i=>buyMaxSharkUpgrade(i))
}

function updateSharkTemp() {
    tmp.su_el.fish = false
    tmp.su_el.prestige = false

    if (hasForgeUpgrade('auto')) {
        tmp.su_el.stone = true
        tmp.su_el.coal = true
        tmp.su_el.iron = true
        tmp.su_el.gold = true
        tmp.su_el.platinum = true
    }
    if (hasResearch('m11')) {
        tmp.su_el.radium = true
        tmp.su_el.uranium = true
        tmp.su_el.berkelium = true
        tmp.su_el.californium = true
    }

    for (let [i,v] of Object.entries(SHARK_UPGRADES)) {
        var lvl = player.shark_upg[i]
        if (['s1','s2','s3','s4'].includes(i)) lvl = lvl.mul(getCRBoost(2))
        if (['p1','p2','p3'].includes(i)) lvl = lvl.mul(getCRBoost(6))
        tmp.shark_upg_eff[i] = v.effect(lvl)
    }

    let bonus_str = remnantUpgEffect(0)

    for (let [i,v] of Object.entries(SHARK.bonuses)) tmp.shark_bonus[i] = v[0]() ? v[1](player.shark_level.mul(bonus_str)) : v[2]

    bonus_str = remnantUpgEffect(5)

    for (let [i,v] of Object.entries(SHARK.rank.bonuses)) tmp.shark_rank_bonus[i] = v[0]() ? v[1](player.shark_rank.mul(bonus_str)) : v[2]

    bonus_str = getNucleobaseEffect('guanine',3)

    for (let [i,v] of Object.entries(SHARK.tier.bonuses)) tmp.shark_tier_bonus[i] = v[0]() ? v[1](player.shark_tier.mul(bonus_str)) : v[2]

    tmp.shark_elo = SHARK.ELO
    tmp.shark_iq = SHARK.tier.ELO
}

function updateSharkHTML() {
    el('shark-level').textContent = player.shark_level.format(0)
    el('shark-tier').textContent = player.shark_rank.format(0)
    if (el('shark-next-rank')) el('shark-next-rank').innerHTML = player.feature >= 11 ? `(${lang_text('next-at')} ELO ${SHARK.rank.require.format(0).bold()})` : ""

    let cost = SHARK.cost()

    el('shark-button').innerHTML = lang_text('upgrade-shark',cost)
    el('shark-button').className = el_classes({locked: player.fish.lt(cost)})

    el('shark-bonus').innerHTML = Object.keys(SHARK.bonuses).filter(x=>SHARK.bonuses[x][0]()).map(x=>lang_text("shark-bonus-"+x,getSharkBonus(x))).join(", ")

    el('pearl-currency').innerHTML = player.feature >= 1 ? `You also have ${CURRENCIES.pearl.amount.format(2)} ${toTextStyle('Pearls','pearl')}.` : ""
}

function updateSharkUpgradesHTML() {
    var cost_text = lang_text('cost'), effect_text = lang_text('effect')
    var t = SU_TABS[tab_name]

    for (let [i,v] of Object.entries(SHARK_UPGRADES)) {
        let unl = t && t.includes(i) && (!v.unl || v.unl())
        el('shark-upgrade'+i+'-div').style.display = el_display(unl)

        if (!unl) continue;
    
        let amt = player.shark_upg[i]
        let req = true
        if (v.req) {
            req = amt.gt(0) || v.req()
            el('su-'+i+'-req-div').style.display = el_display(!req)
            el('su-'+i+'-info').style.display = el_display(req)
        }

        if (!req) continue;

        let cost = v.cost(amt)

        el('su-'+i+'-level').textContent = amt.format(0)

        el('su-'+i+'-cost').innerHTML = `${cost_text}: ${cost.format(0)} ${CURRENCIES[v.curr].costName}`
        el('su-'+i+'-cost').className = el_classes({'shark-upgrade-button': true, locked: CURRENCIES[v.curr].amount.lt(cost)})

        el('su-'+i+'-desc').innerHTML = lang_text('su-'+i+'-desc')+"<br>"+effect_text+": <b>"+v.effDesc(tmp.shark_upg_eff[i])+"</b>"
    }
}

function updateSharkRankHTML() {
    el("shark-elo").innerHTML = tmp.shark_elo.format(0)
    el("shark-elo-calc").innerHTML = SHARK.ELO_calculation

    el("shark-rank").innerHTML = player.shark_rank.format(0)
    el("shark-rank-req").innerHTML = SHARK.rank.require.format(0)

    var rank_text = lang_text("shark-rank-bonuses")
    el('shark-rank-bonus').innerHTML = Object.keys(SHARK.rank.bonuses).filter(x=>SHARK.rank.bonuses[x][0]()).map(x=>rank_text[x](getSharkRankBonus(x))).join(", ")
}

function updateSharkTierHTML() {
    el("shark-iq").innerHTML = tmp.shark_iq.format(0)
    el("shark-iq-calc").innerHTML = SHARK.tier.ELO_calculation

    el("shark-tier2").innerHTML = player.shark_tier.format(0)
    el("shark-tier-req").innerHTML = SHARK.tier.require.format(0)

    var rank_text = lang_text("shark-tier-bonuses")
    el('shark-tier-bonus').innerHTML = Object.keys(SHARK.tier.bonuses).filter(x=>SHARK.tier.bonuses[x][0]()).map(x=>rank_text[x](SHARK.tier.bonuses[x][3](getSharkTierBonus(x)))).join(", ")
}

function upgradeShark(auto) {
    let cost = SHARK.cost()
    if (player.fish.gte(cost)) {
        let bulk = player.shark_level.add(1)
        if (auto) {
            bulk = SHARK.bulk()
            cost = SHARK.cost(bulk.sub(1))
        }
        if (!hasDepthMilestone(0,2)) player.fish = player.fish.sub(cost).max()
        player.shark_level = preventNaNDecimal(bulk)
    }
}

function getSharkBonus(id,def=E(1)) { return tmp.shark_bonus[id] ?? def }
function sharkUpgEffect(id,def=E(1)) { return tmp.shark_upg_eff[id] ?? def }

function getSharkRankBonus(id,def=E(1)) { return tmp.shark_rank_bonus[id] ?? def }
function getSharkTierBonus(id,def=E(1)) { return tmp.shark_tier_bonus[id] ?? def }

function setupSharkHTML() {
    let h = ""

    for (let [i,v] of Object.entries(SHARK_UPGRADES)) {
        h += `
        <div class="shark-upgrade" id="shark-upgrade${i}-div">
            <div class="shark-upgrade-div" id="su-${i}-info">
                <div><h2>${lang_text('su-'+i+'-name')}</h2><br>${lang_text('level')}: <span id="su-${i}-level">0</span></div>
                <div id="su-${i}-desc">x???</div>
                <div class="shark-upgrade-buttons"><button id="su-${i}-cost" onclick="buySharkUpgrade('${i}')">Cost: ???</button><button onclick="buyMaxSharkUpgrade('${i}')">${lang_text('buyMax')}</button></div>
            </div>
            ${v.req ? `<div class="shark-upgrade-requirement" id="su-${i}-req-div"><div>${lang_text('su-'+i+'-req')}</div></div>` : ""}
        </div>
        `
    }

    el('shark-upgrades').innerHTML = h
}

function resetSharkUpgrades(...id) {
    id.forEach(x => {player.shark_upg[x] = E(0)})
}