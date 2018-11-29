import { ObjectType } from "./helpers";
import * as React from 'react';
import { Component } from 'react';
import { debounce, throttle, distinctUntilChanged } from 'rxjs/operators';
import { timer } from 'rxjs';
import { ReduxControllerRegistry } from ".";
import { shallowEqualObjects } from "./utilts";

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


export function ReduxConnect<RootState, ComponentProps>(pathFunction: (state: RootState) => Partial<ComponentProps>, options: {
    debounce?: number,
    throttle?: number
} = {}) {
    return function ReduxConnectInner(OriginalComponent: ObjectType<Component>) {
        return class ConnectedComponent extends React.PureComponent<any, any>{
            reduxControllerSubscriptions = [];

            componentWillMount() {
                let source = ReduxControllerRegistry.rootStoreAsSubject
                    .subscribeToRootStore(pathFunction as any);

                if (options.debounce) {
                    source = source.pipe(debounce(() => timer(options.debounce)));
                }
                if (options.throttle) {
                    source = source.pipe(throttle(() => timer(options.throttle)));
                }

                // Compare the out out to omit unwanted emits
                source.pipe(distinctUntilChanged((o, n) => shallowEqualObjects(o, n)))

                const subscription = source
                    .subscribe((state) => {
                        this.setState(state);
                    });

                // Track the subscription
                this.reduxControllerSubscriptions.push(subscription);
            }

            componentWillUnmount() {
                for (let subscription of this.reduxControllerSubscriptions) {
                    if (subscription) {
                        subscription.unsubscribe();
                    }
                }
                this.reduxControllerSubscriptions = [];
            }

            render() {
                return (<OriginalComponent { ...this.props } {...this.state } />)
            };
        } as any
    }
}
