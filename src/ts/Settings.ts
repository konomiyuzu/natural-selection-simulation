import Animal, { AnimalSettings } from "./Animal";
import Simulation, { SimulationSettings } from "./Simulation";

interface settings {
    simulationSettings: SimulationSettings;
    animalSettings: AnimalSettings;
    [key:string]:any;
}
class Settings{
    static simulationSettings: SimulationSettings;
    static animalSettings: AnimalSettings;
    static #defaultSettings: settings;
    static initialized: boolean = false;

    static init(simulationSettings: Required<SimulationSettings>, animalSettings: Required<AnimalSettings>) {
        this.simulationSettings = simulationSettings;
        this.animalSettings = animalSettings;

        this.#defaultSettings = {} as settings;
        this.#defaultSettings.simulationSettings = {... simulationSettings};
        this.#defaultSettings.animalSettings = {... animalSettings};

        this.initialized = true;
    }

    static resetToDefaultSettings() {
        this.simulationSettings = Object.assign(this.simulationSettings, this.#defaultSettings.simulationSettings)
        this.animalSettings = Object.assign(this.animalSettings, this.#defaultSettings.animalSettings)
    }

    static changeSimulationSettings(newSettings: Partial<SimulationSettings>) {
        this.simulationSettings = Object.assign(this.simulationSettings, newSettings)
    }


    static changeAnimalSettings(newSettings: Partial<AnimalSettings>) {
        this.animalSettings = Object.assign(this.animalSettings, newSettings)
    }
}

export default Settings;