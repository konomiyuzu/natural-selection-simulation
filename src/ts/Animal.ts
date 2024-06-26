import Food from "./Food";
import Random from "./lib/Random";
import Utility from "./lib/Utility";
import Vector2D from "./lib/Vector2D";
import AnimalNames from "./NameList";
import Simulation, { SimulationTime } from "./Simulation";

export interface AnimalTraits{
    speed: number;
    sense: number;
    reproductiveBuffer: number;
    offspringInvestment: number;
}

//this class is for settings that would be editable by the user;
export interface AnimalSettings{
    TraitEffectConstants:AnimalTraits;
    EnergyCostConstants:{
        speed:number
        sense:number
        baseReproductionCost:number
    };

    maximumAge:number;
}

export const baseAnimalTraits: AnimalTraits = {
    speed:1,
    sense:1,
    reproductiveBuffer:1,
    offspringInvestment:1,
}

export enum AnimalActions{
    searchingForFood = "searching for food",
    movingTowardsFood = "moving towards food",
    decidingOnAction = "deciding on action",
    wandering = "wandering",
    reproducing = "reproducing"
}

export enum AnimalDeathTypes{
    starvation = "starvation",
    oldAge = "old age"
}

export const AnimalTraitsClampValues:{
    [key in keyof AnimalTraits]:{
        min:number;
        max:number
    }
} = {
    speed:{min:0.0001,max:Infinity},
    sense:{min:0.0001,max:Infinity},
    reproductiveBuffer:{min:0.0001,max:Infinity},
    offspringInvestment:{min:0.0001,max:Infinity}
};

export class Animal {
    static radius: number = 10;
    static settings: AnimalSettings;
    static initialized: boolean = false;
    name: typeof AnimalNames[number];
    age: SimulationTime = SimulationTime.zero;
    alive: boolean = true;
    energy: number;
    position: Vector2D;
    currentAction: AnimalActions;
    reasonForDeath: AnimalDeathTypes | "still alive" = "still alive";
    traits: AnimalTraits;
    memory: {
        moveTarget: Vector2D | null;
        targetFood: Food | null;
    } = {} as typeof this.memory;
    offspringCount: number = 0;
    offsprings: Animal[] = [];
    generation: number;

    get sightRange():number {
        return Animal.settings.TraitEffectConstants.sense * this.traits.sense;
    }

    get movementEnergyCost(): number{
        return Animal.settings.EnergyCostConstants.speed * (1.5 ** this.traits.speed) * this.traits.speed;
    }

    get reproductionCost(): number{
        return Animal.settings.EnergyCostConstants.baseReproductionCost + this.offspringStartingEnergy
    }

    get offspringStartingEnergy(): number{
        return this.traits.offspringInvestment * Animal.settings.TraitEffectConstants.offspringInvestment
    }

    get energyRequiredForReproductionAttempt(): number{
        return this.reproductionCost + this.reproductionBuffer;
    }

    get reproductionBuffer(): number{
        return (this.traits.reproductiveBuffer) * Animal.settings.TraitEffectConstants.reproductiveBuffer;
    }

    get energyCostPerDay(): number{
        return (this.metabolism + this.movementEnergyCost)* 100
    }

    get metabolism(): number{
        return this.traits.sense * Animal.settings.EnergyCostConstants.sense;
    }

    get moveTarget(): Vector2D {
        return this.memory.moveTarget;
    }

    get targetFood(): Food{
        return this.memory.targetFood;
    }

    set moveTarget(moveTarget: Vector2D) {
        this.memory.moveTarget = moveTarget;
    }

    set targetFood(targetFood: Food){
        this.memory.targetFood = targetFood;
    }

    static init(settings:AnimalSettings){
        if(this.initialized) throw new Error("Animal already initialized");
        this.settings = settings
        this.initialized = true;
    }

    setMoveTarget(moveTarget: Vector2D) {
        this.moveTarget = moveTarget;
    }

    setTargetFood(targetFood: Food){
        this.targetFood = targetFood;
    }

    move(): void {
        let targetVector = this.moveTarget.sub(this.position);
        let speed = this.traits.speed;
        let maxDistance = speed * Animal.settings.TraitEffectConstants.speed;
        let distance = targetVector.length;
        let direction = targetVector.normalized;
        if (distance == 0) {
            this.moveTarget = null;
            return;
        }

        if (distance > maxDistance) {
            this.position = this.position.add(direction.scale(maxDistance))
            this.energy -= this.movementEnergyCost
        } else {
            this.position = this.position.add(direction.scale(distance))
            this.energy -= this.movementEnergyCost * (distance / maxDistance);
        }
    }

    chooseFood(foods: Food[]): Food | null {

        let closestFood: Food | null = null;
        let closestDistance = Infinity;

        for (let food of foods) {
            if (food.eaten) continue;
            let distance = Vector2D.getDistance(this.position, food.position);
            if (distance < closestDistance) {
                closestFood = food;
                closestDistance = distance;
            }
        }

        return closestFood;
    }

    /**chooseMate(mates: Animal[]): Animal | null{
        if(mates.length == 0) return null;

        let closestMate: Animal = null;
        let closestDistance = Infinity;

        for (let mate of mates) {
            let distance = Vector2D.getDistance(this.position, mate.position);
            if (distance < closestDistance) {
                closestMate = mate;
                closestDistance = distance;
            }
        }

        return closestMate;
    }*/

    searchForFood():void{
        let visibleFood = this.getVisibleFood();
        if(visibleFood.length == 0) this.wander();
        else {
            this.currentAction = AnimalActions.movingTowardsFood;
            this.targetFood = this.chooseFood(visibleFood);
            if(this.targetFood == null) {
                this.currentAction = AnimalActions.decidingOnAction;
                return
            }
            this.moveTarget = this.targetFood.position;
        }
    }

    moveTowardsFood():void{
        if(this.targetFood.eaten) {
            this.currentAction = AnimalActions.decidingOnAction;
        } else{
            if (Vector2D.getDistance(this.position, this.memory.targetFood.position) <= Animal.radius + Food.radius) {
                this.eat(this.memory.targetFood);
                this.currentAction = AnimalActions.decidingOnAction;
            }

            this.move();
        }
    }

    decideOnAction():void{
        this.currentAction = AnimalActions.searchingForFood;
    }

    reproduce():void{
        this.energy -= this.reproductionCost;
        const offspring = this.createOffspring();
        Simulation.animals.push(offspring);
        this.offsprings.push(offspring);
        this.offspringCount++;
    }

    /**searchForMate():void{
        if(this.energy <= this.energyCostForMating) {
            this.currentAction = AnimalActions.decidingOnAction;
            
            return;
        } 
        
        let mates = this.getVisibleAnimals().filter(mate => (mate.gender == this.oppositeGender && mate.currentAction == AnimalActions.searchingForMate));

        if(mates.length == 0){
            this.wander()
        }
        else {
            let mate = this.chooseMate(mates);
            
            if(mate == null){
                this.wander()
                return
            }

            this.currentAction = AnimalActions.mating;
            mate.currentAction = AnimalActions.mating;

            this.targetMate = mate;
            mate.targetMate = this;
        }
    }*/

    /**
    mate():void{
        if(!this.targetMate.alive) this.currentAction = AnimalActions.decidingOnAction;

        if(this.energy <= this.energyCostForMating){
            this.currentAction = AnimalActions.decidingOnAction;
            this.targetMate.currentAction = AnimalActions.decidingOnAction;
        }
        if (Vector2D.getDistance(this.position, this.targetMate.position) <= Animal.radius*2) {
            let mate = this.targetMate;

            this.energy -= this.energyCostForMating;
            mate.energy -= mate.energyCostForMating;

            Simulation.animals.push(this.createOffspring(mate));
            this.currentAction = AnimalActions.decidingOnAction;
            mate.currentAction = AnimalActions.decidingOnAction;
        } else{
            if(this.moveTarget != this.targetMate.position) this.moveTarget = this.targetMate.position;
            this.move()
        }
    }
    */

    createOffspring():Animal{
        let position = this.position
        let traits = {} as AnimalTraits;
        for(let trait in this.traits){
            let traitValue = this.traits[trait]
            let serverity = Simulation.settings.mutationSeverity * traitValue
            if(Random.randomChance(Simulation.settings.mutationChance)) traitValue += Random.randomFloat(-serverity,serverity)
            traits[trait] = Utility.clamp(traitValue,AnimalTraitsClampValues[trait].min,AnimalTraitsClampValues[trait].max);
        }
        return new Animal(position,this.offspringStartingEnergy, traits, this.generation + 1)
    }

    update(): void {
        if(!this.alive) throw new Error("tried to update a dead animal");

        if(this.currentAction == AnimalActions.decidingOnAction) this.decideOnAction();
        switch(this.currentAction){
            case AnimalActions.searchingForFood:
                this.searchForFood();
            break;
            case AnimalActions.movingTowardsFood:
                this.moveTowardsFood();
            break;
            case AnimalActions.wandering:
                this.wander();
            break;
        }

        this.age.tick();

        if(this.energy >= this.energyRequiredForReproductionAttempt) this.reproduce();
        this.energy -= this.metabolism;
        if (this.energy <= 0) this.die(AnimalDeathTypes.starvation);
    }

    die(deathClause: AnimalDeathTypes){
        this.alive = false;
        this.reasonForDeath = deathClause;
    }

    wander(): void{
        if(Random.randomChance(.01) || this.moveTarget == null)this.moveTarget = this.getRandomPositionInSightRange();
        this.move();
        if(Vector2D.getDistance(this.position, Vector2D.zero) > Simulation.settings.worldRadius){
            this.moveTarget = Vector2D.getDirection(this.position, Vector2D.zero).scale(this.sightRange).add(this.position);
        }
    }

    eat(food: Food): void {
        food.eaten = true;
        this.energy += food.energy;
    }

    getVisibleFood(foods = Simulation.foods): Food[]{
        let visibleFood: Food[] = [];
        for (let food of foods) {
            const relativePosition = this.position.sub(food.position)
            if ((relativePosition.x **2) + (relativePosition.y**2) <= (this.sightRange)**2) visibleFood.push(food)
        }
        return visibleFood;
    }

    getVisibleAnimals(animals = Simulation.animals): Animal[]{
        let visibleAnimals: Animal[] = [];
        for (let animal of animals) {
            if (Vector2D.getDistance(this.position, animal.position) <= this.sightRange) visibleAnimals.push(animal)
        }
        return visibleAnimals;
    }

    getRandomPositionInSightRange(): Vector2D{
        const r = Math.sqrt(Math.random()) * this.sightRange
        const theta = Math.random() * Math.PI * 2

        return new Vector2D(
            (r * Math.cos(theta)) + this.position.x,
            (r * Math.sin(theta)) + this.position.y,
        )
    }

    constructor(position: Vector2D, startingEnergy: number, traits: AnimalTraits, generation:number) {
        //none of the functions can be called if the animal doesnt exist so i just perform the check here
        if(!Animal.initialized) throw new Error("Animal not initialized")
        this.position = position;
        this.energy = startingEnergy;
        this.traits = traits;
        this.currentAction = AnimalActions.wandering;
        this.age.schedule((()=>{this.currentAction = AnimalActions.decidingOnAction}).bind(this),10)
        this.age.schedule((() => {this.die(AnimalDeathTypes.oldAge)}).bind(this), Animal.settings.maximumAge);
        this.name = Random.randomElementFromArray(AnimalNames);
        this.generation = generation;
    }
    
}

export default Animal;