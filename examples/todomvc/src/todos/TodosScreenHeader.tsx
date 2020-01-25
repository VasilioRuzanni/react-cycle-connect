import React, { FormEvent } from "react";
import xs, { Stream } from "xstream";
import { Sinks, Main } from "@cycle/run";
import { StateSource, Reducer } from "@cycle/state";
import {
  cycleConnect,
  InteractionsSource,
  ReactPropsSource,
  CycleConnectedProps
} from "react-cycle-connect";
import TodoForm from "./TodoForm";
import { Todo } from "./types";

interface InteractionEvents {
  todoFormSubmit: FormEvent<HTMLFontElement>;
}

export interface Props {
  onFormSubmit: (text: string) => void;
}

export type ViewProps = Props & CycleConnectedProps<InteractionEvents>;

export interface Sources {
  interactions: InteractionsSource<InteractionEvents>;
  props: ReactPropsSource<Props>;
}

function main(sources: Sources): Sinks<Main> {
  return {
    interactions: xs.of({
      onFormSubmit: sources.interactions.todoFormSubmit
    })
  };
}

export function TodosScreenHeader({ interactions, interact }: ViewProps) {
  return (
    <header className="header">
      <h1>todos</h1>

      <TodoForm
        isolate={{ state: "newItemFormState" }}
        isEdit={false}
        onSubmit={interact("todoFormSubmit")}
        placeholder="What needs to be done?"
      />
    </header>
  );
}

export default cycleConnect<Props>(main)(TodosScreenHeader);
