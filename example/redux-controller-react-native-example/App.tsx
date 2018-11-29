import * as React from 'react';
import { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { initStore, RootState } from './controllers/store';
import { GetController, AutoUnsubscribe } from 'redux-controllers';
import { TodosController } from './controllers/todos/todos.controller';
import { UserController } from './controllers/user/user.controller';


export function ReduxConnect<RootState, ComponentProps>(pathFunction: (state: RootState) => ComponentProps) {
  return function ReduxControllerInner<RootState, ComponentState>(constructor) {

    return constructor;
  };
}


// Initiate Redux Stores
initStore();




@ReduxConnect<RootState, any>((state) => ({
  username: state.user.username
}))
export default class App extends Component<any, any> {

  state = {
    text: "",
    usernameText: "",
    username: "",
    todos: []
  }

  // @ReduxConnect<RootState, any>((state) => ({
  //   username: state.user.username
  // }))
  // @Input()
  // fasdfsa;

  loadTodos = async () => {
    await GetController(TodosController).loadTodos();
  }

  addTodo = async () => {
    await GetController(TodosController).addTodo(this.state.text);
    this.setState({
      text: ""
    });
  }

  deleteTodo = (text: string) => {
    GetController(TodosController).removeTodo(text);
  }

  @AutoUnsubscribe((context: App) => {
    return GetController(TodosController).subscribeTo(state => state.todos).subscribe(todos => {
      console.log("todos changed", todos);
      context.setState({
        todos
      });
    });
  })
  @AutoUnsubscribe((context: App) => {
    return GetController(UserController).subscribeTo(state => state.username).subscribe(username => {
      context.setState({
        username
      });
    });
  })
  componentWillMount() {

  }


  login = async () => {
    await GetController(UserController).login(this.state.usernameText);
  }

  render() {

    if (this.state.username == "") {
      return (<View style={styles.container}>
        <View style={styles.header}>
          {/* Title */}
          <Text style={styles.headerText}>Welcome</Text>
        </View>
        <View style={styles.body}>
          {/* Body */}
          <View style={styles.addTodoCont}>
            {/* Todo Input */}
            <TextInput
              style={{ height: 40, borderColor: 'gray', borderWidth: 1, flex: 1 }}
              placeholder="Name: Eg: Alex"
              onChangeText={(usernameText) => this.setState({ usernameText })}
              value={this.state.usernameText}
            />
            <TouchableOpacity onPress={this.login} style={styles.button}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>)
    }


    return (
      <View style={styles.container}>
        <View style={styles.header}>
          {/* Title */}
          <Text style={styles.headerText}>Todos</Text>
          <TouchableOpacity onPress={this.loadTodos} style={styles.button}>
            <Text style={styles.buttonText}>Load Todos</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          {/* Body */}
          <View style={styles.addTodoCont}>
            {/* Todo Input */}
            <TextInput
              style={{ height: 40, borderColor: 'gray', borderWidth: 1, flex: 1 }}
              placeholder="Type in description...."
              onChangeText={(text) => this.setState({ text })}
              value={this.state.text}
            />
            <TouchableOpacity onPress={this.addTodo} style={styles.button}>
              <Text style={styles.buttonText}>Add +</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.todoListCont}>
            {/* Todo List */}
            {this.state.todos.map(todo => (
              <TouchableOpacity key={todo.id} style={styles.todo} onPress={() => this.deleteTodo(todo.id)}>
                <Text style={styles.todoText}>{todo.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    padding: 10
  },
  headerText: {
    flex: 1,
    color: '#222',
    fontFamily: 'Arial',
    fontSize: 20,
    textAlign: 'left',
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  addTodoCont: {
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    padding: 10
  },
  todoListCont: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignContent: 'stretch',
  },
  todo: {
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    padding: 10,
    margin: 5,
    backgroundColor: '#f4f4f4'
  },
  todoText: {
    flex: 1,
    color: '#222',
    fontFamily: 'Arial',
    fontSize: 14,
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