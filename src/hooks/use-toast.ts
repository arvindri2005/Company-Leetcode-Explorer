"use client";

// Inspired by react-hot-toast library
import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const _actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof _actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * @function reducer
 * @description A reducer function to manage the state of the toasts. It handles adding, updating, dismissing, and removing toasts.
 * @param {State} state - The current state of the toasts.
 * @param {Action} action - The action to be performed on the state.
 * @returns {State} The new state after applying the action.
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

/**
 * @function toast
 * @description A function to create and display a new toast notification.
 * @param {Toast} props - The properties of the toast to be displayed.
 * @returns {{ id: string; dismiss: () => void; update: (props: ToasterToast) => void; }} An object containing the ID of the new toast, and functions to dismiss or update it.
 */
function toastMain({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {dismiss();}
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

export type ToastFunction = typeof toastMain & {
  success: (title: string, description?: React.ReactNode) => ReturnType<typeof toastMain>;
  error: (title: string, description?: React.ReactNode) => ReturnType<typeof toastMain>;
  warning: (title: string, description?: React.ReactNode) => ReturnType<typeof toastMain>;
  info: (title: string, description?: React.ReactNode) => ReturnType<typeof toastMain>;
};

const toast = toastMain as ToastFunction;

toast.success = (title, description) => 
  toastMain({ title, description, variant: "success" });

toast.error = (title, description) => 
  toastMain({ title, description, variant: "destructive" });

toast.warning = (title, description) => 
  toastMain({ title, description, variant: "warning" });

toast.info = (title, description) => 
  toastMain({ title, description, variant: "info" });

/**
 * @function useToast
 * @description A custom hook that provides access to the toast notification system.
 * It returns the current state of toasts, the `toast` function to create new toasts, and a `dismiss` function to close them.
 * @returns {{ toasts: ToasterToast[]; toast: (props: Toast) => { id: string; dismiss: () => void; update: (props: ToasterToast) => void; }; dismiss: (toastId?: string) => void; }} The toast system's state and action functions.
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { toast,useToast };






