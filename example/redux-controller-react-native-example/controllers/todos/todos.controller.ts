import { RootState } from "../store";
import { ReduxController, ReduxControllerBase, ReduxAsyncAction, CommitFunction, ReduxAction, AutoUnsubscribe, ReduxEffect, CachedState, Provider, ProvideKey, ProvidedState } from "redux-controllers";


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



@ReduxController((rootState: RootState) => rootState.todos)
export class TodosController extends ReduxControllerBase<TodoState, RootState> {

    omittedPaths = [
        ["todos", "lastSynced"],
    ];

    defaultState = {
        lastSynced: 0,
        todoList: ProvidedState([]),
        todoMap: {

        }
    }

    providers = {
        state: {
            todoList: Provider(async () => {
                await new Promise((res, rej) => {
                    setTimeout(() => {
                        res();
                    }, 2000);
                });
                return dummyTodos;
            }, 2000),
        },
        cacheTimeout: 0
    }


    async loadTodos(force?: any, state?: TodoState, commit?: CommitFunction<TodoState>) {
        // setTimeout(() => {
        //     commit(state => {
        //         state.todoList.data = dummyTodos;
        //     });
        // }, 2000);
        console.log("Load Todos");
        await this.load(state => state.todoList);
    }

    @ReduxAction('ADD_TODO')
    addTodo(text: string, state?: TodoState) {
        state.todoList.data.push({
            id: text,
            text: text,
            isCompleted: false
        });
    }

    @ReduxAction('REMOVE_TODO')
    removeTodo(text: string, state?: TodoState) {
        let index = state.todoList.data.findIndex(t => t.id == text);
        if (index > -1) state.todoList.data.splice(index, 1);
    }

    @ReduxEffect('LOGIN_COMMIT')
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
