var lang_data = {}
const LANGUAGES = {}

function lang_text(id,...arg) {
    const L = lang_data[id]
    return typeof L == 'function' ? L(...arg) : L
}

const ALLOWED_LANG_KEY_TO_ELEMENT_ID = [
    `fish-div`,'shark-stats','shark-elo-div','option-title-1','option-title-2','option-title-3','option-title-4','offline-speed','offline-done',
    'agility-summary','radioactive-div','radioactive-summary','radioboost-div','core-temp-div','core-temp-after-div','shark-rank-div','shark-rank-req-div','core-assembler-erase',
    'sharkoid-faith-div','shark-rank-note','respec-evolution-tree','rerun-evolution','import-evolution-tree','export-evolution-tree','evolution-tree-preset',
    'mining-text','mined-resources-text','mining-tier-div','mining-note','mining-tier-undo-btn','scaling-info','black-hole-button','black-hole-html',
    'remnant-html','rocket-part-div','observ-div','mining-ascend-div','super-mining-text','reserv-div','mining-ascend-undo-btn','traject-div',
    'respec-evolution-tree-2','experiment-div','bh-tier-div','bh-tier-button','fundamental-amount-div','starter-upg-note','shark-tier-note','shark-iq-div',
    'shark-tier-div','shark-tier-req-div',
]