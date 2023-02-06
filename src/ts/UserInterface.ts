import Simulation, { SimulationDataCollector } from "./Simulation";
import Camera from "./Camera";
import Vector2D from "./lib/Vector2D";
import Utility from "./lib/Utility";
import Settings from "./Settings";

class UserInterface {
    static initialized: boolean = false;
    static textElements: {
        tpsCounter: HTMLParagraphElement;
        fpsCounter: HTMLParagraphElement;
        populationSizeDisplay: HTMLParagraphElement;
        cycleDisplay: HTMLParagraphElement;
        averageTraitsDisplay: HTMLParagraphElement;
    }
    static buttonElements: {
        newSimulationButton: HTMLButtonElement;
        startStopButton: HTMLButtonElement;
        changeTargetTPS: HTMLButtonElement;
        downloadDataButton: HTMLButtonElement;
    }
    static checkboxElements: {
        renderingButton: HTMLInputElement;
        renderingFoodButton: HTMLInputElement;
        renderingAnimalsButton: HTMLInputElement;
        senseVisualizationButton: HTMLInputElement;
    }
    //im sorry, javascript gods
    static settingsElements: {
        worldRadius: HTMLInputElement;
        mutationChance: HTMLInputElement;
        mutationSeverity: HTMLInputElement;
        initialPopulation: HTMLInputElement;
        animalMaximumAge: HTMLInputElement;
        foodPerFeedingCycle: HTMLInputElement;
        feedingCycleLength: HTMLInputElement;
        maximumFood: HTMLInputElement;
        baseReprodutionCost: HTMLInputElement;
        movementCost: HTMLInputElement;
        senseCost: HTMLInputElement;
        movementMultiplier: HTMLInputElement;
        senseMultiplier: HTMLInputElement;
        reprodutiveUrgeMultiplier: HTMLInputElement;
        offspringInvestmentMultiplier: HTMLInputElement;
    }

    static init(
        textElements: Required<typeof this.textElements>,
        buttonElements: Required<typeof this.buttonElements>,
        checkboxElements: Required<typeof this.checkboxElements>,
        settingsElements: Required<typeof this.settingsElements>) {
        if (this.initialized) throw new Error("UI already initialized");
        this.textElements = textElements;
        this.buttonElements = buttonElements;
        this.checkboxElements = checkboxElements;
        this.settingsElements = settingsElements;

        this.setUpButtonElements();
        this.setUpCheckboxElements();
        this.setUpSettingsElements();
        setInterval(this.update.bind(this), 1000 / 24)
        this.initialized = true;
    }

    static update(): void {
        for (const elementId in this.textElements) {
            const element = this.textElements[elementId];
            let text: string;

            switch (elementId) {
                case "tpsCounter":
                    const tps = Simulation.averageTPS.toFixed(0);
                    const targetTPS = Simulation.targetTPS;
                    text = `tps: ${targetTPS} | ${tps}`;
                    break;

                case "fpsCounter":
                    const fps = Camera.averageFPS.toFixed(0);
                    const targetFPS = Camera.targetFPS;
                    text = `fps: ${targetFPS} | ${fps}`;
                    break;
                case "populationSizeDisplay":
                    const populationSize = Simulation.populationSize;
                    text = `Population Size: ${populationSize}`;
                    break;
                case "cycleDisplay":
                    text = `Cycle: ${Simulation.simulationTime.cycles}.${Simulation.simulationTime.ticks}`
                    break;
                case "averageTraitsDisplay":
                    const averageTraits = Simulation.averageAnimalTraits
                    text = "Average Traits:";
                    for (let averageTrait in averageTraits) {
                        text += `<br>${averageTrait}: ${averageTraits[averageTrait].toFixed(2)}`
                    }
                    break;
            }
            element.innerHTML = text;
        }

        this.buttonElements.startStopButton.innerHTML = Simulation.simulating ? "Pause Simulation" : "Start Simulation";
    }

    static setUpButtonElements() {
        for (const elementId in this.buttonElements) {
            const element = this.buttonElements[elementId];
            let onclickFunction: Function;

            switch (elementId) {
                case "newSimulationButton":
                    onclickFunction = () => {
                        if (Simulation.simulating) Simulation.pauseSimulation();
                        Simulation.setUpSimulation();
                        Camera.reset();
                    }
                    break;
                case "startStopButton":
                    onclickFunction = () => {
                        if (Simulation.simulating) {
                            Simulation.pauseSimulation();
                        } else {
                            Simulation.continueSimulation();
                        }
                    }
                    break;
                case "changeTargetTPS":
                    onclickFunction = () => {
                        const input = prompt("input target tps");

                        //if user presses cancel
                        if (input == null) return;

                        if (!Utility.stringIsNumber(input) || parseFloat(input) <= 0) {
                            alert("invalid input");
                            return;
                        }

                        Simulation.changeTargetTPS(parseFloat(input));
                    }
                    break;
                case "downloadDataButton":
                    onclickFunction = SimulationDataCollector.downloadData.bind(SimulationDataCollector);
                    break;

                default:
                    onclickFunction = () => alert("not yet implemented")
                    break;
            }

            element.onclick = onclickFunction;
        }
    }

    static setUpCheckboxElements() {
        for (const elementId in this.checkboxElements) {
            const element = this.checkboxElements[elementId];
            let onchangeFunction: Function;

            switch (elementId) {
                case "renderingButton":
                    onchangeFunction = () => {
                        Camera.rendering = element.checked;
                    }
                    break;
                case "renderingFoodButton":
                    onchangeFunction = () => {
                        Camera.renderingFood = element.checked;
                    }
                    break;
                case "renderingAnimalsButton":
                    onchangeFunction = () => {
                        Camera.renderingAnimals = element.checked;
                    }
                    break;
                case "senseVisualizationButton":
                    onchangeFunction = () => {
                        Camera.senseVisualization = element.checked;
                    }
                    break;
                default:
                    onchangeFunction = () => alert("not yet implemented")
                    break;
            }

            element.onchange = onchangeFunction;
        }
    }

    static setUpSettingsElements() {
        for (let elementId in this.settingsElements) {
            const element = this.settingsElements[elementId]
            let onchangeFunction: Function;
            //im sorry
            switch (elementId) {
                case "worldRadius":
                    onchangeFunction = () => {
                        if (!Utility.stringIsNumber(element.value) || parseFloat(element.value) <= 0) {
                            alert("invalid input\nworld radius must be a number > 0");
                            element.value = Settings.simulationSettings.worldRadius;
                            return;
                        }

                        Settings.simulationSettings.worldRadius = parseFloat(element.value)
                    }
                    break;
                case "mutationChance":
                    onchangeFunction = () => {
                        if (!Utility.stringIsNumber(element.value) || parseFloat(element.value) < 0 || parseFloat(element.value) > 1) {
                            alert("invalid input\nmutation chance must be a number between 0 and 1");
                            element.value = Settings.simulationSettings.mutationChance;
                            return;
                        }

                        Settings.simulationSettings.mutationChance = parseFloat(element.value)
                    }
                    break;
                case "mutationSeverity":
                    onchangeFunction = () => {
                        if (!Utility.stringIsNumber(element.value) || parseFloat(element.value) < 0) {
                            alert("invalid input\nmutation serverity must be a number >= 0");
                            element.value = Settings.simulationSettings.mutationSeverity;
                            return;
                        }

                        Settings.simulationSettings.mutationSeverity = parseFloat(element.value)
                    }
                    break;
                case "initialPopulation":
                    onchangeFunction = () => {
                        if (!Utility.stringIsNumber(element.value) || parseInt(element.value) <= 0) {
                            alert("invalid input\ninitial population must be an integer > 0");
                            element.value = Settings.simulationSettings.initialPopulation;
                            return;
                        }

                        Settings.simulationSettings.initialPopulation = parseInt(element.value)
                    }
                    break;
                case "animalMaximumAge":
                    onchangeFunction = () => {
                        if (!Utility.stringIsNumber(element.value) || parseFloat(element.value) <= 0) {
                            alert("invalid input\nmaximum age must be a number > 0");
                            element.value = Settings.animalSettings.maximumAge / 100;
                            return;
                        }

                        Settings.animalSettings.maximumAge = parseFloat(element.value) * 100 //the input is expected in cycles but the setting expects it in ticks 
                    }
                    break;
                case "foodPerFeedingCycle":
                    onchangeFunction = () => {
                        if (!Utility.stringIsNumber(element.value) || parseInt(element.value) < 0) {
                            alert("invalid input\nfood per feeding cycle must be an integer >= 0");
                            element.value = Settings.simulationSettings.foodPerFeedingCycle;
                            return;
                        }

                        Settings.simulationSettings.foodPerFeedingCycle = parseInt(element.value)
                    }
                    break;
                case "feedingCycleLength":
                    onchangeFunction = () => {
                        if (!Utility.stringIsNumber(element.value) || parseFloat(element.value) <= 0) {
                            alert("invalid input\nfeeding cycle length must be a number > 0");
                            element.value = Settings.simulationSettings.feedingCycleLength / 100;
                            return;
                        }

                        Settings.simulationSettings.feedingCycleLength = parseFloat(element.value) * 100 //same deal as age
                        Simulation.updateFeedingCycleLength();
                    }
                    break;
                case "maximumFood":
                    onchangeFunction = () => {
                        if (!Utility.stringIsNumber(element.value) || parseInt(element.value) < 0) {
                            alert("invalid input\nmaximum food must be an integer >= 0");
                            element.value = Settings.simulationSettings.maximumFood;
                            return;
                        }

                        Settings.simulationSettings.maximumFood = parseInt(element.value)
                    }
                    break;
                case "baseReprodutionCost":
                    onchangeFunction = () => {
                        alert("to be implemented")
                    }
                    break;
                case "movementCost":
                    onchangeFunction = () => {
                        alert("to be implemented")
                    }
                    break;
                case "senseCost":
                    onchangeFunction = () => {
                        alert("to be implemented")
                    }
                    break;
                case "movementMultiplier":
                    onchangeFunction = () => {
                        alert("to be implemented")
                    }
                    break;
                case "senseMultiplier":
                    onchangeFunction = () => {
                        alert("to be implemented")
                    }
                    break;
                case "reprodutiveUrgeMultiplier":
                    onchangeFunction = () => {
                        alert("to be implemented")
                    }
                    break;
                case "offspringInvestmentMultiplier":
                    onchangeFunction = () => {
                        alert("to be implemented")
                    }
                    break;
            }

            element.onchange = onchangeFunction;
        }
    }
}

export default UserInterface;