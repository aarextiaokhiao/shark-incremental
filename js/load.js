function loadGame(start=true, gotNaN=false) {
    if (!gotNaN) prevSave = localStorage.getItem(SAVE_ID)
    player = getPlayerData()
    load(prevSave)
    reloadTemp()

    if (start) {
        lang_data = LANGUAGES.EN.text
        setupOptions()

        createCanvasGraph("offline",{axis_name: ["Time","Fish"], color: "orange"})

        el("research-page").onchange = function () {
            this.value = research_page = Math.max(1,Math.round(this.value))
            updateResearchHTML()
        }

        setupCurrencies()
        setupHTML()

        setTimeout(() => {
            var offline_t = (Date.now() - player.latest_time)/1000

            updateTemp()
            loop()

            if (offline_t > 60 && player.radios["offline"]) simulateOffline(offline_t)
            else el("app").style.display = ""
            
            autosave = setInterval(save, [1/0,15000,30000,60000,120000][player.radios["autosave"]], true)
            setInterval(loop, 1000/FPS)
        }, 100);
    }
}

function getLangRadio(id) {
    return [id,...lang_text('radio-desc')[id]]
}

function setupOptions() {
    createRadio(...getLangRadio('notation'), {
        start_position: 1,
    })

    createRadio(...getLangRadio('autosave'), {
        start_position: 3,
        width: 60,
    })
    
    createRadio(...getLangRadio('offline'), {
        start_position: 1,
    })
    createRadio(...getLangRadio('notify'), {
        start_position: 1,
    })

    createRadio(...getLangRadio('max-research-amt'), {
        start_position: 2,
        width: 40,
    })
    createRadio(...getLangRadio('visible-research'), {
        start_position: 0,
    })
}