import Animal, { AnimalTraits, baseAnimalTraits } from "./Animal"
import Food from "./Food";
import Random from "./lib/Random";
import Vector2D from "./lib/Vector2D";

interface SimulationSettings {
    initialPopulation: number;
    worldSize: Vector2D;
    mutationChance: number;
    mutationSeverity: number;
    foodPerCycle: number;
    maximumFood: number;
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

    static get zero(): SimulationTime{
        return new SimulationTime(0,0);
    }

    constructor(totalTicks:number);
    constructor(ticks: number, cycle: number)

    constructor(ticks: number, cycle?: number) {
        if(cycle != null){
            if (ticks > 100 || ticks < 0) throw new Error("ticks in invalid range")
            this.ticks = ticks;
            this.cycles = cycle
        }else{
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
            if (schedule != null) schedule.tick();

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

    clearSchedule(id: number): void {
        for (let i = 0; i < this.scheduled.length; i++) {
            const schedule = this.scheduled[i];
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
    static tps: number;
    static lastTenTPS: number[] = [];
    static settings: SimulationSettings = {
        initialPopulation: 20,
        worldSize: new Vector2D(1500, 1500),
        mutationChance: .25,
        mutationSeverity: .05,
        foodPerCycle: 1000,
        maximumFood: 1000
    }

    static get averageAnimalTraits(): AnimalTraits{
        let output = {} as AnimalTraits;
        for(let trait in baseAnimalTraits){
            let average = this.animals.map(animal => animal.traits[trait]) //array of trait values
            .reduce((a,b) => a+b,0)/this.animals.length; //summed then divided by length (averaged)

            output[trait] = average;
        }

        return output
    }

    //average of almost everything because why not
    static get averageAnimal(): Animal{
        let averagePosition = this.animals.map(animal => animal.position)
        .reduce((a,b) => a.add(b),Vector2D.zero).scale(1/this.animals.length);

        let averageEnergy = this.animals.map(animal => animal.energy)
        .reduce((a,b) => a+b,0)/this.animals.length;

        let averageAge = this.animals.map(animal => animal.age.totalTicks)
        .reduce((a,b) => a+b,0)/this.animals.length;

        let averageAnimal = new Animal(averagePosition,averageEnergy,this.averageAnimalTraits)
        averageAnimal.age = new SimulationTime(Math.round(averageAge));
        return averageAnimal;
    }

    static startSimulation() {
        this.reset();
        this.addAnimal(this.settings.initialPopulation);
        this.simulationTime.scheduleRepeating(this.nextCycle.bind(this), 100);
        this.addFood(this.settings.foodPerCycle)
        if (!this.simulating) this.interval = setInterval(this.tick.bind(this), 1000 / this.targetTPS)
    }

    static reset() {
        this.animals = [];
        this.foods = [];
        this.simulationTime.reset();
        this.simulationTime.clearAllSchedules();
    }

    static get averageTPS(): number {
        return this.lastTenTPS.reduce((a, b) => a + b, 0) / this.lastTenTPS.length;
    }

    static get simulating(): boolean {
        return this.interval != null;
    }

    static changeSettings(settings: Partial<typeof this.settings>) {
        Object.assign(this.settings, settings);
    }

    static changeTargetTPS(targetTPS: number) {
        clearInterval(this.interval);
        this.targetTPS = targetTPS;
        this.interval = setInterval(this.tick.bind(this), 1000 / targetTPS)
    }

    static getRandomPositionInWorld(): Vector2D {
        return new Vector2D(
            Random.randomInteger(-this.settings.worldSize.x / 2, this.settings.worldSize.x / 2),
            Random.randomInteger(-this.settings.worldSize.y / 2, this.settings.worldSize.y / 2)
        )
    }

    static addFood(amount) {
        for (let i = 0; i < amount; i++) {
            let food = new Food(this.getRandomPositionInWorld(), 20)
            this.foods.push(food)
            if (this.foods.length >= this.settings.maximumFood) break;
        }
    }

    static addAnimal(amount) {
        for (let i = 0; i < amount; i++) {
            let animal = new Animal(this.getRandomPositionInWorld(), 100, baseAnimalTraits)
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
            if(!isFinite(deltaTime)) deltaTime = 1000/this.targetTPS        
            this.tps = deltaTime;
            this.lastTenTPS.push(this.tps);
            if (this.lastTenTPS.length >= 11) this.lastTenTPS.shift()
        }
        this.simulationTime.tick();

        this.lastTickTime = Date.now();
        
        if(this.animals.length == 0) {
            alert("extinction 💀")
            this.pauseSimulation()
        }
    }

    static pauseSimulation(){
        clearInterval(this.interval);
        this.interval = null;
    }

    static nextCycle() {
        this.addFood(this.settings.foodPerCycle);
        this.settings.foodPerCycle = Math.max(this.settings.foodPerCycle - 1, 100)
    }
}

export default Simulation;