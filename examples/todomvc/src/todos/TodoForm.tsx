import React, { FormEvent, FocusEvent, KeyboardEvent, Ref } from 'react';
import classnames from 'classnames';
import xs, { Stream } from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import { StateSource, Reducer } from 'cycle-onionify';
import {
  cycleConnect,
  InteractionsSource,
  ReactPropsSource,
  InteractionEvent,
  InteractionsSink,
  InteractionsProps,
  CycleConnectOptionsProps,
  CycleConnectedProps
} from 'react-cycle-connect';
import { Todo } from './types';

// TODO: Move to constants
const ENTER_KEY_CODE = 13;
const ESC_KEY_CODE = 27;

export interface TodoFormState {
  text: string;
}

interface InteractionEvents {
  blur: FocusEvent<HTMLInputElement>;
  change: FormEvent<HTMLInputElement>;
  keyDown: KeyboardEvent<HTMLElement>;
}

export interface Props extends CycleConnectOptionsProps {
  text?: string;
  isEdit?: boolean;
  isEditing?: boolean;
  placeholder?: string;
  onSubmit?: (text?: string | null) => void;
  onCancel?: () => void;
}

export type ViewProps = Props & CycleConnectedProps<InteractionEvents>;

export interface Sources {
  props: ReactPropsSource<Props>;
  onion: StateSource<TodoFormState>;
  interactions: InteractionsSource<InteractionEvents>;
}

export interface Sinks {
  props: Stream<Partial<ViewProps>>;
  onion: Stream<Reducer<TodoFormState>>;
  interactions: InteractionsSink<
    Props,
    {
      onSubmit: Stream<string>;
      onCancel: Stream<null>;
    }
  >;
  // interactions: Stream<{
  //   onSubmit: Stream<string>;
  //   onCancel: Stream<null>;
  // }>;
}

interface ModelActions {
  change$: Stream<string>;
  cancel$: Stream<null>;
}

function intent(
  interactions: InteractionsSource<InteractionEvents>,
  isEdit$: Stream<boolean>
) {
  const keyPress$ = interactions.keyDown;

  const enterKeyPress$ = keyPress$
    .filter(event => !!event && event.which === ENTER_KEY_CODE)
    .mapTo(null);

  const escKeyPress$ = keyPress$
    .filter(event => !!event && event.which === ESC_KEY_CODE)
    .mapTo(null);

  const blur$ = interactions.blur.mapTo(null);

  const change$ = interactions.change.map(
    event => (event && event.currentTarget.value) || ''
  );

  return {
    change$,
    submit$: xs.merge(
      enterKeyPress$,
      // NOTE: Only submit on blur if we're editing
      blur$
        .compose(sampleCombine(isEdit$))
        .map(([_, isEdit]) => isEdit)
        .filter(isEdit => isEdit)
    ),
    cancel$: escKeyPress$
  };
}

function model(actions: ModelActions): Stream<Reducer<TodoFormState>> {
  const defaultReducer$ = xs.of(function defaultReducer(state: TodoFormState) {
    if (state) return state;
    return { text: '' };
  });

  const formChangeReducer$ = actions.change$.map(
    (text: string) =>
      function formChangeReducer(state: TodoFormState) {
        return {
          ...state,
          text
        };
      }
  );

  const cancelReducer$ = actions.cancel$.map(
    () =>
      function cancelReducer(state: TodoFormState) {
        return void 0;
      }
  );

  return xs.merge(defaultReducer$, formChangeReducer$, cancelReducer$);
}

function main(sources: Sources): Sinks {
  const state$ = sources.onion.state$;
  const actions = intent(
    sources.interactions,
    sources.props.pluck('isEdit').map(isEdit => !!isEdit)
  );
  const reducer$ = model(actions);
  const formValue$ = state$.map(state => state.text);

  return {
    props: state$,
    onion: reducer$,
    interactions: xs.of({
      onSubmit: actions.submit$
        .compose(sampleCombine(formValue$))
        .map(([_, text]) => text.trim()),
      onCancel: actions.cancel$
    })
  };
}

export function TodoForm({
  interactions,
  text,
  isEdit,
  isEditing,
  placeholder
}: ViewProps) {
  function onRef(el: HTMLInputElement) {
    if (isEditing && el) {
      el.focus();
      el.selectionStart = el.value.length;
    }
  }

  return (
    <input
      className={classnames({
        'new-todo': !isEdit,
        edit: isEditing
      })}
      ref={onRef}
      type="text"
      placeholder={placeholder}
      autoFocus={true}
      value={text}
      onBlur={interactions.blur}
      onChange={interactions.change}
      onKeyDown={interactions.keyDown}
    />
  );
}

export default cycleConnect(main)(TodoForm);
