export type Environnement = "REACT_NATIVE" | "ANGULAR" | "NODE" | "REACT";

export class Providers {
    static getCreateEngine(env: Environnement, asyncStorage?) {
        switch (env) {
            case "REACT_NATIVE": {
                return ProvideReactNativeStorage(asyncStorage);
            }
            case "REACT": {
                return webNativeStorage;
            }
            case "ANGULAR": {
                return webNativeStorage;
            }
            case "NODE": {
                // Todo: Need to Add Local Storage
                throw new Error("Node is not yet supported");
            }
            default: {
                return webNativeStorage;
            }
        }

    }
}

export const ProvideReactNativeStorage = function (AsyncStorage) {
    return function (key) {
        return {
            load: async function load() {
                const state = await AsyncStorage.getItem(key);
                return JSON.parse(state) || {};
            },
            save: async function save(state) {
                const stateString = JSON.stringify(state);
                return AsyncStorage.setItem(key, stateString);
            }
        };
    };
}

export const webNativeStorage = function (key, replacer?, reviver?) {
    return {
        load: async function load() {
            var jsonState = localStorage.getItem(key);
            return JSON.parse(jsonState, reviver) || {};
        },
        save: async function save(state) {
            var jsonState = JSON.stringify(state, replacer);
            localStorage.setItem(key, jsonState);
        }
    };
};