import Camera from "./Camera";
import Vector2D from "./lib/Vector2D";
import Simulation from "./Simulation";

//@ts-ignore
window.Vector2D = Vector2D;
//@ts-ignore
window.Simulation = Simulation;
//@ts-ignore
Camera.init(document.getElementById("canvas"))
//@ts-ignore
window.Camera = Camera;
Simulation.startSimulation();
Simulation.changeTargetTPS(1000)

let tps = document.getElementById("tps")
let target = document.getElementById("target")
let cycle = document.getElementById("cycle")
let pop = document.getElementById("population")
let average = document.getElementById("average")
setInterval(() => {
    tps.innerHTML = "average tps for the last ten ticks: "+Simulation.averageTPS.toFixed(0);
    target.innerHTML = "target tps: "+Simulation.targetTPS;
    cycle.innerHTML = `cycle: ${Simulation.simulationTime.cycles}<br>ticks: ${Simulation.simulationTime.ticks}`
    pop.innerHTML = "population size: " + Simulation.animals.length
    let out = ""
    let traits = Simulation.animals[0].traits
    for(let trait in traits){
        out = `${out}average ${trait}: ${(Simulation.animals.map(x => x.traits[trait]).reduce((a,b) => a + b)/Simulation.animals.length).toFixed(2)}<br>`
    }
    average.innerHTML = out
},1000/60);
