# Redux Controllers

## Motivation
Usually, working with Redux architecture feels very verbose and time-consuming. If you want to patch something very fast, you would feel that your hands are tightened. There should be a simple way to code using Redux patterns. It should be simple as writing a class method. Hence Redux Controllers

## Why Redux Controllers
You will find an easy way to create Redux stores and mutation methods that can be easily integrated with React/ React Native/ Angular codebase. You will also be able to write separate tests for Redux Controllers on NodeJs using Mocha.


**Features**
- "Complexity" of Reducers/ Actions/ Action Creators/ Dispatchers taken of
- Out of the box immutability management (inbuilt Immer)
- Support for Asynchronous Commits
- Helper functions to efficiently bind store to component
- Out of the box persistent
- Ability to use existing reducers and middleware along with Redux Controllers
- Typescript Support
- Application testing Framework
- Watchers -> Actions and State
- Inbuilt Caching


# Get Started

1) Install Redux Controllers 
<br /> using npm

```
npm i redux-controllers -s
npm i rxjs -s
```

or using yarn
```
yarn add redux-controllers
yarn add rxjs
```

2) Create your first Redux controllers

Redux Controllers mainly consists of two parts
1) Redux Store initialization function
2) Controllers

`controllers/counter/counter.controller.ts`
```
import { RootState } from "../store";
import { ReduxController, ReduxControllerBase, ReduxAsyncAction, CommitFunction, ReduxAction, AutoUnsubscribe, ReduxEffect, ReduxWatch } from "redux-controllers";


export interface CounterState {
    counter: number,
}

@ReduxController((rootState: RootState) => rootState.counterState)
export class CounterController extends ReduxControllerBase<CounterState, RootState> {

    defaultState = {
        counter: 0
    }

}
```
`controllers/store.ts`
```
import { CounterState, CounterController } from "./counter/counter.controller";
import { Reducer, combineReducers } from "redux";
import { ReduxControllerRegistry } from "redux-controllers";
import { AsyncStorage } from "react-native"


export interface RootState {
    counterState: CounterState,
}

export function initStore() {
    ReduxControllerRegistry.init([
        CounterController,
    ], {
            environment: 'REACT_NATIVE',
            persistance: {
                active: true,
                throttle: 200,
                asyncStorageRef: AsyncStorage
            }
        });
        ReduxControllerRegistry.load();

}
```

3) Start Redux Controller in the beginning of the app

```
import * as React from 'react';
import { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { initStore, RootState } from './controllers/store';


// Initiate Redux Stores
initStore();


export default class App extends Component<any, any> {

  render() {
    return (
      <View style={{}}>
          <TouchableOpacity onPress={this.login} style={styles.button}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
      </View>
    );
  }
}


```

 **Things to notice**
-  Controllers have a reference to `rootstate`. This is for typings to work properly
- Controllers themselves state which part of the Redux State they are controlling(mutating).
- Default state is provided as a property
- `ReduxControllerRegistry` accepts an array of `ReduxControllers` as the first parameter and accepts configuration option as the second parameter. The options should follow one of the interfaces based on the environment
`ReduxControllerOptions_web | ReduxControllerOptions_reactNative | ReduxControllerOptions_node`
- The interface definitions can be found [here](src/redux-controller.registry.ts)

<b> Hola! You have created your first Redux controller 😃 </b>


# Learn to use Redux Controller

## Create your first ReduxAction


`controllers/counter/counter.controller.ts`
```
import { RootState } from "../store";
import { ReduxController, ReduxControllerBase, ReduxAsyncAction, CommitFunction, ReduxAction, AutoUnsubscribe, ReduxEffect, ReduxWatch } from "redux-controllers";


export interface CounterState {
    counter: number,
}

@ReduxController((rootState: RootState) => rootState.counterState)
export class CounterController extends ReduxControllerBase<CounterState, RootState> {

    defaultState = {
        counter: 0
    }

    @ReduxAction()
    increaseCounter(increaseBy?: number) {
        this.state.counter++;
    }

}
```

 **Things to notice**
-  All ReduxAction() functions take 1st parameter as the payload
- `increase` method is decorated by `@ReduxAction()`. This decorator converts the method into a Redux Action and creates a reducer in the background
- State is mutable directly.
    <b>you don't need to do </b> <br/>
    `state = Object.assign({},counter:state.counter++);`
- You don't need to do return any value.

## Call your first action


```
import * as React from 'react';
import { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { initStore, RootState } from './controllers/store';
import { GetController, ReduxConnect, Connect } from 'redux-controllers';
import { CounterController } from './controllers/counter/counter.controller';
import Counter, { CounterConnectedProps } from './counter.component';


// Initiate Redux Stores
initStore();
export default class App extends Component<AppProps, AppState> {

  increment = () => GetController(CounterController).increaseCounter();

  counterConnector = (state: RootState): CounterConnectedProps => ({
    counter: state.counterState.counter,
  })

  render() {
    return (
      <View style={styles.container}>
        <Connect connector={this.counterConnector}>
          <Counter />
        </Connect>
        <TouchableOpacity onPress={this.increment} style={styles.button}>
          <Text style={styles.buttonText}>Increase ++ </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export interface AppProps {
  counter: number;
}

export interface AppState {
  counter: number;
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingTop: 60,
  },
  counterText: {
    flex: 1,
    color: '#222',
    fontFamily: 'Arial',
    fontSize: 20,
    textAlign: 'left',
  },
  button: {
    backgroundColor: '#333',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Arial',
    fontSize: 16,
    textAlign: 'center',
  }
});


```

**Things to notice**
- To get the instance of the controller you can use `GetController` function.
- There are multiple ways of reading the state
  - Read State Directly 
    - Eg: `GetController(CounterController).state.counter
  - Subscribe to state
    - Eg: 
    ```
    GetController(CounterController).subscribeTo(state=>state.counter).subscribe(counter=>{
      ...
    })
    ```
  - For React and React Native Projects,  there are two helper functions that are available to connect them directly
    - Using @ReduxConnect Decorator
   
      ```
      @ReduxConnect<RootState, any>((rootState) => ({
          counter: rootState.counterState.counter,
      }))
      ```
      - `@ReduxConnect` decorater will automatically push state changes to the `prop` of components

      - To get the typings, you should provide interface of `RootState` and the interface the properties of the component being decorated

      - The object returned by the function is pushed as properties whenever any changes happen to the mapped states.
    - Using HOC `Connect` inside template
      - `Connect` accepts a property `connector` which is a state mapping function


# Advanced Features and Configurations

0) Redux Async Actions
1) Redux Watch
2) Redux Effects
3) Connecting Existing Middleware
4) Configuring Persistence
5) Enabling/Disabling Redux Debugger
6) Accessing Root State within controllers
7) Omitting sub states from persisting
8) Named/Unnamed Actions
9) Customized Commit Messages
10) Providers
11) Resetting SubStates and RootState
12) Writing Helper Functions in Redux Controller
13) State based watchers

```
Todo: Write a doc for Advanced Features and Configurations
```

## Redux Async Actions

Redux Async Actions helps you to work with asynchronous state changes

Eg: 
`counter.controller.ts`
```
import { RootState } from "../store";
import { ReduxController, ReduxControllerBase, ReduxAsyncAction, CommitFunction, ReduxAction, AutoUnsubscribe, ReduxEffect, ReduxWatch } from "redux-controllers";


export interface CounterState {
    counter: number,
}

@ReduxController((rootState: RootState) => rootState.counterState)
export class CounterController extends ReduxControllerBase<CounterState, RootState> {

    defaultState = {
        counter: 0
    }

    @ReduxAsyncAction()
    async loadCounterFromBackend() {
        const counterValue: number = await new Promise(resolve => {
            setTimeout(() => {
                resolve(100);
            }, 2000);
        });

        this.commit(state => {
            state.counter = counterValue;
        });
    }

}

```

`app.tsx`
```
...

export default class App extends Component<AppProps, AppState> {

  loadRemoteState = () => GetController(CounterController).loadCounterFromBackend();

  counterConnector = (state: RootState): CounterConnectedProps => ({
    counter: state.counterState.counter,
  })


  render() {
    return (
      <View style={styles.container}>
        <Connect connector={this.counterConnector}>
          <Counter />
        </Connect>
        <TouchableOpacity onPress={this.loadRemoteState} style={styles.button}>
          <Text style={styles.buttonText}>Load State </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

...
```

**Things to notice**
- Once an asynchronous action is completed,  `this.commit` is called to make the state changes
- There will be two Redux Action Fired
  - One when the method is called
  - One when the commit happens
- The method is a promise and the promise gets resolved when the commit happens. This helps you to maintain local state of the action within the component


## Redux Watch
Redux Watch helps you to watch a field/ path/ computed value and trigger a function based on on it
```
    @ReduxWatch((rootState: RootState) => ({
        token: rootState.user.accessToken,
    }))
    watchUserToken({token}: { token: string }) {
       // Do something
       // Eg: Configure Service SDK
    }
```
**Things to notice**
- `@ReduxWatch` decorator takes in a state mapping function as the only parameter
- The decorated method will only fire if the returned object's key value has changed
- The mapping function **must** always be an object. It should not be a primitive value

## Redux Effects
Redux Effect helps you to trigger a function as a side effect when a Redux Action is dispatched.
```
    @ReduxEffect('LOGIN')
    async onUserLoggedIn({user}: { user: any }) {
       // Do something
       // Eg: Configure Service SDK
    }
```
**Things to notice**
- `@ReduxEffect` decorator takes in a the action name to watch for as the only parameter
- The decorated method will only fire if the mentioned action is dispatched
- The method decorated by `@ReduxEffect` must always be a promise.


## State Providers
State providers helps you to easily manage resources and entities in the state with caching
`yyy.controller.ts`
```
    defaultState = {
        todoList: ProvidedState([]),
        todoMap: {},
        timeBasedList: ProvidedTimeBasedState([])
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
```
`yyy.component.tsx`
```
// load resources | respects cache
await GetController(YYYController).load(state=>state.todoList);

// load resource | force refresh
await GetController(YYYController).load(state=>state.todoList,true);

// Loading Key
await GetController(YYYController).load(state=>state.todoMap.xyz);

// Loading Resources belonging to a date range
await GetController(YYYController).load(state=>state.timeBasedList,{ from: new Date().getTime(), to: new Date().getTime() - 100000 });


```


```
Todo: Write a doc for Advanced Features and Configurations
```

# Complex Store Examples

1) Calendar Events
2) Paginated List 
3) UI Elements State

```
Todo: Write a doc for Complex Store Examples

```

# Simple Testing Framework

```
Todo: Write Doc for Simple Testing Framework
```


# Contributors

```
Todo: Fill in contributors
```




# Debugging in NodeJs
Run Process
chrome://inspect/#devices
Install Remove Dev
npm install --save-dev remotedev-server
or
npm install -g remotedev-server
Run to start dev server
remotedev --hostname=localhost --port=1234

Pass in options.devToolsOptions to init function
```
            devToolsOptions: {
                host: '127.0.0.1',
                port: 1234
            }
```


# Todo
Add Helper Notes with https://stackoverflow.com/questions/43177855/how-to-create-a-deep-proxy for state and commit function

- Add `.set(state=>state.foo,{value});` method to set a path 
- Add Provide Crud | Provide Resource
```
ProvideCrud({
load:()=>{},
edit:()=>{}
})
```
- Add Provide Resources
```
ProvideResources({
key:'id'
load:()=>{},
edit:()=>{},
delete:()=>{}
}),
```
- make payload optional for redux action and async action
- expose this.rootState


# Utopian State Management Library
[https://medium.com/@ragularuban/thought-share-my-ideal-state-management-for-angular-react-vue-and-what-not-cab7725e2c16](https://medium.com/@ragularuban/thought-share-my-ideal-state-management-for-angular-react-vue-and-what-not-cab7725e2c16)