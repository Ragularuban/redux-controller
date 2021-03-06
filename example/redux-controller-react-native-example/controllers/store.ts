import { TodoState, TodosController } from "./todos/todos.controller";
import { Reducer, combineReducers } from "redux";
import { UserState, UserController } from "./user/user.controller";
import { ReduxControllerRegistry } from "redux-controllers";

export interface RootState {
    todos: TodoState,
    user: UserState
}

export function initStore() {
    ReduxControllerRegistry.init([
        TodosController,
        UserController
    ], {
            environment: 'REACT_NATIVE',
            middleware: [],
            persistance: {
                active: true,
                throttle: 5000,
            },
            enableDevTools: true
        });
}