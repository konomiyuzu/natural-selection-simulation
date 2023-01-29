export type AllowedKeys = typeof KeyboardInput.allowedKeys[number]

class KeyboardInput{
    static allowedKeys = ["KeyW","KeyA","KeyS","KeyD","ShiftLeft","Space","Equal","Minus"] as const;
    static #keys:Record<AllowedKeys, boolean> = {} as Record<AllowedKeys, boolean>;
    static initialized = false;

    static get keys(){
        if(!this.initialized) this.init();
        
        return this.#keys
    }

    static init(){
        if(this.initialized) throw new Error("Input already initialized")

        for(let key of this.allowedKeys){
            this.#keys[key] = false;
        }

        document.addEventListener("keydown", (e) => {
            let key = e.code as AllowedKeys;
            if(this.allowedKeys.includes(key)){
                this.keys[key] = true;
            }
        })

        document.addEventListener("keyup", (e) => {
            let key = e.code as AllowedKeys;
            if(this.allowedKeys.includes(key)){
                this.keys[key] = false;
            }
        })

        this.initialized = true;
    }
}

export default KeyboardInput;