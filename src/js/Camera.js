import Canvas2D from "./lib/Canvas2D";
import Vector2D from "./lib/Vector2D";
import Simulation from "./Simulation";
import Utility from "./lib/Utility";
import KeyboardInput from "./KeyboardInput";
import Food from "./Food";
import Animal from "./Animal";
class Camera {
    static position = Vector2D.zero;
    static canvas2D;
    static rendering = true;
    static renderingFood = true;
    static renderingAnimals = true;
    static renderingBackground = true;
    static zoom = 1;
    static cameraSpeed = 5;
    static lastMouseData = {};
    static initialized = false;
    static init(canvas, targetFPS = 60) {
        this.canvas2D = new Canvas2D(canvas);
        setInterval(this.update.bind(this), 1000 / targetFPS);
        window.addEventListener("resize", () => {
            this.canvas2D.updateDimensions();
        });
        window.addEventListener("wheel", this.handleScroll.bind(this));
        window.addEventListener("mousemove", this.handleMouseDrag.bind(this));
        window.addEventListener("mouseup", () => {
            this.lastMouseData = {};
        });
    }
    static mouseCoordinatesToWorldCoordinates(mouseCoordinates) {
        let bounding = this.canvas2D.canvas.getBoundingClientRect();
        let offsetVector = new Vector2D(bounding.left, bounding.top);
        //convert screen coordinates into canvas coordinates
        let projectedCoordinates = mouseCoordinates.sub(offsetVector);
        projectedCoordinates = this.canvas2D.canvasCoordinatesToVectorCoordinates(projectedCoordinates);
        return this.reverseProject(projectedCoordinates);
    }
    static handleScroll(e) {
        let zoomChange = KeyboardInput.keys.shift ? (-e.deltaY / 2000) * 5 : -e.deltaY / 2000;
        this.zoom += zoomChange;
        this.zoom = Utility.clamp(this.zoom, 0.1, 10);
    }
    static handleMouseDrag(e) {
        if (e.target != this.canvas2D.canvas || e.buttons == 0)
            return;
        e.preventDefault();
        if (this.lastMouseData.x == null || this.lastMouseData.y == null) {
            this.lastMouseData.x = e.x;
            this.lastMouseData.y = e.y;
        }
        else {
            let dx = e.x - this.lastMouseData.x;
            let dy = e.y - this.lastMouseData.y;
            this.position.x -= dx / this.zoom;
            this.position.y += dy / this.zoom;
            this.lastMouseData.x = e.x;
            this.lastMouseData.y = e.y;
        }
    }
    static changeZoom(newZoom) {
        this.zoom = newZoom;
    }
    static changeSpeed(newSpeed) {
        this.cameraSpeed = newSpeed;
    }
    static update() {
        let speed = KeyboardInput.keys.shift ? this.cameraSpeed * 3 : this.cameraSpeed;
        speed /= this.zoom;
        if (KeyboardInput.keys.w) {
            this.position.y += speed;
        }
        if (KeyboardInput.keys.s) {
            this.position.y -= speed;
        }
        if (KeyboardInput.keys.a) {
            this.position.x -= speed;
        }
        if (KeyboardInput.keys.d) {
            this.position.x += speed;
        }
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
        let x = Simulation.settings.worldSize.x / 2;
        let y = Simulation.settings.worldSize.y / 2;
        let topRight = this.project(new Vector2D(-x, y));
        let topLeft = this.project(new Vector2D(x, y));
        let bottomRight = this.project(new Vector2D(-x, -y));
        let bottomLeft = this.project(new Vector2D(x, -y));
        this.canvas2D.queuePolygon([topRight, topLeft, bottomLeft, bottomRight], -10, "#00FF0020");
    }
    static queueFoods() {
        for (let food of Simulation.foods) {
            let position = this.project(food.position);
            if (Math.abs(position.x) - Food.radius > this.canvas2D.width || Math.abs(position.y) - Food.radius > this.canvas2D.height)
                continue;
            this.canvas2D.queueCircle(new Vector2D(Math.round(position.x), Math.round(position.y)), Food.radius * this.zoom, 0, "lime");
        }
    }
    static queueAnimals() {
        for (let animal of Simulation.animals) {
            let position = this.project(animal.position);
            if (Math.abs(position.x) - Animal.radius > this.canvas2D.width || Math.abs(position.y) - Animal.radius > this.canvas2D.height)
                continue;
            this.canvas2D.queueCircle(new Vector2D(Math.round(position.x), Math.round(position.y)), Animal.radius * this.zoom, 0, "grey");
        }
    }
    static render() {
        if (!this.rendering)
            return;
        if (this.renderingFood)
            this.queueFoods();
        if (this.renderingAnimals)
            this.queueAnimals();
        if (this.renderingBackground)
            this.queueBackground();
        this.canvas2D.clear();
        this.canvas2D.draw();
    }
    static project(coordinates) {
        return coordinates.sub(this.position).scale(this.zoom);
    }
    static reverseProject(coordinates) {
        return coordinates.scale(1 / this.zoom).add(this.position);
    }
}
export default Camera;
