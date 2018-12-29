// Reference mocha-typescript's global definitions:
/// <reference path="../node_modules/mocha-typescript/globals.d.ts" />

import { suite, test, slow, timeout } from "mocha-typescript";
import { initReduxControllers } from './test-controllers/store';
import { GetController } from "../src";
import { TodosController } from "./test-controllers/todos/todos.controller";

// Todo: Need to write complete test

@suite
class GeneralTest {
    static async before() {
        initReduxControllers();
    }

    @test async "Test Provided State"() {
        let x = await GetController(TodosController).load(state => state.todoList)
        console.log(x);
    }


    @test async "Test Provided Key State"() {
        let x = await GetController(TodosController).load(state => state.todoMap.fsdafaf)
        console.log(x);
    }

    @test async "Test Provided State through time range based provider"() {
        let x = await GetController(TodosController).loadBasedOnTimeRange(state => state.timeBasedList, { from: new Date().getTime(), to: new Date().getTime() - 100000 })
        console.log(x);
    }
}