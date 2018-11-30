// Reference mocha-typescript's global definitions:
/// <reference path="../node_modules/mocha-typescript/globals.d.ts" />

import { suite, test, slow, timeout } from "mocha-typescript";

// Todo: Need to write the test

@suite
class Test1 {
    @test test1() {
        return true;
    }
}