export type Environnement = "REACT_NATIVE" | "ANGULAR" | "NODE" | "REACT";

export class Providers {
    static getCreateEngine(env: Environnement) {
        switch (env) {
            case "REACT_NATIVE": {
                return require("redux-storage-engine-reactnativeasyncstorage");
            }
            case "REACT": {
                return require("redux-storage-engine-localstorage");
            }
            case "ANGULAR": {
                return require("redux-storage-engine-localstorage");
            }
            case "NODE": {
                // Todo: Need to Add Local Storage
                throw new Error("Node is not yet supported");
            }
            default: {
                return require("redux-storage-engine-localstorage");
            }
        }

    }
}