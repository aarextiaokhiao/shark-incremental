var tmp = {}
var options = {
    notation: "mixed_sc",
    max_range: 9,
    pass: 0,
}

function reloadTemp() {
    tmp = {
        currency_gain: {},

        shark_bonus: {},
        shark_upg_eff: [],

        shark_elo: E(0),
        shark_rank_bonus: {},

        shark_iq: E(0),
        shark_tier_bonus: {},

        su_el: {},
        su_locked: {},
        su_automated: [],

        research_visible: [],
        research_eff: {},
		explore: {
			depth_gain: [],
			mult: [],
			eff: [],
			upg_boost: [],
			mil_reached: [],
		},

        core_bonus_level: [],
        core_effect: [],
        cr_boost: [],

        ca_building_effect: [],
        ca_building_strength: [],

        evolution_tree_effect: [],
        charged_et_effect: [],

        mining_fortune: E(0),
        ore_spawn_base: 1,
        ore_generator: 0,
        mining_speed: E(1),
        mining_damage: E(1),
        mining_tier_bonus: [],

        forge_speed: E(1),
        forge_affords: {},
        forge_effect: {},

        particle_accel_eff: [],

        scalings: {},

        bh_pause: false,

        bh_reduction: E(1),
        remnant_upg_effects: [],

        ss_difficulty: 0,
        sb_upg_effects: {},
        experiment_boosts: [],

        constellation_boosts: [],

        nucleobases: {},
    }

    for (let x in EXPLORE) {
        tmp.explore.mil_reached[x] = []
        tmp.explore.upg_boost[x] = E(1)
    }

    for (let x in SCALINGS) {
        tmp.scalings[x] = []
        for (let y in SCALINGS[x].base) {
            let b = []
            for (let z of SCALINGS[x].base[y]) b.push(z)
            tmp.scalings[x].push(b)
        }
    }

    for (let x in NUCLEOBASES.ctn) {
        tmp.nucleobases[x] = {
            tier: E(0),
            exp_gain: E(0),
            effect: [],
        }
    }
}

function updateTemp() {
    tmp.ss_difficulty = SOLAR_SYSTEM[player.solar_system.active]?.difficulty ?? 0 
    tmp.cr_active = player.core.radiation.active

    updateResearchTemp()
    updateScalingsTemp()
    updateHadronTemp()
    updateConstellationTemp()
    updateSingularityTemp()
    updatePATemp()
    updateEvolutionTreeTemp()
    updateCoreTemp()
    updateExplorationTemp()
    AGILITY.updateTemp()
    updateSharkTemp()

    var asu = []
    for (let [i,v] of Object.entries(AUTOMATION)) if ('su' in v && isAutoEnabled(i)) asu.push(...v.su)
    tmp.su_automated = asu

    for (let [i,v] of Object.entries(CURRENCIES)) tmp.currency_gain[i] = preventNaNDecimal(v.gain??E(0))

    reloadOres();
}

function updateOptions() {
    options.notation = ['sc','mixed_sc'][player.radios["notation"]]
    options.max_range = [3,6,9,12,15][player.radios["comma-format"]]
}