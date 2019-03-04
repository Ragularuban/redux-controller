import { RootState } from "../store";
import { CachedState, ReduxController, ReduxControllerBase, ProvidedState, Provider, CommitFunction, ReduxAction, ReduxEffect, ProvideKey, ProvideTimeRangeBasedData, ReduxAsyncAction, TimeBasedCachedState, ProvidedTimeBasedState } from "../../../src";
import { async } from "rxjs/internal/scheduler/async";


export interface TodoState {
    lastSynced: number,
    todoList: CachedState<Todo[]>,
    todoMap: {
        [key: string]: CachedState<Todo>
    },
    timeBasedList: TimeBasedCachedState<Todo[]>
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
        todoMap: {},
        timeBasedList: ProvidedTimeBasedState([])
    }

    providers = {
        state: {
            todoList: Provider(async () => {
                console.log("Load Todos ML");
                await new Promise((res, rej) => {
                    setTimeout(() => {
                        res();
                    }, 2000);
                });
                return dummyTodos;
            }, 2000),
            todoMap: ProvideKey(async (key) => {
                await new Promise((res, rej) => {
                    setTimeout(() => {
                        res();
                    }, 2000);
                });
                return {
                    id: key,
                    text: key + "Todo 1",
                    isCompleted: false
                };
            }),
            timeBasedList: ProvideTimeRangeBasedData<Todo[]>((range) => this.loadTodosInTimeRange(range), true)
        },
        cacheTimeout: 0
    }


    async loadTodos(force?: any, state?: TodoState, commit?: CommitFunction<TodoState>) {
        // setTimeout(() => {
        //     commit(state => {
        //         state.todoList.data = dummyTodos;
        //     });
        // }, 2000);
        console.log("Load Todos XYS");
        await this.load(state => state.todoList, true);
    }

    @ReduxAction('ADD_TODO')
    async addTodo(text: string) {
        this.state.todoList.data.push({
            id: text,
            text: text,
            isCompleted: false
        });
        // setTimeout(async () => {
        //     await this.load(state => state.todoList, true)
        // }, 500);
    }

    @ReduxAsyncAction('TEST_1')
    async loadTodosInTimeRange({ from, to }: { from: number, to: number }, state?: TodoState, commit?: CommitFunction<TodoState>) {
        console.log("Helloo");
        this.commit(state => {
            state.timeBasedList.data.push({
                id: "XX",
                text: "Todo 1",
                isCompleted: false
            })
            state.timeBasedList.loadedRanges.push({ from, to });
        });
        setTimeout(async () => {
            await this.load(state => state.todoList, true);
        }, 500);
    }

    @ReduxAsyncAction('TEST_2')
    async test2Async({ from, to }: { from: number, to: number }, state?: TodoState, commit?: CommitFunction<TodoState>) {
        console.log("Helloo");
        await new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 3000);
        });
        this.commit(state => {
            state.timeBasedList.data.push({
                id: "XX",
                text: "Test 2",
                isCompleted: false
            })
            state.timeBasedList.loadedRanges.push({ from, to });
        });
        setTimeout(async () => {
            await this.load(state => state.todoList, true);
        }, 500);
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

    @ReduxEffect('TEST_1_COMMIT')
    test1(text: string, state?: TodoState) {
        console.log("Commit 1");
    }

    @ReduxEffect('TEST_2_COMMIT')
    test2(text: string, state?: TodoState) {
        console.log("Commit 2");
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
