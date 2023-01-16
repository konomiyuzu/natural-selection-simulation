import Vector2D from "./lib/Vector2D";

class Food{
    static radius:number = 1;
    position:Vector2D;
    energy:number;
    eaten:boolean = false;

    constructor(position:Vector2D, energy:number){
        this.position = position;
        this.energy = energy;
    }
}

export default Food;