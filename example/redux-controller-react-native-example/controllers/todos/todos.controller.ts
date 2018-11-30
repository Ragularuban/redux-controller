import { RootState } from "../store";
import { ReduxController, ReduxControllerBase, ReduxAsyncAction, CommitFunction, ReduxAction, AutoUnsubscribe, ReduxEffect } from "redux-controllers";


export interface TodoState {
    lastSynced: number,
    todoList: CachedState<Todo[]>,
    todoMap: {
        [key: string]: Todo
    }
}

export interface Todo {
    id: string,
    text: string,
    isCompleted: boolean
};

export interface CachedState<T> {
    lastUpdated: number,
    data: T
}

export function defaultCachedState<T>(value: T): CachedState<T> {
    return {
        lastUpdated: 0,
        data: value
    }
}

export function Provider<T>(providerFunc: (...any) => Promise<T>, timeout?: number): T {

    return null;
};

export function ProvideKey<T>(providerFunc: (key: string, ...arg) => Promise<T>, timeout?: number): { [key: string]: T } {

    return null;
};


@ReduxController((rootState: RootState) => rootState.todos)
export class TodosController extends ReduxControllerBase<TodoState, RootState> {

    omittedPaths = [
        ["todos", "lastSynced"],
    ];

    defaultState = {
        lastSynced: 0,
        todoList: defaultCachedState([]),
        todoMap: {

        }
    }

    @ReduxAsyncAction
    load(pathFunction){
        // Get State
        // Get Safely the path provided
        // Get the provider configuration
        // Dispathc LOAD_THORUGH_PROVIDER,payload:{path:'sfdsf'}
        // if the path is null or has property last updated and it is timeedout
        // 
        // from the configuration call the loading call
        // 
    }

    providers: Partial<TodoState> = {
        todoList: Provider(async () => {
            // Timeout with Cache
            return dummyTodos;
        }, 2000),
        todoMap: ProvideKey(async (key) => {
            return dummyTodos[0];
        }, 2000)
    }

    @ReduxAsyncAction('LOAD_TODOS')
    async loadTodos(payload?: any, state?: TodoState, commit?: CommitFunction<TodoState>) {
        setTimeout(() => {
            commit(state => {
                state.todoList = dummyTodos;
            });
        }, 2000);
    }

    @ReduxAction('ADD_TODO')
    addTodo(text: string, state?: TodoState) {
        state.todoList.push({
            id: text,
            text: text,
            isCompleted: false
        });
    }

    @ReduxAction('REMOVE_TODO')
    removeTodo(text: string, state?: TodoState) {
        let index = state.todoList.findIndex(t => t.id == text);
        if (index > -1) state.todoList.splice(index, 1);
    }

    @ReduxEffect('LOGIN_COMIT')
    watchForLogin(text: string, state?: TodoState) {
        this.loadTodos();
    }
}

const dummyTodos = [
    {
        id: "001",
        text: "Todo 1",
        isCompleted: false
    },
    {
        id: "002",
        text: "Todo 2",
        isCompleted: false
    },
    {
        id: "003",
        text: "Todo 3",
        isCompleted: false
    },
    {
        id: "004",
        text: "Todo 4",
        isCompleted: false
    }
];[]
