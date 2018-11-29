import { ObjectType } from "./helpers";

export function AutoUnsubscribe(func) {
    return (target, key: string, descriptor: TypedPropertyDescriptor<(...any) => any>) => {
        const originalMethod = descriptor.value;
        (descriptor as any).value = function (...args) {
            if (!this.reduxSubscriptions) {
                this.reduxSubscriptions = [];
                this.componentWillUnmount = () => {
                    for (let subscription of this.reduxSubscriptions) {
                        if (subscription) {
                            subscription.unsubscribe();
                        }
                    }
                    this.reduxSubscriptions = [];
                }
            }
            this.reduxSubscriptions.push(func.bind(this)(this));
            return originalMethod.bind(this)();
        }
        return descriptor;
    }
}


export function ReduxConnect(pathFunction: (state) => any) {
    return function ReduxControllerInner<T>(constructor: ObjectType<T>) {

        return constructor;
    };
}
