import Vector2D from "./Vector2D.js";

interface Canvas2DEntry {
    zIndex: number;
    draw: (context: CanvasRenderingContext2D) => void;
    args: object;
}

export class Canvas2DRectangleEntry implements Canvas2DEntry {
    zIndex: number;
    args: {
        position: Vector2D,
        dimensions: Vector2D,
        color: string
    }

    /**
     * @param {Vector2D} position should be in canvas coordinates
     * @param {Vector2D} dimensions a vector2D representing the width and height of the rectangle
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     */
    constructor(position: Vector2D, dimensions: Vector2D, zIndex: number = 0, color: string = "#FFFFFF") {
        this.zIndex = zIndex;

        this.args = {
            position: position,
            dimensions: dimensions,
            color: color
        };
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = this.args.color;
        context.fillRect(this.args.position.x, this.args.position.y, this.args.dimensions.x, this.args.dimensions.y)
    }
}

export class Canvas2DCircleEntry implements Canvas2DEntry {
    zIndex: number;
    args: {
        position: Vector2D,
        radius: number,
        color: string
    }

    /**
     * @param {Vector2D} position should be in canvas coordinates
     * @param {number} radius a number representing the radius of the circle
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     */
    constructor(position: Vector2D, radius: number, zIndex: number = 0, color: string = "#FFFFFF") {
        this.zIndex = zIndex;

        this.args = {
            position: position,
            radius: radius,
            color: color
        };
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = this.args.color;
        context.strokeStyle = this.args.color;

        context.beginPath();
        context.arc(this.args.position.x, this.args.position.y, this.args.radius, 0, 2 * Math.PI);
        context.fill();
        context.stroke();

    }
}

export class Canvas2DLineEntry implements Canvas2DEntry {
    zIndex: number;
    args: {
        pointA: Vector2D,
        pointB: Vector2D,
        lineSize: number,
        color: string
    }

    /**
     * 
     * @param {Vector2D} pointA a Vector2D representing the line's starting point in canvas coordinates
     * @param {Vector2D} pointB a Vector2D representing the line's ending point in canvas coordinates
     * @param {number} lineSize a number representing the line's stroke width
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     */
    constructor(pointA: Vector2D, pointB: Vector2D, lineSize: number = 1, zIndex: number = 0, color: string = "#FFFFFF") {
        this.zIndex = zIndex;
        this.args = {
            pointA: pointA,
            pointB: pointB,
            lineSize: lineSize,
            color: color
        }
    }

    draw(context: CanvasRenderingContext2D) {
        context.strokeStyle = this.args.color;
        context.lineWidth = this.args.lineSize;
        context.beginPath();
        context.moveTo(this.args.pointA.x, this.args.pointA.y);
        context.lineTo(this.args.pointB.x, this.args.pointB.y);
        context.stroke();
    }
}

export class Canvas2DPolygonEntry implements Canvas2DEntry {
    zIndex: number;
    args: {
        points: Vector2D[],
        color: string
    }

    /**
     * 
     * @param {Vector2D[]} points an array of Vector2Ds representing the vertices in the polygon, should be in canvas coordinates
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     */
    constructor(points: Vector2D[], zIndex: number = 0, color: string = "#FFFFFF") {
        this.zIndex = zIndex;
        this.args = {
            points: points,
            color: color
        }
    }

    draw(context: CanvasRenderingContext2D): void {
        context.fillStyle = this.args.color;
        context.beginPath()
        context.moveTo(this.args.points[0].x, this.args.points[0].y)
        for (let i = 0; i < this.args.points.length; i++) {
            let point = this.args.points[(i + 1) % this.args.points.length];
            context.lineTo(point.x, point.y)
        }
        context.closePath()
        context.fill()
    }
}

export class Canvas2DTextEntry implements Canvas2DEntry{
    zIndex: number;
    args: {
        position: Vector2D,
        text: string,
        color: string,
        fontSize: number
    }

    /**
     * @param {Vector2D} position should be in canvas coordinates
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     */
    constructor(position: Vector2D, text: string, fontSize: number, zIndex: number = 0, color: string = "#FFFFFF") {
        this.zIndex = zIndex;

        this.args = {
            position: position,
            text: text,
            color: color,
            fontSize: fontSize
        };
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = this.args.color;
        context.textAlign = "center";
        context.font = `${this.args.fontSize}px arial`
        context.fillText(this.args.text,this.args.position.x, this.args.position.y)
    }
}

export default class Canvas2D {
    canvas: HTMLCanvasElement;
    drawQueue: Canvas2DEntry[] = [];

    /**
     * 
     * @param {HTMLCanvasElement} canvas the html canvas element
     * @description initializes the Canvas2D class, should be ran before any other functions in this class
     */
    constructor(canvas: HTMLCanvasElement) {
        if (canvas == null) throw new Error("Canvas cannot be null")
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.canvas = canvas;
    }

    updateDimensions() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    /**
     * 
     * @param {Canvas2DEntry} Canvas2DEntry the entry to be added 
     * @description adds a draw queue entry into the draw queue using binaray search to insert the object into the correct index accounting for
     * z indexes, objects inserted with the same zIndex are sorted according to when they were inserted, with the last inserted being on top and the first
     * inserted being in the bottom
     */
    addToDrawQueue(Canvas2DEntry: Canvas2DEntry): void {
        const arr = this.drawQueue.map(queueEntry => queueEntry.zIndex);
        const value = Canvas2DEntry.zIndex;
        let index: number;
        let start = 0;
        let end = arr.length - 1;

        //hard coded shortcuts for edge cases
        if (arr.length == 0 || arr[start] > value) index = 0;
        if (arr[end] <= value) index = end + 1;

        while (index == null) {
            let middle = Math.floor((start + end) / 2)

            if (arr[middle] <= value) start = middle + 1;
            else if (arr[middle] > value) end = middle - 1;

            //meaning the comparison array is now [a,b] or [a]
            if (end - start <= 1) {
                if (value < arr[start]) index = start; //this will insert before start since thats how splice works [c,a,b]
                else if (value >= arr[end]) index = end + 1; //this will insert after end [a,b,c]
                else index = start + 1; //same here but with start instead [a,c,b]

                break;
            }
        }

        this.drawQueue.splice(index, 0, Canvas2DEntry);
    }

    //all methods should eventually get one of these, then the initialization Error will be thrown
    get context(): CanvasRenderingContext2D {
        return this.canvas.getContext("2d");
    }

    get width(): number {
        return this.canvas.width;
    }

    get height(): number {
        return this.canvas.height;
    }

    /**
     * @description draws everything in the draw queue in order (ordered by zIndex)
     * also clears the drawQueue for next frame (but does not clear the screen)
     */
    draw(): void {
        for (let i = 0; i < this.drawQueue.length; i++) {
            this.drawQueue[i].draw(this.context)
        }

        this.drawQueue = [];
    }

    /**
     * 
     * @param {Vector2D} position vector coordinates representing the position of the point
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color css color string
     * @description adds a point (1*1 square) to the draw queue
     */
    queuePoint(position: Vector2D, zIndex: number = 0, color: string = "#FFFFFF"): void {
        const entry = new Canvas2DRectangleEntry(
            this.vectorCoordinatesToCanvasCoordinates(position),
            new Vector2D(1, 1),
            zIndex,
            color
        );

        this.addToDrawQueue(entry);
    }

    /**
     * 
     * @param {Vector2D} position vector coordinates representing the top right corner of the rectangle
     * @param {Vector2D} dimensions a vector2D with the x and y coordinates representing the width and height respectively
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     * @description adds a rectangle to the draw queue
     */
    queueRectangle(position: Vector2D, dimensions: Vector2D, zIndex: number = 0, color: string = "#FFFFFF"): void {
        const entry = new Canvas2DRectangleEntry(
            this.vectorCoordinatesToCanvasCoordinates(position),
            dimensions,
            zIndex,
            color
        )

        this.addToDrawQueue(entry);
    }

    /**
     * 
     * @param {Vector2D} position vector coordinates representing the center of the rectangle
     * @param {Vector2D} dimensions a vector2D with the x and y coordinates representing the width and height respectively
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     * @description adds a centered rectangle to the draw queue
     */
    queueCenteredRectangle(position: Vector2D, dimensions: Vector2D, zIndex: number = 0, color: string = "#FFFFFF"): void {
        const centeredPosition = new Vector2D(
            position.x - (dimensions.x / 2),
            position.y + (dimensions.y / 2)
        )

        const entry = new Canvas2DRectangleEntry(
            this.vectorCoordinatesToCanvasCoordinates(centeredPosition),
            dimensions,
            zIndex,
            color
        )

        this.addToDrawQueue(entry)
    }

    /**
     * 
     * @param {Vector2D} position vector coordinates representing the top right corner of the square
     * @param {number} size a number representing the size of the square
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     * @description adds a square to the draw queue
     */
    queueSquare(position: Vector2D, size: number, zIndex: number = 0, color: string = "#FFFFFF"): void {
        const entry = new Canvas2DRectangleEntry(
            this.vectorCoordinatesToCanvasCoordinates(position),
            new Vector2D(size, size),
            zIndex,
            color
        )

        this.addToDrawQueue(entry);
    }

    /**
     * 
     * @param {Vector2D} position vector coordinates representing the center of the square
     * @param {number} size a number representing the size of the square
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     * @description adds a centered square to the draw queue
     */
    queueCenteredSquare(position: Vector2D, size: number, zIndex: number = 0, color: string = "#FFFFFF"): void {
        const centeredPosition = new Vector2D(
            position.x - (size / 2),
            position.y + (size / 2)
        )

        const entry = new Canvas2DRectangleEntry(
            this.vectorCoordinatesToCanvasCoordinates(centeredPosition),
            new Vector2D(size, size),
            zIndex,
            color
        )

        this.addToDrawQueue(entry)
    }

    /**
     * 
     * @param {Vector2D} position vector coordinates representing the center of the cirlce
     * @param {number} radius a number representing the radius of the circle
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     * @description adds a circle to the draw queue
     */
    queueCircle(position: Vector2D, radius: number, zIndex: number = 0, color: string = "#FFFFFF"): void {
        const entry = new Canvas2DCircleEntry(
            this.vectorCoordinatesToCanvasCoordinates(position),
            radius,
            zIndex,
            color
        )

        this.addToDrawQueue(entry)
    }

    /**
     * 
     * @param {Vector2D} pointA vector coordinates representing the starting point of the line
     * @param {Vector2D} pointB vector coordinates representing the ending point of the line
     * @param {number} lineSize a number representing the line's stroke width
     * @param {number} zIndex a number representing the zIndex
     * @param {string} color a css color string
     */
    queueLine(pointA: Vector2D, pointB: Vector2D, lineSize: number = 1, zIndex: number = 0, color: string = "#FFFFFF"): void {
        const entry = new Canvas2DLineEntry(
            this.vectorCoordinatesToCanvasCoordinates(pointA),
            this.vectorCoordinatesToCanvasCoordinates(pointB),
            lineSize,
            zIndex,
            color
        )

        this.addToDrawQueue(entry);
    }

    queuePolygon(points: Vector2D[], zIndex: number = 0, color: string = "#FFFFFF"): void {
        const entry = new Canvas2DPolygonEntry(
            points.map(vector2D => this.vectorCoordinatesToCanvasCoordinates(vector2D)),
            zIndex,
            color
        )

        this.addToDrawQueue(entry)
    }

    queueText(position: Vector2D, text: string, fontSize:number, zIndex: number = 0, color:string = "#FFFFFF"): void{
        const entry = new Canvas2DTextEntry(
            this.vectorCoordinatesToCanvasCoordinates(position),
            text,
            fontSize,
            zIndex,
            color
        )

        this.addToDrawQueue(entry);
    }

    /**
     * @description clears the canvas
     */
    clear() {
        const context = this.context;
        context.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 
     * @param {Vector2D} vector2D a Vector2D in vector coordinates
     * @returns modifed Vector2D in canvas coordinates
     * @description converts the vector coordinate system ((0,0) being in the middle and y up) into
     * canvas coordinates ((0,0) being top right and y down) 
     */
    vectorCoordinatesToCanvasCoordinates(vector2D: Vector2D): Vector2D {
        let offsetVector = new Vector2D(this.width / 2, this.height / 2);
        vector2D = vector2D.add(offsetVector);
        return new Vector2D(vector2D.x, this.height - vector2D.y);
    }

    /**
    * 
    * @param {Vector2D} vector2D a Vector2D in canvas coordinates
    * @returns modifed Vector2D in vector coordinates
    * @description converts the canvas coordinate system ((0,0) being in the top right and y down) into
    * vector coordinates ((0,0) being middle and y up) 
    */
    canvasCoordinatesToVectorCoordinates(coordinates: Vector2D): Vector2D {
        let offsetVector = new Vector2D(this.width / 2, this.height / 2);
        coordinates = coordinates.sub(offsetVector);
        return new Vector2D(coordinates.x, -coordinates.y)
    }
}