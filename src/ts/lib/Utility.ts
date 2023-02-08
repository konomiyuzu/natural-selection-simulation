class Utility{
    static clamp(num:number,min:number,max:number):number{
        return Math.min(max,Math.max(num,min))
    }

    static stringIsNumber(string:string): boolean{
        return !/(?!^-(\d+|\.)|\d+|\.)./g.test(string);
    }
}

export default Utility;