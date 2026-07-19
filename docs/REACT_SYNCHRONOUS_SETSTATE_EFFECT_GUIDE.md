# Guide: Resolving "Calling setState synchronously within an effect can trigger cascading renders"

This document provides a comprehensive guide on understanding, avoiding, and fixing the React compiler/ESLint warning: **"Calling setState synchronously within an effect can trigger cascading renders"** using modern React best practices.

---

## 1. Executive Summary

### What is the Error?
When you invoke a `setState` function synchronously inside a `useEffect` body without waiting for an asynchronous event (like a `fetch` promise resolution or a `setTimeout`), React triggers an immediate secondary render cycle.

### Why is it a Problem?
1. **Cascading Renders (Double Renders):**
   $$\text{Render 1 (Initial)} \longrightarrow \text{DOM Paint} \longrightarrow \text{useEffect Execution} \longrightarrow \text{setState} \longrightarrow \text{Render 2 (Cascading)}$$
2. **Performance Degradation & Visual Jank:** Extra render cycles burn CPU cycles and can lead to micro-flashes on screen.
3. **Infinite Loop Risk:** If dependencies are configured incorrectly, synchronous updates inside effects can easily lock the UI thread in an infinite render loop.

---

## 2. Common Anti-Patterns & How to Refactor

### Anti-Pattern 1: Deriving State in `useEffect`

#### ❌ Incorrect (Triggering Cascading Renders)
```tsx
function Profile({ firstName, lastName }: { firstName: string; lastName: string }) {
  const [fullName, setFullName] = useState('');

  // 🔴 Bad: Synchronous setState in useEffect to derive state
  useEffect(() => {
    setFullName(`${firstName} ${lastName}`);
  }, [firstName, lastName]);

  return <h1>{fullName}</h1>;
}
```

#### ✅ Best Practice: Derive Values Directly During Render
Do not store derived state in `useState` or `useEffect`. Calculate it on the fly during component execution.

```tsx
function Profile({ firstName, lastName }: { firstName: string; lastName: string }) {
  // ✅ Good: Calculated directly during render (0 extra renders)
  const fullName = `${firstName} ${lastName}`;

  return <h1>{fullName}</h1>;
}
```

If the calculation is expensive, wrap it with `useMemo`:
```tsx
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

---

### Anti-Pattern 2: Resetting Form / State When Props Change

#### ❌ Incorrect
```tsx
function UserForm({ userId }: { userId: string }) {
  const [comment, setComment] = useState('');

  // 🔴 Bad: Resetting state via useEffect
  useEffect(() => {
    setComment('');
  }, [userId]);

  return <textarea value={comment} onChange={(e) => setComment(e.target.value)} />;
}
```

#### ✅ Best Practice: Use the `key` Attribute
Explicitly pass a `key` to reset a component and all its inner state automatically when identity changes.

```tsx
// Parent component
<UserForm key={userId} userId={userId} />

// Child component (clean & simple)
function UserForm({ userId }: { userId: string }) {
  const [comment, setComment] = useState('');
  return <textarea value={comment} onChange={(e) => setComment(e.target.value)} />;
}
```

---

### Anti-Pattern 3: Adjusting Partial State Based on Props

If you must adjust state when a prop changes and resetting whole state via `key` is not desirable, adjust state **directly during render**, not in `useEffect`.

#### ✅ Best Practice: State Adjustment in Render Body
```tsx
function SelectionList({ items }: { items: Item[] }) {
  const [prevItems, setPrevItems] = useState(items);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ✅ React allows setting state during render IF wrapped in a condition.
  // React will immediately restart render with new state before painting the DOM.
  if (items !== prevItems) {
    setPrevItems(items);
    setSelectedId(null);
  }

  return <List items={items} selectedId={selectedId} onSelect={setSelectedId} />;
}
```

---

### Anti-Pattern 4: Triggering Event Handlers inside `useEffect`

#### ❌ Incorrect
```tsx
function Cart({ items }: { items: Item[] }) {
  const [isTotalExceeded, setIsTotalExceeded] = useState(false);

  // 🔴 Bad: Synchronously setting alert state inside useEffect
  useEffect(() => {
    if (items.length > 10) {
      setIsTotalExceeded(true);
    }
  }, [items]);
}
```

#### ✅ Best Practice: Move Logic to Event Handlers
Perform state updates inside the event handler that caused the action (e.g., `onAddToCart`).

```tsx
function Cart({ items, onUpdateItems }: CartProps) {
  const [isTotalExceeded, setIsTotalExceeded] = useState(false);

  const handleAddItem = (newItem: Item) => {
    const updated = [...items, newItem];
    onUpdateItems(updated);
    if (updated.length > 10) {
      setIsTotalExceeded(true);
    }
  };
}
```

---

### Anti-Pattern 5: Syncing External Subscriptions

If you are reading external browser APIs or global stores (e.g. window width, online status):

#### ❌ Incorrect
```tsx
function WindowWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // 🔴 Bad: Synchronously reading window and calling setState on mount
    setWidth(window.innerWidth);

    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
}
```

#### ✅ Best Practice: Use `useSyncExternalStore`
```tsx
import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getSnapshot() {
  return window.innerWidth;
}

function getServerSnapshot() {
  return 0; // fallback for SSR
}

function WindowWidth() {
  // ✅ Good: No useEffect or double render needed
  const width = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <div>Width: {width}px</div>;
}
```

---

## 3. Advanced React 19 Patterns: `useEffectEvent`

In modern React, if an effect needs to read non-reactive values or trigger side-effect routines without re-running or causing unwanted render cascades:

```tsx
import { useEffect, useEffectEvent } from 'react';

function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  const onConnected = useEffectEvent((room) => {
    showNotification(`Connected to ${room}`, theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', () => {
      onConnected(roomId);
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // theme is isolated inside useEffectEvent!
}
```

---

## 4. Legitimate Exceptions & Safe Suppressions

### When is Synchronous `setState` in `useEffect` Acceptable?
There are rare DOM measurement cases where synchronous state updates are necessary (e.g. tooltip placement, measuring rendered node dimensions).

#### Recommended Alternative for DOM Measurement: `useLayoutEffect`
If visual layout depends on DOM measurements, use `useLayoutEffect` to run updates before the browser paints, eliminating visible flicker:

```tsx
useLayoutEffect(() => {
  if (ref.current) {
    const rect = ref.current.getBoundingClientRect();
    setHeight(rect.height);
  }
}, []);
```

#### Disabling the ESLint Warning
If you have verified that a synchronous `setState` in `useEffect` is intentional and unavoidable:

```tsx
useEffect(() => {
  // eslint-disable-next-line react-compiler/react-compiler, react-hooks/set-state-in-effect
  setTooltipVisible(true);
}, []);
```

---

## 5. Summary Checklist

| Goal | Do NOT Use | Use Instead |
| :--- | :--- | :--- |
| **Transform props/state** | `useEffect` + `setState` | Calculate directly during render (`useMemo` if heavy) |
| **Reset component state on prop change** | `useEffect` + `setState` | Pass `key={id}` to component |
| **Handle user interaction result** | `useEffect` + `setState` | Logic inside Event Handler (`onClick`, `onSubmit`) |
| **Subscribe to browser/external store** | `useEffect` + `setState` | `useSyncExternalStore` |
| **DOM dimensions measurement** | `useEffect` + `setState` | `useLayoutEffect` |
