export class Random {
    static randomInteger(min, max) {
        if (min == null || max == null)
            throw new Error("minimum or maximum must not be null");
        if (min > max)
            throw new Error("minimum must not be larger than the maximum");
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static randomFloat(min, max) {
        if (min == null || max == null)
            throw new Error("minimum or maximum must not be null");
        if (min > max)
            throw new Error("minimum must not be larger than the maximum");
        return (Math.random() * (max - min + Number.MIN_VALUE)) + min;
    }
    static randomBoolean() {
        return this.randomChance(.5);
    }
    static randomChance(chance) {
        if (chance > 1 || chance < 0)
            throw new Error(`chance must be in the range [0,1] instead ${chance} was given`);
        return Math.random() <= chance;
    }
    static randomArryIndexFromArray(arr) {
        return this.randomInteger(0, arr.length);
    }
    static randomElementFromArray(arr) {
        return arr[this.randomArryIndexFromArray(arr)];
    }
}
export default Random;
