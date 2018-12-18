import { RootState } from "../store";
import { ReduxControllerBase, ReduxController, ReduxAsyncAction, CommitFunction } from "../../../src";

export interface UserState {
    username: string;
}

@ReduxController((rootState: RootState) => rootState.user)
export class UserController extends ReduxControllerBase<UserState, RootState> {

    defaultState = {
        username: ''
    }






    // @ReduxAction()
    // setUsername(name?: string, state?: UserState){
    //     state.username = name;
    // }


    // @ReduxAsyncAction()
    // async login(name?: string, state?: UserState, commit?: CommitFunction<UserState>) {
    //     setTimeout(() => {
    //         commit(state => {
    //             state.username = name;
    //         });
    //     }, 2000);
    // }

    @ReduxAsyncAction('LOGIN')
    async login(name?: string, state?: UserState, commit?: CommitFunction<UserState>) {
        setTimeout(() => {
            commit(state => {
                state.username = name;
            });
        }, 2000);
    }

}