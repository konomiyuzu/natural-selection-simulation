import Canvas2D from "./lib/Canvas2D";
import Vector2D from "./lib/Vector2D";
import Simulation from "./Simulation";
import Utility from "./lib/Utility";
import KeyboardInput from "./KeyboardInput";
import Food from "./Food";
import Animal, { TraitEffectConstants } from "./Animal";

class Camera {
    static position: Vector2D = Vector2D.zero;
    static canvas2D: Canvas2D;
    static rendering: boolean = true;
    static renderingFood: boolean = true;
    static renderingAnimals: boolean = true;
    static renderingBackground: boolean = true;
    static zoom: number = 1;
    static cameraSpeed: number = 5;
    static lastMouseData: {
        x: number | null
        y: number | null
    } = {} as typeof this.lastMouseData;
    static initialized: boolean = false;

    static init(canvas: HTMLCanvasElement, targetFPS: number = 60) {
        this.canvas2D = new Canvas2D(canvas);

        setInterval(this.update.bind(this), 1000 / targetFPS)

        window.addEventListener("resize", () => {
            this.canvas2D.updateDimensions();
        })

        window.addEventListener("wheel", this.handleScroll.bind(this))
        window.addEventListener("mousemove", this.handleMouseDrag.bind(this))
        window.addEventListener("mouseup", () => {
            this.lastMouseData = {} as typeof this.lastMouseData;
        })

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

    static handleMouseDrag(e: MouseEvent) {
        if (e.target != this.canvas2D.canvas || e.buttons == 0) return;
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
        if(KeyboardInput.keys.Equal){
            this.zoom += zoomSpeed;
        }
        if(KeyboardInput.keys.Minus){
            this.zoom -= zoomSpeed;
        }
        if(KeyboardInput.keys.Space) {
            this.position = Vector2D.zero;
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
        for (let food of Simulation.foods) {
            let position = this.project(food.position);

            if (Math.abs(position.x) - Food.radius > this.canvas2D.width || Math.abs(position.y) - Food.radius > this.canvas2D.height) continue;
            this.canvas2D.queueCircle(new Vector2D(Math.round(position.x),Math.round(position.y)), Food.radius * this.zoom, 0, "lime")
        }
    }

    static queueAnimals(): void {
        for (let animal of Simulation.animals) {
            let position = this.project(animal.position);

            if (Math.abs(position.x) - Animal.radius > this.canvas2D.width || Math.abs(position.y) - Animal.radius > this.canvas2D.height) continue;
            this.canvas2D.queueCircle(new Vector2D(Math.round(position.x),Math.round(position.y)), Animal.radius * this.zoom, 0, "grey")
            if (this.senseVisualization) this.canvas2D.queueCircle(new Vector2D(Math.round(position.x),Math.round(position.y)), Math.sqrt(animal.traits.sense) * TraitEffectConstants.sense,1,"#FFFFFF03")
            if (this.animalNames) this.canvas2D.queueText(new Vector2D(Math.round(position.x),Math.round(position.y + (Animal.radius + 3) * this.zoom)),animal.name,10 * this.zoom, 2)
        }
    }
    static render() {
        if(!this.rendering) return;
        if(this.renderingFood)this.queueFoods();
        if(this.renderingAnimals)this.queueAnimals();

        if(this.renderingBackground)this.queueBackground();
        this.canvas2D.clear();
        this.canvas2D.draw();
    }

    static project(coordinates: Vector2D) {
        return coordinates.sub(this.position).scale(this.zoom);
    }

    static reverseProject(coordinates: Vector2D){
        return coordinates.scale(1/this.zoom).add(this.position);
    }
}

export default Camera; 