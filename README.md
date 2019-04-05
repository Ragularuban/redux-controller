# Redux Controllers

## Warning

<b>This Project is not yet completed. Use at your own risk</b>


## Motivation
Usually, working on Redux architecture feels very verbose and time consuming. If you want to patch something very fast, you would feel that your hands are tightened. There should be a simple way to code using redux patterns which is simple as writing an easy controller. Hence Redux Controllers

## Why Redux Controllers
You will find an easy way to create redux stores that can be easily integrated to react/react native/angular code base. You will also find a application testing framework that is based on redux controllers and mocha.


**Features**
- Complexity of reducers/actions/action creators/dispatchers taken of
- Out of the box immutability management
- Support for Asynchronous Commits
- Helper functions to efficiently bind store to component
- Out of the box persistent
- Ability to use existing reducers and middleware along with redux-controllers
- Typescript Support
- Application testing Framework


# Get Started

1) Install Redux Controllers
```
npm i redux-controllers -s

```
2) Create your first Redux controllers

`controllers/counter/counter.controller.ts`
```
import { RootState } from "../store";
import { ReduxController, ReduxControllerBase, ReduxAsyncAction, CommitFunction, ReduxAction, AutoUnsubscribe, ReduxEffect } from "redux-controllers";


export interface CounterState {
    counter: number,
}

@ReduxController((rootState: RootState) => rootState.counterState)
export class CounterController extends ReduxControllerBase<CounterState, RootState> {

    defaultState = {
        counterState: 0,
    }

}
```
`controllers/store.ts`
```
import { CounterState, CounterController } from "./counter/counter.controller";
import { Reducer, combineReducers } from "redux";
import { ReduxControllerRegistry } from "redux-controllers";

export interface RootState {
    counterState: CounterState,
}

export function initStore() {
    ReduxControllerRegistry.init([
        CounterController,
    ], {
            environment: 'REACT_NATIVE',
        });
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

<b> Hola! You have created a Redux controller 😃 </b>


# Learn to use Redux Controller

## Create your first ReduxAction


`controllers/counter/counter.controller.ts`
```
import { RootState } from "../store";
import { ReduxController, ReduxControllerBase, ReduxAsyncAction, CommitFunction, ReduxAction, AutoUnsubscribe, ReduxEffect } from "redux-controllers";


export interface CounterState {
    counter: number,
}

@ReduxController((rootState: RootState) => rootState.counterState)
export class CounterController extends ReduxControllerBase<CounterState, RootState> {

    defaultState = {
        counterState: 0,
    }

    @ReduxAction('INCREASE_COUNTER')
    increase(payload?: any, state?: CounterState) {
        state.counter++;
    }

}
```

1) Things to notice -> 1

    All synchronous function that mutates the state **must** take 2 parameters

    1) payload
    2) state <b>(State parameter should be optional to avoid typescript complaining)</b>


2) Things to notice -> 2

    `increase` method is decorated by `@ReduxAction('INCREASE_COUNTER')`. This decorater converts the method into a redux action and creates a reducer in the background

3) Things to notice -> 3

    state is mutable directly.
    <b>you don't need to do </b>
    `state = Object.assign({},counter:state.counter++);`

4) Things to notice -> 3

    You don't need to do return any value.

## Call your first action


```
import * as React from 'react';
import { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { initStore, RootState } from './controllers/store';


// Initiate Redux Stores
initStore();


@ReduxConnect<RootState, AppProps>((state) => ({
  counter: state.counterState.counter,
}))
export default class App extends Component<any, AppProps> {

  increment = ()=> GetController(CounterController).increase();

  render() {
    return (
      <View style={styles.container}>
      <Text style={styles.counterText}>{this.props.counter}</Text>
          <TouchableOpacity onPress={this.increment} style={styles.button}>
              <Text style={styles.buttonText}>Increase ++ </Text>
            </TouchableOpacity>
      </View>
    );
  }
}

export interface AppProps {
    counter:number;
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

1) Things to notice -> 1

    ```
     @ReduxConnect<RootState, any>((rootState) => ({
        counter: rootState.counterState.counter,
     }))
    ```
    `@ReduxConnect` decorater will automatically push state changes to the `prop` of components

    To get the typings, you should provide interface of `RootState` and the interface the properties of the component being decorated

    The object returned by the function is pushed as properties whenever any changes happen to the mapped states.

```
Todo: Publish an Expo Project
```
```
Todo: Write Doc for Asyncronous Action
```
```
Todo: Change the state Parater to MutableState to describe the parameter
```


# Advanced Features and Configurations

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