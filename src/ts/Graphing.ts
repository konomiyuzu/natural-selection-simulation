import { Chart, ChartTypeRegistry } from "chart.js/auto";
import Animal, { AnimalTraits } from "./Animal";
import Simulation, { SimulationData, SimulationTime } from "./Simulation";
type GraphFunction = (data: JsonSerialized<SimulationData>[], ...args: any) => Chart.ChartConfiguration;

//doesnt work perfectly but probably ok for now
type JsonSerialized<T> = {
    [K in keyof T]: T[K] extends (...args: any) => any ? never :
    T[K] extends object ? JsonSerialized<T[K]> :
    string
}

//this is messy and not scalable but im lazy and just want it done, maybe ill come back and work on a modular system later
export class GraphTypes {
    static defaultLineSettings = {
        fill: false,
        lineTension: .2,
        pointRadius: 0,
        borderWidth: 1,
    }
    static averageTraitsOverTime: GraphFunction = (data: JsonSerialized<SimulationData>[]): Chart.ChartConfiguration => {
        return {
            type: "line",
            data: {
                labels: data.map(x => `${x.time.cycles}.${x.time.ticks}`),
                datasets: [{
                    label: "Speed",
                    data: data.map(x => parseFloat(x.averageTraits.speed)),
                    borderColor: "#ffb5a1",
                    ...this.defaultLineSettings
                }, {
                    label: "Sense",
                    data: data.map(x => parseFloat(x.averageTraits.sense)),
                    borderColor: "#a1ffba",
                    ...this.defaultLineSettings
                }, {
                    label: "Reproductive Buffer",
                    data: data.map(x => parseFloat(x.averageTraits.reproductiveBuffer)),
                    borderColor: "#a1dcff",
                    ...this.defaultLineSettings
                }, {
                    label: "Offspring Investment",
                    data: data.map(x => parseFloat(x.averageTraits.offspringInvestment)),
                    borderColor: "#ffa1f6",
                    ...this.defaultLineSettings
                }],
            }
        } as Chart.ChartConfiguration;
    }

    static populationOverTime: GraphFunction = (data: JsonSerialized<SimulationData>[]): Chart.ChartConfiguration => {
        return {
            type: "line",
            data: {
                labels: data.map(x => `${x.time.cycles}.${x.time.ticks}`),
                datasets: [{
                    label: "Population",
                    data: data.map(x => parseFloat(x.populationSize)),
                    borderColor: "#818081",
                    ...this.defaultLineSettings
                }],
            }
        } as Chart.ChartConfiguration;
    }

    static populationAndFoodOverTime: GraphFunction = (data: JsonSerialized<SimulationData>[]): Chart.ChartConfiguration => {
        return {
            type: "line",
            data: {
                labels: data.map(x => `${x.time.cycles}.${x.time.ticks}`),
                datasets: [{
                    label: "Animal Population",
                    data: data.map(x => parseFloat(x.populationSize)),
                    borderColor: "#818081",
                    ...this.defaultLineSettings
                }, {
                    label: "Food Count",
                    data: data.map(x => parseFloat(x.foodCount)),
                    borderColor: "#00ff00",
                    ...this.defaultLineSettings
                }],
            }
        } as Chart.ChartConfiguration;
    }

    static traitValueFrequency: GraphFunction = (data: JsonSerialized<SimulationData>[], index: number, trait: keyof AnimalTraits, min=0,max=4): Chart.ChartConfiguration => {
        
        //i am sorry, me in the future.
        //this basically first rounds all the values into multiples of .1
        //then count how many of each appear
        //then plot it in a bar graph
        const usedData = data[index].allAnimalTraits?.map(x=>{
            let value = parseFloat(x[trait]) * 100
            value = Math.ceil(value/10) * 10  
            return value/100 //all of this rounds the values into multiples of 0.1
        })
        const dataArray = [];
        const labelsArray = [];

        if(usedData != null){
        //i could probably use a better algorithm, but im just going to count all of them because its 2 am and i want to see results
        for(let i = min; i < max +.1; i+= 0.1){
            dataArray.push(0) // initialize an array of zeros at just the correct length
            labelsArray.push(Math.round(i*100)/100);
        }
        
        
            usedData.forEach(x=>{
                dataArray[Math.round(((x-min)/.1))]++
            })
        }
        
        return {
            type: 'bar',
            data: {
                labels:labelsArray,
                datasets:[{
                    label:`${trait} at cycle ${data[index].time.cycles}.${data[index].time.ticks}`,
                    data:dataArray.map(x=>x/parseInt(data[index].populationSize)),
                    lineTension:.25,
                    fill:true
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        min:0,
                        max:1
                    }
                }
            },
        }as Chart.ChartConfiguration;
    }

    static getMinMax(data:JsonSerialized<SimulationData>[], trait: keyof AnimalTraits){
        let processedData = data.map(x=>x.allAnimalTraits?.map(x=>{
            let value = parseFloat(x[trait]) * 100
            value = Math.ceil(value/10) * 10  
            return value/100 //all of this rounds the values into multiples of 0.1
        }))
        let min = Infinity;
        let max = -Infinity;
        for(let data of processedData){
            min = Math.min(...data, min);
            max = Math.max(...data, max);
        }
        return {
            min:min,
            max:max
        }
    }
}
class Grapher {
    static initialized: boolean = false;
    static chart: Chart;
    static data: JsonSerialized<SimulationData>[];
    static init(data: JsonSerialized<SimulationData>[], canvas: HTMLCanvasElement) {
        this.data = data;

        Chart.defaults.color = '#FFF';

        const config = GraphTypes.averageTraitsOverTime(this.data);
        this.chart = new Chart(canvas, config as any);

        this.initialized = true;
    }

    static graph(graphFunction: GraphFunction) {
        const newData = graphFunction(this.data);
        this.chart.data.labels = newData.data.labels;
        this.chart.data.datasets = newData.data.datasets as any;

        this.chart.update();
    }

    static graphFrequency(index:number,trait: keyof AnimalTraits,min=0,max=4){
        const newData = GraphTypes.traitValueFrequency(this.data,index,trait,min,max)

        this.chart.config.type = "bar"
        this.chart.data.labels = newData.data.labels;
        this.chart.data.datasets = newData.data.datasets as any;
        this.chart.options = newData.options as any;
        this.chart.update("resize");
    }

    static animateFrequency(trait: keyof AnimalTraits, animationSpeed = 1){
        let i = 0;
        const minmax = GraphTypes.getMinMax(this.data,trait);
        let interval = setInterval(()=>{
            if(i>= this.data.length) clearInterval(interval);
            
            Grapher.graphFrequency(i,trait,0,minmax.max+.2);
            i++ 
        },1000/(animationSpeed*10))
    }
}

export default Grapher;