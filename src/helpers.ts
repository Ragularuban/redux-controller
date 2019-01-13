const moment = require('moment');
// Start - Importing Twix via both module resolution
require('twix');
import * as twix from "twix";
import 'twix';
// - End importing Twix

import * as _ from 'lodash';

/**
 * @description Access a Redux Controller
 */
export function GetController<T>(constructor: ObjectType<T>) {
    return (constructor as any).get() as T;
}

/**
 * @description Access a sub-property of an object safely
 */
export const GetSafely = <T>(fun: () => T, fallback?: T) => {
    let value: T = null;
    try {
        value = fun();
    } catch (e) {
        //Ignore Error
    }
    return (value === null || value === undefined) ? fallback : value;
}

export declare type ObjectType<T> = {
    new(...args: any[]): T;
};


/**
 * @description Check whether a range is already loaded
 */
export function isAlreadyFetched(from: number, to: number, loadedRanges: { from: number, to: number }[]) {
    let needToLoad = true;
    const rangeToLoad = moment(from).twix(to);

    // Bubble Time Period to check whether request engulf the loaded periods
    const sortedPeriod = _.sortBy(loadedRanges, 'from');
    const bubbledPeriod: { from: number, to: number }[] = [];
    for (let i = 0; i < sortedPeriod.length; i++) {
        if (i == 0) {
            bubbledPeriod.push(sortedPeriod[i]);
            continue;
        }
        const lastBubble = _.last(bubbledPeriod);
        if (moment(sortedPeriod[i].from).isBetween(moment(lastBubble.from), moment(lastBubble.to))) {
            lastBubble.to = sortedPeriod[i].to;
        } else {
            bubbledPeriod.push(sortedPeriod[i]);
        }
    }

    // Check whether items are already loaded or not
    for (let loadedRange of bubbledPeriod) {
        const range = moment(loadedRange.from).twix(loadedRange.to);
        if (range.engulfs(rangeToLoad)) {
            needToLoad = false;
            break;
        }
    }
    return !needToLoad;
}