import { getDescendantProp, findPath } from "./utilts";
import * as storage from 'redux-storage';
import { Providers, Environnement } from "./providers";
import debounce from 'redux-storage-decorator-debounce';
import filter from 'redux-storage-decorator-filter';
import { Store, combineReducers, createStore, applyMiddleware, Reducer, compose } from "redux";
import * as Rx from 'rxjs';
import * as _ from 'lodash';
import { ReduxControllerBase } from "./redux-controller";
import { GetController, ObjectType, GetSafely } from "./helpers";
const autoBind = require('auto-bind');
// import { composeWithDevTools } from 'remote-redux-devtools';

declare let window;


export const ReduxControllerRegistry = {
    controllers: [],
    rootStoreAsSubject: null,
    ready: false,
    rootStore: null,
    storageEngine: null,
    blacklistedPaths: [],
    options: null as ReduxControllerOptions_web | ReduxControllerOptions_reactNative | ReduxControllerOptions_node,
    load: async (options?: { source: string }) => {
        // Overview
        // --------
        //  -> Read From Storage Engine
        //  -> Remove the black listed path
        //  Todo: Need to remove the properties which are not found in the Storage
        //       Loading an non-existent path would throw and error. Therefor we need to manage it
        //  -> Load data to Redux Storage
        // --------
        let data;
        try {
            data = await ReduxControllerRegistry.storageEngine.load();
        } catch (e) {
            console.log('error while loading data from storage, Loading Empty Objects', e);
            data = {};
        }


        // If a source is provided, then load the data from it the current store
        if (options && options.source) {
            const storageEngine = Providers.getCreateEngine(ReduxControllerRegistry.options.environment, GetSafely(() => (ReduxControllerRegistry.options.persistance as any).asyncStorageRef))(options.source);
            data = await storageEngine.load();
        }

        let defaultState = ReduxControllerRegistry.rootStore.getState();
        for (let path of ReduxControllerRegistry.blacklistedPaths) {
            _.set(data, path.join('.'), getDescendantProp(defaultState, path.join('.')));
        }
        const statePaths = ReduxControllerRegistry.controllers.reduce((prev, current) => {
            const rootPathArray = findPath(current.instance.rootPathFunction);
            prev.push(rootPathArray[0]);
            return prev;
        }, []);

        ReduxControllerRegistry.rootStore.dispatch({ type: "REDUX_STORAGE_LOAD", payload: _.pick(data, ...statePaths) });
    },
    init: <RootState>(controllers: ObjectType<ReduxControllerBase<any, any>>[], options: ReduxControllerOptions_web | ReduxControllerOptions_reactNative | ReduxControllerOptions_node | ReduxControllerOptions_node = {
        environment: 'ANGULAR',
        middleware: [],
        persistance: {
            active: true,
            throttle: 5000,
            storageKey: 'REDUX_CONTROLLERS'
        },
        enableDevTools: true
    }) => {
        // Overview
        // --------
        // Todo: Write an overview of what's happening in this function
        // --------
        // Todo: Show Warning of Controller is empty or is not a Redux Controller
        // Todo: Merge Default Configurations and provided configurations
        // Todo: Log the Derived Redux Controller Configuration

        ReduxControllerRegistry.options = options;

        const storageToReducerMap = {};

        // Build Map using the controller path;
        for (let controller of controllers) {
            let path = findPath(GetController(controller).rootPathFunction);
            let pointer = storageToReducerMap;
            for (let i = 0; i < path.length; i++) {
                if (path[i + 1]) {
                    if (!pointer[path[i]]) {
                        pointer[path[i]] = {};
                    }
                    pointer = pointer[path[i]];
                } else {
                    if (pointer[path[i]]) {
                        throw new Error(`Redux Controller Paths Overlaps. Check path: ${path.join('.')} . This could also be because you have registered the controllers twice`)
                    }
                    pointer[path[i]] = GetController(controller).getReducerFunction();
                }
            }
        }

        if (options.reducerToJoin) {
            // Todo: Check whether there is an overlap in path and throw Error
            Object.assign(storageToReducerMap, options.reducerToJoin);
        }

        let combinedReducers: Reducer<any> = combineReducers(storageToReducerMap);


        // Create a set of middleware to be applied
        let middlewareToBeApplied = [...(options.middleware || [])];

        // Persistance is Active
        if (options.persistance.active) {
            combinedReducers = storage.reducer(combinedReducers);

            let blacklistedPaths: string[][] = [];

            // Build Black Listed Path to remove when saving and loading
            ReduxControllerRegistry.controllers.forEach(ctrl => {
                let paths = ctrl.instance.omittedPaths || [];
                blacklistedPaths = [...blacklistedPaths, ...paths];
            });

            ReduxControllerRegistry.blacklistedPaths = blacklistedPaths;
            /// Create Storage Engine
            let storageEngine = Providers.getCreateEngine(options.environment, GetSafely(() => (options.persistance as any).asyncStorageRef))(options.persistance.storageKey || 'REDUX_CONTROLLERS');
            storageEngine = debounce(storageEngine, options.persistance.throttle || 2000);
            storageEngine = filter(storageEngine, [], blacklistedPaths);
            ReduxControllerRegistry.storageEngine = storageEngine;

            // Create Storage Middleware
            const storageMiddleware = storage.createMiddleware(storageEngine);

            // Add Storage MiddleWare
            middlewareToBeApplied.push(storageMiddleware);
        }


        // Create Composers and add Dev Tools

        // Todo: Check enableDevTools and enable the dev tools
        const composeEnhancers =
            typeof window === 'object' &&
                window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
                window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
                    // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
                })
                // : (options.environment == "NODE") ? composeWithDevTools({
                //     realtime: true,
                //     name: 'Redux Controllers Dev',
                //     hostname: options.devToolsOptions ? options.devToolsOptions.host : '127.0.0.1',
                //     port: options.devToolsOptions ? options.devToolsOptions.port : 8000, // the port your remotedev server is running at
                // }) 
                : compose;



        const enhancer = composeEnhancers(
            applyMiddleware(...middlewareToBeApplied),
            // other store enhancers if any
        );
        const AppStore = createStore(combinedReducers, enhancer);

        // Create Observables
        const rootStoreAsSubject = new Rx.Subject();
        ReduxControllerRegistry.rootStoreAsSubject = rootStoreAsSubject;


        AppStore.subscribe(() => {
            rootStoreAsSubject.next(AppStore.getState());
        });

        // Activate Store
        ReduxControllerRegistry.controllers.forEach(ctrl => {
            ctrl.instance.setStore(AppStore);
            ctrl.class.prototype.rootStore = AppStore;
        });
        // Activate Watchers
        ReduxControllerRegistry.controllers.forEach(ctrl => {
            if (ctrl.instance.watchers) {
                ctrl.instance.watchers.forEach(watcher => {
                    watcher(rootStoreAsSubject, AppStore);
                });
            }
        });

        // Activate Reducers
        ReduxControllerRegistry.controllers.forEach(ctrl => {
            ctrl.instance.reducers = ctrl.class.prototype.reducers || [];
        });

        //Activate Get Instance
        ReduxControllerRegistry.controllers.forEach(ctrl => {
            ctrl.class.prototype.get = () => ctrl.instance;
            ctrl.class.prototype.rootPathFunction = ctrl.class.rootPathFunction;
        });

        //Activate Providers
        ReduxControllerRegistry.controllers.forEach(ctrl => {
            ctrl.instance.initProviders();
        });

        // Bind this context
        ReduxControllerRegistry.controllers.forEach(ctrl => {
            autoBind(ctrl.instance);
        });

        ReduxControllerRegistry.ready = true;
        ReduxControllerRegistry.rootStore = AppStore;
        return AppStore as Store<RootState>;
    },
    getStore: <T>() => {
        // Returns Get Root Store
        if (ReduxControllerRegistry.ready) {
            return ReduxControllerRegistry.rootStore as Store<T>;
        }
        return null;
    }
}

export type ReduxControllerOptions = ReduxControllerOptions_web | ReduxControllerOptions_reactNative;

export interface ReduxControllerOptions_web {
    environment: "ANGULAR" | "REACT",
    middleware?: any[],
    persistance?: {
        active: boolean,
        throttle: number,
        storageKey?: string,
        asyncStorageRef?: any
    },
    reducerToJoin?: Reducer<any>,
    enableDevTools?: boolean
}

export interface ReduxControllerOptions_reactNative {
    environment: "REACT_NATIVE",
    middleware?: any[],
    persistance?: ReduxControllerOptions_reactNative_node_persistence_on | ReduxControllerOptions_reactNative_node_persistence_off,
    reducerToJoin?: Reducer<any>,
    enableDevTools?: boolean
}

export interface ReduxControllerOptions_node {
    environment: "NODE",
    middleware?: any[],
    persistance?: ReduxControllerOptions_reactNative_node_persistence_on | ReduxControllerOptions_reactNative_node_persistence_off,
    reducerToJoin?: Reducer<any>,
    enableDevTools?: boolean,
    devToolsOptions?: {
        host: string,
        port: number
    }
}


export interface ReduxControllerOptions_reactNative_node_persistence_on {
    active: true,
    throttle?: number,
    storageKey?: string,
    asyncStorageRef: any
}

export interface ReduxControllerOptions_reactNative_node_persistence_off {
    active: false,
    throttle?: number,
    storageKey?: string,
    asyncStorageRef?: any
}