import { getDescendantProp } from "./utilts";
import * as storage from 'redux-storage';
import { Providers } from "./providers";
import debounce from 'redux-storage-decorator-debounce';
import filter from 'redux-storage-decorator-filter';
import { Store, combineReducers, createStore, applyMiddleware, Reducer } from "redux";
import * as Rx from 'rxjs';
import * as _ from 'lodash';

declare let window;


export const ReduxControllerRegistry = {
    controllers: [],
    ready: false,
    rootStore: null,
    storageEngine: null,
    blacklistedPaths: [],
    load: async () => {
        const data = await ReduxControllerRegistry.storageEngine.load();
        let defaultState = ReduxControllerRegistry.rootStore.getState();
        for (let path of ReduxControllerRegistry.blacklistedPaths) {
            _.set(data, path.join('.'), getDescendantProp(defaultState, path.join('.')));
        }
        ReduxControllerRegistry.rootStore.dispatch({ type: "REDUX_STORAGE_LOAD", payload: data });
    },
    init: <T>(appReducerWithoutStorage: Reducer<T>) => {
        const appReducer = storage.reducer(appReducerWithoutStorage);

        /// Create Storage Engine and middelware
        let storageEngine = Providers.getCreateEngine("REACT_NATIVE")("REDUX_CONTROLLERS");

        storageEngine = debounce(storageEngine, 2000);

        let blacklistedPaths: string[][] = [
            // 'blacklisted-key',
            // ['nested', 'blacklisted-key']
        ];

        ReduxControllerRegistry.controllers.forEach(ctrl => {
            let paths = ctrl.instance.omittedPaths || [];
            blacklistedPaths = [...blacklistedPaths, ...paths];
        });

        storageEngine = filter(storageEngine, [], blacklistedPaths);

        ReduxControllerRegistry.storageEngine = storageEngine;
        ReduxControllerRegistry.blacklistedPaths = blacklistedPaths;

        const storageMiddleware = storage.createMiddleware(storageEngine);

        // Create Store
        const createStoreWithMiddleware = applyMiddleware(storageMiddleware)(createStore);

        const AppStore = createStoreWithMiddleware(appReducer,
            (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__()
        );

        const rootStoreAsSubject = new Rx.Subject();

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

        //Active Get Instance
        ReduxControllerRegistry.controllers.forEach(ctrl => {
            ctrl.class.prototype.get = () => ctrl.instance;
            ctrl.class.prototype.rootPathFunction = ctrl.class.rootPathFunction;
        });

        ReduxControllerRegistry.ready = true;
        ReduxControllerRegistry.rootStore = AppStore;
        return AppStore as Store<T>;
    },
    getStore: <T>() => {
        if (ReduxControllerRegistry.ready) {
            return ReduxControllerRegistry.rootStore as Store<T>;
        }
        return null;
    }
}