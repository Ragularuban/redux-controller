import { TodoState, TodosController } from "./todos/todos.controller";
import { Reducer, combineReducers } from "redux";
import { UserState, UserController } from "./user/user.controller";
import { ReduxControllerRegistry } from "../../src";

export interface RootState {
    todos: TodoState,
    user: UserState
}

export function initReduxControllers() {
    ReduxControllerRegistry.init([
        TodosController,
        UserController
    ], {
            environment: 'NODE',
            persistance: {
                active: true,
                throttle: 100
            }
        });
}