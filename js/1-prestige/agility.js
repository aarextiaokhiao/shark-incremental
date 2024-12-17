let AGILITY = {
	data: [
		[
			{
				cost: 0.5,
				disp: "Every 5 seconds, attain...",
				tick(dt) {
					player.agility.ch += dt
					if (player.agility.ch < 5) return

					let times = Math.floor(player.agility.ch / 5)
					player.agility.ch = Math.max(player.agility.ch - times * 5, 0)
					tmp.agility.times += times
				}
			}, {
				cost: 1,
				disp: "Per 5 seconds, produce...",
				tick(dt) {
					tmp.agility.times += dt / 5
				}
			}, {
				cost: 2,
				disp: x => `Overcharge. (${formatTime(player.agility.overch)})`,
				tick(dt) {
					let on = player.agility.on.map(x => x[0]).includes("1")
					if (on) {
						tmp.agility.times = player.agility.overch / 5
						player.agility.overch = 0
					} else player.agility.overch += dt * 2
				}
			}
		], [
			{
				cost: 0.5,
				eff: power => power,
				disp: x => `${formatTime(x,0)} worth of ${toTextStyle('Shark','shark')} effects`,
				tick(times, eff) {
					gainCurrency("fish", tmp.currency_gain.fish.mul(eff).mul(times))
					gainCurrency("pearl", tmp.currency_gain.pearl.mul(eff).mul(times))
				}
			}, {
				cost: 1,
				eff: power => power / 1e4,
				disp: x => `+×${format(x, 4)} ${toTextStyle('Fish','fish')} multiplier this Prestige (Currently ${formatMult(player.agility.mult, 3)})`,
				tick(times, eff) {
					player.agility.mult = Math.min(player.agility.mult + times * eff, hasResearch("p6") ? 6 : 3)
				}
			}, {
				cost: 1,
				eff: power => E(1.1).pow((power - 20) / (inExploration(2) ? 2 : 1)),
				disp: x => `${x.format()} ${toTextStyle('Prestige','prestige')} Shards`,
				tick(times, eff) {
					gainCurrency("prestige", eff.mul(times))
				}
			}, {
				cost: 3,
				unl: _ => player.explore.unl > 0,

				eff: power => power / 20,
				disp: x => `${formatTime(x,0)} worth of Exploration resources`,
				tick(times, eff) {
					for (var i of Object.values(EXPLORE).map(x => x.resource)) gainCurrency(i, tmp.currency_gain[i].mul(eff).mul(times))
				}
			},
		]
	],
	toggle(i) {
		let index = player.agility.on.indexOf(i)
		if (index == -1) player.agility.on.push(i)
		else player.agility.on = player.agility.on.slice(0,index).concat(player.agility.on.slice(index+1))
	},
	tick(dt) {
		// Check Pearls
		if (player.feature >= 3) {
			let p = CURRENCIES.pearl
			p.amount = p.amount.sub(dt * tmp.agility.total)
			if (p.amount.eq(0) && tmp.agility.total > 0) {
				player.agility.on = ["00", "10"]
				addNotify(lang_text('notify-desc').agility_reset)
			}
		}

		// Events
		tmp.agility.times = 0
		for (var i of player.agility.on) if (i[0] == 0) AGILITY.data[0][i[1]].tick(dt)

		if (tmp.agility.times == 0) return
		for (var i of player.agility.on) if (i[0] == 1) AGILITY.data[1][i[1]].tick(tmp.agility.times, tmp.agility.eff[i[1]])
	},
	updateTemp() {
		var t = tmp.agility = {
			total: 0,
			eff: []
		}

		// Calculate total
		if (player.feature >= 3) {
			var cost_free = true
			for (var i of player.agility.on) {
				t.total += AGILITY.data[i[0]][i[1]].cost
				if (!["00", "10"].includes(i)) cost_free = false
			}
			t.total = cost_free ? 0 : (t.total ** 2) / (hasDepthMilestone(2,1) ? 1.5 : 1)
		}

		// Calculate effects
		var pow = sharkUpgEffect("s2", E(0)).toNumber()
		for (var [i, d] of Object.entries(AGILITY.data[1])) t.eff[i] = d.eff(pow)
	},

	setupHTML() {
		for (var [i, d] of Object.entries(AGILITY.data)) {
			var h = ``
			for (var [i2, d2] of Object.entries(d)) h += `<button onclick="AGILITY.toggle('${i + i2}')" id="agility-${i + i2}">${typeof d2.disp == "function" ? "" : d2.disp}</button>`
			el("agility-" + i).innerHTML = h
		}
	},
	updateHTML() {
		el('agility-pearl').innerHTML = `You have ${CURRENCIES.pearl.amount.format(2)} ${toTextStyle('Pearls','pearl')}. (-${format(tmp.agility.total, 1)}/s)`
		el('agility-power').innerHTML = `Agility Power: ${toTextStyle(sharkUpgEffect("s2", 0), "pearl")}`

		for (var [i, d] of Object.entries(AGILITY.data)) {
			for (var [i2, d2] of Object.entries(d)) {
				let elm = el(`agility-${i + i2}`)
				let unl = !d2.unl || d2.unl()
				elm.style.display = el_display(unl)

				if (!unl) continue
				elm.className     = el_classes({ bought: player.agility.on.includes(i + i2) })
				if (typeof d2.disp == "function") elm.innerHTML = d2.disp(i == 1 ? tmp.agility.eff[i2] : undefined)
			}
		}
	}
}