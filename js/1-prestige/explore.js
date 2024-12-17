const EXPLORE = [
    {
        resource: "coral",
        level_req: 35,
        maxDepth: 10935,

        effect: (r,d) => r.max(1).log10().div(10).add(1).pow(hasResearch("p7") ? 2 : 1),
        effDesc: x => formatMult(x) + " " + CURRENCIES.fish.costName,

        cost: [l=>E(10).pow(l).mul(1e4), x=>x.div(1e4).log(10).add(1).floor()],

        fish_req: E(1e10),

        milestone: [
            10, 100, 1000, 3000, 10935
        ],
    },{
        resource: "ice",
        level_req: 40,
        maxDepth: 5450,

        effect: (r,d) => r.max(1).log10().div(2).add(1).pow(hasResearch("p7") ? 1.5 : 1),
        effDesc: x => formatMult(x) + " " + CURRENCIES.prestige.costName,

        cost: [l=>E(10).pow(l).mul(1e4), x=>x.div(1e4).log(10).add(1).floor()],

        fish_req: E(1e9),

        milestone: [
            10, 30, 100, 1000, 5450
        ],
    },{
        resource: "salt",
        level_req: 50,
        maxDepth: 8605,

        effect(r,d) {
            return r.add(1).log10().pow(2/3)
        },
        effDesc: x => `-${x.format()} levels to ${toTextStyle('Swim and Dive','shark')} and ${toTextStyle('Treasure','prestige')}'s costs`,

        cost: [l=>E(10).pow(l).mul(1e4), x=>x.div(1e4).log(10).add(1).floor()],

        fish_req: E(1e12),

        milestone: [
            10, 20, 8605
        ],
    },{
        resource: "snow",
        level_req: 65,
        maxDepth: 7236,

        effect(r,d) {
            return r.add(10).log(10)
        },
        effDesc: x => `${formatMult(x)} Exploration base.`,

        cost: [l=>E(10).pow(l).mul(1e3), x=>x.div(1e3).log(10).add(1).floor()],

        fish_req: E(1e7),

        milestone: [
            7236
        ],
    },{
        resource: "kelp",
        level_req: 1000,
        maxDepth: 7290,

        effect(r,d) {
            let m = d.div(this.maxDepth).max(1)
            let x = expPow(r.add(1),hasDepthMilestone(4,3) ? 0.75 : 0.5)
            if (hasResearch('e5')) x = x.max(r.add(1).root(2));
            x = x.pow(m.log10().root(2).div(8).add(1)).overflow('ee12',0.5,2)
            let y = hasResearch('s4') ? r.add(10).log10().log10().mul(m.log10().add(10).log10()).root(2).div(2).add(1) : E(1)
            return [x,y]
        },
        effDesc: x => formatMult(x[0]) + (x[1].gt(1) ? ", " + formatPow(x[1],3) : "") + " " + lang_text("radioactive-name"),

        cost: [l=>EINF, x=>E(0)],

        fish_req: E('1e6000'),

        milestone: [
            100, 250, 5000, 7290
        ],
    },
]

function getResourceOtherMult(i) {
    let x = E(1)
    switch (i) {
        case 0:
            if (hasResearch('e1')) x = x.mul(researchEffect('e1'))
        break;
        case 1:
            if (hasResearch('e2')) x = x.mul(researchEffect('e2'))
        break;
        case 4:
            if (hasResearch('e4')) x = x.mul(researchEffect('e4'))
        break;
    }
    if (i < 4) x = x.mul(coreReactorEffect(2))
    return x
}

function getBaseExploration(i=player.explore.active,amt=player.explore.best_fish) {
    if (tmp.ss_difficulty) return E(0)

    let req = EXPLORE[i].fish_req
    if (amt.lt(req)) return E(0)

	let r = amt.div(req).root(5)
	return r.mul(tmp.explore.eff[3] ?? 1)
}

function inExploration(i) { return player.explore.active == i || player.explore.active == 4 && i < 4 }
function hasDepthMilestone(i,j) { return i < 5 && hasSMilestone(3) || tmp.explore.mil_reached[i][j] }

function calcNextDepth(x,gain,i) {
	if (x.gt(1)) x = x.pow(3)

    let g = x.add(gain)

	if (g.gt(1)) g = g.root(3)
	return g
}

function enterExploration(i) {
    if (player.explore.unl <= i) return

    if (player.explore.active == -1) player.explore.active = i
    else {
        let a = player.explore.active
        player.explore.base[a] = player.explore.base[a].max(getBaseExploration(a))
        player.explore.active = player.explore.active == i ? -1 : i
    }

    player.explore.best_fish = E(0)

    if (player.explore.active >= 1) {
        CURRENCIES.prestige.amount = E(0)
        CURRENCIES.pearl.amount = E(0)
        resetSharkUpgrades('p1','p2','p3')
    }

    doReset('prestige',true)
}

function buyExploreUpgrade(i) {
    if (player.feature < 4) return;
    if (player.explore.unl <= i) return

    var amt = player.explore.upg[i][0]
    var E = EXPLORE[i], cost = E.cost, curr = player.explore.res[i]
    if (curr.gte(cost[0](amt))) {
        var bulk = cost[1](curr)
        player.explore.upg[i][0] = bulk.gt(amt) ? bulk : amt.add(1)
    }
}

function setupExplorationHTML() {
    let h = ""
    EXPLORE.forEach((x,i)=>{
        let curr = CURRENCIES[x.resource]
        let texts = lang_text(`explore-${i}-milestone`)
        h += `
        <div class="explore-div" id="explore-${i}-div">
            <div class="explore-desc">
                <button id="explore-${i}-explore" onclick="enterExploration(${i})">Your current base is 0/s.<br>Explore the ocean!</button>
                <div>
                    <div style="min-height: 118px; text-align: left;">
                        <h3>${lang_text("explore-"+i+"-name")}</h3><br>
                        ${curr.costName}: <span id="explore-${i}-res">0</span><br>
                        <b>${lang_text("effect")}:</b> <span id="explore-${i}-effect">???</span><br>
                        <b>${lang_text("depth")}:</b> <span id="explore-${i}-depth">0m</span>
                    </div><div class="table-left">
                        <button class="explore-cost" id="explore-${i}-cost1" onclick="buyExploreUpgrade(${i})"></button>
                    </div>
                </div><div>
                    <span><b>${lang_text("explore-while")}:</b> ${lang_text("explore-"+i+"-desc")}</span><br><br>
                    ${x.milestone.map((p,j) => `<span id="explore-${i}-milestone-${j}">• ${format(p,0,12,"sc")}m: ${texts[j]}</span><br>`).join("")}
                </div>
            </div>
        </div>
        `
    })
    el("explore-table").innerHTML = h
}

function updateExplorationHTML() {
    var a = player.explore.active

    var texts = [
        lang_text("require"),
        lang_text("explore-doubler-1"),
    ]
    EXPLORE.forEach((x,i)=>{
        let unl = player.explore.unl > i, el_id = `explore-${i}-`
        el(el_id+'div').style.display = el_display(unl)
        if (unl) {
            let b = player.explore.base[i]
            if (i == a) {
                let bb = getBaseExploration(i)
                el(el_id+'explore').innerHTML = lang_text('explore-inside',b,bb,x.fish_req)
            } else el(el_id+'explore').innerHTML = lang_text("explore-outside",b)

            let res = player.explore.res[i], curr = CURRENCIES[x.resource], text_curr = curr.costName

            el(el_id+'res').textContent = res.format(0) + " " + res.formatGain(tmp.currency_gain[x.resource])
            el(el_id+'effect').innerHTML = x.effDesc(tmp.explore.eff[i])

            let depth = player.explore.depth[i]
            el(el_id+'depth').innerHTML = depth.format() + "m / " + format(x.maxDepth,0) + "m " + depth.formatGain(calcNextDepth(depth,tmp.explore.depth_gain[i].div(FPS),i).sub(depth).mul(FPS))

            var cost_el = el(el_id+'cost1'), costs = x.cost, upgs = player.explore.upg[i]
            
            var amount = upgs[0], cost = costs[0](amount)
            cost_el.innerHTML = `${texts[1]} [${amount.format(0)}]<br>${texts[0]}: ${cost.format(0)} ${text_curr}`
            cost_el.className = el_classes({"explore-cost": true, locked: res.lt(cost)})

            for (let j = 0; j < x.milestone.length; j++) {
                let p = x.milestone[j]
                el(`explore-${i}-milestone-${j}`).style.backgroundColor = depth.gte(p) ? "#0804" : "transparent"
            }
        }
    })

    el("next-explore").innerHTML = player.explore.unl < EXPLORE.length ? lang_text("explore-next",EXPLORE[player.explore.unl].level_req) : ""
}

function updateExplorationTemp() {
    tmp.explore.MP = getCRBoost(9)

    EXPLORE.forEach((x,i)=>{
        tmp.explore.eff[i] = x.effect(player.explore.unl > i ? player.explore.res[i] : E(0), player.explore.depth[i])

        let upg = player.explore.upg[i]
        tmp.explore.upg_boost[i] = Decimal.pow(2,upg[0])

        let d = player.explore.base[i]
		d = d.mul(tmp.explore.upg_boost[i])
		d = d.mul(sharkUpgEffect("s4", 1))
		if (hasDepthMilestone(0, 0)) d = d.mul(E(1.02).pow(player.shark_upg.p2))
        tmp.explore.depth_gain[i] = d

        tmp.explore.mil_reached[i] = x.milestone.map((p) => player.explore.depth[i].round().gte(Decimal.round(p)))

        tmp.explore.mult[i] = getResourceOtherMult(i)
    })
}