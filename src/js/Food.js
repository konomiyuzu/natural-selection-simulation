class Food {
    static radius = 1;
    position;
    energy;
    eaten = false;
    constructor(position, energy) {
        this.position = position;
        this.energy = energy;
    }
}
export default Food;
