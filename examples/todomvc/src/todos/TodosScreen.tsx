import React, { Component, FormEvent, MouseEvent } from 'react';
import xs, { Stream } from 'xstream';
import { Sinks } from '@cycle/run';
import { StateSource, Reducer } from 'cycle-onionify';
import {
  cycleConnect,
  InteractionsSource,
  CycleConnectedProps,
} from 'react-cycle-connect';
import {
  Collection,
  makeFilteredListLens
} from 'react-cycle-connect/lib/extra/onionify';
import TodoItem from './TodoItem';
import TodosScreenFooter from './TodosScreenFooter';
import {
  SHOW_ALL,
  SHOW_COMPLETED,
  SHOW_ACTIVE
} from '../constants/todoFilters';
import { Todo } from './types';
import { TodoFormState } from './TodoForm';
import TodosScreenHeader from './TodosScreenHeader';

const TODO_FILTER_FNS = {
  [SHOW_ALL]: () => true,
  [SHOW_ACTIVE]: (todo: Todo) => !todo.completed,
  [SHOW_COMPLETED]: (todo: Todo) => todo.completed
};

export interface TodosState {
  todos: Todo[];
  filter: string;
  newItemFormState?: TodoFormState;
}

interface InteractionEvents {
  headerFormSubmit: string;
  toggleAllClick: MouseEvent<HTMLElement>;
  clearCompleted: null;
  filterChange: string;
}

export interface ViewProps extends CycleConnectedProps<InteractionEvents> {
  todos: Todo[];
  filter: string;
  completedCount: number;
  activeCount: number;
}

export interface Sources {
  interactions: InteractionsSource<InteractionEvents>;
  onion: StateSource<TodosState>;
}

export interface Sinks {
  props: Stream<Partial<ViewProps>>;
  onion: Stream<Reducer<TodosState>>;
}

interface ModelActions {
  createTodo$: Stream<string>;
  filterUpdate$: Stream<string>;
  toggleAll$: Stream<null>;
  clearCompleted$: Stream<null>;
}

const filteredListLens = makeFilteredListLens<TodosState, Todo>(
  'todos',
  (item, state) => TODO_FILTER_FNS[state.filter](item),
  'id'
);

function intent(interactions: InteractionsSource<InteractionEvents>) {
  return {
    filterUpdate$: interactions.filterChange,
    toggleAll$: interactions.toggleAllClick.mapTo(null),
    clearCompleted$: interactions.clearCompleted.mapTo(null),
    createTodo$: interactions.headerFormSubmit.filter(text => !!text)
  };
}

function model(actions: ModelActions): Stream<Reducer<TodosState>> {
  const defaultReducer$ = xs.of(function defaultReducer(
    state: TodosState
  ): TodosState {
    if (typeof state !== 'undefined') return state;

    return {
      todos: [],
      filter: SHOW_ALL,
      newItemFormState: void 0
    };
  });

  const filterReducer$ = actions.filterUpdate$.map(
    (filter: string) =>
      function filterReducer(state: TodosState): TodosState {
        return { ...state, filter };
      }
  );

  const toggleAllReducer$ = actions.toggleAll$.map(
    () =>
      function toggleAllReducer(state: TodosState): TodosState {
        const areAllCompleted = state.todos.every(todo => todo.completed);
        return {
          ...state,
          todos: state.todos.map((todo: Todo) => ({
            ...todo,
            completed: !areAllCompleted
          }))
        };
      }
  );

  // TODO: Make state composable and remove nesting
  const createTodoReducer$ = actions.createTodo$.map(
    (text: string) =>
      function createTodoReducer(state: TodosState): TodosState {
        return {
          ...state,
          todos: [
            ...state.todos,
            {
              id:
                state.todos.reduce(
                  (maxId, todo) => Math.max(todo.id, maxId),
                  0
                ) + 1,
              completed: false,
              text
            }
          ],
          newItemFormState: { text: '' }
        };
      }
  );

  const clearCompletedReducer$ = actions.clearCompleted$.mapTo(
    function clearCompletedReducer(state: TodosState): TodosState {
      return {
        ...state,
        todos: state.todos.filter((todo: Todo) => !todo.completed)
      };
    }
  );

  return xs.merge(
    defaultReducer$,
    createTodoReducer$,
    filterReducer$,
    toggleAllReducer$,
    clearCompletedReducer$
  );
}

function computedProps({ todos, filter }: TodosState) {
  const completedCount = todos.reduce(
    (count: number, todo: Todo) => (todo.completed ? count + 1 : count),
    0
  );
  const activeCount = todos.length - completedCount;

  return {
    completedCount,
    activeCount
  };
}

function main(sources: Sources): Sinks {
  const state$ = sources.onion.state$ as Stream<TodosState>;
  const actions = intent(sources.interactions);
  const reducer$ = model(actions);
  const computedProps$ = state$.map(computedProps);

  return {
    props: xs.merge(state$, computedProps$),
    onion: reducer$
  };
}

export function TodosScreen({
  interactions,
  todos,
  filter,
  completedCount,
  activeCount
}: ViewProps) {
  return (
    <section className="todoapp">
      <TodosScreenHeader onFormSubmit={interactions.headerFormSubmit} />

      <section className="main">
        {todos.length > 0 && (
          <span>
            <input
              className="toggle-all"
              type="checkbox"
              checked={completedCount === todos.length}
            />
            <label onClick={interactions.toggleAllClick} />
          </span>
        )}

        <ul className="todo-list">
          <Collection lens={filteredListLens} itemComponent={TodoItem} />
        </ul>

        {todos.length > 0 && (
          <TodosScreenFooter
            completedCount={completedCount}
            activeCount={activeCount}
            filter={filter}
            onClearCompleted={interactions.clearCompleted}
            onFilterChange={interactions.filterChange}
          />
        )}
      </section>
    </section>
  );
}

export default cycleConnect(main)(TodosScreen);
