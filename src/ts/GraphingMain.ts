import Grapher, { GraphTypes } from "./Graphing";

//expose to console for testing
//@ts-ignore
window.Grapher = Grapher;
//@ts-ignore
window.GraphTypes = GraphTypes;


//graph button
const graphButton = document.getElementById("graph") as HTMLButtonElement;
const graphingModeSelector = document.getElementById("mode") as HTMLSelectElement;
graphButton.onclick = async () => {
    const data = await getData();
    Grapher.data = data;
    switch (graphingModeSelector.value) {
        case "averageTraitsOverTime":
            Grapher.graph(GraphTypes.averageTraitsOverTime)
            break;
        case "populationOverTime":
            Grapher.graph(GraphTypes.populationOverTime)
            break;
        case "populationAndFoodOverTime":
            Grapher.graph(GraphTypes.populationAndFoodOverTime)
            break;
    }
}

const sourceSelector = document.getElementById("source") as HTMLSelectElement;
async function getData(){
    let data;
    switch(sourceSelector.value){
        case "lastSimulation":
            data = JSON.parse(sessionStorage.getItem("data"));
            break;
        case "file":
            const file = (document.getElementById("dataFile") as HTMLInputElement).files[0];
        if (file == null) {
            alert("no file selected")
            throw new Error("no file selected")
        }
        data = JSON.parse(await file.text());
        break;
    }

    //i cant be bothered doing data validation rn, but when i get around to it it should go here

    return data;
}

getData()
.then((data)=>{
    Grapher.init(data, document.getElementById("chart") as HTMLCanvasElement);
})