import Canvas2D from "./lib/Canvas2D";
import Vector2D from "./lib/Vector2D";
import Simulation from "./Simulation";
import Utility from "./lib/Utility";
import KeyboardInput from "./KeyboardInput";
import Food from "./Food";
import Animal from "./Animal";

class Camera {
    static position: Vector2D = Vector2D.zero;
    static canvas2D: Canvas2D;
    static rendering: boolean = true;
    static renderingFood: boolean = true;
    static renderingAnimals: boolean = true;
    static renderingBackground: boolean = true;
    static targetFPS: number;
    static interval: number| null = null;
    static zoom: number = 1;
    static cameraSpeed: number = 5;
    static senseVisualization: boolean = false;
    static animalNames: boolean = false;
    static lastFrameTime: number;
    static followTarget: Animal | null;
    static followOffspringOnReproduction: boolean;
    static lastTenFPS: number[] = [];
    static lastMouseData: {
        x: number | null
        y: number | null
    } = {} as typeof this.lastMouseData;
    static initialized: boolean = false;

    static get averageFPS(): number {
        return this.lastTenFPS.reduce((a, b) => a + b, 0) / Math.max(1,this.lastTenFPS.length);
    }

    static init(canvas: HTMLCanvasElement, targetFPS: number = 30) {
        if(!Simulation.initialized) throw new Error("Simulation not yet initialized");
        this.canvas2D = new Canvas2D(canvas);

        this.interval = setInterval(this.update.bind(this), 1000 / targetFPS)

        window.addEventListener("resize", () => {
            this.canvas2D.updateDimensions();
        })

        window.addEventListener("wheel", this.handleScroll.bind(this))
        window.addEventListener("mousemove", this.handleMouseDrag.bind(this))
        window.addEventListener("mousedown", this.handleMouseMiddleClick.bind(this))
        window.addEventListener("mouseup", () => {
            this.lastMouseData = {} as typeof this.lastMouseData;
        })

        this.targetFPS = targetFPS;
    }

    static reset():void{
        this.position = Vector2D.zero;
        this.zoom = 1;
        this.followTarget = null;
    }

    static changeTargetFPS(newTargetFPS:number){
        clearInterval(this.interval);
        this.targetFPS = newTargetFPS;
        this.interval = setInterval(this.update.bind(this), 1000 / this.targetFPS)
    }

    static mouseCoordinatesToWorldCoordinates(mouseCoordinates: Vector2D) {
        let bounding = this.canvas2D.canvas.getBoundingClientRect();
        let offsetVector = new Vector2D(bounding.left,bounding.top);

        //convert screen coordinates into canvas coordinates
        let projectedCoordinates = mouseCoordinates.sub(offsetVector);
        projectedCoordinates = this.canvas2D.canvasCoordinatesToVectorCoordinates(projectedCoordinates);
        return this.reverseProject(projectedCoordinates)
    }

    static handleScroll(e: WheelEvent) {
        if(e.target != this.canvas2D.canvas) return;
        let zoomChange = KeyboardInput.keys.ShiftLeft ? -e.deltaY / 2000 : (-e.deltaY / 2000) * 5;

        this.zoom += zoomChange * this.zoom;

        this.zoom = Utility.clamp(this.zoom, 0.1, 10)
    }

    static handleMouseMiddleClick(e: MouseEvent): void{
        if(e.target != this.canvas2D.canvas || e.buttons != 4) return;
        if(this.followTarget != null){
            this.followTarget = null;
            return;
        }

        const position = this.mouseCoordinatesToWorldCoordinates(new Vector2D(e.x, e.y))
        
        for(let animal of Simulation.animals){
            if(Vector2D.getDistance(position,animal.position) <= Animal.radius){
                this.followTarget = animal;
                break; 
            }
        }
    }

    static handleMouseDrag(e: MouseEvent) {
        if (e.target != this.canvas2D.canvas || e.buttons == 0 || e.buttons == 4) return;
        e.preventDefault();

        if (this.lastMouseData.x == null || this.lastMouseData.y == null) {
            this.lastMouseData.x = e.x;
            this.lastMouseData.y = e.y;
        } else {
            let dx = e.x - this.lastMouseData.x;
            let dy = e.y - this.lastMouseData.y;

            this.position.x -= dx / this.zoom;
            this.position.y += dy / this.zoom;

            this.lastMouseData.x = e.x;
            this.lastMouseData.y = e.y;
        }


    }

    static changeZoom(newZoom: number) {
        this.zoom = newZoom;
    }

    static changeSpeed(newSpeed: number) {
        this.cameraSpeed = newSpeed;
    }

    static update() {

        //check if followTarget has died
        if(this.followTarget != null && !this.followTarget.alive) {
            alert(`${this.followTarget.name} has died of ${this.followTarget.reasonForDeath}`);
            this.followTarget = null;
        }

        //switch target on reproduction
        if (this.followOffspringOnReproduction && this.followTarget != null && this.followTarget.offspringCount > 0){
            this.followTarget = this.followTarget.offsprings[0];
        }

        let speed = KeyboardInput.keys.ShiftLeft ? this.cameraSpeed : this.cameraSpeed * 3;
        let zoomSpeed = KeyboardInput.keys.ShiftLeft ? this.zoom/100 : this.zoom/20;
        speed /= this.zoom;

        if (KeyboardInput.keys.KeyW) {
            this.position.y += speed;
        }
        if (KeyboardInput.keys.KeyS) {
            this.position.y -= speed;
        }
        if (KeyboardInput.keys.KeyA) {
            this.position.x -= speed;
        }
        if (KeyboardInput.keys.KeyD) {
            this.position.x += speed;
        }
        if(this.followTarget != null){
            this.position = this.followTarget.position.copy();
        }
        if(KeyboardInput.keys.Space) {
            this.position = Vector2D.zero;
        }
        
        if(KeyboardInput.keys.Equal){
            this.zoom += zoomSpeed;
        }
        if(KeyboardInput.keys.Minus){
            this.zoom -= zoomSpeed;
        }

        this.zoom = Utility.clamp(this.zoom, 0.1, 10)
        this.render();
    }

    /**
    
    static queueBorders(){
        let x = Simulation.settings.worldSize.x/2;
        let y = Simulation.settings.worldSize.y/2;

        let topRight = this.project(new Vector2D(-x,y));
        let bottomLeft = this.project(new Vector2D(x,-y));

        this.canvas2D.queueRectangle(new Vector2D(-this.canvas2D.width/2,this.canvas2D.height/2),new Vector2D(this.canvas2D.width,(this.canvas2D.height/2) - topRight.y - 10),10,"black")
        this.canvas2D.queueRectangle(new Vector2D(-this.canvas2D.width/2,bottomLeft.y),new Vector2D(this.canvas2D.width,bottomLeft.y - 10 - (-this.canvas2D.height/2)),10,"black")
    }
     */

    static queueBackground() {
        let position = this.project(Vector2D.zero);
        this.canvas2D.queueCircle(position, Simulation.settings.worldRadius * this.zoom, -10, "#00FF0020")
    }

    static queueFoods(): void {
        const positions = [];
        for (let food of Simulation.foods) {
            let position = this.project(food.position);

            if (Math.abs(position.x) - Food.radius > this.canvas2D.width || Math.abs(position.y) - Food.radius > this.canvas2D.height) continue;
            positions.push(new Vector2D(Math.round(position.x),Math.round(position.y)));
        }

        this.canvas2D.queueManyCircles(positions, new Array(positions.length).fill(Food.radius * this.zoom), 0, "lime")
    }

    static queueAnimals(): void {
        const positions = [];
        const senseRadii = [];
        for (let animal of Simulation.animals) {
            let position = this.project(animal.position);

            if (Math.abs(position.x) - Animal.radius > this.canvas2D.width || Math.abs(position.y) - Animal.radius > this.canvas2D.height) continue;
            positions.push(new Vector2D(Math.round(position.x),Math.round(position.y)))
            if (this.senseVisualization) senseRadii.push(animal.traits.sense * Animal.settings.TraitEffectConstants.sense * this.zoom);
            if (this.animalNames) this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y + (Animal.radius + 3) * this.zoom)),animal.name,10 * this.zoom, 2)
        }

        this.canvas2D.queueManyCircles(positions, new Array(positions.length).fill(Animal.radius * this.zoom), 0, "grey")
        if(this.senseVisualization) this.canvas2D.queueManyCircles(positions, senseRadii, 1, "#FFFFFF44");
                
        
        //special info for follow target
        if(this.followTarget == null) return;
        const animal = this.followTarget;
        const position = this.project(animal.position);
        //sense visualization
        this.canvas2D.queueCircle(new Vector2D(Math.round(position.x),Math.round(position.y)),animal.traits.sense * Animal.settings.TraitEffectConstants.sense * this.zoom, 1, "#FFFFFF44");
        //line to move target
        if(animal.moveTarget != null) this.canvas2D.queueLine(position,this.project(animal.moveTarget),this.zoom,1,"white");
        //name
        this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y + (Animal.radius + 3) * this.zoom)),animal.name,10 * this.zoom, 2);
        //action text
        this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y + (Animal.radius + 13) * this.zoom)),animal.currentAction,10 * this.zoom, 2, "#cccccc");
        
        //energy
        this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y - (Animal.radius + 5) * this.zoom)),`energy: ${animal.energy.toFixed(2)}`,5 * this.zoom, 2, "#cccccc");
        //age
        this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y - (Animal.radius + 10) * this.zoom)),`age: ${animal.age.totalTicks/100}`,5 * this.zoom, 2, "#cccccc");
        //number of offspring
        this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y - (Animal.radius + 15) * this.zoom)),`offspring count: ${animal.offspringCount}`,5 * this.zoom, 2, "#cccccc");

        //stats
        this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y - (Animal.radius + 20) * this.zoom)),`speed: ${animal.traits.speed.toFixed(2)}`,3 * this.zoom, 2, "#cccccc");
        this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y - (Animal.radius + 23) * this.zoom)),`sense: ${animal.traits.sense.toFixed(2)}`,3 * this.zoom, 2, "#cccccc");
        this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y - (Animal.radius + 26) * this.zoom)),`reproductiveBuffer: ${animal.traits.reproductiveBuffer.toFixed(2)}`,3 * this.zoom, 2, "#cccccc");
        this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y - (Animal.radius + 29) * this.zoom)),`offspringInvestment: ${animal.traits.offspringInvestment.toFixed(2)}`,3 * this.zoom, 2, "#cccccc");

        //generation
        this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y - (Animal.radius + 32) * this.zoom)),`generation: ${animal.generation}`,3 * this.zoom, 2, "#cccccc");

    }
        
    static render() {
        if(!this.rendering) return;
        if(this.renderingFood)this.queueFoods();
        if(this.renderingAnimals)this.queueAnimals();

        if(this.renderingBackground)this.queueBackground();

        this.canvas2D.clear();
        this.canvas2D.draw();

        if (this.lastFrameTime != null) {    
            let deltaTime = 1000 / (Date.now() - this.lastFrameTime);
            if(!isFinite(deltaTime)) deltaTime = 1000/this.targetFPS;        
            this.lastTenFPS.push(deltaTime);
            if (this.lastTenFPS.length >= 11) this.lastTenFPS.shift();
        }

        this.lastFrameTime = Date.now();
    }

    static project(coordinates: Vector2D) {
        return coordinates.sub(this.position).scale(this.zoom);
    }

    static reverseProject(coordinates: Vector2D){
        return coordinates.scale(1/this.zoom).add(this.position);
    }
}

export default Camera; 