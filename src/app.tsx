import { ParentProps, Suspense, type Component } from 'solid-js';


export function App(props: ParentProps) {
  return <Suspense>{props.children}</Suspense>

}
export default App;
