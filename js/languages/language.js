var lang_data = {}
const LANGUAGES = {}

function lang_text(id,...arg) {
    const L = lang_data[id]
    return typeof L == 'function' ? L(...arg) : L
}

const ALLOWED_LANG_KEY_TO_ELEMENT_ID = [
    `fish-div`,'shark-stats','shark-elo-div','option-title-1','option-title-2','option-title-3','option-title-4','offline-speed','offline-done',
    'radioactive-div','radioactive-summary','radioboost-div','core-temp-div','core-temp-after-div','shark-rank-div','shark-rank-req-div','core-assembler-erase',
    'sharkoid-faith-div','shark-rank-note','respec-evolution-tree','rerun-evolution','import-evolution-tree','export-evolution-tree','evolution-tree-preset',
    'mining-text','mined-resources-text','mining-tier-div','mining-note',
]