function getRandomGid() {
    return Math.floor(Math.random() * 99999).toString()
}

function getCurDate() {
    return new Date().toLocaleString()
}

function genStmtCol(obj){
    const colsName = Object.keys(obj).join(", ");
    console.log("column no ", colsName)
    return colsName
}

function genStmtPlaceHolder(obj){
    const placeholders = Object.keys(obj).fill('?').join(", ");
    return placeholders;
}

function genStmtArr(obj) {
    let result = []
    for (const [key, value] of Object.entries(obj)) {
        result.push(value.toString())
      }
    console.log("result length ", result)
    return result
}

module.exports = { getRandomGid, getCurDate, genStmtCol, genStmtPlaceHolder, genStmtArr}