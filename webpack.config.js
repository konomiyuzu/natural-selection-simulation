module.exports = {
    "mode": "development",
    "entry": {
        simulation: "./src/js/Main.js",
        graphing: "./src/js/GraphingMain.js"
    },
    "output": {
        "path": __dirname + "/dist",
    },
    "watch": true,
}