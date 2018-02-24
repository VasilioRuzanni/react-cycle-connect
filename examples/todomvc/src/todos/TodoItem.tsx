import React, { Component, MouseEvent, ChangeEvent } from 'react';
import classnames from 'classnames';
import xs, { Stream } from 'xstream';
import { Sinks } from '@cycle/run';
import { StateSource, Reducer } from 'cycle-onionify';
import {
  cycleConnect,
  InteractionsSource,
  InteractionsSink,
  InteractionEvent,
  CycleConnectedProps
} from 'react-cycle-connect';
import { StateIsolator } from 'react-cycle-connect/lib/extra/onionify';
import TodoForm, { TodoFormState } from './TodoForm';
import { Todo } from './types';

export interface TodoItemState {
  id: number;
  text: string;
  completed: boolean;
  isEditing: boolean;
  form?: TodoFormState;
}

export interface InteractionEvents {
  formSubmit: string;
  formCancel: null;
  toggle: ChangeEvent<HTMLInputElement>;
  textDoubleClick: MouseEvent<HTMLElement>;
  destroyClick: MouseEvent<HTMLElement>;
}

export interface ViewProps extends CycleConnectedProps<InteractionEvents> {
  text: string;
  completed: boolean;
  isEditing?: boolean;
}

export interface Sources {
  interactions: InteractionsSource<InteractionEvents>;
  onion: StateSource<any>;
}

export interface Sinks {
  props: Stream<{ [name: string]: any }>;
  onion: Stream<Reducer<TodoItemState>>;
}

function intent(interactions: InteractionsSource<InteractionEvents>) {
  const formSubmit$ = interactions.formSubmit;

  return {
    startEdit$: interactions.textDoubleClick,
    cancelEdit$: interactions.formCancel,
    saveTodo$: formSubmit$.filter((text: string) => !!text),
    toggle$: interactions.toggle.map(event => event.currentTarget.checked),
    destroy$: xs
      .merge(
        interactions.select('destroyClick'),
        formSubmit$.filter((text: string) => !text)
      )
      .mapTo(null)
  };
}

function model(actions: {
  [key: string]: Stream<any>;
}): Stream<Reducer<TodoItemState>> {
  const defaultReducer$ = xs.of(function defaultReducer(state: TodoItemState) {
    if (state) return state;
    return void 0;
  });

  const isEditing$ = xs.merge(
    actions.startEdit$.mapTo(true),
    actions.saveTodo$.mapTo(false),
    actions.cancelEdit$.mapTo(false)
  );

  const formReducer$ = isEditing$.map(
    (isEditing: boolean) =>
      function formReducer(state: TodoItemState) {
        return {
          ...state,
          isEditing,
          form: isEditing ? { text: state.text } : void 0
        };
      }
  );

  const updateReducer$ = (actions.saveTodo$ as Stream<string>).map(
    (newText: string) =>
      function updateReducer(state: TodoItemState) {
        return {
          ...state,
          text: newText
        };
      }
  );

  const toggleReducer$ = (actions.toggle$ as Stream<boolean>).map(
    completed =>
      function toggleReducer(state: TodoItemState) {
        return {
          ...state,
          completed
        };
      }
  );

  const destroyReducer$ = (actions.destroy$ as Stream<any>).mapTo(
    function destroyReducer(state: TodoItemState) {
      return void 0;
    }
  );

  return xs.merge(
    defaultReducer$,
    formReducer$,
    updateReducer$,
    toggleReducer$,
    destroyReducer$
  );
}

function main(sources: Sources): Sinks {
  const state$ = sources.onion.state$ as Stream<TodoItemState>;
  const actions = intent(sources.interactions);
  const reducer$ = model(actions);

  return {
    props: state$,
    onion: reducer$
  };
}

export function TodoItem({
  interactions,
  text,
  completed,
  isEditing
}: ViewProps) {
  const todoVNode = isEditing ? (
    <StateIsolator lens="form">
      <TodoForm
        isEdit={true}
        isEditing={isEditing}
        onSubmit={interactions.formSubmit}
        onCancel={interactions.formCancel}
      />
    </StateIsolator>
  ) : (
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={completed}
          onChange={interactions.toggle}
        />
        <label onDoubleClick={interactions.textDoubleClick}>{text}</label>
        <button className="destroy" onClick={interactions.destroyClick} />
      </div>
    );

  return (
    <li
      className={classnames({
        completed: completed,
        editing: isEditing
      })}
    >
      {todoVNode}
    </li>
  );
}

export default cycleConnect(main)(TodoItem);
