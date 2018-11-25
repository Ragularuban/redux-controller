import { TodoState, TodosController } from "./todos/todos.controller";
import { ReduxControllerRegistry, GetController } from 'redux-controllers';
import { Reducer, combineReducers } from "redux";

export interface RootState {
    todos: TodoState
}

const appReducer: Reducer<RootState> = combineReducers({
    todos: GetController(TodosController).getReducerFunction(),
});

export const RootStore = ReduxControllerRegistry.init(appReducer);

export function initStore() {
    RootStore.getState();
    // Ideal Implementation
    // ReduxControllerRegistry.init([
    //     TodosController
    // ]);
}