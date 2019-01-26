//=====================================================
// ** dataUpdate.js
//-----------------------------------------------------
//  Update speed, temperature, pressure of data points
//=====================================================
setInterval(function () {
    for (let node in pipeVertexData) {
        pipeVertexData[node].speed += randNum(-1, 1);
        pipeVertexData[node].temperature += randNum(-1, 1);
        pipeVertexData[node].pressure += randNum(-1, 1);
    }
}, 1000);