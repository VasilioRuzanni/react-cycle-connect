# react-cycle-connect

An experimental library that allows using [Cycle.js](https://cycle.js.org/) as a reactive dataflow framework for [React](https://reactjs.org/). 
Written in TypeScript.

This little thing allows to define your app's **view** layer using regular React components, but implement the actual logic behind it using pure functional reactive approach, taking advantage of Cycle.js' [Model-View-Intent](https://cycle.js.org/model-view-intent.html) pattern and its exceptional **side effect control**.

This isn't a custom implementation of Cycle **pattern** for `React` but a link to real Cycle.js instead, so any Cycle.js drivers and wrappers can be applied (e.g., `cycle-onionify` for state management). Also, for this reason, some knowledge about how `Cycle.js` works is assumed.

> **Note:** This is an experimental lib and currently works with `React` and `xstream` only. If all goes good, the support for `preact`/`inferno` (instead of `React`) and for `RxJS`/`most` (instead of `xstream`) is anticipated. Nothing prevents from having `react-native` covered too.

**Any feedback is highly appreciated!**


## Table of Contents

- [Shut up and show me the code](#shut-up-and-show-me-the-code)
- [Installation](#installation)
- [Motivation](#motivation)
  - [Why not just use Cycle.js alone?](#why-not-just-use-cyclejs-alone)
  - [Is it a "Cycle.js in React" or "React in Cycle.js"?](#is-it-a-cyclejs-in-react-or-react-in-cyclejs)
- [How it works (architecture)](#how-it-works-architecture)
  - [Differences from idiomatic Cycle.js usage](#differences-from-idiomatic-cyclejs-usage)  
- [Guide](#guide)
  - [Basics](#basics)
  - [Root Cycle](#root-cycle)
  - [`render` option](#render-option)
  - [`displayName` option](#displayname-option)
  - [Inside the Cycle](#inside-the-cycle)
    - [Drivers](#drivers)
    - [Wrappers](#wrappers)
    - [Sources](#sources)
    - [Sinks](#sinks)
  - [React `props`](#react-props)
  - [Interactions](#interactions)
    - [Events triggering by the view](#events-triggering-by-the-view)
    - [View events handling with `interactions` source](#view-events-handling-with-interactions-source)
    - [Upstream interactions with `interactions` sink (calling callbacks on `props`)](#upstream-interactions-with-interactions-sink-calling-callbacks-on-props)
  - [React component lifecycle streams](#react-component-lifecycle-streams)
  - [Side effect control and `fnCallEffect` driver](#side-effect-control-and-fncalleffect-driver)
  - [Isolation](#isolation)
    - [Naive explicit isolation (conceptually incorrect)](#naive-explicit-isolation-conceptually-incorrect)
    - [`isolate` option for `cycleConnect()`](#isolate-option-for-cycleconnect)
    - [`isolate` prop](#isolate-prop)
    - [`<Isolator>` helper component](#isolator-helper-component)
  - [Extra: state management with `cycle-onionify`](#extra-state-management-with-cycle-onionify)
    - [`<StateIsolator>` helper component](#stateisolator-helper-component)
    - [Handling collection state manually](#handling-collection-state-manually)
    - [`<Collection>` helper component](#collection-helper-component)
    - [`makeFilteredListLens()` factory function to assist `<Collection>`](#makefilteredlistlens-factory-function-to-assist-collection)
  - [Testing](#testing) [WIP]
  - [TypeScript support](#typescript-support) [WIP]
- [API reference](#api-reference) [WIP]
- [Alternatives / Competitors](#alternatives-competitors)
  - [cycle-react](#cycle-react)
  - [recycle.js](#recyclejs)
  - [redux-cycles](#redux-cycles)
- [FAQ](#faq) [WIP]


## Shup up and show me the code

Cycle.js's [counter](https://github.com/cyclejs/cyclejs/tree/master/examples/basic/counter) example ported over:

```js
import React from 'react';
import ReactDOM from 'react-dom';
import xs from 'xstream';
import { run } from '@cycle/run';
import { cycleConnect } from 'react-cycle-connect';

// Your Cycle.js `main` function

function main(sources) {
  const action$ = xs.merge(
    sources.interactions.decrement.map(ev => -1),
    sources.interactions.increment.map(ev => +1)
  );
  const count$ = action$.fold((acc, x) => acc + x, 0);

  return {
    props: count$.map(count => ({ count }))
  };
}

// Your React component

function App({ interactions, count }) {
  return (
    <div>
      <button onClick={interactions.decrement}>Decrement</button>
      <button onClick={interactions.increment}>Increment</button>
      <p>Counter: {count}</p>
    </div>
  );
}

// Some connection magic

const ConnectedApp = cycleConnect(main, {
  root: true,
  runFn: run
})(App);

// Render normally as it's a regular React app

ReactDOM.render(
  <ConnectedApp />,
  document.getElementById('root')
);
```

Also - there's official [TodoMVC](https://github.com/VasilioRuzanni/react-cycle-connect/tree/master/examples/todomvc) example with `cycle-onionify` for state management.


## Installation

Using [npm](https://www.npmjs.com/):

    $ npm install --save react-cycle-connect

Using [yarn](https://yarnpkg.com):

    $ yarn add react-cycle-connect


## Motivation

The motivation to create this lib was based off the need to retain the React-style composability of the **view** layer using regular React components, reuse existing React components, make it (the lib) easily/incrementally adoptable in an ongoing React project, but also take advantage of the Cycle.js' [MVI](https://cycle.js.org/model-view-intent.html) pattern and side effect control.

At the same time, while the most valuable thing from `Cycle` is the **pattern** itself, there are numerous available libs/plugins for Cycle.js to take advantage of, thus taking the best of both worlds.

This way, you can still use anything from React stack (e.g., `react-router` to compose your routed app screens), but describe the interactions as a dataflow, with pure functions and reactive streams. Most of React components are going to be ["dumb"](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) (and also [stateless functional](https://hackernoon.com/react-stateless-functional-components-nine-wins-you-might-have-overlooked-997b0d933dbc) aka SFC) since all the backing logic and cross-component communication would be handled by a tree of `Cycle.js` programs.


### Why not just use Cycle.js alone?

That is what I'd recommend considering in the first place. Its fast, its cool, the `snabbdom` (virtual DOM rendering engine behind Cycle's DOM driver) is goddamn fast and reliable. If you don't intend to use `React` components in any way, don't even get bothered. The `react-cycle-connect` is more about "introducing Cycle.js to `React`", not the other way around.


### Is it a "Cycle.js in React" or "React in Cycle.js"?

More of a "Cycle.js in React". The app is bootstrapped by rendering a React component to the DOM, view is composed the React way. The root Cycle.js program is being `run` by rendering a root `cycleConnect()`ed component. **Though**, it doesn't prescribe how you write your Cycle.js programs, and aside from the DOM generation part, its just Cycle.js all the way.


## How it works (architecture)

Every `cycleConnect()`ed component got a real Cycle.js program "attached" to it. The boundary between the two is `props`. From your Cycle.js program standpoint, **`props` is a view**. Cycle.js program can update `props` that React component will then render.

A bunch of nested React components in your app represent a "tree of React components". `react-cycle-connect` maintains a "tree of Cycle.js programs" that map to `cycleConnect()`ed components and takes advantage of React's [context](https://reactjs.org/docs/context.html) feature to provide links between the nodes. Each connected component provides scoped links to the children nodes .

New "Cycle nodes" are attached lazily, upon associated React component initialization (this is where React controls how Cycle programs are run). The above-mentioned "link" is just an object on React `context` that brings couple properties:

- `sources` for the child connected component's `main` function; and
- `sinkProxies` to subscribe to that component's `main` function `sinks`.

This is where something unusual for the Cycle.js happens - we subscribe to and unsubscribe from connected component's `main` function `sinks` based on React component's lifetime hooks. In Cycle.js, you normally just run the app at startup and let it run as an ongoing process. But this is where `react-cycle-connect` performs the sync between the two worlds.

Overall, aside from using React `context` (which is just an implementation detail) and some intense wrapping on the `react-cycle-connect` side to make laziness possible, `react-cycle-connect` tries to represent the entire tree of Cycle.js programs as close as possible to what you'd end up with by writing idiomatic Cycle.js with explicit calling of nested component's `main` functions from the parent component `main` function. The result of children components is always `merge`d.

Aside from passing the `sources` to children components, `react-cycle-connect` also explicitly applies some internal wrappers to integrate with React component: [`lifecycle`](#react-component-lifecycle-streams), [`props`](#react-props) and [`interactions`](#interactions), that are **scoped to a connected component's Cycle.js program only**. It also explicitly runs the internal [`fnCallEffect`](#side-effect-control-and-fncalleffect-driver) driver for the `root` nodes by default - this is necessary for the `interactions` sink to work (because its supposed to run callbacks passed via `props` and that might be an effectful function).

Note that the entire internal "tree" of Cycle.js programs is maintained pure, including internal component-scoped wrappers, just as you would do with regular Cycle.js program.


### Differences from idiomatic Cycle.js usage

> Note: there's a difference in how'd you write the `react`/`react-cycle-connect` app vs pure `Cycle.js` app. There's _no misuse_ of Cycle.js per se, we just don't use it for rendering with `react-cycle-connect` - and that applies certain implications to the approach.

`React` and `Cycle.js`, while both allow to create user interfaces, imply different approaches to the app architecture. The most important part here is that they are conceptually different when it comes to generating the VDOM.

In order to combine the two approaches nicely, there are certain deviations from how'd you write the `Cycle.js`-only app to allow for more optimal React DX.

- The main difference from a pure `Cycle.js` way is that its not a Cycle program that technically generates VDOM - instead, there's React component to represent a piece of UI. `Cycle.js` approach to view/`DOM` event handling is rather purist - view only defines the markup and nothing else (i.e., user interaction/event handlers are defined inside Cycle program itself and not as some view component `onClick`/etc attribute). That is not a crazy random opinion but instead a very well thought and weighted out decision by Cycle.js team. `react-cycle-connect` takes a different approach, which isn't that strict and is more in line with React, with callbacks amongst `props` and all that stuff. It enables the events/component callbacks handling via [interactions](#interactions).

- The view composition is obviously completely different. In `Cycle.js` you run each component's `main` function that (possibly) generates a VDOM node and then explicitly combine the pieces of markup into a single VDOM stream that is then given to a DOM driver. With `react-cycle-connect` you compose the view layer with React components normally. You can just connect those to Cycle.js program to "outsource" the actual logic to it.


## Guide

This assumes the preliminary knowledge of both `React` and `Cycle.js` (and `xstream`). It doesn't provide much of the insight on how these work, but is instead focused on how `react-cycle-connect` combines the two.


### Basics

The result of `cycleConnect()` call is a [HOC](https://reactjs.org/docs/higher-order-components.html#convention-maximizing-composability) that optionally takes a React component (similar to that `connect()` function of `react-redux`) and returns a component that is _augmented_ with backing Cycle.js program. This Cycle.js program is internally wrapped into a "Cycle Node" that, when initialized, is connected to a tree of Cycle.js programs. "Cycle Nodes" of every `cycleConnect()`ed components are linked together via React `context`.

Note, though, that there are no direct references from one component's Cycle program to another component's Cycle program, i.e., you're not invoking one `main` function from the other (this is perfectly possible though, but since we're not using `DOM driver` here, it would only handle non-DOM stuff). Instead, `react-cycle-connect` handles the linking behind the scenes, so the "sibling" Cycle programs are fed with the same `sources` and subscribe their `sinks` to the same `sinkProxies`.

There's essential concept of **isolation** in Cycle.js, so every `cycleConnect()`ed component accepts an [`isolate`](#isolate-prop) prop, that is directly passed to `isolate` function from `@cycle/isolate` package. Read more about Cycle.js isolation [here](https://cycle.js.org/api/isolate.html).


### Root Cycle

Every `cycleConnect()`ed component provides a `cycleNodeLink` object to its children through React `context` and also expects that `cycleNodeLink` from some parent component (not necessarily immediate parent).

That link object has the following shape:
```js
{
  // Sources to provide to our Cycle.js program's `main` function as an argument
  sources: { ... },

  // sinkProxies to subscribe to our Cycle program's `main` function sinks
  sinkProxies: { ... }
}
```

You shouldn't be working with that directly but its important that something needs to provide the top-level `sources` and `sinks` in the first place. This is what `root` option of cycle connect for.

Also, the `cycleConnect()`ed components' programs (`main` functions) are lazily attached to already running upper-level Cycle.js program, so the `root` program has to be `run`.

So, root `cycleConnect`, aside from `{ root: true }` option, also needs `runFn` defined, so that it knows how to run your top-level Cycle.js program. This would normally be just a `run` function from `@cycle/run` package (or `@cycle/rxjs-run`, or `@cycle/most-run`, depending on the reactive streams library in use).

You could just `cycleConnect()` your top-level `App` component like we did in the [first example](#shut-up-and-show-me-the-code):
 
```js
import { run } from '@cycle/run';
import { cycleConnect } from 'react-cycle-connect';
...

function main(sources) {
  ...
}

function App() {
  return (
    // Some JSX
    ...
  );
}

const ConnectedApp = cycleConnect(main, {
  root: true,
  runFn: run
})(App);
```

Though this will work, its advisable to create a specialized `RootCycle` component just for this purpose:

```js
// RootCycle.js

import { run } from '@cycle/run';
import { cycleConnect } from 'react-cycle-connect';

function main(sources) {
  ...
}

export const RootCycle = cycleConnect(main, {
  root: true,
  runFn: run
})(); // No component to wrap? Its okay, read ahead

export default RootCycle;
```

The top-level Cycle sources are actually `drivers` and `wrappers`, so root Cycle is also in charge of providing these `drivers` and `wrappers` to any Cycle.js program down the tree, as `sources`.

`drivers` option is the object with keys defining properties of the `sources` object, identical to how you'd do that in a regular Cycle.js program.

`wrappers` option accepts an array of wrappers (order might matter there, so its a user-land option).

Also, the `main` function is optional (because you might need a `cycleConnect` to be a `root` or for `isolation` only), so you can skip it, unless you have some logic to implement there.

> Note that the `wrappers` can be passed to any `cycleConnect`, even non-root, but `drivers` option is only valid for `root` Cycle and is ignored otherwise.

```js
// RootCycle.js

import { run } from '@cycle/run';
import { makeHTTPDriver } from '@cycle/http';
import onionify from 'cycle-onionify';
import { cycleConnect } from 'react-cycle-connect';

const drivers = { HTTP: makeHTTPDriver() };
const wrappers = [onionify];

export const RootCycle = cycleConnect({
  root: true,
  runFn: run,
  drivers,
  wrappers
})();

export default RootCycle;
```

`RootCycle` component is basically in charge of bootstrapping the "Cycle" part of your app here.

Then just wrap your `App` with it and e.g., render with `ReactDOM`:

```js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import RootCycle from './RootCycle';

ReactDOM.render(
  (
    <RootCycle>
      <App />
    </RootCycle>
  ),
  document.getElementById('root')
);

```


### `render` option

You might have noticed in axamples above that we're not providing any component to a `cycleConnect` HOC, leaving empty braces instead:

```js
const ConnectedComponent = cycleConnect({
  root: true,
  runFn: run,
  drivers,
  wrappers
})();
```

Well, that is not a mistake - the wrapped component is optional. When a "component to wrap" is provided to `cycleConnect(...)(ComponentToWrap)`, then if we render the connected component, the `cycleConnect` will also render `ComponentToWrap` internally.
 
Thats all good and works (and what you'll be using most of the time anyway), but sometimes you just want to keep your React Element tree a bit cleaner when the wrapped component would be a kind of _noop_ anyway (just forwarding `children` and nothing else), or component is some technical/lower-level like `RootCycle`, or have some special rendering behavior.

So, we want to avoid seeing this in React Developer Tools:

 ```html
  <cycleConnect(SomeComponent)>
    <SomeComponent>
      ...
    </SomeComponent>
  </cycleConnect(SomeComponent)>
```

You can use `render` option for that. It accepts the function with this signature:
```js
(props) => ReactNode | null
```

If no component is provided for wrapping, nor `render` option is defined, the `render` option defaults to `(props) => props.children || null` function, so its either forwarding `children` if any or renders nothing.

If both `render` option is provided and component-to-wrap is passed, then `render` takes the precedence.

> Note: Why not use the `render` option in place of wrapped component all the time? Well, its technically possible, espeically if your React component is a stateless functional component anyway.
> 
> But regular HOC wrapping is just common technique in React world and is nicely composable when you have other HOCs than `cycleConnect`.
>
> And is cleaner too - you might be prototyping your app as a set of `React` components first, without even involving `react-cycle-connect`, then "connect" them all at once, or introduce `react-cycle-connect` incrementally. Whatever :)


### `displayName` option

Your component's `displayName` is by default automatically assigned to the following (depending on whether the wrapped component is provided, or `render` option, or neither:

 - `cycleConnect(WrappedComponentNameHere)` when WrappedComponent is passed
 - `cycleConnect(customRenderFn)` when `render` prop is defined (and is truthy)
 - `cycleConnect(defaultRenderFn)` otherwise

You can override that like with any regular React component:

```js
const ConnectedComponent = cycleConnect({
  ...
)(Component);

ConnectedComponent.displayName = 'ConnectedComponent';
```

But there's also a `displayName` option to set the generated (connected) component `displayName`, which looks a bit cleaner:

```js
const ConnectedComponent = cycleConnect({
  ...
  displayName: 'ConnectedComponent'
)(Component);
```


### Inside the Cycle

`react-cycle-connect` really assumes that you know how to use Cycle.js. Its really a very simple yet very elegant pattern, so make sure to familiarize yourself with it.

Quick recap on what Cycle.js `main` function is. Its basically a **pure** function with the signature:

```js
main :: (Sources) => Sinks
```

It accepts `sources` as an argument and returns `sinks` and describes a dataflow using composition of reactive streams and their transformations with pure functions.

> Please note that the `main` function **is only run once** per `React` component lifecycle. It doesn't run again on rerendering or something. This is because the actual call to `main(...)` is to just build up a **dataflow**, not to get some rendering data.
>
> The data flows through reactive streams, from `sources` to `sinks` of the `main`, until its `sinks` are unsubscribed from parent Cycle program's `sinkProxies` (this happens when React component is unmounted).


#### Drivers

The `driver` is supposed to run side effects for a Cycle.js program. Its outside the program itself, supposed to be impure and connects your Cycle app with the "outer world". This is an essential concept and is described in a great detail in [Cycle.js docs on drivers](https://cycle.js.org/drivers.html).

There are no differences from idiomatic Cycle.js in how `react-cycle-connect` handles `drivers` - it just hands it over to `@cycle/run` directly. There is only one `react-cycle-connect` driver (an `fnCallEffect` driver) that is always added internally by the `cycleConnect({ root: true })`ed component - it allows to invoke functions outside the `main` that is to be maintained pure.


#### Wrappers

The `wrapper` is a rather simple thing - its just a function that takes `main` function that wraps it with the other `main` function that might in turn add some logic in between:

```js
function someWrapper(originalMain) {
  return wrappedMain(sources) {
    // Can do something here, like transforming `sources` somehow
    // ...

    // Invoke the original `main` internally to obtain its sinks
    const sinks = originalMain(sources);

    // Can do something to `originalMain`s sinks here
    // ...

    return {
      ...sinks,
      someOtherSink: xs.of({ ... }) // Can add a new sink
    };
  }
}
```

It is important that the wrapping `main` is maintained **pure**, so that your entire program is pure. If you need some effectful logic to run in a wrapping `main`, you should consider using driver for that. Wrappers, just like any regular `main` function, can internally use `sources` that are created from `drivers`.

Wrappers can also add arbitrary `sources` and could expect certain `sinks` to be returned from the Cycle program, depending on particular wrapper implementation.

Wrappers are usually created to encapsulate some non-business-logic stuff, you'd be normally describe anything related to the app itself in the "original" `main` function.

Most of `react-cycle-connect` (aside from `cycleConnect(...)` HOC itself) is implemented with wrappers, that are created for each `cycleConnect()`ed component automatically:
- `reactPropsWrapper` (to mess around with React component props)
- `reactLifecycleWrapper` (a gateway to React component lifecycle streams)
- `interactionsWrapper` (to route the view events back from your wrapped React component aka **view**, and pass the events upstream, to parent components)


#### Sources

This is a Cycle.js program's input. `main` function shouldn't care whether something on the `sources` is a `driver` or some custom thing provided by one of the wrappers.

For `root` connected component, the `sources` are `drivers` directly plus whatever `wrappers` add to them.


#### Sinks

This is a Cycle.js program's output.

`react-cycle-connect` invokes your `cycleConnect()`ed component's `main` function, takes its `sinks` and subscribes the `sinkProxies` passed from the parent component to these `sinks`. Its how `react-cycle-component` is "attaching" the new component to a tree of Cycle programs.

If there's no parent component (thus, no `sinkProxies`) and your component is a "Root Cycle", then the sinks are handled to `@cycle/run` to "run" as with a regular Cycle.js app.


### React `props`

The `cycleConnect()`ed `React` component is essentially a **view** for the associated Cycle.js `main` function. And `react-cycle-connect` encourages the **view** to be a "dumb" stateless function that takes `props` as an argument ad returns something of `ReactNode` type (i.e., `ReactElement`s, `null`, etc, whatever `React` component renders).

> Note: The wrapped `React` shouldn't necessarily be a stateless functional component (SFC), you could have any `React` component wrapped, but its advisable to use functions for the most part as the whole point of `react-cycle-connect` is to use `Cycle.js` for anything that is not a **view**.

So, the `props` is the only communication channel from our Cycle.js part (the connected component's `main` function) to connected `React` component itself. We therefore need to pass the props from our Cycle program to the **view** (a `React` component) somehow.

This is where `reactPropsWrapper` comes into play and provides `props` source and sink for a `main` function. Its local to a component, so no other components will share the same `props` source or sink.

#### `props` sink

The `props` _sink_ on `cycleConnect()`ed is there to pass the props to the view:

```js
function main(sources) {
  return {
    props: xs.of({ greetable: 'World' })
  };
}

// Use the passed `greetable` prop

function MyComponent(props) {
  return (
    <div>
      Hello {props.greetable}!
    </div>
  );
}

const MyConnectedComponent = cycleConnect(main)(MyComponent);
```

Remember, that the value you map to `props` sink should be an object of new props and that updated props will be **merged** with existing component `props` like:
```js
const updatedProps = Object.assign({}, prevProps, newProps);
```

This means that you can easily overwrite any props you want and leave the others intact.

Also, note above that we're passing the `props` through an `Observable` stream and that might be synchronous (like in our example with a stream of static data that is sent immediately) but could also be asynchronous. In that case the value of some prop might be not yet available on the first render:

```js
function main(sources) {
  return {
    props: xs.of({ greetable: 'World' }).compose(delay(3000))
  };
}

// Trying to use the passed `greetable` prop
// But whooops, no `greetable` yet :(

function MyComponent(props) {
  return (
    <div>
      Hello {props.greetable}!
    </div>
  );
}

const MyConnectedComponent = cycleConnect(main)(MyComponent);
```

So either provide a default value for that async prop's `Observable` or perform additional checks in the **view**, when rendering.

> Note: When messing with the `props` in your `main`, remember that any props that are passed from outside as an input to a `React` component, are also there (including **callback functions**, if there are any) and are also merged upon updates from outside (on `componentDidUpdate`).

Lets summarize: the `props` from the `props` sink are passed from the `main` function to the **view** (`React` component).

#### `props` source

Not only you'll need to provide the props to the **view** for rendering, but oftentimes you'd need your `props` to take part in transformations/calculations in the `main` function itself. For that reason, `reactPropsWrapper` provides the `props` source as well.

It allows you to have an `Observable` stream of your component's input `props`. Note that the `sources.props` is of type `ReactPropsSource` and to take the actual stream of props, use its `props$` attribute:

```js
function main(sources) {
  const name$ = sources.props.props$.map(props => props.name);

  return {
    props: name$.map(name => ({ name: name.toUpperCase() }))
  };
}

function MyComponent(props) {
  return (
    <div>
      Hello, {props.name}! Your father is Mr. {props.father}.
    </div>
  );
}

const MyConnectedComponent = cycleConnect(main)(MyComponent);

...

// Somewhere else:
<MyConnectedComponent name="Luke Skywalker" father="Darth Vader" />

// renders:
//
// <div>
//   Hello, LUKE SKYWALKER! Your father is Mr. Darth Vader.
// </div>
```

The new value on `props$` is emitted every time `props` change. This could be overkill for the most cases, as you would only need just few props for your dataflow.

This is what `ReactPropsSource.pluck()` method for, it accepts the name of the nested prop (will return `undefined` if the stream value is not an object) and returns a stream of that prop only that is only got new value once this particular prop changes:

```js
function main(sources) {
  const name$ = sources.props.pluck('name');

  return {
    props: name$.map(name => ({ name: name.toUpperCase() }))
  };
}
```

The `pluck()`ed stream also performs shallow comparison and does `dropRepeats()` behind the scenes, so identical values don't cause a new value emitted on an `Observable`.

Note that you don't need to always pull all props from your `main` function's `sources.props` just for the sake of it to just forward to the `props` sink directly, you better only pick those you need in a dataflow with `ReactPropsSource.pluck()`. The `props` passed from outside will be available on the view normally. You can overwrite them from inside your `main` though.

There's also `ReactPropsSource.select()` method that also accepts a nested prop name. The difference is that the result is not an `Observable` stream of prop values but the `ReactPropsSource` instance itself that is _scoped_ to that piece of `props`:

```js
function main(sources) {
  const name$ = sources.props.pluck('name'); // Stream of strings
  const nameSource = sources.props.select('someNestedObject'); // Scoped ReactPropsSource

  const someNestedObjProperty$ = nameSource.pluck('someNestedObjectProperty');
  ...
}

```

This is useful when you want to `pluck()` a stream of some sub-prop from deeper nested objects.

> Note: Taking deep property stream this way isn't really nice currently as requires quite a bit of boilerplate - this part of API is already being thought out further and reconsidered.


### Interactions

So far so good, but rendering the `props` isn't the only exciting thing we want to do with `React`, right? We also want to handle events coming from the **view**(e.g., the DOM).

The way `react-cycle-connect` handles events and nested components' callbacks is the biggest deviation from an idiomatic Cycle.js app using `DOM` driver. It refrains from a holistic "no handlers in the view" approach for a few reasons:

- We need something more in line with `React` as we're using React here
- We're not always handling DOM events but also need to handle some children components data/events passed back. We can't pass streams like in regular Cycle.js app, in `React` we do it via callbacks that are provided amongst children components' `props` and we need `cycleConnect()`ed components to be compatible `React` components at all levels.

This is what "interactions" feature of `react-cycle-connect` is for. It provides the unified interface for parent-child components communication and event handling that is aligned with a regular event/callback handling model on `React` side but also allows to access those events in form of `Observable` streams inside the `main` function.

#### Events triggering by the view

Every `cycleConnect()ed` component has some additional `react-cycle-connect`-specific props injected, so they are available on your **view**.

These are `interactFn` which is a function that takes the `interactionType` (a string) and optional `predefinedValue` (of any type) and returns a function that will be a callback for your event or some child component prop function.

So, the signature is:
```js
(interactionType, predefinedValue?) => (value) => void
```

Its supposed to be called imperatively in your **view** and is available as `props.interact`:

```js
function MyComponent({ interact }) {
  return (
    <div>
      <button type="button" onClick={interact('buttonClick')}>
        Click me!
      </button>
    </div>
  );
}
```

For the sake of being cleaner (and for better [TypeScript support](#typescript-support)), `react-cycle-connect` also leverages the ES2015 `Proxy` feature to provide the object with dynamic properties, each representing an `interact` with `interactionType` dynamically defined after the function property name. Its available on `props.interactions` so we can rewrite the above snippet as:

```js
function MyComponent({ interactions }) {
  return (
    <div>
      <button type="button" onClick={interactions.buttonClick}>
        Click me!
      </button>
    </div>
  );
}
```

In the example above, the `interactions.buttonClick` function receives the click `event` as an argument and that is what you'll get in your `main` (next section).

While cleaner, it doesn't allow for the `predefinedValue` to be set, so if you need some particular value to be emitted by the associated stream in your `main`, you can either use `interact` or create an inline function:

```js
// Assuming you have `id` available, e.g.
// when looping/mapping over the collection of items

<button
  type="button"
  className="delete-btn"
  onClick={interact('delete', id)}
>
  Click me!
</button>

// OR

<button
  type="button"
  className="delete-btn"
  onClick={() => interactions.delete(id)}
>
  Click me!
</button>
```

#### View events handling with `interactions` source

There's internal `interactionsWrapper` in `react-cycle-connect` and it provides the `interactions` source for our `main` function. The `interactions` source is of type `InteractionsSource`, which has the `InteractionsSource.select()` method, which we can use to obtain interaction streams:

```js
function main(sources) {
  const buttonClick$ = sources.interactions.select('buttonClick');

  // Do something with a buttonClick$, e.g.
  // map it to the click coordinates props

  return {
    props: buttonClick$.map(
      event => ({
        clickX: event.clientX,
        clickY: event.clientY,
      })
    )
  };
}

function MyComponent({ interact, clickX, clickY }) {
  return (
    <div>
      <span>
        Last clicked at: X - {clickX}, Y - {clickY}
      </span>

      <button type="button" onClick={interact('buttonClick')}>
        Click me!
      </button>
    </div>
  );
}

const ConnectedComponent = cycleConnect(main)(MyComponent);
```

The streams are `select()`ed by the same `interactionType` string you provided to the `interact()` function on your view.

Similar to how `interactions` object with dynamic function-props is available on your view, `InteractionsSource` is a ES2015 `Proxy` and it maintains the dynamic streams right on itself (just don't use `select` as its reserved method name here here):

```js
function main(sources) {
  const buttonClick$ = sources.interactions.buttonClick;

  return {
    props: buttonClick$.map(
      event => ({
        clickX: event.clientX,
        clickY: event.clientY,
      })
    )
  };
}

function MyComponent({ interactions, clickX, clickY }) {
  return (
    <div>
      <span>
        Last clicked at: X - {clickX}, Y - {clickY}
      </span>

      <button type="button" onClick={interactions.buttonClick}>
        Click me!
      </button>
    </div>
  );
}

const ConnectedComponent = cycleConnect(main)(MyComponent);
```

> Note: If you try to get the non-existing stream, it will still work, this thing is dynamic, so the stream will be created nevertheless but will just never emit values. Be careful and look out for typos! [Using TypeScript](#typescript-support) is highly recommended to avoid typos here.


#### Upstream interactions with `interactions` sink (calling callbacks on `props`).

Now that we can handle the streams of view events and values from the children components, we would also need to somehow call the callbacks that are passed among our `props`.

First, nothing prevents from following the common React way and call those directly from the **view**:

```js
function MyComponent({ onButtonClick }) {
  return (
    <button type="button" onClick={onButtonClick}>
      Click me!
    </button>
  );
}

// Somewhere else:
doSomething = (event) => { console.log('clicked!'); };

...

<MyComponent onButtonClick={doSomething} />
```

This is fine if you don't need that value's stream in your dataflow. This approach bypasses your Cycle.js program's `main` completely and doesn't make it impure by otherwise possibly passing an effectful function as `onButtonClick`. There's even no need to `cycleConnect()` your component in the above example.

Keep in mind that if `onButtonClick` is optional there, you will also need to check whether that is defined before providing that as a callback (use `PropTypes` or TypeScript to mark it as either required or optional).

Oftentimes you will need to call some callback that lives on the `props` though, and this is what `interactions` sink provided by `interactionsWrapper` does:

```js
function main(sources) {
  const buttonClick$ = sources.interactions.buttonClick;
  const coords$ = buttonClick$.map(
    event => ({
      clickX: event.clientX,
      clickY: event.clientY,
    })
  );

  // We both update the `props` (to render it in this component)
  // and pass upstream
  return {
    props: coords$,
    interactions: xs.of({
      onCoordsChange: coords$
    })
  };
}

function MyComponent({ interactions }) {
  return (
    <div>
      <span>
        Last clicked at: X - {clickX}, Y - {clickY}
      </span>

      <button type="button" onClick={interactions.buttonClick}>
        Click me!
      </button>
    </div>
  );
}

const ConnectedComponent = cycleConnect(main)(MyComponent);

// Somewhere else:
handleCoordsChange = (coords) => {
  console.log('New coordinates received: ', coords);
};

...

<ConnectedComponent onCoordsChange={handleCoordsChange} />

// The new coords will be rendered by the component
// and the console will show the "New coordinates received"
// with new coords too.
```

Once the appropriate stream emits a value, that callback is called. It will also check if the callback was passed in the first place to skip the call attempt if no callback with a given name is passed among the `props`.

**Important:** Note that `interactions` sink expects a stream of object whose property names correspond to callback names on `props` and property values are themselves streams too - whatever values those streams emit, will be passed as an argument to the callback.

So far so good, but we know that our `interactionsWrapper` is a **wrapper** and not a **driver**, so what if one passed the effectful function as a callback, e.g., `handleCoordsChange` passed as `onCoordsChange` above does a `console.log()` internally - that is a side effect, right?

Well, this is why the function is not invoked directly, or inside the wrapper (since the wrapper is the part of the pure land of our `main`s), its using the `fnCallEffect` **driver** internally. More on this below in a section about [Side-effect control](#side-effect-control-and-fncalleffect-driver), just keep in mind that `wrappers` and `main` should be pure and `react-cycle-connect` follows that requirement.


### React component lifecycle streams

You're probably not going to need `React` component lifecycle hooks often inside your `main`, but still - they are provided via special `reactLifecycleWrapper`. It provides the `lifecycle` **source** that is available on each `cycleConnect()`ed `main` sources.

The lifecycle events are provided as `Observable` streams and their names mostly mirror the React [lifecycle methods](https://reactjs.org/docs/react-component.html#the-component-lifecycle), but shortened to remove some redundant `component` prefixes:

| React lifecycle method      | `lifecycle` source property | Stream value     |
|-----------------------------|-----------------------------|------------------|
| `componentWillMount`        | `willMount$`                | `null`           |
| `componentDidMount`         | `didMount$`                 | `null`           |
| `componentWillReceiveProps` | `willReceiveProps$`         | `nextProps`      |
| `componentWillUpdate`       | `willUpdate$`               | `nextProps`      |
| `componentDidUpdate`        | `didUpdate$`                | `prevProps`      |
| `componentWillUnmount`      | `willUnmount$`              | `null`           |
| `componentDidCatch`         | `didCatch$`                 | Error data       |

The "error data" on the `didCatch$` is an object of this shape:
```js
{
  error: Error;
  errorInfo: ErrorInfo;
}
```
These are basically React `componentDidCatch(error, errorInfo)` arguments squashed into a single object.

Also, note that `shouldComponentUpdate` hook is not present there, since that is not really an **event** and affects how your component is rendered. `react-cycle-connect` would be providing its own custom internal `shouldComponentUpdate` instead for optimisation purposes and you could implement it on your wrapped component anyway.

> Note: As well, no lifecycle events are passing anything related to React component `state`, only taking `props` into account instead. This is because the `state` is meant to be managed differently when Cycle.js is in use. You can still use that for wrapped component but its out of play on the component generated by `cycleConnect(...)`.

A quick example:

```js
function main(sources) {
  const willUnmount$ = { sources.lifecycle };

  // Do something on unmounting, e.g. report that to a console
  // via some hypothetical `logger` driver
  return {
    logger: willUnmount$.mapTo(`I'll be unmounted soon!`)
  };
}
```


### Side-effect control and `fnCallEffect` driver

Side-effect control is where Cycle.js really shines (not only implementation, it applies to the "cycle pattern" behind Cycle.js in the first place).

In order to keep the `cycle` part of `cycleConnect()`ed component pure, we need to make sure that any potentially effectful function is not run inside our `main` directly.

This is what `fnCallEffect` driver is responsible for. It allows to only **describe** what function you want to call and with what arguments, then delegate that to a `driver` which is supposed to run any impure functions outside of the app itself.

The way it works is very similar to that of `HTTP` driver from `@cycle/http` package where you don't actually run the request inside your `main` but just describe it and pass to `HTTP` driver to handle. `fnCallEffect` driver is just a bit more generic and operates on functions.

`react-cycle-connect` uses `fnCallEfffect` driver internally (to run effects for upstream `interactions`), but it is also available for you on any connected `main` as `fnCallEffect` **sink** automatically (i.e., without explicit configuration on a **root** cycle):

```js
function log() {
  console.log(`I'm effectful!`);
}

function saveToLocalStorage(message) {
  localStorage.setItem('message', message);
}

function main(sources) {
  const someCallbackFn$ = sources.props.pluck('someCallbackFunction');

  return {
    fnCallEffect: xs.merge(
      xs.of({ fn: log }),
      xs.of({ fn: saveToLocalStorage, args: ['some message to save'] }),
      // Call the `props` callback function directly, this is how
      // `interactions` sink works behind the scenes:
      someCallbackFn$.map(fn => ({ fn }))
    )
  };
}
```


### Isolation

**Isolation** is Cycle.js way of making the component's `sources` and `sinks` isolated from influence of other components.

Make sure to carefully read more about Cycle.js isolation [here](https://cycle.js.org/api/isolate.html). It might take a bit to get used to an idea.

To reiterate: the concept of **isolation** is important for Cycle.js apps. Its a little bit different for `react-cycle-connect` because most things are scoped to a particular `cycleConnect()`ed component already, like components have "local" `interactions`, `props` and `lifecycle` sources and sinks and `React` components are also self-contained already.

There are though `drivers`/`wrappers` that will need the **isolation** feature, like `HTTP` driver or `cycle-onionify` wrapper (a state management solution for Cycle.js apps). So, **isolation** makes sense for shared `drivers`/`wrappers`, those you pass to `@cycle/run` function (by defining the `drivers`/`wrappers` options on **root** `cycleConnect(...)`) and that will be available across the entire tree of Cycle programs.

> Note: The isolation works by **scoping** the source streams to particular component and a kind of **unscoping** of the sink streams before connecting to parent's sinks.
>
> Also note, that each driver/wrapper decides on its own how its sources/sinks should be isolated.

In Cycle.js, you use the `isolate()` function from [`@cycle/isolate`](https://www.npmjs.com/package/@cycle/isolate) package directly, as you're just invoking the children `main` functions from your current component's `main` function:

```js
function main(sources) {
  const childSinks = isolate(childMain, { DOM: 'foo', HTTP: 'bar' })(sources);

  // Do something with childSinks, combine somehow, etc

  return {
    ...
  };
}
```

`isolate` function has this simple signature:
```js
isolate :: (MainFn, scope) => MainFn
```

It takes the `main` function and an optional `scope` and returns an isolated `main` function.

`react-cycle-connect` does also use the `@cycle/isolate` package internally, but you can't call `isolate()` directly on some `childMain` function. You'd never call one component's `main` from the other component's `main` directly with `react-cycle-connect`.

#### Naive explicit isolation (conceptually incorrect)

Just to illustrate the issue, there's an attempt to isolate the component's `HTTP` sources, so that HTTP requests initiated from that components are scoped to it (and are unavailable to siblings).

Since we know that `isolate()` returns a `main` function and `cycleConnect()` takes the `main` function as an argument, lets try to feed it an isolated version of it:

```js
function main(sources) {
  ...
}

function MyComponent() {
  ...
}

const isolatedMain = isolate(main, { HTTP: 'myComponent' });
const ConnectedComponent = cycleConnect(isolatedMain)(MyComponent);
```

While this will won't raise any errors (because this is valid code after all), this approach brings a subtle issue.

This will isolate things for this particular components but **not their children components**, so in this case, children (connected childred `React` components) will have no `myComponent` isolation scope for `HTTP` channel.

This might seems like a no-issue, because hey, you can define different scopes for the children components right? Well, while this is technically possible, its conceptually incorrect and it will be completely broken in some cases, e.g., with `cycle-onionify` where  the deeper you go - the "more filtered" source streams you get.

**Important!** The above note about it being "conceptually incorrect" refers to the way `react-cycle-connect` maintains the tree of Cycle.js programs internally. It tries to make the entire app structure **look** the same way as you'd manually write a Cycle.js app. So, when you `isolate(childMain)` at some level, then if inside your `childMain` you also call some `grandChildMain(...)` happens, then `grandChildMain` gets isolated sources no matter what.


#### `isolate` option for `cycleConnect()`

The first way to correctly isolate `cycleConnect()`ed component is to use the `isolate` option for `cycleConnect()` itself, so the above can be rewritten as:

```js
function main(sources) {
  ...
}

function MyComponent() {
  ...
}

const ConnectedComponent = cycleConnect(main, {
  isolate: { HTTP: 'myComponent' }
})(MyComponent);
```

This will work perfectly, with all children `cycleConnect()`ed components having `myComponent` namespace applied to `HTTP` sources/sinks in their `main` functions.

The `isolate` option accepts a `string` or the `object` and in that case its passed directly to `@cycle/isolate` package's `isolate(main, scope)` as a `scope` argument. So, check out the [`isolate` function API reference](https://cycle.js.org/api/isolate.html.).

`react-cycle-connect` also makes it accept a function that takes component `props` as an argument and should return the scope of `string` or `object` type that is then also passed to `@cycle/isolate` package's `isolate(main, scope)`. This allows for some dynamic isolation scopes to be set based on the React component's initial props.

> **Important**: Despite the `isolate` is provided as an option to `cycleConnect()` when defining the connected component, the actual isolation will only happen when **component instance** is created. This is why its possible to dynamically resolve the `scope` based on the component `props` in `react-cycle-connect`.


#### `isolate` prop

Despite the `isolate` option will work nicely for some cases, there's a pattern in how it is utilized in pure Cycle.js programs. Lets take a look at pure Cycle.js example again:

```js
function main(sources) {
  const childSinks = isolate(childMain, { DOM: 'foo', HTTP: 'bar' })(sources);

  // ...

  return {
    ...
  };
}
```

The important part is that in Cycle.js app its not a child who decides how to isolate itself but `scope` is provided from the parent instead.

Most of the time, we want to maintain the same approach with `react-cycle-connect`. The advantage is that component in this case is totally agnostic from the provided scope, it doesn't even care whether its isolated or not at all - all it knows is that it expects certain `sources` and returns certain `sinks`. This makes the component reusable.

This is especially important with `cycle-onionify`, where you want to control where your child components "attach" to the state.

In other words, the parent decides how to compose children components, not the other way around, because otherwise the child would need to have an intimate knowledge of something that really belongs to parent and thus not being reusable and breaking encapsulation.

For this reason, every `cycleConnect`ed React component accepts an `isolate` prop, so you can use that just like any other prop:

```js
function main(sources) {
  ...
}

function MyComponent() {
  ...
}

const ConnectedComponent = cycleConnect(main)(MyComponent);

// Somewhere else:

// Isolate everything
<ConnectedComponent isolate="myComponent" />

// Isolate HTTP only
<ConnectedComponent isolate={{ HTTP: 'myComponent' }} />
<ConnectedComponent isolate={{ HTTP: 'myComponent_2' }} />
```

In contrast with [`isolate` option](#isolate-option), the `isolate` prop can only accept `string` or `object` that is directly passed to `isolate()` function from `@cycle/isolate`, thus maintaining full parity with pure Cycle.js approach. Indeed, having a function that accepts initial `props` wouldn't make much sense because you're anyway providing props that could be different for different component instances when rendering that component.


#### `<Isolator>` helper component

Since isolation in `react-cycle-connect` applies to both "current" `cycleConnect()`ed component and all its `cycleConnect()`ed children, we might sometimes need to define some connected component to only be a common parent for some children, which must provide isolation but wouldn't contain any logic.

This is what a helper `Isolator` component for. It accepts the `scope` prop (that is directly passed as a `scope` argument to `isolate(main, scope)` function of `@cycle/isolate`):

```js
<Isolator scope={{ HTTP: 'someNamespace' }}>
  <ConnectedComponent someProps="1" />
  <ConnectedComponent someProps="2" />
  <ConnectedComponent someProps="3" />
</Isolator>
```

This assists the isolation composition at view level.


### Extra: State management with `cycle-onionify`

[`cycle-onionify`](https://github.com/staltz/cycle-onionify) is the idiomatic Cycle.js fractal state management solution. It is tailored for Cycle.js apps but since `react-cycle-connect` is using the real Cycle.js, it stays fully compatible here as well.

Using `cycle-onionify` with `react-cycle-connect` is optional, since you might be using different lib (e.g., `redux`) for that. 

To start, just read the [onionify docs](https://github.com/staltz/cycle-onionify) and install the package:

```
$ npm install --save cycle-onionify
```

and pass that with `wrappers` array to a `root` connected component (e.g., [Root Cycle](#root-cycle)):

```js
// RootCycle.js

import { run } from '@cycle/run';
import onionify from 'cycle-onionify';
import { cycleConnect } from 'react-cycle-connect';

const wrappers = [onionify];

export const RootCycle = cycleConnect({
  root: true,
  runFn: run,
  wrappers
})();

export default RootCycle;
```

Now every `cycleConnect()`ed component that is a child of the above-mentioned `RootCycle` in React component tree got the `onion` source and sink.

**Important:** Notice that **you're all set** - its purely a Cycle.js land. `react-cycle-connect` **doesn't** provide any additional functionality for `cycle-onionify`. Instead, it provides few helpers for isolation and working with collections on the React side.

All the exportables related to `onionify` reside in the extra package: `react-cycle-connect/lib/extra/onionify`. It is installed along with the main lib but is not `require()`d/`import`ed by default, so won't be bundled (by Webpack, Rollup, etc) unless you're using it.

This extra sub-package contains few things:

- `<StateIsolator>` helper component
- `<Collection>` helper component
- `makeFilteredListLens()` helper factory function

Read ahead for details on each.

In `cycle-onionify`, the state/reducers layer composition is done via [isolation](#isolation), so the first thing here is `<StateIsolator>`:


#### `<StateIsolator>` helper component

This is pretty much like [`<Isolator>`](#isolator-helper-component) but is here to specifically isolate `onion` sources/sinks only.

So, the:

```js
import { StateIsolator } from 'react-cycle-connect/lib/extra/onionify';

// ...

<StateIsolator lens="someStateProperty">
  <NestedComponent />
</StateIsolator>
```

is somewhat a convenient shortcut to:

```js
import { Isolator } from 'react-cycle-connect';

// ...

<Isolator scope={{ onion: 'someStateProperty', '*': null }}>
  <NestedComponent />
</Isolator>
```

Notice how `StateIsolator`'s prop is explicitly named `lens`. It just implies that oftentimes you'll be using ["lens"](https://github.com/staltz/cycle-onionify#how-to-share-data-among-components-or-compute-derived-data) to isolate the state. Consider a string just a shortcut to a more elaborate `lens` object.

In the example above, the `<NestedComponent>`'s `main` function `sources.onion.state$` will represent only that "someStateProperty" piece of state. Pretty much how you'd `isolate()` the `onion` channel in an idiomatic Cycle.js app.

There's also a `channelName` property, so that you can change the name of the source/sink inside your `main` to something else. Thats to be on par with `cycle-onionify` features, where you can also change that name.


#### Handling collection state manually

Managing collections of components in pure Cycle.js with `onionify` is a kind of a recognized challenge. This is why `cycle-onionify` ended up providing `makeCollection()` helper function - [see their docs](https://github.com/staltz/cycle-onionify#how-to-handle-a-dynamic-list-of-nested-components) for more detail.

While `react-cycle-connect` also has a `<Collection>` helper component that is very similar to `cycle-onionify` `makeCollection()` function, lets first try to pretend we don't have it and imagine how'd we handle the state without it.

> **Note:** Nothing prevents you from skipping right to [a description of how `<Collection>` works](#collection-helper-component), but it might be useful to understand the rationale behind it, so reading this section is recommended.

Handling collections is different with React than in Cycle.js, e.g., you can always just render React components in a loop or `.map()` an array of data to an array of components and React will render that.

When you want to render some `Array` data from your **state**, its easy without any helpers:

```js
/*
  Assume you have this value on your `List` component `state$`:

  {
    list: [
      { id: 1, name: 'Obi-Wan Kenobi', kills: 100 },
      { id: 2, name: 'Luke Skywalker', kills: 25 },
      { id: 3, name: 'Darth Vader', kills: 9000 }
    ]
  }
*/

// ListItem.jsx

function ListItem({ itemData }) {
  return (
    <li>
      {itemData.name} (ID: {itemData.id}, kills: {itemData.kills})
    </li>
  );
}

// List.jsx

function main(sources) {
  // Just pass as `props` directly
  return {
    props: sources.onion.state$
  };
}

function List({ list }) {
  return (
    <ul>
      {list.map(item => (
        <ListItem key={item.id} itemData={item} />
      ))}
    </ul>
  );
}

const ConnectedList = cycleConnect(main)(List);
```

This keeps your `ListItem` component just a "dumb" view, there's no even need of connecting it to the Cycle tree. So far so good.

Then you want to add more item-level capabilities, like editing an item (incrementing hero `kills` in our case, for simplicity) or deleting an item. You can still manage the state in the `List` component, act upon some callbacks for particular item and only stream reducers from inside `List` component's `main`:

```js
/*
  Assume you have this value on your `List` component `state$`:

  {
    list: [
      { id: 1, name: 'Obi-Wan Kenobi', kills: 100 },
      { id: 2, name: 'Luke Skywalker', kills: 25 },
      { id: 3, name: 'Darth Vader', kills: 9000 }
    ]
  }
*/

// ListItem.jsx

function ListItem({ itemData, onIncrementClick, onDeleteClick }) {
  return (
    <li>
      {itemData.name} (ID: {itemData.id}, kills: {itemData.kills}) -
      <button type="button" onClick={onIncrementClick}>
        Increment "kills"
      </button>

      <button type="button" onClick={onDeleteClick}>
        Delete
      </button>
    </li>
  );
}

// List.jsx

function intent(interactions) {
  return {
    itemIncrement$: interactions.itemIncrementClick,
    itemDelete$: interactions.itemDeleteClick
  };
}

function model(actions) {
  const defaultReducer$ = xs.of(function defaultReducer(state) {
    if (typeof state !== 'undefined') return state;
    return {
      list: []
    };
  });

  const incrementItemReducer$ = actions.itemIncrement$.map(
    (id) => function incrementItemReducer(state) {
      return {
        ...state,
        list: state.list.map(listItem => {
          if (listItem.id !== id) return listItem;
          return {
            ...listItem,
            kills: listItem.kills + 1
          };
        })
      };
    }
  );

  const deleteItemReducer$ = actions.itemDelete$.map(
    (id) => function deleteItemReducer(state) {
      return {
        ...state,
        list: state.list.filter(listItem => listItem.id !== id)
      };
    }
  );

  return xs.merge(
    defaultReducer$,
    incrementItemReducer$,
    deleteItemReducer$
  );
}

function main(sources) {
  const actions = intent(sources.interactions);
  const reducer$ = model(actions);

  return {
    onion: reducer$,
    props: sources.onion.state$
  };
}

function List({ interactions, list }) {
  return (
    <ul>
      {list.map(item => (
        <ListItem
          key={item.id}
          itemData={item}
          onIncrementClick={() => interactions.itemIncrementClick(item.id)}
          onDeleteClick={() => interactions.itemDeleteClick(item.id)}
        />
      ))}
    </ul>
  );
}

const ConnectedList = cycleConnect(main)(List);
```

There is already some noise in reducers, especially on updates. Also, what if there's another piece of state sibling to `list` property? `List` gets overburdened quickly.

You'd also quickly realize that this makes the collection item state inherently bound to `List`, so while you could be reusing `ListItem` somewhere else, you couldn't reuse its state management part.

This is unfortunate because certain actions ("edit" and "delete") are related to a single item and can be managed at that item's level. This is totally possible with `cycle-onionify` because its a **fractal state** management thing, so we could be taking advantage of that **fractal** aspect with `react-cycle-connect` too.

So, we'd better be managing internal item state at the `ListItem` component level. To do that, let's `cycleConnect` the `ListItem` component and make it handle its stuff. We need to carefully let each item's component know which piece of state does belong to it, and we'll use `listLens` for that:

```js
/*
  Assume you have this value on your `List` component `state$`:

  {
    list: [
      { id: 1, name: 'Obi-Wan Kenobi', kills: 100 },
      { id: 2, name: 'Luke Skywalker', kills: 25 },
      { id: 3, name: 'Darth Vader', kills: 9000 }
    ]
  }
*/

// ListItem.jsx

function intent(interactions) {
  return {
    increment$: interactions.incrementClick,
    delete$: interactions.deleteClick
  };
}

function model(actions) {
  // Note: default reducer assumes that we always have a valid
  // state from the parent component. It just makes it undefined
  // explicitly otherwise.
  const defaultReducer$ = xs.of(function defaultReducer(state) {
    if (state) return state;
    return void 0;
  });

  const incrementReducer$ = actions.increment$.map(
    () => function incrementReducer(state) {
      return {
        ...state,
        kills: state.kills + 1
      };
    }
  );

  const deleteReducer$ = actions.delete$.map(
    () => function deleteReducer(state) {
      return void 0;
    }
  );

  return xs.merge(
    defaultReducer$,
    incrementReducer$,
    deleteReducer$
  );
}

function main(sources) {
  const actions = intent(sources.interactions);
  const reducer$ = model(actions);

  /*
  The initial `state$` value is something like this,
  due to isolation on the `List`.

    {
      id: 1,
      name: 'Obi-Wan Kenobi',
      kills: 100
    }

  */

  return {
    onion: reducer$,
    props: sources.onion.state$.map(state => ({ itemData: state }))
  };
}

function ListItem({ interactions, itemData }) {
  return (
    <li>
      {itemData.name} (ID: {itemData.id}, kills: {itemData.kills}) -
      <button type="button" onClick={interactions.incrementClick}>
        Increment "kills"
      </button>

      <button type="button" onClick={interactions.deleteClick}>
        Delete
      </button>
    </li>
  );
}

const ConnectedListItem = cycleConnect(main)(ListItem);


// List.jsx

function model() {
  const defaultReducer$ = xs.of(function defaultReducer(state) {
    if (typeof state !== 'undefined') return state;
    return {
      list: []
    };
  });

  // const addItemReducer$ = ...

  return xs.merge(
    defaultReducer$,
    // addItemReducer$, etc
  );
}

function main(sources) {
  const reducer$ = model();

  return {
    onion: reducer$,
    props: sources.onion.state$ // Merge state into props
  };
}

// A lens for particular item, to extract/update its state correctly
function itemLens(id) {
  return {
    get(arr) {
      if (typeof arr === 'undefined') return void 0;
      for (let i = 0, n = arr.length; i < n; ++i) {
        if (arr[i].id === id) {
          return arr[i];
        }
      }
      return void 0;
    },

    set(arr, updatedItemState) {
      if (typeof arr === 'undefined') {
        return [item];
      } else if (typeof item === 'undefined') {
        return arr.filter((itemState) => itemState.id !== id);
      }

      return arr.map((itemState) => {
        if (itemState.id === id) return updatedItemState;
        return itemState;
      });
    }
  };
}

// Note that we no longer need to pass the data to list items,
// they get it from `onion` state directly, on their own, but we still
// need to provide the instructions on how to `isolate` each item state,
// so that each component knows what item from collection it renders.
function List({ interactions, list }) {
  return (
    <ul>
      {list.map(item => (
        <ConnectedListItem
          key={item.id}
          isolate={{ onion: itemLens(item.id) }}
        />
      ))}
    </ul>
  );
}

const ConnectedList = cycleConnect(main)(List);
```

There's another issue with this. Now our `listLens` is intrinsically bound to a `list` property on a component state and , because we _just know_ that the `ConnectedList` component state is of the shape:

```js
{
  list: []
}
```

and item state has an `id` attribute. But what if `List` state is:

```js
{
  someOtherListProp: []
}
```

or something else, or has other properties along the way, which we'd need to take into account then:

```js
{
  someOtherListProp: [],
  somethingElse: 'some string',
  someOtherProp: 123,
  someNestedObject: { ... }
}
```

or (unlikely but still possible), the actual collection is an item in some other collection:
```js
{
  [
    [], // list 1
    [], // list 2
    [], // list 3
    [] // etc
  ]
}
```

Also, what if there's another `key` for collection item and not an `id` attribute`?

To make item lens reusable, we need it to assume that the collection state is always an `Array` (or `undefined`) and pass a function to calculate the `key`. 

Lets refactor this a bit, by extracting the use-case-specific property names out and explicitly isolate our list rendering with `<StateIsolator>` (unrelated code is omitted):

```js
// ...

// A lens for particular item, to extract/update its state correctly
// Note that we replaced the `id` with the more generic `key` and
// the function now accepts another function as an argument, that
// obtains the "key" to compare.
function itemLens(key, itemKeyFn) {
  return {
    get(arr) {
      if (typeof arr === 'undefined') return void 0;
      for (let i = 0, n = arr.length; i < n; ++i) {
        if (itemKeyFn(arr[i], i) === key) {
          return arr[i];
        }
      }
      return void 0;
    },

    set(arr, updatedItemState) {
      if (typeof arr === 'undefined') {
        return [item];
      } else if (typeof item === 'undefined') {
        return arr.filter(
          (itemState, index) => itemKeyFn(itemState, index) !== key
        );
      }

      return arr.map((itemState, index) => {
        if (itemKeyFn(itemState, index) === key) {
          return updatedItemState;
        } else {
          return itemState;
        }
      });
    }
  };
}

function List({ interactions, list }) {
  return (
    <ul>
      <StateIsolator lens="list">
        {list.map(item => (
          <ConnectedListItem
            key={item.id}
            isolate={{ onion: itemLens(item.id, (item, index) => item.id) }}
          />
        ))}
      </StateIsolator>
    </ul>
  );
}

const ConnectedList = cycleConnect(main)(List);
```


Alright, this works but wow, there's a lot of boilerplate to write overall for this kind of thing every time, isn't there? We might also be reusing the `listLens` as its generic enough, so why not have it extracted to a package? Well, thats why we have a `<Collection>` component that encapsulates the repetitive boilerplate.


#### `<Collection>` helper component

This helper component somewhat mirrors the functionality of `makeCollection()` helper function from `cycle-onionify`. It allows to avoid the repetitive boilerplate from collection to collection. `<Collection>` is itself just a `cycleConnect()`ed component.

It provides two levels of `onion` source/sink isolation internally - one for "collection" piece of state and then for each rendered item. The collection state isolation is required in order for it to be truly reusable (i.e., we can't just hardcode the `<Collection>` state to always be some `list` prop - instead, its made a userland decision, see previous section for a more elaborate description). So, `<Collection>` state is always expected to be an `Array` (or `undefined`).

Collection isolation is configured with a `lens` prop (read more about lens in [`cycle-onionify` docs](https://github.com/staltz/cycle-onionify#how-to-share-data-among-components-or-compute-derived-data)):

```js
const fooLens = {
  get: (state) => state.foo,
  set: (state, childState) => ({ ...state, foo: childState })
};

<Collection lens={fooLens} ... />
```

For such a straightforward use case (its very common) the `string` shortcut of the above will suffice:

```js
<Collection lens="foo" ... />
```

Each item's isolation is implemented internally (with `itemLens`) and is the core feature of `<Collection>`.

> Note: The code for `itemLens` is almost entirely burrowed from the `cycle-onionify` codebase - could even probably be reused as is if `cycle-onionify` package `export`s that.

You need to specify what component you want rendered as a collection item with `itemComponent` prop:

```js
<Collection lens="foo" itemComponent={ListItem} />
```

Note that `<Collection>` provides isolation for each item and `cycleConnect()`ed list item is supposed to just pull its data from `sources.onion.state$` directly. By default, though, `<Collection>` also passes the (already correctly isolated) item state as item component's `props` for convenience and for it to work with non-`cycleConnect()`ed item components.

> Note: Due to architecture of `react-cycle-connect`, there are no alternatives to `collectSinks` option and `pickMerge` and `pickCombine` helpers from `cycle-onionify`, because sink streams are handled differently in `react-cycle-connect` and they always behave as being `pickMerge()`d here.

**Additional options**.

We know that React, when rendering a collection, requires a `key` prop to be defined on an item component. `<Collection>` does that for you internally and uses the item's `index` (position in a list) for that by default. In order to customize the `key` (used for both React and internal `itemLens`), you can pass an `itemKeyFn` prop that accepts a function of this signature:

```js
(itemState, index?) => Key;
```

Must return a React-compatible `Key` value. Quick example on how to set that to use item's `id` attribute:

```js
<Collection
  lens="foo"
  itemComponent={ListItem}
  itemKeyFn={(itemState) => itemState.id}
/>
```

`<Collection>`, with the internal use of `listLens`, provides **only** `onion` source/sink isolation for each item by default. If you need other channels to be isolated somehow, you can provide `itemIsolate` property, which will be just passed as every item's `isolate` prop. Notr, though, that explicitly setting `onion` channel scope will be ignored - `<Collection>` will overwrite that internally.

Next option is `channelName` which, just like with `<StateIsolator>` is supposed to change the `onion` to something else (like `stateTree` maybe).

Lastly, if you want to tweak the way your item component is rendered, you can pass the `itemRender` prop to the collection, which needs to be a function compatible with the signature:

```js
(itemState, itemKey, index) => ReactNode
```

Please note that it completely overrides the item rendering and in this case you're on your own - the `itemComponent` and `itemIsolate` props will be ignored, as well as no `itemLens` will be applied to the item component internally and you'll need to provide the `key` on your own. This is just an escape hatch and is not supposed to be used often (or probably ever):

```js
<Collection
  lens="list"
  itemRender={(itemState) => (
    <ListItem
      {...itemState}
      key={itemState.id}
      isolate={{ onion: someCustomItemLens(itemState.id) }}
    />
  )}
/>
```


#### `makeFilteredListLens()` factory function to assist `<Collection>`

Alrighty. One more important aspect of `lens` is that they're useful and are suggested approach for [computed `props` and derived data](https://github.com/staltz/cycle-onionify#how-to-share-data-among-components-or-compute-derived-data).

So, the `lens` prop on `<Collection>` isn't always supposed to be a shortbut prop name as oftentimes you'd want to show a filtered version of your collection. Since the only responsibility of `<Collection>` is to just isolate state nicely and render items, filtering the collection data is a userland option.

There are no special props on `<Collection>` to filter data but since it accepts `lens`, we can leverage that and provide a `lens` object that will "zoom" to a filtered subset of our collection data on `get` and merge things back on `set`.

You can write that `filteredListLens` manually, but the use case is so common that there's a helper included into the package. Lets see an example (from our [TodoMVC](https://github.com/VasilioRuzanni/react-cycle-connect/tree/master/examples/todomvc)) with "todo" items that also reads a value from state to decide, based on the `filter` value, which function to use in the predicate:

```js
import { makeFilteredListLens } from 'react-cycle-connect/lib/extra/onionify';

const TODO_FILTER_FUNCTIONS = {
  ['show_all']: () => true,
  ['show_active']: (todo) => !todo.completed,
  ['show_completed']: (todo) => todo.completed
};

const filteredListLens = makeFilteredListLens(
  'todos',
  (item, state) => TODO_FILTER_FUNCTIONS[state.filter](item),
  'id'
);

// Somewhere when rendering:
<Collection lens={filteredListLens} itemComponent={TodoItem} />
```

The above will only show the filtered subset of the collection and will merge any state changes to the source collection. Please note that this `lens` is to isolate the collection, not its items - those are still managed internally with some internal `itemLens`.

The `makeFilteredListLens` function has this signature:

```js
(stateProp, filterPredicate, equals) => Lens
```
with all arguments required.

- `stateProp` is just a string that defines which piece of state the filtered collection should be calculated from. While it wouldn't be neccessary for `get` part of the `lens`, we need it for `set`, because filtered collection is a computed value and doesn't reside on the state directly, so we need to let it know which piece of state is to update.

  Its going to be the same what you'd otherwise set as `<Collection>` `lens` prop string shortcut, should you want to show an entire collection without filtering.

- `filterPredicate` is a function of a signature:
  ```js
  (itemState, state) => boolean
  ```
  which is the heart of this feature - it decides whether to include or excluded the item into/from the filtered collection. Return `true` for the item to be included (its just a regular `Array.prototype.filter` behind the scenes). Particular item state is passed as a first argument but there's also a second argument, `state`, that is the entire `state` object, where your collection property resides...
  
  Wait, WAT! Why would lens know about the state that is beyond of collection state itself? Well, since your state is fractal and you're keeping your list there, chances are you're going to keep the **filtering** and **pagination** metadata from that level on as well. This might seems confusing at first, so feel free to check how it's used in our [TodoMVC](https://github.com/VasilioRuzanni/react-cycle-connect/tree/master/examples/todomvc) example.

- `equals` is a predicate to check whether the two items are equal:
  ```js
  (itemState1, itemState2) => boolean
  ```

  Should return `true` if two item's states should be considered equal. Its such a common thing to just provide something like
  ```js
  (item1, item2) => item1.id === item2.id
  ```

  that there's a `string` shortcut for it, which accepts the attribute name, e.g., `id`:
  ```js
  makeFilteredListLens('someStateProps', ..., 'id')
  ```

Note that this is only about filtering the state data on isolation, its not about rendering. `<Collection>` handles rendering no matter what `lens` is in use and you can also use the created `lens` on your own, not necessarily with `<Collection>`.


### Testing

This is more or less straightforward here - `react-cycle-connect` doesn't really have any `react-cycle-connect`-ish code to write, so it boils down to Cycle.js testing (take a look at [`@cycle/time`](https://github.com/cyclejs/cyclejs/tree/master/time) here) as well as React testing with, e.g., [Jest](https://facebook.github.io/jest/docs/en/tutorial-react.html) and [Enzyme](https://github.com/airbnb/enzyme).

**[TODO: To be expanded with examples and practices]**


### TypeScript support

[WIP]

Quick note: `react-cycle-connect` is itself written in TypeScript and export lots of types, both internally used and those intended to be used in the userland. Type-annotated examples and suggested practices are coming up!


## API reference

[TODO]

Quick note: [Guide](#guide) covers most (if not all) of the public API of the lib, so feel free to check that out in the meantime.


## Alternatives / Competitors

#### [cycle-react](https://github.com/pH200/cycle-react)

This is one of the first attempts to use "Cycle pattern" with React. It doesn't have any references to Cycle.js itself, but it nicely reimplements the pattern, so the architecture is somewhat similar. Its using much more Cycle.js way of handling markup, which you're building inside Cycle program itself there, which isn't the case with `react-cycle-connect` where there is more explicit boundary between React and Cycle.

Its also where the concept of `interactions` came from to `react-cycle-connect` (though, orchestrated differently). Only meant to be used with `RxJS 4` and `RxJS 5`. 

Doesn't maintain the tree of Cycle.js programs, focusing on having the "Cycle pattern" at component level instead with a different public API surface.

Looks quite robust in what it does, so definitely take a look at it.

#### [recycle.js](https://recycle.js.org/)

This is a really cool one, another reimplementation of "Cycle pattern" in React, but this time its closer to pure Cycle.js when it comes to event handling with view being a pure readonly representation of state.

The downside is that it explicitly monkey-patches the `React.createElement` to achieve Cycle.js style of event handling.

Its approach also resembles [Elm](http://elm-lang.org/) and [`hyperapp`](https://hyperapp.js.org/) in that its `view`, `dispatch`, `update`, etc sections are explicitly configured, whereas you just call functions from functions in Cycle.js (and `react-cycle-connect`).


#### [redux-cycles](https://github.com/cyclejs-community/redux-cycles)

Not really an alternative, since it doesn't allow to use Cycle.js for React component dataflow. Its rather a set of drivers for `redux`, supposed to provide an ability to use Cycle.js for handling side effects in [Redux](https://redux.js.org/)-based app.

Definitely consider it if all you need is managing Redux async actions' side-effects.

Like `react-cycle-connect`, it assumes the use of the real Cycle.js libs. This means that it could well be a complement to `react-cycle-connect` if you decide to use Redux as a state container in `react-cycle-connect` (and not, e.g., `cycle-onionify`).


## FAQ

[TODO]


## Roadmap

- Streamline the API
- JSDoc for the entire codebase
- Full test coverage
- Optimize the re-rendering (the entire props update pipeline)
- `RxJS` and `most.js` support (looking into how [Callbags](https://github.com/staltz/callbag-basics) would possibly make their way into Cycle.js, thus making it more reactive-lib agnostic).
- `preact` and `inferno` support (and also possibly `Vue`, in which case it might be renamed somehow)
