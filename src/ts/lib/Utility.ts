class Utility{
    static clamp(num:number,min:number,max:number):number{
        return Math.min(max,Math.max(num,min))
    }
}

export default Utility;