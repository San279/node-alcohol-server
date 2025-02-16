function getRandomGid() {
    return Math.floor(Math.random() * 99999).toString()
}

function getCurDate() {
    const date = new Date().toISOString();
    return date;
}

function genStmtCol(obj){
    const colsName = Object.keys(obj).join(", ");
    console.log("column no ", colsName)
    return colsName
}

function genStmtPlaceHolder(obj){
    let placeholders = '';
    let i = 0;
    for (const [key, value] of Object.keys(obj)){
        i += 1
        placeholders += '$' + i + ','
    }
    placeholders = placeholders.slice(0, -1);
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

const requireParams = params => (req, res, next) => {
    const reqParamList = Object.keys(req.params);
    const hasAllRequiredParams = params.every(param =>
        reqParamList.includes(param)
    );
    if (!hasAllRequiredParams)
        return res
            .status(400)
            .send(
                `The following parameters are all required for this route: ${params.join(", ")}`
            );

    next();
};

module.exports = { getRandomGid, getCurDate, genStmtCol, genStmtPlaceHolder, genStmtArr, requireParams}