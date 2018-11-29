
import produce, { applyPatches } from "immer";
import { Store, combineReducers, createStore, applyMiddleware, Reducer } from "redux";
import * as Rx from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { } from "redux";
import * as _ from 'lodash';
import { shallowEqualObjects } from "./utilts";
import { ObjectType } from "./helpers";
import { ReduxControllerRegistry } from "./redux-controller.registry";
const changeCase = require('change-case');

/**
 * @description All Redux Controller must extend this class.
 */
export class ReduxControllerBase<state, rootState> {
    private reducers: any[] = [];
    rootPathFunction: (state) => any;

    omittedPaths: string[][] = [];
    rootStore: Store<rootState>;

    defaultState: state = {} as state;

    private setStore(store) {
        this.rootStore = store;
    }

    get state() {
        return this.rootPathFunction(this.rootStore.getState()) as state;
    }

    subscribeTo<T>(pathFunction: (state: state) => T) {
        const subject = new Rx.BehaviorSubject(pathFunction(this.rootPathFunction(this.rootStore.getState())));
        this.rootStore.subscribe(() => {
            subject.next(pathFunction(this.rootPathFunction(this.rootStore.getState())));
        });
        return subject.pipe(distinctUntilChanged());
    }

    subscribeToRootStore<T>(combineFunction: (state: rootState) => T) {
        const subject = new Rx.BehaviorSubject(this.rootStore.getState());
        this.rootStore.subscribe(() => {
            subject.next(this.rootStore.getState());
        });
        return subject.pipe(map(combineFunction)).pipe(distinctUntilChanged((o, n) => shallowEqualObjects(o, n)));
    }

    getReducerFunction() {
        return (state, action) => {
            const reducedState = (this.reducers as any[]).reduce((prev, fn) => fn(prev, action), state);
            return (reducedState || this.defaultState) as state;
        }
    }
}



export function ReduxController(pathFunction: (state) => any) {
    return function ReduxControllerInner<T>(constructor: ObjectType<T>) {
        (constructor as any).get = () => (constructor as any).instance;
        (constructor as any).instance = new constructor();
        ReduxControllerRegistry.controllers.push({
            class: (constructor as any),
            instance: (constructor as any).instance
        });
        (constructor as any).rootPathFunction = pathFunction;
        (constructor as any).instance.rootPathFunction = pathFunction;
        return constructor;
    };
}





export function ReduxWatch<rootState>(combineFunction: (state: rootState) => any) {
    // return the action creater function
    return (target, key: string, descriptor: TypedPropertyDescriptor<any>) => {

        if (!target.watchers) {
            target.watchers = [];
        }

        let actionName: string = target.actionNames[key];
        target.watchers.push((rootStoreAsSubject, rootStore) => {
            // Todo: Probably add the subscriber to a registry
            rootStoreAsSubject.pipe(map(combineFunction)).pipe(distinctUntilChanged((o, n) => shallowEqualObjects(o, n))).subscribe(data => {
                try {
                    const action = {
                        type: actionName,
                        payload: data
                    };
                    rootStore.dispatch(action);
                } catch (e) {
                    console.log("Error while dispatching action", e);
                }
            });
        });

        return descriptor;
    }
}



export function ReduxAction<payload, state>(actionName?: string) {
    // return the action creater function
    return (target, key: string, descriptor: TypedPropertyDescriptor<(payload: payload, state?: state, draft?: state) => any>) => {
        let originalMethod = descriptor.value;
        // Register the reducer

        if (!target.reducers) {
            target.reducers = [];
        }

        if (!target.actionNames) {
            target.actionNames = {}
        }

        // If action name is not given, produce actionName from method key
        if (!actionName) {
            actionName = changeCase.constantCase(key);
        }
        target.actionNames[key] = actionName;

        target.reducers.push((state, action) => {
            if (actionName == action.type) {
                let payload = action.payload;
                let argsToBeInjected = [payload];
                // Collect State Parameters Data Injection
                let metadataKey_matrixAction = `meta_parameters_${key}`;
                let matrixDataRequests = target[metadataKey_matrixAction];

                let shouldReadFromDraft = false;
                let draftPosition;

                if (!matrixDataRequests || matrixDataRequests.length == 0) {
                    shouldReadFromDraft = true;
                    draftPosition = 1;
                    argsToBeInjected[2] = state;
                } else {
                    for (let i = 0; i < matrixDataRequests.length; i++) {
                        if (matrixDataRequests[i]) {
                            if (matrixDataRequests[i] == "STATE") {
                                argsToBeInjected[i] = state;
                            } else if (matrixDataRequests[i] == "DRAFT") {
                                shouldReadFromDraft = true;
                                draftPosition = i;
                                argsToBeInjected[i] = "It's a DRAFT";
                            }
                        }
                    }
                }

                if (shouldReadFromDraft) {
                    return produce(state, draft => {
                        argsToBeInjected[draftPosition] = draft;
                        let that = target.get();
                        let result = originalMethod.apply(that, argsToBeInjected);
                    });
                }
                let that = target.get();
                const returnValue = originalMethod.apply(that, argsToBeInjected);
                if (Promise.resolve(returnValue) == returnValue) {
                    return state;
                }
                return returnValue;

            }
            return state || target.defaultState;
        });

        (descriptor as any).value = function (...args) {
            const action = {
                type: actionName,
                payload: args.length > 1 ? args : args[0]
            };
            this.reducers = target.reducers;
            target.rootStore = this.rootStore;
            target.watchers = this.watchers;
            this.rootStore.dispatch(action);
        }
        return descriptor;
    }
}


export function ReduxAsyncAction<payload, state>(actionName?: string, triggerGlobally?: boolean) {
    // return the action creater function
    return (target, key: string, descriptor: TypedPropertyDescriptor<(payload?: payload, state?: state, commit?: CommitFunction<any>) => any>) => {
        let originalMethod = descriptor.value;
        let commitReducerFunction = (state, action) => {
            return produce(state, commitFunctionToExecute);
        };
        let commitFunctionToExecute = (state) => { };

        // Register the reducer

        if (!target.reducers) {
            target.reducers = [];
        }

        // If action name is not given, produce actionName from method key
        if (!actionName) {
            actionName = changeCase.constantCase(key);
        }

        if (!target.actionNames) {
            target.actionNames = {}
        }
        target.actionNames[key] = actionName;

        target.reducers.push((state, action) => {
            if (actionName == action.type) {
                let payload = action.payload;
                let argsToBeInjected = [payload];
                // Collect State Parameters Data Injection
                let metadataKey_matrixAction = `meta_parameters_${key}`;
                let matrixDataRequests = target[metadataKey_matrixAction];

                let shouldReadFromDraft = false;
                let draftPosition;
                if (!matrixDataRequests || matrixDataRequests.length == 0) {
                    shouldReadFromDraft = true;
                    draftPosition = 2;
                    argsToBeInjected[1] = state;

                    let comitFunction = (prducerFunction) => {
                        commitFunctionToExecute = prducerFunction;
                        const action = {
                            type: `${actionName}_COMIT`,
                            payload: {}
                        };
                        target.rootStore.dispatch(action);
                        return target.rootPathFunction(target.rootStore.getState());
                    }

                    argsToBeInjected[2] = comitFunction;
                } else {
                    for (let i = 0; i < matrixDataRequests.length; i++) {
                        if (matrixDataRequests[i]) {
                            if (matrixDataRequests[i] == "STATE") {
                                argsToBeInjected[i] = state;
                            } else if (matrixDataRequests[i] == "COMIT") {
                                let comitFunction = (prducerFunction?) => {
                                    commitFunctionToExecute = prducerFunction;
                                    const action = {
                                        type: `${actionName}_COMIT`,
                                        payload: {}
                                    };
                                    target.rootStore.dispatch(action);
                                    return target.rootPathFunction(target.rootStore.getState());
                                }
                                draftPosition = i;
                                argsToBeInjected[i] = comitFunction;
                            }
                        } else {
                            // Not a Matrix Data
                        }
                    }
                }
                setTimeout(() => {
                    let asyncFunc = originalMethod.apply(target.get(), argsToBeInjected);
                    asyncFunc.then((d) => {
                        action.resolve && action.resolve(d);
                    }).catch(e => {
                        action.reject && action.reject(e);
                    });
                });

                return state;

            }
            return state || target.defaultState;
        });

        target.reducers.push((state, action) => {
            if (`${actionName}_RESOLVED` == action.type) {
                let payload = action.payload;
                console.log("Resolved Action called");
            }
            return state || target.defaultState;
        });

        target.reducers.push((state, action) => {
            if (`${actionName}_COMIT` == action.type) {
                return commitReducerFunction(state, action);
            }
            return state || target.defaultState;
        });

        (descriptor as any).value = function (...args) {
            return new Promise((res, rej) => {
                const action = {
                    type: actionName,
                    payload: args.length > 1 ? args : args[0],
                    resolve: res,
                    reject: rej
                };
                target.rootStore = this.rootStore;
                this.reducers = target.reducers;
                setTimeout(() => {
                    this.rootStore.dispatch(action);
                });
            });
        }
        return descriptor;
    }
}


export function ReduxInject(property: string) {
    return function markParameter(target: any, key: string, index: number) {
        var metadataKey = `meta_parameters_${key}`;
        if (!target[metadataKey]) {
            target[metadataKey] = [];
        }
        target[metadataKey][index] = property;
    }
}

export function ReduxEffect(actionName: string) {
    // return the action creator function
    return (target, key: string, descriptor: TypedPropertyDescriptor<(...any) => any>) => {

        let originalMethod = descriptor.value;

        target.reducers.push((state, action) => {
            if (actionName == action.type) {
                let that = target.get();
                setTimeout(() => {
                    let asyncFunc = originalMethod.apply(that, [action.payload, state]);
                });
                return state;
            }
            return state || target.defaultState;
        });

        (descriptor as any).value = function (...args) {
            const action = {
                type: actionName,
                payload: args.length > 1 ? args : args[0]
            };
            target.rootStore = this.rootStore;
            this.reducers = target.reducers;
            this.rootStore.dispatch(action);
        }
        return descriptor;
    }
}

export interface CommitFunction<T> {
    (fun: (state: T) => any): T;
}

