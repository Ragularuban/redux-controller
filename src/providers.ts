export type Environnement = "REACT_NATIVE" | "ANGULAR" | "NODE" | "REACT";

export class Providers {
    static getCreateEngine(env: Environnement, storage?) {
        switch (env) {
            case "REACT_NATIVE": {
                return ProvideReactNativeStorage(storage);
            }
            case "REACT": {
                return webNativeStorage;
            }
            case "ANGULAR": {
                return webNativeStorage;
            }
            case "NODE": {
                return nodeStorage('.store', storage);
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
            load: function load() {
                return AsyncStorage.getItem(key).then(function (jsonState) {
                    return JSON.parse(jsonState) || {};
                });
            },
            save: function save(state) {
                var jsonState = JSON.stringify(state);
                return AsyncStorage.setItem(key, jsonState);
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


export const nodeStorage = function (storageDirectory: string, LocalStorage) {
    const localStorage = new LocalStorage(storageDirectory);
    return function (key) {
        return {
            load: function load() {
                return new Promise((resolve) => {
                    let jsonState = localStorage.getItem(key);
                    resolve(JSON.parse(jsonState) || {});
                });
            },
            save: function save(state) {
                return new Promise((resolve) => {
                    let jsonState = JSON.stringify(state);
                    resolve(localStorage.setItem(key, jsonState));
                });

            }
        };
    };
};