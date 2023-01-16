import Food from "./Food";
import Random from "./lib/Random";
import Utility from "./lib/Utility";
import Vector2D from "./lib/Vector2D";
import Simulation, { SimulationTime } from "./Simulation";
//this class is for settings that would be editable by the user;
export class AnimalSettings {
    static traitEffectConstants;
    static EnergyCostConstants;
    static maximumAge = 3000;
}
export const baseAnimalTraits = {
    speed: 1,
    sense: 1,
    reproductiveUrge: 1,
    offspringInvestment: 1,
};
export var TraitEffectConstants;
(function (TraitEffectConstants) {
    TraitEffectConstants[TraitEffectConstants["speed"] = 3] = "speed";
    TraitEffectConstants[TraitEffectConstants["sense"] = 50] = "sense";
    TraitEffectConstants[TraitEffectConstants["reproductiveUrge"] = 30] = "reproductiveUrge";
    TraitEffectConstants[TraitEffectConstants["offsprintInvestment"] = 50] = "offsprintInvestment";
})(TraitEffectConstants || (TraitEffectConstants = {}));
export var EnergyCostConstants;
(function (EnergyCostConstants) {
    EnergyCostConstants[EnergyCostConstants["speed"] = 0.1] = "speed";
    EnergyCostConstants[EnergyCostConstants["sense"] = 0.1] = "sense";
    EnergyCostConstants[EnergyCostConstants["baseReproductionCost"] = 100] = "baseReproductionCost";
})(EnergyCostConstants || (EnergyCostConstants = {}));
export var AnimalActions;
(function (AnimalActions) {
    AnimalActions["searchingForFood"] = "searching for food";
    AnimalActions["movingTowardsFood"] = "moving towards food";
    AnimalActions["decidingOnAction"] = "deciding on action";
    AnimalActions["wandering"] = "wandering";
    AnimalActions["reproducing"] = "reproducing";
})(AnimalActions || (AnimalActions = {}));
export const AnimalTraitsClampValues = {
    speed: { min: 0.01, max: Infinity },
    sense: { min: 0.01, max: Infinity },
    reproductiveUrge: { min: 0.01, max: Infinity },
    offspringInvestment: { min: 0.01, max: Infinity }
};
export class Animal {
    static radius = 10;
    age = SimulationTime.zero;
    alive = true;
    energy;
    position;
    currentAction;
    traits;
    memory = {};
    get movementEnergyCost() {
        return EnergyCostConstants.speed * (1.5 ** this.traits.speed) * this.traits.speed;
    }
    get reproductionCost() {
        return EnergyCostConstants.baseReproductionCost + (this.traits.offspringInvestment * TraitEffectConstants.offsprintInvestment);
    }
    get energyRequiredForReproductionAttempt() {
        return this.reproductionCost + ((1 / this.traits.reproductiveUrge) * TraitEffectConstants.reproductiveUrge);
    }
    get energyCostPerDay() {
        return (this.metabolism + this.movementEnergyCost) * 100;
    }
    get metabolism() {
        return this.traits.sense * EnergyCostConstants.sense;
    }
    get moveTarget() {
        return this.memory.moveTarget;
    }
    get targetFood() {
        return this.memory.targetFood;
    }
    set moveTarget(moveTarget) {
        this.memory.moveTarget = moveTarget;
    }
    set targetFood(targetFood) {
        this.memory.targetFood = targetFood;
    }
    setMoveTarget(moveTarget) {
        this.moveTarget = moveTarget;
    }
    setTargetFood(targetFood) {
        this.targetFood = targetFood;
    }
    move() {
        let targetVector = this.moveTarget.sub(this.position);
        let speed = this.traits.speed;
        let maxDistance = speed * TraitEffectConstants.speed;
        let distance = targetVector.length;
        let direction = targetVector.normalized;
        if (distance == 0) {
            this.moveTarget = null;
            return;
        }
        if (distance > maxDistance) {
            this.position = this.position.add(direction.scale(maxDistance));
            this.energy -= this.movementEnergyCost;
        }
        else {
            this.position = this.position.add(direction.scale(distance));
            this.energy -= this.movementEnergyCost * (distance / maxDistance);
        }
    }
    chooseFood(foods) {
        let closestFood = null;
        let closestDistance = Infinity;
        for (let food of foods) {
            if (food.eaten)
                continue;
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
    searchForFood() {
        let visibleFood = this.getVisibleFood();
        if (visibleFood.length == 0)
            this.wander();
        else {
            this.currentAction = AnimalActions.movingTowardsFood;
            this.targetFood = this.chooseFood(visibleFood);
            if (this.targetFood == null) {
                this.currentAction = AnimalActions.decidingOnAction;
                return;
            }
            this.moveTarget = this.targetFood.position;
        }
    }
    moveTowardsFood() {
        if (this.targetFood.eaten) {
            this.currentAction = AnimalActions.decidingOnAction;
        }
        else {
            if (Vector2D.getDistance(this.position, this.memory.targetFood.position) <= Animal.radius + Food.radius) {
                this.eat(this.memory.targetFood);
                this.currentAction = AnimalActions.decidingOnAction;
            }
            this.move();
        }
    }
    decideOnAction() {
        this.currentAction = AnimalActions.searchingForFood;
    }
    reproduce() {
        this.energy -= this.reproductionCost;
        Simulation.animals.push(this.createOffspring());
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
    createOffspring() {
        let position = this.position;
        let traits = {};
        for (let trait in this.traits) {
            let traitValue = this.traits[trait];
            let serverity = Simulation.settings.mutationSeverity * traitValue;
            if (Random.randomChance(Simulation.settings.mutationChance))
                traitValue += Random.randomFloat(-serverity, serverity);
            traits[trait] = Utility.clamp(traitValue, AnimalTraitsClampValues[trait].min, AnimalTraitsClampValues[trait].max);
        }
        return new Animal(position, this.traits.offspringInvestment * TraitEffectConstants.offsprintInvestment, traits);
    }
    update() {
        if (!this.alive)
            throw new Error("tried to update a dead animal");
        if (this.currentAction == AnimalActions.decidingOnAction)
            this.decideOnAction();
        switch (this.currentAction) {
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
        if (this.energy >= this.energyRequiredForReproductionAttempt)
            this.reproduce();
        this.energy -= this.metabolism;
        if (this.energy <= 0)
            this.alive = false;
    }
    die() {
        this.alive = false;
    }
    nextCycle() {
    }
    wander() {
        if (Random.randomChance(.01) || this.moveTarget == null)
            this.moveTarget = Simulation.getRandomPositionInWorld();
        this.move();
    }
    eat(food) {
        food.eaten = true;
        this.energy += food.energy;
    }
    getVisibleFood(foods = Simulation.foods) {
        let visibleFood = [];
        for (let food of foods) {
            if (Vector2D.getDistance(this.position, food.position) <= TraitEffectConstants.sense * this.traits.sense)
                visibleFood.push(food);
        }
        return visibleFood;
    }
    getVisibleAnimals(animals = Simulation.animals) {
        let visibleAnimals = [];
        for (let animal of animals) {
            if (Vector2D.getDistance(this.position, animal.position) <= TraitEffectConstants.sense * this.traits.sense)
                visibleAnimals.push(animal);
        }
        return visibleAnimals;
    }
    constructor(position, startingEnergy, traits) {
        this.position = position;
        this.energy = startingEnergy;
        this.traits = traits;
        this.currentAction = AnimalActions.decidingOnAction;
        this.age.schedule(this.die.bind(this), AnimalSettings.maximumAge);
    }
}
export default Animal;
