import { RootState } from "../store";
import { ReduxController, ReduxControllerBase, ReduxAsyncAction, CommitFunction, ReduxAction, AutoUnsubscribe } from "../redux-controller";
import { ReduxEffect } from "../redux-controller";


export interface TodoState {
    lastSynced: number,
    todos: {
        id: string,
        text: string,
        isCompleted: boolean
    }[]
}

@ReduxController((rootState: RootState) => rootState.todos)
export class TodosController extends ReduxControllerBase<TodoState, RootState> {

    omittedPaths = [
        ["todos", "lastSynced"],
    ];

    defaultState = {
        lastSynced: 0,
        todos: []
    }


    @ReduxAsyncAction<any, TodoState>('LOAD_TODOS')
    async loadTodos(payload?: any, state?: TodoState, commit?: CommitFunction<TodoState>) {
        setTimeout(() => {
            commit(state => {
                state.todos = [
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
                ];
            });
        }, 2000);
    }

    @ReduxAction('ADD_TODO')
    addTodo(text: string, state?: TodoState) {
        state.todos.push({
            id: text,
            text: text,
            isCompleted: false
        });
    }

    @ReduxAction('REMOVE_TODO')
    removeTodo(text: string, state?: TodoState) {
        let index = state.todos.findIndex(t => t.id == text);
        if (index > -1) state.todos.splice(index, 1);
    }

    @ReduxEffect('LOGIN_COMIT')
    watchForLogin(text: string, state?: TodoState) {
        this.loadTodos();
    }
}
