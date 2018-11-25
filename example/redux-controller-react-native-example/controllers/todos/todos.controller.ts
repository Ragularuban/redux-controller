import { RootState } from "../store";
import { ReduxController, ReduxControllerBase, ReduxAsyncAction, CommitFunction, ReduxAction, AutoUnsubscribe } from "redux-controllers";


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
            state = commit(state => {
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



    // provider = {
    //     taggedImages: this.loadTodosResource
    // }

    // @ReduxWatch(state => state.user.id)
    // @ReduxAsyncAction('SYNC_TAGGED_IMAGES')
    // loadTodos() {
    //     // Todo: When App Starts, we need to cross check whether sync and async functions are properly done
    // }

    // @ReduxAsyncAction('SYNC_TAGGED_IMAGES')
    // deleteTodo() {

    // }

    // @ReduxAsyncAction('SYNC_TAGGED_IMAGES')
    // markTodoAsCompleted() {

    // }


    // @Provider({
    //     timeout: 3000
    // })
    // loadTodosResource() {

    // }

    // Possibly - Connect to JSON APIs straight away and provide a simple CRUD operation out of the box
}
