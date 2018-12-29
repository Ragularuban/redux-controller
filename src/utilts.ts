
function shallowEqualArrays(arrA: any[], arrB: any[]) {
    if (arrA === arrB) {
        return true;
    }

    let len = arrA.length;

    if (arrB.length !== len) {
        return false;
    }

    for (var i = 0; i < len; i++) {
        if (arrA[i] !== arrB[i]) {
            return false;
        }
    }

    return true;
};


export function shallowEqualObjects(objA: Object, objB: Object) {
    if (objA === objB) {
        return true;
    }

    let aKeys = Object.keys(objA);
    let bKeys = Object.keys(objB);
    let len = aKeys.length;

    if (bKeys.length !== len) {
        return false;
    }

    for (let i = 0; i < len; i++) {
        let key = aKeys[i];

        if (objA[key] !== objB[key]) {
            return false;
        }
    }

    return true;
};

export function getDescendantProp(obj: Object, path: string) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}


export function findPath(pathFunc: (obj: any) => any) {
    let path: string[] = [];
    const tracker = new Proxy({}, {
        get(target, propKey) {
            path.push(propKey as string);
            return tracker;
        }
    });
    pathFunc(tracker);
    return path;
}
