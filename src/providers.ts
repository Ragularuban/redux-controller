import createEngineReactNative from 'redux-storage-engine-reactnativeasyncstorage';
import createEngineLocalStorage from 'redux-storage-engine-localstorage';

export type Environnement = "REACT_NATIVE" | "ANGULAR" | "NODE" | "REACT";

export class Providers {
    static getCreateEngine(env: Environnement) {
        switch (env) {
            case "REACT_NATIVE": {
                return createEngineReactNative;
            }
            case "REACT": {
                return createEngineLocalStorage;
            }
            case "ANGULAR": {
                return createEngineLocalStorage;
            }
            case "NODE": {
                // Todo: Need to Add Local Storage
                throw new Error("Node is not yet supported");
            }
            default: {
                return createEngineLocalStorage;
            }
        }

    }
}