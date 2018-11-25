import createEngine from 'redux-storage-engine-reactnativeasyncstorage';

export class Providers {

    static getCreateEngine(env: string) {
        return createEngine;
    }
}