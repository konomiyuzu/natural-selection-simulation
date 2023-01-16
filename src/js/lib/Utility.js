class Utility {
    static clamp(num, min, max) {
        return Math.min(max, Math.max(num, min));
    }
}
export default Utility;
