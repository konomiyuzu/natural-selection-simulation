import Animal, { AnimalTraits, baseAnimalTraits } from "./Animal"
import Food from "./Food";
import Vector2D from "./lib/Vector2D";

export interface SimulationSettings {
    initialPopulation: number;
    worldRadius: number;
    mutationChance: number;
    mutationSeverity: number;
    foodPerFeedingCycle: number;
    feedingCycleLength: number;
    maximumFood: number;
    collectData: boolean;
    dataCollectionFrequency: number;
    foodEnergyValue: number;
    collectVerboseData: boolean;
}

export interface SimulationData {
    time: SimulationTime;
    averageTraits: AnimalTraits;
    populationSize: number;
    foodCount: number;
    simulationSettings?: SimulationSettings;
    allAnimalTraits?: AnimalTraits[];
    averageAnimal?: Animal;
}

export class SimulationDataCollector {
    static data: SimulationData[] = [];

    static collectData() {
        let data = {} as SimulationData;

        data.time = new SimulationTime(Simulation.simulationTime.totalTicks);
        data.averageTraits = Simulation.averageAnimalTraits;
        data.populationSize = Simulation.populationSize;
        data.foodCount = Simulation.foodCount;

        if (Simulation.settings.collectVerboseData) {
            data.allAnimalTraits = Simulation.animals.map(x => x.traits);
            data.averageAnimal = Simulation.averageAnimal;
            data.simulationSettings = Object.assign({}, Simulation.settings);
        }

        this.data.push(data);
        return data;
    }

    static downloadData(): void {
        const filename = prompt("file name", "data")
        if (filename == null) return;

        const dataURL = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data));
        let element = document.createElement("a");
        element.setAttribute("href", dataURL);
        element.setAttribute("download", filename + ".json");

        element.style.display = "none";

        document.body.append(element);
        element.click();
        document.body.removeChild(element);
    }
}

export class SimulationTimeSchedule {
    id: number;
    totalTicksSinceLastRan: number = 0;
    timesRan: number = 0;
    single: boolean;
    scheduleInterval: number;
    callbackfn: Function;

    constructor(callbackfn: Function, scheduleInterval: number, id: number, single: boolean) {
        this.callbackfn = callbackfn;
        this.id = id;
        this.scheduleInterval = scheduleInterval;
        this.single = single;
    }

    tick(): void {
        this.totalTicksSinceLastRan++
        if (this.totalTicksSinceLastRan == this.scheduleInterval) {
            this.callbackfn();
            this.totalTicksSinceLastRan = 0;

            this.timesRan++;
        }
    }
}
export class SimulationTime {
    ticks: number;
    cycles: number;
    scheduled: (SimulationTimeSchedule | null)[] = [];

    get totalTicks(): number {
        return this.ticks + (100 * this.cycles)
    }

    static get zero(): SimulationTime {
        return new SimulationTime(0, 0);
    }

    constructor(totalTicks: number);
    constructor(ticks: number, cycle: number)

    constructor(ticks: number, cycle?: number) {
        if (cycle != null) {
            if (ticks > 100 || ticks < 0) throw new Error("ticks in invalid range")
            this.ticks = ticks;
            this.cycles = cycle
        } else {
            this.ticks = ticks % 100;
            this.cycles = Math.floor(ticks / 100);
        }

    }

    tick() {
        this.ticks++
        if (this.ticks == 100) {
            this.ticks = 0;
            this.cycles++;
        }

        for (let schedule of this.scheduled) {
            if (schedule == null) continue;
            schedule.tick();
            if (schedule.single && schedule.timesRan >= 1) this.clearSchedule(schedule.id);
        }
    }

    reset() {
        this.ticks = 0;
        this.cycles = 0;
    }

    /**
     * 
     * @param callbackfn 
     * @param interval the interval in totalTicks inbetween each callback
     */
    scheduleRepeating(callbackfn: Function, interval: number): number {
        let id = this.getNewValidScheduleId();
        this.scheduled[id] = new SimulationTimeSchedule(callbackfn, interval, id, false);

        return id;
    }

    schedule(callbackfn: Function, timeout: number): number {
        let id = this.getNewValidScheduleId();
        this.scheduled[id] = new SimulationTimeSchedule(callbackfn, timeout, id, true);

        return id;
    }

    /**
     * 
     * @returns a new valid id for adding to the scheduled array
     */
    getNewValidScheduleId(): number {
        let id;

        //search for an empty spot left behind by clearSchedule
        //before adding a new spot entirely
        for (let i = 0; i < this.scheduled.length; i++) {
            const schedule = this.scheduled[i];
            if (schedule == null) {
                id = i;
                break;
            }
        }
        if (id == null) id = this.scheduled.length //basically push if there are not empty spots

        return id;
    }

    getScheduleById(id: number): SimulationTimeSchedule | null {
        return this.scheduled[id];
    }

    clearSchedule(id: number): void {
        for (let i = 0; i < this.scheduled.length; i++) {
            const schedule = this.scheduled[i];
            if (schedule == null) continue;
            if (schedule.id == id) {
                this.scheduled[i] = null;
                return;
            }
        }

        throw new Error(`no schedule with id ${id} found`)
    }

    clearAllSchedules(): void {
        this.scheduled = [];
    }
}

class Simulation {
    static animals: Animal[] = [];
    static foods: Food[] = [];
    static simulationTime: SimulationTime = new SimulationTime(0, 0);
    static targetTPS: number = 60;
    static lastTickTime: number;
    static interval: number | null;
    static feedingScheduleId: number;
    static tps: number;
    static lastTenTPS: number[] = [];
    static initialized: boolean = false;
    static settings: SimulationSettings;
    static get foodCount() {
        return this.foods.length;
    }

    static get populationSize() {
        return this.animals.length;
    }

    static get data() {
        return SimulationDataCollector.data;
    }

    static get averageAnimalTraits(): AnimalTraits {
        let output = {} as AnimalTraits;
        for (let trait in baseAnimalTraits) {
            let average = this.animals.map(animal => animal.traits[trait]) //array of trait values
                .reduce((a, b) => a + b, 0) / this.animals.length; //summed then divided by length (averaged)

            output[trait] = average;
        }

        return output
    }

    //average of almost everything because why not
    static get averageAnimal(): Animal {
        let averagePosition = this.animals.map(animal => animal.position)
            .reduce((a, b) => a.add(b), Vector2D.zero).scale(1 / this.animals.length);

        let averageEnergy = this.animals.map(animal => animal.energy)
            .reduce((a, b) => a + b, 0) / this.animals.length;

        let averageAge = this.animals.map(animal => animal.age.totalTicks)
            .reduce((a, b) => a + b, 0) / this.animals.length;

        let averageGeneration = this.animals.map(animal => animal.generation)
            .reduce((a, b) => a + b, 0) / this.animals.length;

        let averageOffspringCount = this.animals.map(animal => animal.offspringCount)
            .reduce((a, b) => a + b, 0) / this.animals.length;


        let averageAnimal = new Animal(averagePosition, averageEnergy, this.averageAnimalTraits, Math.round(averageGeneration))
        averageAnimal.age = new SimulationTime(Math.round(averageAge));
        averageAnimal.offspringCount = Math.round(averageOffspringCount);
        return averageAnimal;
    }

    static init(settings: SimulationSettings) {
        if (this.initialized) throw new Error("Simulation already initialized");
        this.settings = settings;
        this.initialized = true;
    }

    static updateFeedingCycleLength(): void {
        if (this.feedingScheduleId != null) this.simulationTime.clearSchedule(this.feedingScheduleId);
        this.feedingScheduleId = this.simulationTime.scheduleRepeating(this.feed.bind(this), this.settings.feedingCycleLength);
    }

    static setUpSimulation() {
        this.reset();
        this.addAnimal(this.settings.initialPopulation);
        this.feedingScheduleId = this.simulationTime.scheduleRepeating(this.feed.bind(this), this.settings.feedingCycleLength);
        if (this.settings.collectData) this.simulationTime.scheduleRepeating(SimulationDataCollector.collectData.bind(SimulationDataCollector), this.settings.dataCollectionFrequency);
        this.addFood(this.settings.foodPerFeedingCycle);
        SimulationDataCollector.collectData();
    }

    static reset() {
        this.animals = [];
        this.foods = [];
        this.simulationTime.reset();
        this.simulationTime.clearAllSchedules();
        SimulationDataCollector.data = [];
    }

    static get averageTPS(): number {
        return this.lastTenTPS.reduce((a, b) => a + b, 0) / Math.max(1, this.lastTenTPS.length);
    }

    static get simulating(): boolean {
        return this.interval != null;
    }

    static changeTargetTPS(targetTPS: number) {
        this.targetTPS = targetTPS;
        if (this.simulating) {
            this.pauseSimulation();
            this.continueSimulation();
        }
    }

    static getRandomPositionInWorld(): Vector2D {
        const radius = Math.sqrt(Math.random()) * this.settings.worldRadius;
        const theta = 2 * Math.random() * Math.PI;

        return new Vector2D(
            radius * Math.cos(theta),
            radius * Math.sin(theta)
        )
    }

    static addFood(amount) {
        for (let i = 0; i < amount; i++) {
            if (this.foods.length >= this.settings.maximumFood) break;
            let food = new Food(this.getRandomPositionInWorld(), this.settings.foodEnergyValue)
            this.foods.push(food)
        }
    }

    static addAnimal(amount) {
        for (let i = 0; i < amount; i++) {
            let animal = new Animal(this.getRandomPositionInWorld(), 100, Object.assign({},baseAnimalTraits), 0)
            this.animals.push(animal)
        }
    }

    static tick() {
        for (let animal of this.animals) {
            animal.update()
        }

        this.foods = this.foods.filter(food => food.eaten == false);
        this.animals = this.animals.filter(animal => animal.alive);

        if (this.lastTickTime != null) {
            let deltaTime = 1000 / (Date.now() - this.lastTickTime);
            if (!isFinite(deltaTime)) deltaTime = 1000 / this.targetTPS
            this.tps = deltaTime;
            this.lastTenTPS.push(this.tps);
            if (this.lastTenTPS.length >= 11) this.lastTenTPS.shift()
        }
        this.simulationTime.tick();

        this.lastTickTime = Date.now();

        if (this.animals.length == 0) {
            alert("extinction 💀")
            this.pauseSimulation()
        }
    }

    static pauseSimulation() {
        if (!this.simulating) throw new Error("tried to pause the simulation, but the simulation is already paused")
        clearInterval(this.interval);
        this.interval = null;
    }

    static continueSimulation() {
        if (this.simulating) throw new Error("tried to continue the simulation, but the simulation is already running")
        this.interval = setInterval(this.tick.bind(this), 1000 / this.targetTPS);
    }

    static feed() {
        this.addFood(this.settings.foodPerFeedingCycle);

        //check if the interval needs to be changed
        if (this.settings.feedingCycleLength != this.simulationTime.getScheduleById(this.feedingScheduleId).scheduleInterval) this.updateFeedingCycleLength();
    }
}

export default Simulation;