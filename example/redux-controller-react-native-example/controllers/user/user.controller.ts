import { RootState } from "../store";
import { ReduxController, ReduxControllerBase, ReduxAsyncAction, CommitFunction, ReduxAction, AutoUnsubscribe } from "redux-controllers";
import { Providers } from "redux-controllers/dist/providers";


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