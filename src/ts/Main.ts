import Animal from "./Animal";
import Camera from "./Camera";
import Utility from "./lib/Utility";
import Vector2D from "./lib/Vector2D";
import Settings from "./Settings";
import Simulation, { SimulationDataCollector } from "./Simulation";
import UserInterface from "./UserInterface";

//expose these classes to the window element so that they may be used in the console for debugging
//@ts-ignore
window.Vector2D = Vector2D;
//@ts-ignore
window.Simulation = Simulation;
//@ts-ignore
window.Camera = Camera;
//@ts-ignore
window.SimulationDataCollector = SimulationDataCollector;
//@ts-ignore
window.Settings = Settings;
//@ts-ignore
window.Utility = Utility;

//default values that i will hardcode
Settings.init(
    {
        initialPopulation: 20,
        worldRadius: 350,
        mutationChance: 1,
        mutationSeverity: .1,
        foodPerFeedingCycle: 300,
        feedingCycleLength: 100,
        maximumFood: 1000,
        collectData: true,
        dataCollectionFrequency: 25,
        foodEnergyValue:20
    }
    ,
    {
        TraitEffectConstants: {
            speed: 3,
            sense: 50,
            reproductiveBuffer: 30,
            offspringInvestment: 50
        },
        EnergyCostConstants: {
            speed: 0.1,
            sense: 0.1,
            baseReproductionCost: 100
        },
        maximumAge: 3000
    }
);

Simulation.init(Settings.simulationSettings);
Animal.init(Settings.animalSettings);
Simulation.setUpSimulation(); //so that there is already a simulation at first

Camera.init(document.getElementById("canvas") as HTMLCanvasElement);


const textElements = {} as typeof UserInterface.textElements;
textElements.tpsCounter = document.getElementById("tps") as HTMLParagraphElement;
textElements.fpsCounter = document.getElementById("fps") as HTMLParagraphElement;
textElements.populationSizeDisplay = document.getElementById("populationSize") as HTMLParagraphElement;
textElements.cycleDisplay = document.getElementById("cycle") as HTMLParagraphElement;
textElements.averageTraitsDisplay = document.getElementById("averageTraits") as HTMLParagraphElement;

const buttonElements = {} as typeof UserInterface.buttonElements;
buttonElements.newSimulationButton = document.getElementById("newSimulationButton") as HTMLButtonElement;
buttonElements.startStopButton = document.getElementById("startStopButton") as HTMLButtonElement;
buttonElements.changeTargetTPS = document.getElementById("changeTargetTPS") as HTMLButtonElement;
buttonElements.downloadDataButton = document.getElementById("downloadDataButton") as HTMLButtonElement;

const checkboxElements = {} as typeof UserInterface.checkboxElements;
checkboxElements.renderingButton = document.getElementById("rendering") as HTMLInputElement;
checkboxElements.renderingFoodButton = document.getElementById("renderingFood") as HTMLInputElement;
checkboxElements.renderingAnimalsButton = document.getElementById("renderingAnimals") as HTMLInputElement;
checkboxElements.senseVisualizationButton = document.getElementById("senseVisualization") as HTMLInputElement;

//forgive me lord
const settingsElements = {} as typeof UserInterface.settingsElements;
settingsElements.worldRadius = document.getElementById("worldRadius") as HTMLInputElement;
settingsElements.mutationChance = document.getElementById("mutationChance") as HTMLInputElement;
settingsElements.mutationSeverity = document.getElementById("mutationSeverity") as HTMLInputElement;
settingsElements.initialPopulation = document.getElementById("initialPopulation") as HTMLInputElement;
settingsElements.animalMaximumAge = document.getElementById("animalMaximumAge") as HTMLInputElement;
settingsElements.foodPerFeedingCycle = document.getElementById("foodPerFeedingCycle") as HTMLInputElement;
settingsElements.feedingCycleLength = document.getElementById("feedingCycleLength") as HTMLInputElement;
settingsElements.maximumFood = document.getElementById("maximumFood") as HTMLInputElement;
settingsElements.baseReprodutionCost = document.getElementById("baseReprodutionCost") as HTMLInputElement;
settingsElements.movementCost = document.getElementById("movementCost") as HTMLInputElement;
settingsElements.senseCost = document.getElementById("senseCost") as HTMLInputElement;
settingsElements.movementMultiplier = document.getElementById("movementMultiplier") as HTMLInputElement;
settingsElements.senseMultiplier = document.getElementById("senseMultiplier") as HTMLInputElement;
settingsElements.reprodutiveUrgeMultiplier = document.getElementById("reprodutiveUrgeMultiplier") as HTMLInputElement;
settingsElements.offspringInvestmentMultiplier = document.getElementById("offspringInvestmentMultiplier") as HTMLInputElement;


UserInterface.init(textElements, buttonElements, checkboxElements, settingsElements);