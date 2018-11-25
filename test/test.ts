// Reference mocha-typescript's global definitions:
/// <reference path="../node_modules/mocha-typescript/globals.d.ts" />

import { suite, test, slow, timeout } from "mocha-typescript";

@suite
class Test1 {
    @test test1() {
        return true;
    }
}