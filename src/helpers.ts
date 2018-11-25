/**
 * @description Access a Redux Controller
 */
export function GetController<T>(constructor: ObjectType<T>) {
    return (constructor as any).get() as T;
}

/**
 * @description Access a sub-property of an object safely
 */
export const GetSafely = <T>(fun: () => T, fallback?: T) => {
    let value: T = null;
    try {
        value = fun();
    } catch (e) {
        //Ignore Error
    }
    return (value === null || value === undefined) ? fallback : value;
}

export declare type ObjectType<T> = {
    new(...args: any[]): T;
};

