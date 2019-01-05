import { ObjectType } from "./helpers";
import * as React from 'react';
import { Component } from 'react';
import { debounce, throttle, distinctUntilChanged, map } from 'rxjs/operators';
import { timer } from 'rxjs';
import * as Rx from 'rxjs';
import { shallowEqualObjects } from "./utilts";
import { ReduxControllerRegistry } from "./redux-controller.registry";


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
                const rootStore = ReduxControllerRegistry.getStore();
                const subject = new Rx.BehaviorSubject(rootStore.getState());

                const rootStoreUnSubscription = rootStore.subscribe(() => {
                    subject.next(rootStore.getState());
                });

                this.reduxControllerSubscriptions.push({ unsubscribe: rootStoreUnSubscription });

                let source = subject.pipe(map(pathFunction));

                if (options.debounce) {
                    source = source.pipe(debounce(() => timer(options.debounce)));
                }
                if (options.throttle) {
                    source = source.pipe(throttle(() => timer(options.throttle)));
                }

                // Compare the out out to omit unwanted emits
                // source.pipe(distinctUntilChanged((o, n) => shallowEqualObjects(o, n)))

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
                return (<OriginalComponent {...this.props} {...this.state} />)
            };
        } as any
    }
}


export class Connect extends React.PureComponent<ConnectProps, ConnectState>{

    state = {};
    private reduxControllerSubscriptions = [];

    constructor(props) {
        super(props);
    }

    componentWillMount() {
        // Todo: this could be re-written in such a way where there exist only a single observable
        if (this.props.connector) {
            if (typeof this.props.connector === "function") {
                this.reduxControllerSubscriptions.push(ReduxControllerRegistry.rootStoreAsSubject.pipe(map(this.props.connector)).pipe(distinctUntilChanged((o, n) => shallowEqualObjects(o, n))).subscribe(d => {
                    this.setState(d);
                }));
                // Todo: Instead of shallow equals, use deep equals to compare new arrays created by filter functions
            } else {
                if (this.props.connector.global) {
                    this.reduxControllerSubscriptions.push(ReduxControllerRegistry.rootStoreAsSubject.pipe(map(this.props.connector.global)).pipe(distinctUntilChanged((o, n) => shallowEqualObjects(o, n))).subscribe(d => {
                        this.setState(d);
                    }));
                }
                if (this.props.connector.subscriptions) {
                    for (let subscription of this.props.connector.subscriptions) {
                        this.reduxControllerSubscriptions.push(subscription.subscribe(state => {
                            this.setState(state);
                        }));
                    }
                }
            }
        }

    }

    componentWillUnmount() {
        for (let subscription of this.reduxControllerSubscriptions) {
            if (subscription) {
                subscription.unsubscribe();
            }
        }
    }



    render() {
        return (
            React.cloneElement(this.props.children, { ...this.state, onModalViewScroll: (this.props as any).onModalViewScroll })
        );
    }
}

export interface ConnectProps {
    connector: iConnector,
    children: JSX.Element
}

export interface ConnectState {

}

export type iConnector = iConnectorMultipleSubscription | iConnectorMapFunction;

export interface iConnectorMultipleSubscription {
    global?: (rootState) => any,
    subscriptions?: Rx.Observable<any>[]
}

export type iConnectorMapFunction = (rootState: any) => any

export type iConnectorMap = { [components: string]: iConnector };