// Reference mocha-typescript's global definitions:
/// <reference path="../node_modules/mocha-typescript/globals.d.ts" />

import { suite, test, slow, timeout } from "mocha-typescript";
import { initReduxControllers } from './test-controllers/store';
import { GetController } from "../src";
import { TodosController } from "./test-controllers/todos/todos.controller";

// Todo: Need to write complete test

@suite(timeout(90000))
class GeneralTest {
    static async before() {
        console.log("fsffs");
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
        await new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 3000);
        });
        console.log(GetController(TodosController).state.todoList);
    }


    @test async "Add to do works"() {
        let x = await GetController(TodosController).addTodo('Test todo X');
        await new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 3000);
        });
        console.log(GetController(TodosController).state.todoList);
    }

    @test async "Load todo 2"() {
        let x = await Promise.all([
            GetController(TodosController).loadTodosInTimeRange({ from: 0, to: 1 }),
            GetController(TodosController).test2Async({ from: 0, to: 1 })
        ]);
        await new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 3000);
        });
        console.log(GetController(TodosController).state.todoList, GetController(TodosController).state.timeBasedList);
    }
}