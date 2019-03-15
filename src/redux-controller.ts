
import produce, { applyPatches } from "immer";
import { Store, combineReducers, createStore, applyMiddleware, Reducer } from "redux";
import * as Rx from 'rxjs';
import { distinctUntilChanged, map, throttle } from 'rxjs/operators';
import { } from "redux";
import * as _ from 'lodash';
import { shallowEqualObjects, findPath, getDescendantProp } from "./utilts";
import { ObjectType, isAlreadyFetched } from "./helpers";
import { ReduxControllerRegistry } from "./redux-controller.registry";
const changeCase = require('change-case');
import immutable from 'object-path-immutable';
import { interval } from "rxjs";

/**
 * @description All Redux Controller must extend this class.
 */
export class ReduxControllerBase<state, rootState> {
    private reducers: Reducer[] = [];
    private stateDraft;

    rootPathFunction: (state) => any;

    omittedPaths: string[][] = [];
    rootStore: Store<rootState>;

    defaultState: state = {} as state;

    providers: {
        state: Partial<state>,
        cacheTimeout?: number
    } = {
            state: {},
            cacheTimeout: 0
        };
    providerMap: {
        [path: string]: (
            (
                (path: string | { from: number, to: number }) => any
            )
            |
            {
                isReduxAction: boolean,
                providerFunction: (path: string | { from: number, to: number }) => any
            }
        )
    } = {};

    commit: (commitFunction: (state: state) => void) => void;


    reducerForProvider = (state, action) => {
        const rootPathArray = findPath(this.rootPathFunction);
        const rootPath = rootPathArray.join('.');
        const shouldAction = action.payload && (rootPath == action.payload.rootPath);
        // Determines whether the path actually belongs to the current controller

        if (shouldAction && (action.type == "LOAD_THROUGH_PROVIDER" || action.type == "LOAD_THROUGH_TIME_RANGE_BASED_PROVIDER")) {
            const path = action.payload.path;
            let targetMap;
            try {
                targetMap = getDescendantProp(state, path)
            } catch (e) {
                // Ignore Error
            }
            if (!targetMap) {
                // For some edge cases if the target object is empty, initiate the target object with default value
                //! Need to check if this throws error for ProvidedKeyFunction
                return immutable.set(state, path, getDescendantProp(this.defaultState, path));
            }
        } else if (shouldAction && action.type == "LOAD_THROUGH_PROVIDER_SUCCESS") {
            const path = action.payload.path;
            const data = action.payload.data;
            return immutable.set(state, path, {
                lastUpdated: new Date().getTime(),
                data: data
            });
        } else if (shouldAction && action.type == "LOAD_THROUGH_TIME_RANGE_BASED_PROVIDER_SUCCESS") {
            const path = action.payload.path;
            const data = action.payload.data;
            const existingData = getDescendantProp(state, path);
            const loadedRange = { from: action.payload.from, to: action.payload.to };
            // Todo: Ideally Without just merging the array, we need to cross check for duplicate elements by considering a key
            return immutable.set(state, path, {
                loadedRanges: [existingData.loadedRanges, loadedRange],
                data: [existingData.data, data]
            });
        }

        return state;
    }

    initProviders() {
        let providerMap: { [path: string]: () => any } = {};
        function getProviders(obj: Object, path: string = '') {
            for (let key in obj) {
                if (obj[key] && obj[key].isProvider) {
                    // This will make sure that the load function could be mapped to an existing redux action
                    if (obj[key].isReduxAction) {
                        providerMap[path ? `${path}.${key}` : key] = obj[key];
                    } else {
                        providerMap[path ? `${path}.${key}` : key] = obj[key].providerFunction;
                    }

                } else {
                    getProviders(obj[key], path ? `${path}.${key}` : key);
                }
            }
        }
        getProviders(this.providers.state);
        this.providerMap = providerMap;
        this.reducers.push(this.reducerForProvider);
    }

    async loadBasedOnTimeRange<T>(pathFunction: (state: state) => T, { from, to }: { from: number, to: number }, forceRefresh?: boolean): Promise<T> {
        let pathArray = findPath(pathFunction);
        let rootPathArray = findPath(this.rootPathFunction);
        let path = pathArray.join('.')
        let rootPath = rootPathArray.join('.');

        const action = {
            type: 'LOAD_THROUGH_TIME_RANGE_BASED_PROVIDER',
            payload: {
                path,
                rootPath,
                from,
                to
            }
        };
        this.rootStore.dispatch(action);

        const mappedItem: {
            loadedRanges: { from: number, to: number }[],
            data: any
        } = getDescendantProp(this.state, path);

        if (mappedItem && (isAlreadyFetched(from, to, mappedItem.loadedRanges))) {
            return mappedItem as any;
        }

        if (this.providerMap[path]) {
            try {
                const provider = this.providerMap[path];

                if (typeof provider == "object" && provider.isReduxAction) {
                    const data = await provider.providerFunction({ from, to });
                } else {
                    let functionToCall: (...args) => any;
                    if (typeof provider == "object") {
                        functionToCall = provider.providerFunction;
                    } else {
                        functionToCall = provider;
                    }
                    const data = await functionToCall({ from, to });
                    const action = {
                        type: 'LOAD_THROUGH_TIME_RANGE_BASED_PROVIDER_SUCCESS',
                        payload: {
                            path,
                            rootPath,
                            data,
                            from,
                            to
                        }
                    };
                    this.rootStore.dispatch(action);
                }

                //* Note: This function essentially returns the whole array, Instead of filtering down only the items that are loaded. I think that's fine
                return getDescendantProp(this.state, path);
            } catch (e) {
                const action = {
                    type: 'LOAD_THROUGH_TIME_RANGE_BASED_PROVIDER_FAILED',
                    payload: {
                        path: path,
                        rootPath,
                        e,
                        from,
                        to
                    }
                };
                this.rootStore.dispatch(action);
                throw e;
            }
        } else {
            console.warn(`Tried to load path that is not provided : ${findPath(this.rootPathFunction).join('.')} -> ${path}`);
            return mappedItem as any;
        }
    }

    async load<T>(pathFunction: (state: state) => T, forceRefresh?: boolean): Promise<T> {
        // Get Safely the path provided
        let pathArray = findPath(pathFunction);
        let rootPathArray = findPath(this.rootPathFunction);
        let path = pathArray.join('.')
        let rootPath = rootPathArray.join('.');

        const action = {
            type: 'LOAD_THROUGH_PROVIDER',
            payload: {
                path,
                rootPath
            }
        };
        this.rootStore.dispatch(action);
        // The previous action will make sure that the provided path is never empty or not initiated
        let mappedItem: {
            lastUpdated: number,
            data: any
        } = getDescendantProp(this.state, path);

        // If item does not need to be loaded, then return the item
        const currentTime = new Date().getTime();
        if (
            !forceRefresh &&
            mappedItem &&
            (mappedItem.lastUpdated + this.providers.cacheTimeout > currentTime)
        ) {
            return mappedItem as any;
        }

        let primaryPath = path;
        // Fix for Object Key Providers
        if (!this.providerMap[path]) {
            let secondaryPath = pathArray.slice(0, pathArray.length - 1).join('.');
            if (this.providerMap[secondaryPath]) {
                path = secondaryPath;
            }
        }


        if (this.providerMap[path]) {
            const provider = this.providerMap[path];
            try {
                const provider = this.providerMap[path];

                if (typeof provider == "object" && provider.isReduxAction) {
                    const data = await provider.providerFunction(_.last(pathArray));
                } else {
                    let functionToCall: (...args) => any;
                    if (typeof provider == "object") {
                        functionToCall = provider.providerFunction;
                    } else {
                        functionToCall = provider;
                    }
                    const data = await functionToCall(_.last(pathArray));
                    const action = {
                        type: 'LOAD_THROUGH_PROVIDER_SUCCESS',
                        payload: {
                            path: primaryPath,
                            rootPath,
                            data
                        }
                    };
                    this.rootStore.dispatch(action);
                }
                return getDescendantProp(this.state, primaryPath);
            } catch (e) {
                const action = {
                    type: 'LOAD_THROUGH_PROVIDER_FAILED',
                    payload: {
                        path: primaryPath,
                        rootPath,
                        e
                    }
                };
                this.rootStore.dispatch(action);
                throw e;
            }
        } else {
            // Todo: Show hints in the warning
            console.warn(`Tried to load path that is not provided : ${findPath(this.rootPathFunction).join('.')} -> ${path}`);
            return mappedItem as any;
        }
    }

    private setStore(store) {
        this.rootStore = store;
    }

    get state() {
        if (this.stateDraft) {
            return this.stateDraft as state;
        }
        return this.rootPathFunction(this.rootStore.getState()) as state;
    }

    subscribeTo<T>(pathFunction: (state: state) => T) {
        const subject = new Rx.BehaviorSubject(pathFunction(this.rootPathFunction(this.rootStore.getState())));
        this.rootStore.subscribe(() => {
            subject.next(pathFunction(this.rootPathFunction(this.rootStore.getState())));
        });
        return subject.pipe(distinctUntilChanged());
    }

    subscribeToRootStore<T>(stateMapFunction: (state: rootState) => T) {
        const subject = new Rx.BehaviorSubject(this.rootStore.getState());
        this.rootStore.subscribe(() => {
            subject.next(this.rootStore.getState());
        });
        return subject.pipe(map(stateMapFunction)).pipe(distinctUntilChanged((o, n) => shallowEqualObjects(o, n)));
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





export function ReduxWatch<rootState>(stateMapFunction: (state: rootState) => any, throttleInMs?: number) {
    // return the action creator function
    return (target, key: string, descriptor: TypedPropertyDescriptor<any>) => {

        if (!target.watchers) {
            target.watchers = [];
        }

        let actionName: string = target.actionNames[key];
        target.watchers.push((rootStoreAsSubject, rootStore) => {
            // Todo: Probably add the subscriber to a registry

            rootStoreAsSubject.pipe(map(stateMapFunction)).pipe(
                distinctUntilChanged((o, n) => shallowEqualObjects(o, n)),
                ...throttleInMs ? [throttle(val => interval(throttleInMs))] : []
            ).subscribe(data => {
                try {
                    // const action = {
                    //     type: actionName,
                    //     payload: data
                    // };
                    // rootStore.dispatch(action);
                    descriptor.value.bind(target)(data);
                } catch (e) {
                    console.log("Error while dispatching action", e);
                }
            });
        });

        return descriptor;
    }
}

export function ReduxGuard<rootState>(guardFunction: (state: rootState, args?: any[]) => boolean) {
    // return the action creator function
    return (target, key: string, descriptor: TypedPropertyDescriptor<any>) => {
        const originalMethod = descriptor.value;
        (descriptor as any).value = function (...args) {
            if (guardFunction(target.get().rootStore.getState(), args)) {
                return originalMethod.apply(target.get(), args);
            }
            return null;
        }
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
                        const context = target.get();
                        context.stateDraft = draft;
                        let result = originalMethod.apply(context, argsToBeInjected);
                        context.stateDraft = null;
                    });
                }
                const context = target.get();
                context.stateDraft = argsToBeInjected[draftPosition];
                const returnValue = originalMethod.apply(context, argsToBeInjected);
                context.stateDraft = null;
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
    // return the action creator function
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

                    let commitFunction = (producerFunction) => {
                        commitFunctionToExecute = producerFunction;
                        const action = {
                            type: `${actionName}_COMMIT`,
                            payload: {}
                        };
                        target.rootStore.dispatch(action);
                        return target.rootPathFunction(target.rootStore.getState());
                    }

                    argsToBeInjected[2] = commitFunction;
                } else {
                    for (let i = 0; i < matrixDataRequests.length; i++) {
                        if (matrixDataRequests[i]) {
                            if (matrixDataRequests[i] == "STATE") {
                                argsToBeInjected[i] = state;
                            } else if (matrixDataRequests[i] == "COMMIT") {
                                let commitFunction = (producerFunction?) => {
                                    commitFunctionToExecute = producerFunction;
                                    const action = {
                                        type: `${actionName}_COMMIT`,
                                        payload: {}
                                    };
                                    target.rootStore.dispatch(action);
                                    return target.rootPathFunction(target.rootStore.getState());
                                }
                                draftPosition = i;
                                argsToBeInjected[i] = commitFunction;
                            }
                        } else {
                            // Not a Matrix Data
                        }
                    }
                }
                setTimeout(() => {
                    const context = target.get();
                    const modifiedContext = Object.assign(Object.create(Object.getPrototypeOf(context)), JSON.parse(JSON.stringify(context)));
                    modifiedContext.commit = argsToBeInjected[draftPosition];

                    let asyncFunc = originalMethod.apply(modifiedContext, argsToBeInjected);

                    asyncFunc.then((d) => {
                        action.resolve && action.resolve(d);
                    }).catch(e => {
                        action.reject && action.reject(e);
                    });
                    // let returnData;

                    // produce(context.state, async (draft) => {
                    //     modifiedContext.stateDraft = draft;
                    //     let asyncFunc = originalMethod.apply(modifiedContext, argsToBeInjected);
                    //     const data = await asyncFunc;
                    //     returnData = data;
                    //     const action = {
                    //         type: `${actionName}_COMMIT`,
                    //         payload: {}
                    //     };
                    //     target.rootStore.dispatch(action);
                    //     return data;
                    // }).then(d => {
                    //     action.resolve && action.resolve(returnData);
                    // }).catch(e => {
                    //     action.reject && action.reject(e);
                    // });

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
            if (`${actionName}_COMMIT` == action.type) {
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
        })

        // (descriptor as any).value = function (...args) {
        //     const action = {
        //         type: actionName,
        //         payload: args.length > 1 ? args : args[0]
        //     };
        //     target.rootStore = this.rootStore;
        //     this.reducers = target.reducers;
        //     this.rootStore.dispatch(action);
        // }
        return descriptor;
    }
}

export interface CommitFunction<T> {
    (fun: (state: T) => any): T;
}

export interface CachedState<T> {
    lastUpdated: number,
    data: T
}

export interface TimeBasedCachedState<T> {
    loadedRanges: { from: number, to: number }[],
    data: T
}

export function ProvidedState<T>(value: T): CachedState<T> {
    return {
        lastUpdated: 0,
        data: value
    }
}

export function ProvidedTimeBasedState<T>(value: T): TimeBasedCachedState<T> {
    return {
        loadedRanges: [],
        data: value
    }
}

export function Provider<T>(providerFunction: (...any) => Promise<T>, timeout?: number): CachedState<T> {

    return {
        providerFunction,
        isProvider: true
    } as any as CachedState<T>;
};

export function ProvideKey<T>(providerFunction: (key: string, ...arg) => Promise<T>, timeout?: number): { [key: string]: CachedState<T> } {

    return {
        providerFunction,
        isProvider: true
    } as any as { [key: string]: CachedState<T> };
};

export function ProvideTimeRangeBasedData<T>(providerFunction: (payload: { from: number, to: number }, ...args) => Promise<T | void>, isReduxAction?: boolean): TimeBasedCachedState<T> {
    return {
        providerFunction,
        isProvider: true,
        isReduxAction
    } as any as TimeBasedCachedState<T>;
};