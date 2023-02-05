import Animal, { AnimalSettings } from "./Animal";
import { SimulationSettings } from "./Simulation";

class Settings{
    static simulationSettings: SimulationSettings;
    static animalSettings: AnimalSettings;

    static initialized: boolean = false;

    static init(simulationSettings:Required<SimulationSettings>, animalSettings:Required<AnimalSettings>){
        this.simulationSettings = simulationSettings;
        this.animalSettings = animalSettings;

        this.initialized = true;
    }

    static changeSimulationSettings(newSettings:Partial<SimulationSettings>){
        this.simulationSettings = Object.assign(this.simulationSettings, newSettings)
    }

    
    static changeAnimalSettings(newSettings:Partial<AnimalSettings>){
        this.animalSettings = Object.assign(this.animalSettings, newSettings)
    }
}

export default Settings;